import type { Corpus, DisplayUnit, ResultRow } from "../types";
import { displayValue, unitLabel } from "../units";

type Props = {
  corpus: Corpus | null;
  results: ResultRow[];
  selectedId: string | null;
  activeReferenceId: string;
  unit: DisplayUnit;
  onSelect: (wordId: string) => void;
};

const WIDTH = 720;
const HEIGHT = 560;
const PAD = 58;
const SCALES = {
  hz: {
    f1Min: 200,
    f1Max: 1000,
    f2Min: 600,
    f2Max: 2800,
    xTicks: [2600, 2200, 1800, 1400, 1000, 600],
    yTicks: [200, 400, 600, 800, 1000]
  },
  bark: {
    f1Min: 2,
    f1Max: 10,
    f2Min: 4.5,
    f2Max: 15,
    xTicks: [14, 12, 10, 8, 6],
    yTicks: [2, 4, 6, 8, 10]
  }
} satisfies Record<DisplayUnit, {
  f1Min: number;
  f1Max: number;
  f2Min: number;
  f2Max: number;
  xTicks: number[];
  yTicks: number[];
}>;

type ChartPoint = {
  id: string;
  x: number;
  y: number;
};

export function orderPointsClockwise<T extends ChartPoint>(points: T[]): T[] {
  if (points.length < 3) return [...points];
  const center = points.reduce(
    (total, point) => ({
      x: total.x + point.x / points.length,
      y: total.y + point.y / points.length
    }),
    { x: 0, y: 0 }
  );
  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
}

export function VowelChart({ corpus, results, selectedId, activeReferenceId, unit, onSelect }: Props) {
  const scale = SCALES[unit];
  const x = (f2: number) => PAD + ((scale.f2Max - f2) / (scale.f2Max - scale.f2Min)) * (WIDTH - PAD * 2);
  const y = (f1: number) => PAD + ((f1 - scale.f1Min) / (scale.f1Max - scale.f1Min)) * (HEIGHT - PAD * 2);
  const orderedResults = corpus?.tokens
    .map((token) => results.find((result) => result.wordId === token.id))
    .filter((result): result is ResultRow => result?.f1 != null && result?.f2 != null) ?? [];
  const measuredPoints = orderedResults
    .map((result): ChartPoint | null => {
      const f1 = displayValue(result.f1, unit);
      const f2 = displayValue(result.f2, unit);
      return f1 == null || f2 == null ? null : { id: result.wordId, x: x(f2), y: y(f1) };
    })
    .filter((point): point is ChartPoint => Boolean(point));
  const isCompleteVowelSpace = Boolean(corpus && measuredPoints.length === corpus.tokens.length);
  const polygonPoints = isCompleteVowelSpace
    ? orderPointsClockwise(measuredPoints).map((point) => `${point.x},${point.y}`)
    : [];

  return (
    <section className="chart-panel" aria-label="Vowel space chart">
      <div className="chart-heading">
        <span>Vowel space</span>
        <span>F2 reversed, F1 down, {unitLabel(unit)}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img">
        <rect className="plot-bg" x={PAD} y={PAD} width={WIDTH - PAD * 2} height={HEIGHT - PAD * 2} />
        {scale.xTicks.map((tick) => (
          <g key={tick}>
            <line className="grid" x1={x(tick)} y1={PAD} x2={x(tick)} y2={HEIGHT - PAD} />
            <text className="tick" x={x(tick)} y={HEIGHT - 22} textAnchor="middle">{tick}</text>
          </g>
        ))}
        {scale.yTicks.map((tick) => (
          <g key={tick}>
            <line className="grid" x1={PAD} y1={y(tick)} x2={WIDTH - PAD} y2={y(tick)} />
            <text className="tick" x={24} y={y(tick) + 4}>{tick}</text>
          </g>
        ))}
        <text className="axis-label" x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle">F2 {unitLabel(unit)}</text>
        <text className="axis-label" transform={`translate(14 ${HEIGHT / 2}) rotate(-90)`} textAnchor="middle">F1 {unitLabel(unit)}</text>

        {corpus?.tokens.map((token) => {
          const reference = token.references[activeReferenceId] ?? Object.values(token.references)[0];
          if (!reference) return null;
          const f1 = displayValue(reference.f1, unit);
          const f2 = displayValue(reference.f2, unit);
          if (f1 == null || f2 == null) return null;
          return (
            <g key={token.id}>
              <circle
                className="reference-point"
                cx={x(f2)}
                cy={y(f1)}
                r={10}
                style={{ stroke: token.color }}
              />
              <text className="reference-label" x={x(f2) + 14} y={y(f1) + 5}>
                {token.ipa}
              </text>
            </g>
          );
        })}

        {polygonPoints.length >= 3 && (
          <polygon className="speaker-polygon" points={polygonPoints.join(" ")} />
        )}

        {results.map((result) => {
          const f1 = displayValue(result.f1, unit);
          const f2 = displayValue(result.f2, unit);
          if (f1 == null || f2 == null) return null;
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
                cx={x(f2)}
                cy={y(f1)}
                r={selected ? 9 : 7}
                style={{ fill: result.color }}
              />
              <text className="point-label" x={x(f2) + 12} y={y(f1) - 10}>{result.word}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
