import React from "react";
import ReactDOM from "react-dom/client";
import { Box, Download, Globe2, Mic, Play, RotateCcw, Ruler, SkipForward, Square, Users } from "lucide-react";

import { analyzeToken, fetchCorpora } from "./api";
import { WavRecorder } from "./audio";
import { VowelChart } from "./components/VowelChart";
import { sessionResultsToCsv } from "./csv";
import type { Corpus, DisplayUnit, ResultRow } from "./types";
import { formatFormant, unitLabel } from "./units";
import "./styles.css";

type RecordingState = "idle" | "recording" | "analyzing";
type CenterView = "2d" | "3d";

const ArticulatoryModel3D = React.lazy(() =>
  import("./components/ArticulatoryModel3D").then((module) => ({
    default: module.ArticulatoryModel3D
  }))
);

function App() {
  const [corpora, setCorpora] = React.useState<Corpus[]>([]);
  const [activeCorpusId, setActiveCorpusId] = React.useState("american-english");
  const [activeReferenceId, setActiveReferenceId] = React.useState("american");
  const [unit, setUnit] = React.useState<DisplayUnit>("hz");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [centerView, setCenterView] = React.useState<CenterView>("2d");
  const [state, setState] = React.useState<RecordingState>("idle");
  const [message, setMessage] = React.useState("Loading word list...");
  const recorderRef = React.useRef<WavRecorder | null>(null);

  React.useEffect(() => {
    fetchCorpora()
      .then((nextCorpora) => {
        setCorpora(nextCorpora);
        const initialCorpus = nextCorpora.find((item) => item.id === activeCorpusId) ?? nextCorpora[0];
        if (initialCorpus) {
          setActiveCorpusId(initialCorpus.id);
          setActiveReferenceId(initialCorpus.referenceSets[0]?.id ?? "");
        }
        setMessage("Ready");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const corpus = corpora.find((item) => item.id === activeCorpusId) ?? corpora[0] ?? null;
  const token = corpus?.tokens[currentIndex] ?? null;
  const selectedResult = results.find((result) => result.wordId === selectedId) ?? results.at(-1) ?? null;
  const progress = corpus ? Math.round((results.length / corpus.tokens.length) * 100) : 0;
  const activeReference = corpus?.referenceSets.find((item) => item.id === activeReferenceId) ?? corpus?.referenceSets[0] ?? null;

  async function startRecording() {
    if (!corpus || !token || state !== "idle") return;
    try {
      const recorder = new WavRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setState("recording");
      setMessage(`Recording ${token.display}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Microphone permission was denied.");
    }
  }

  async function stopRecording() {
    if (!corpus || !token || state !== "recording" || !recorderRef.current) return;
    setState("analyzing");
    setMessage("Analyzing vowel...");
    try {
      const recording = await recorderRef.current.stop();
      if (recording.duration < 0.25) {
        throw new Error("That clip was too short. Try holding the vowel a little longer.");
      }
      const analysis = await analyzeToken(corpus, token, recording.blob);
      const row: ResultRow = {
        ...analysis,
        corpusId: corpus.id,
        timestamp: new Date().toISOString(),
        color: token.color,
        ipa: token.ipa
      };
      setResults((existing) => [...existing.filter((item) => item.wordId !== row.wordId), row]);
      setSelectedId(row.wordId);
      setMessage(`${token.display}: F1 ${formatFormant(analysis.f1, unit)}, F2 ${formatFormant(analysis.f2, unit)}`);
      setCurrentIndex((index) => Math.min(index + 1, (corpus?.tokens.length ?? 1) - 1));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analysis failed.");
    } finally {
      setState("idle");
      recorderRef.current = null;
    }
  }

  function skipToken() {
    if (!corpus) return;
    setCurrentIndex((index) => Math.min(index + 1, corpus.tokens.length - 1));
    setMessage("Skipped");
  }

  function resetSession() {
    setResults([]);
    setSelectedId(null);
    setCurrentIndex(0);
    setMessage("Session cleared");
  }

  function exportCsv() {
    const blob = new Blob([sessionResultsToCsv(results, unit)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vowel-space-session.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function changeCorpus(nextCorpusId: string) {
    const nextCorpus = corpora.find((item) => item.id === nextCorpusId);
    setActiveCorpusId(nextCorpusId);
    setActiveReferenceId(nextCorpus?.referenceSets[0]?.id ?? "");
    setCurrentIndex(0);
    setResults([]);
    setSelectedId(null);
    setMessage("Ready");
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="prompt-panel">
          <div className="topline">
            <span>{corpus?.language ?? "Vowel"} vowel space</span>
            <span>{corpus?.version ?? "ver 1.0"}</span>
          </div>
          <div className="authorline">WANG Zhiyan</div>
          <div className="switch-stack">
            <div className="segmented" aria-label="Language">
              <Globe2 size={16} />
              {corpora.map((item) => (
                <button
                  key={item.id}
                  className={item.id === corpus?.id ? "active" : ""}
                  onClick={() => changeCorpus(item.id)}
                  disabled={state !== "idle"}
                >
                  {corpusButtonLabel(item)}
                </button>
              ))}
            </div>
            {corpus && corpus.referenceSets.length > 1 && (
              <div className="segmented" aria-label="Reference accent">
                <Users size={16} />
                {corpus.referenceSets.map((item) => (
                  <button
                    key={item.id}
                    className={item.id === activeReferenceId ? "active" : ""}
                    onClick={() => setActiveReferenceId(item.id)}
                    disabled={state !== "idle"}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <div className="segmented" aria-label="Formant unit">
              <Ruler size={16} />
              {(["hz", "bark"] as DisplayUnit[]).map((nextUnit) => (
                <button
                  key={nextUnit}
                  className={nextUnit === unit ? "active" : ""}
                  onClick={() => setUnit(nextUnit)}
                >
                  {unitLabel(nextUnit)}
                </button>
              ))}
            </div>
          </div>
          <div className="word-zone">
            <span className="word-count">{corpus ? `${currentIndex + 1} / ${corpus.tokens.length}` : "..."}</span>
            <h1>{token?.display ?? "Loading"}</h1>
            <p>{token ? `${token.ipa} target vowel` : "Preparing corpus"}</p>
          </div>
          <div className="meter">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="controls">
            {state === "recording" ? (
              <button className="primary danger" onClick={stopRecording} title="Stop recording">
                <Square size={20} />
                Stop
              </button>
            ) : (
              <button className="primary" onClick={startRecording} disabled={!token || state === "analyzing"} title="Record token">
                {state === "analyzing" ? <Play size={20} /> : <Mic size={20} />}
                {state === "analyzing" ? "Working" : "Record"}
              </button>
            )}
            <button onClick={skipToken} disabled={!corpus || state !== "idle"} title="Skip word">
              <SkipForward size={18} />
            </button>
            <button onClick={resetSession} disabled={state !== "idle"} title="Reset session">
              <RotateCcw size={18} />
            </button>
            <button onClick={exportCsv} disabled={results.length === 0} title="Download CSV">
              <Download size={18} />
            </button>
          </div>
          <p className={`status ${state}`}>{message}</p>
        </div>

        <div className="center-stack">
          <div className="segmented view-switch" aria-label="Visualization view">
            <Box size={16} />
            {(["2d", "3d"] as CenterView[]).map((view) => (
              <button
                key={view}
                className={view === centerView ? "active" : ""}
                onClick={() => setCenterView(view)}
              >
                {view.toUpperCase()}
              </button>
            ))}
          </div>
          {centerView === "2d" ? (
            <VowelChart
              corpus={corpus}
              results={results}
              selectedId={selectedId}
              activeReferenceId={activeReference?.id ?? ""}
              unit={unit}
              onSelect={setSelectedId}
            />
          ) : (
            <React.Suspense fallback={<div className="articulatory-panel loading-panel">Loading 3D model...</div>}>
              <ArticulatoryModel3D result={selectedResult} />
            </React.Suspense>
          )}
        </div>

        <aside className="result-panel">
          <div className="panel-heading">
            <span>Latest formants</span>
            <strong>{results.length}</strong>
          </div>
          {selectedResult ? (
            <div className="formant-readout">
              <h2>{selectedResult.word}</h2>
              <span>{selectedResult.ipa}</span>
              <dl>
                <div>
                  <dt>F1</dt>
                  <dd>{formatFormant(selectedResult.f1, unit)}</dd>
                </div>
                <div>
                  <dt>F2</dt>
                  <dd>{formatFormant(selectedResult.f2, unit)}</dd>
                </div>
                <div>
                  <dt>F3</dt>
                  <dd>{formatFormant(selectedResult.f3, unit)}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{Math.round(selectedResult.confidence * 100)}%</dd>
                </div>
              </dl>
              {selectedResult.warnings.length > 0 && (
                <ul className="warnings">
                  {selectedResult.warnings.map((warning) => (
                    <li key={warning}>{formatWarning(warning)}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="empty-state">Record the first word to place a vowel point.</div>
          )}
          <div className="mini-table">
            {results.map((result) => (
              <button key={result.wordId} onClick={() => setSelectedId(result.wordId)}>
                <span style={{ background: result.color }} />
                {result.word}
                <strong>{formatCompact(result.f1, unit)} / {formatCompact(result.f2, unit)}</strong>
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function formatWarning(warning: string): string {
  return warning.replaceAll("_", " ");
}

function corpusButtonLabel(corpus: Corpus): string {
  return corpus.language.replace(" English", "");
}

function formatCompact(value: number | null, unit: DisplayUnit): string {
  if (value == null) return "n/a";
  return unit === "bark" ? formatFormant(value, unit).replace(" Bark", "") : value.toFixed(0);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
