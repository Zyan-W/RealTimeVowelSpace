import type { Corpus, ResultRow } from "../types";

type Props = {
  corpus: Corpus | null;
  results: ResultRow[];
  selectedId: string | null;
  onSelect: (wordId: string) => void;
};

const WIDTH = 720;
const HEIGHT = 560;
const PAD = 58;
const F1_MIN = 200;
const F1_MAX = 1000;
const F2_MIN = 600;
const F2_MAX = 2800;

export function VowelChart({ corpus, results, selectedId, onSelect }: Props) {
  const x = (f2: number) => PAD + ((F2_MAX - f2) / (F2_MAX - F2_MIN)) * (WIDTH - PAD * 2);
  const y = (f1: number) => PAD + ((f1 - F1_MIN) / (F1_MAX - F1_MIN)) * (HEIGHT - PAD * 2);
  const xTicks = [2600, 2200, 1800, 1400, 1000, 600];
  const yTicks = [200, 400, 600, 800, 1000];

  return (
    <section className="chart-panel" aria-label="Vowel space chart">
      <div className="chart-heading">
        <span>Vowel space</span>
        <span>F2 reversed, F1 down</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        <rect className="plot-bg" x={PAD} y={PAD} width={WIDTH - PAD * 2} height={HEIGHT - PAD * 2} />
        {xTicks.map((tick) => (
          <g key={tick}>
            <line className="grid" x1={x(tick)} y1={PAD} x2={x(tick)} y2={HEIGHT - PAD} />
            <text className="tick" x={x(tick)} y={HEIGHT - 22} textAnchor="middle">{tick}</text>
          </g>
        ))}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line className="grid" x1={PAD} y1={y(tick)} x2={WIDTH - PAD} y2={y(tick)} />
            <text className="tick" x={24} y={y(tick) + 4}>{tick}</text>
          </g>
        ))}
        <text className="axis-label" x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle">F2 Hz</text>
        <text className="axis-label" transform={`translate(14 ${HEIGHT / 2}) rotate(-90)`} textAnchor="middle">F1 Hz</text>

        {corpus?.tokens.map((token) => (
          <g key={token.id}>
            <ellipse
              className="reference-region"
              cx={x(token.reference.f2)}
              cy={y(token.reference.f1)}
              rx={(token.reference.radiusF2 / (F2_MAX - F2_MIN)) * (WIDTH - PAD * 2)}
              ry={(token.reference.radiusF1 / (F1_MAX - F1_MIN)) * (HEIGHT - PAD * 2)}
              style={{ stroke: token.color, fill: token.color }}
            />
            <text className="reference-label" x={x(token.reference.f2)} y={y(token.reference.f1) + 4} textAnchor="middle">
              {token.ipa}
            </text>
          </g>
        ))}

        {results.map((result) => {
          if (result.f1 == null || result.f2 == null) return null;
          const selected = selectedId === result.wordId;
          return (
            <g
              key={result.wordId}
              className="point-group"
              role="button"
              tabIndex={0}
              aria-label={`Select ${result.word}`}
              onClick={() => onSelect(result.wordId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  onSelect(result.wordId);
                }
              }}
            >
              <circle
                className={selected ? "result-point selected" : "result-point"}
                cx={x(result.f2)}
                cy={y(result.f1)}
                r={selected ? 9 : 7}
                style={{ fill: result.color }}
              />
              <text className="point-label" x={x(result.f2) + 12} y={y(result.f1) - 10}>{result.word}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
