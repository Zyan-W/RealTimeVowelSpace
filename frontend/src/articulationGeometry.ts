import type { ArticulationEstimate } from "./articulation";

export type Vector3Tuple = [number, number, number];

export type ArticulatoryGeometryParams = {
  tongue: {
    position: Vector3Tuple;
    scale: Vector3Tuple;
    rotationZ: number;
  };
  lips: {
    centerX: number;
    aperture: number;
    protrusion: number;
    roundingScale: number;
  };
  jaw: {
    lowerY: number;
    hingeRotationZ: number;
  };
  tract: {
    points: Vector3Tuple[];
    radius: number;
  };
  resonance: {
    strength: number;
  };
};

export function getArticulatoryGeometryParams(estimate: ArticulationEstimate): ArticulatoryGeometryParams {
  const jaw = estimate.jawOpen;
  const front = estimate.tongueFrontness;
  const height = estimate.tongueHeight;
  const rounding = estimate.lipRounding;
  const tractShape = estimate.tractShape;
  const tongueX = -0.75 + front * 1.35 - rounding * 0.18;
  const tongueY = -0.78 + height * 0.9 - jaw * 0.22;
  const lipProtrusion = rounding * 0.48;
  const lipAperture = Math.max(0.22, 0.28 + jaw * 0.62 - rounding * 0.1);

  return {
    tongue: {
      position: [tongueX, tongueY, 0],
      scale: [1.08 + jaw * 0.26, 0.36 + height * 0.18, 0.42],
      rotationZ: -0.24 + front * 0.22 + jaw * 0.14
    },
    lips: {
      centerX: 2.22 + lipProtrusion,
      aperture: lipAperture,
      protrusion: lipProtrusion,
      roundingScale: 0.72 + rounding * 0.58
    },
    jaw: {
      lowerY: -1.18 - jaw * 0.42,
      hingeRotationZ: -0.08 - jaw * 0.18
    },
    tract: {
      points: [
        [-2.25, -1.32, 0],
        [-1.6, -0.72 + height * 0.38, 0],
        [-0.55, 0.05 + height * 0.35 - jaw * 0.08, 0],
        [0.78, 0.08 + (1 - front) * 0.16 + tractShape * 0.1, 0],
        [2.12 + lipProtrusion, 0.02 + lipAperture * 0.08, 0]
      ],
      radius: 0.13 + jaw * 0.15 + (1 - front) * 0.05 + rounding * 0.03
    },
    resonance: {
      strength: tractShape
    }
  };
}
