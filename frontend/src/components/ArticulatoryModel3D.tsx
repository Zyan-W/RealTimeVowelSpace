import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { deriveArticulationEstimate } from "../articulation";
import { getArticulatoryGeometryParams, type Vector3Tuple } from "../articulationGeometry";
import type { ResultRow } from "../types";

type Props = {
  result: ResultRow | null;
};

type SceneHandles = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  tongue: THREE.Mesh;
  upperLip: THREE.Mesh;
  lowerLip: THREE.Mesh;
  tract: THREE.Mesh;
  jaw: THREE.Mesh;
  resonance: THREE.Mesh;
  tractMaterial: THREE.MeshStandardMaterial;
  resonanceMaterial: THREE.MeshStandardMaterial;
};

export function ArticulatoryModel3D({ result }: Props) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const handlesRef = React.useRef<SceneHandles | null>(null);
  const estimate = React.useMemo(() => deriveArticulationEstimate(result), [result]);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const handles = createScene(host);
    handlesRef.current = handles;
    updateScene(handles, estimate);

    let animationFrame = 0;
    const render = () => {
      handles.controls.update();
      handles.renderer.render(handles.scene, handles.camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    render();

    const resizeObserver = new ResizeObserver(() => resizeRenderer(host, handles));
    resizeObserver.observe(host);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      handles.controls.dispose();
      disposeScene(handles.scene);
      handles.renderer.dispose();
      host.replaceChildren();
      handlesRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (handlesRef.current) {
      updateScene(handlesRef.current, estimate);
    }
  }, [estimate]);

  const readout = [
    ["Jaw", estimate.jawOpen],
    ["Tongue height", estimate.tongueHeight],
    ["Tongue front", estimate.tongueFrontness],
    ["Lip round", estimate.lipRounding]
  ] as const;

  return (
    <section className="articulatory-panel" aria-label="3D vocal tract model">
      <div className="chart-heading">
        <span>3D vocal tract</span>
        <span>{result ? `${result.word} / ${result.ipa}` : "Neutral model"}</span>
      </div>
      <div
        className="articulatory-canvas"
        ref={hostRef}
        role="img"
        aria-label="Pedagogical 3D vocal tract estimate with orbit controls"
      />
      <div className="articulation-summary">
        <div>
          <span>Estimate</span>
          <strong>{Math.round(estimate.confidence * 100)}%</strong>
        </div>
        {readout.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <div className="articulation-meter">
              <i style={{ width: `${Math.round(value * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="articulation-note">
        Formant-driven teaching approximation, not an anatomical reconstruction.
      </p>
    </section>
  );
}

function createScene(host: HTMLDivElement): SceneHandles {
  const { width, height } = elementSize(host);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#fbfcfa");

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0.15, 0.15, 6.2);
  fitCamera(camera, width, height);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.replaceChildren(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, -0.05, 0);
  controls.minDistance = 3.8;
  controls.maxDistance = 9.2;
  controls.update();

  scene.add(new THREE.AmbientLight("#ffffff", 1.6));
  const keyLight = new THREE.DirectionalLight("#ffffff", 2.1);
  keyLight.position.set(2.8, 3.5, 5.2);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight("#9fc6d0", 0.8);
  fillLight.position.set(-3, -1.5, 3);
  scene.add(fillLight);

  const head = new THREE.Mesh(
    createHeadGeometry(),
    new THREE.MeshStandardMaterial({
      color: "#d9c4aa",
      transparent: true,
      opacity: 0.23,
      roughness: 0.74,
      metalness: 0.02,
      side: THREE.DoubleSide
    })
  );
  head.position.z = -0.06;
  scene.add(head);

  const palate = new THREE.Mesh(
    createTube([
      [-1.7, 0.42, 0.08],
      [-0.72, 0.78, 0.08],
      [0.72, 0.72, 0.08],
      [1.85, 0.35, 0.08]
    ], 0.035),
    new THREE.MeshStandardMaterial({ color: "#8f6f60", roughness: 0.5 })
  );
  scene.add(palate);

  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 24),
    new THREE.MeshStandardMaterial({
      color: "#cc5b67",
      roughness: 0.56,
      metalness: 0.01
    })
  );
  scene.add(tongue);

  const lipMaterial = new THREE.MeshStandardMaterial({
    color: "#b94c57",
    roughness: 0.48,
    metalness: 0.02
  });
  const upperLip = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), lipMaterial);
  const lowerLip = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), lipMaterial.clone());
  scene.add(upperLip, lowerLip);

  const tractMaterial = new THREE.MeshStandardMaterial({
    color: "#3f7f93",
    transparent: true,
    opacity: 0.58,
    roughness: 0.34,
    metalness: 0.02
  });
  const tract = new THREE.Mesh(createTube([[0, 0, 0], [0.01, 0.01, 0]], 0.16), tractMaterial);
  scene.add(tract);

  const jaw = new THREE.Mesh(
    createTube([
      [-1.55, -1.16, 0.12],
      [0.1, -1.36, 0.12],
      [1.85, -1.16, 0.12]
    ], 0.045),
    new THREE.MeshStandardMaterial({ color: "#7f6257", roughness: 0.62 })
  );
  scene.add(jaw);

  const resonanceMaterial = new THREE.MeshStandardMaterial({
    color: "#f4a582",
    emissive: "#7a3215",
    emissiveIntensity: 0.18,
    transparent: true,
    opacity: 0.68,
    roughness: 0.35
  });
  const resonance = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.024, 12, 56), resonanceMaterial);
  resonance.position.set(-1.9, -1.18, 0.16);
  scene.add(resonance);

  const floor = new THREE.GridHelper(5.5, 10, "#cfd6cd", "#e2e6df");
  floor.position.y = -1.9;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  return {
    scene,
    camera,
    renderer,
    controls,
    tongue,
    upperLip,
    lowerLip,
    tract,
    jaw,
    resonance,
    tractMaterial,
    resonanceMaterial
  };
}

function updateScene(handles: SceneHandles, estimate: ReturnType<typeof deriveArticulationEstimate>) {
  const params = getArticulatoryGeometryParams(estimate);
  const [tongueX, tongueY, tongueZ] = params.tongue.position;
  const [tongueScaleX, tongueScaleY, tongueScaleZ] = params.tongue.scale;

  handles.tongue.position.set(tongueX, tongueY, tongueZ + 0.09);
  handles.tongue.scale.set(tongueScaleX, tongueScaleY, tongueScaleZ);
  handles.tongue.rotation.z = params.tongue.rotationZ;

  const lipY = params.lips.aperture / 2;
  const lipXScale = 0.24 + params.lips.protrusion * 0.35;
  const lipYScale = 0.1 * params.lips.roundingScale;
  const lipZScale = 0.25 * params.lips.roundingScale;
  handles.upperLip.position.set(params.lips.centerX, lipY + 0.1, 0.08);
  handles.lowerLip.position.set(params.lips.centerX, -lipY - 0.12, 0.08);
  handles.upperLip.scale.set(lipXScale, lipYScale, lipZScale);
  handles.lowerLip.scale.set(lipXScale, lipYScale, lipZScale);

  replaceGeometry(handles.tract, createTube(params.tract.points, params.tract.radius));
  replaceGeometry(handles.jaw, createTube([
    [-1.55, -1.16, 0.12],
    [0.1, params.jaw.lowerY, 0.12],
    [1.85, params.jaw.lowerY + 0.18, 0.12]
  ], 0.045));
  handles.jaw.rotation.z = params.jaw.hingeRotationZ;

  handles.tractMaterial.opacity = 0.4 + estimate.confidence * 0.22;
  handles.tractMaterial.color.setHSL(0.53 - estimate.tongueFrontness * 0.07, 0.42, 0.46);
  handles.resonance.scale.setScalar(0.72 + params.resonance.strength * 0.46);
  handles.resonanceMaterial.emissiveIntensity = 0.12 + params.resonance.strength * 0.36;
}

function createHeadGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-2.48, -1.68);
  shape.bezierCurveTo(-2.9, -0.68, -2.45, 1.4, -0.9, 1.78);
  shape.bezierCurveTo(0.82, 2.2, 2.52, 1.18, 2.55, 0.08);
  shape.bezierCurveTo(2.58, -0.62, 1.95, -0.96, 1.18, -1.22);
  shape.bezierCurveTo(0.18, -1.58, -1.46, -1.98, -2.48, -1.68);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    bevelSegments: 2
  });
  geometry.translate(0, 0, -0.09);
  return geometry;
}

function createTube(points: Vector3Tuple[], radius: number): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, 72, radius, 14, false);
}

function replaceGeometry(mesh: THREE.Mesh, geometry: THREE.BufferGeometry) {
  mesh.geometry.dispose();
  mesh.geometry = geometry;
}

function resizeRenderer(host: HTMLDivElement, handles: SceneHandles) {
  const { width, height } = elementSize(host);
  handles.camera.aspect = width / height;
  fitCamera(handles.camera, width, height);
  handles.renderer.setSize(width, height);
}

function fitCamera(camera: THREE.PerspectiveCamera, width: number, height: number) {
  const aspect = width / height;
  camera.fov = aspect < 1.1 ? 47 : 42;
  camera.position.z = aspect < 1.1 ? 7.35 : 6.2;
  camera.updateProjectionMatrix();
}

function elementSize(element: HTMLElement): { width: number; height: number } {
  return {
    width: Math.max(320, Math.round(element.clientWidth || 640)),
    height: Math.max(360, Math.round(element.clientHeight || 520))
  };
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    }
  });
}
