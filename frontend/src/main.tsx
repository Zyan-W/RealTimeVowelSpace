import React from "react";
import ReactDOM from "react-dom/client";
import { Mic, RotateCcw, SkipForward, Square, Download, Play } from "lucide-react";

import { analyzeToken, fetchCorpus } from "./api";
import { WavRecorder } from "./audio";
import { VowelChart } from "./components/VowelChart";
import { sessionResultsToCsv } from "./csv";
import type { Corpus, ResultRow } from "./types";
import "./styles.css";

type RecordingState = "idle" | "recording" | "analyzing";

function App() {
  const [corpus, setCorpus] = React.useState<Corpus | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [results, setResults] = React.useState<ResultRow[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [state, setState] = React.useState<RecordingState>("idle");
  const [message, setMessage] = React.useState("Loading word list...");
  const recorderRef = React.useRef<WavRecorder | null>(null);

  React.useEffect(() => {
    fetchCorpus()
      .then((nextCorpus) => {
        setCorpus(nextCorpus);
        setMessage("Ready");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  const token = corpus?.tokens[currentIndex] ?? null;
  const selectedResult = results.find((result) => result.wordId === selectedId) ?? results.at(-1) ?? null;
  const progress = corpus ? Math.round((results.length / corpus.tokens.length) * 100) : 0;

  async function startRecording() {
    if (!token || state !== "idle") return;
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
    if (!token || state !== "recording" || !recorderRef.current) return;
    setState("analyzing");
    setMessage("Analyzing vowel...");
    try {
      const recording = await recorderRef.current.stop();
      if (recording.duration < 0.25) {
        throw new Error("That clip was too short. Try holding the vowel a little longer.");
      }
      const analysis = await analyzeToken(token, recording.blob);
      const row: ResultRow = {
        ...analysis,
        timestamp: new Date().toISOString(),
        color: token.color,
        ipa: token.ipa
      };
      setResults((existing) => [...existing.filter((item) => item.wordId !== row.wordId), row]);
      setSelectedId(row.wordId);
      setMessage(`${token.display}: F1 ${analysis.f1?.toFixed(0)} Hz, F2 ${analysis.f2?.toFixed(0)} Hz`);
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
    const blob = new Blob([sessionResultsToCsv(results)], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "vowel-space-session.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <div className="prompt-panel">
          <div className="topline">
            <span>English vowel space</span>
            <span>{corpus?.version ?? "v1"}</span>
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

        <VowelChart corpus={corpus} results={results} selectedId={selectedId} onSelect={setSelectedId} />

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
                  <dd>{selectedResult.f1?.toFixed(0)} Hz</dd>
                </div>
                <div>
                  <dt>F2</dt>
                  <dd>{selectedResult.f2?.toFixed(0)} Hz</dd>
                </div>
                <div>
                  <dt>F3</dt>
                  <dd>{selectedResult.f3 ? `${selectedResult.f3.toFixed(0)} Hz` : "n/a"}</dd>
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
                <strong>{result.f1?.toFixed(0)} / {result.f2?.toFixed(0)}</strong>
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

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
