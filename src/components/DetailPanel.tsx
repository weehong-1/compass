import { memo } from "react";
import { formatDegree } from "@/domain/angle";
import {
  DRAGON_NAMES,
  ELEMENT_NAMES,
  YIN_YANG_NAMES,
  mountainRange,
  type Mountain,
} from "@/domain/mountains";
import { directionAt, palaceOf, type Trigram } from "@/domain/trigrams";
import { ELEMENT_FILL } from "./luopan/palette";

interface Props {
  sitting: Mountain;
  facing: Mountain;
}

/** 当前坐山与向山的详细资料。 */
export const DetailPanel = memo(function DetailPanel({ sitting, facing }: Props) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
      <MountainCard role="坐" mountain={sitting} />
      <MountainCard role="向" mountain={facing} />
    </div>
  );
});

function MountainCard({ role, mountain: m }: { role: "坐" | "向"; mountain: Mountain }) {
  const palace = palaceOf(m);
  const range = mountainRange(m);
  const color = ELEMENT_FILL[m.element];

  return (
    <article className="rounded-xl border border-line bg-surface p-4" aria-label={`${role}山：${m.name}`}>
      <header className="mb-3 flex items-center gap-3">
        <span className="rounded-md bg-accent px-2 py-0.5 text-sm font-bold text-accent-ink">{role}</span>
        <span className="font-serif text-3xl font-bold">{m.name}</span>
        <span className="ml-auto text-right text-xs text-muted tabular-nums">
          {directionAt(m.center).name}
          <br />
          {formatDegree(range.start)} – {formatDegree(range.end)}
        </span>
      </header>
      <dl className="detail-list">
        <dt>卦</dt>
        <dd className="flex items-center gap-2">
          <TrigramGlyph trigram={palace.trigram} />
          <span>
            {palace.trigram.name}宫 · 洛书{palace.trigram.luoshuName}
          </span>
        </dd>
        <dt>五行</dt>
        <dd className="flex items-center gap-2">
          <span
            className="inline-block size-3.5 rounded-full border border-black/20"
            style={{ background: color.fill }}
            aria-hidden="true"
          />
          {ELEMENT_NAMES[m.element]}
        </dd>
        <dt>三元龙</dt>
        <dd>{DRAGON_NAMES[m.dragon]}</dd>
        <dt>阴阳</dt>
        <dd>{YIN_YANG_NAMES[m.yinYang]}</dd>
        <dt>节气</dt>
        <dd>{m.solarTerm}</dd>
        <dt>生肖</dt>
        <dd>{m.zodiac ?? "—"}</dd>
        <dt>时辰</dt>
        <dd className="tabular-nums">
          {m.shichen ? `${m.shichen.name} ${m.shichen.start}–${m.shichen.end}` : "—"}
        </dd>
      </dl>
    </article>
  );
}

/** 卦象小图：上爻在上、初爻在下。 */
function TrigramGlyph({ trigram }: { trigram: Trigram }) {
  return (
    <svg viewBox="0 0 24 20" width="22" height="18" aria-label={`${trigram.name}卦`} role="img">
      {trigram.lines.map((yang, i) => {
        const y = 16 - i * 6;
        return yang ? (
          <rect key={i} x={2} y={y} width={20} height={3} fill="currentColor" />
        ) : (
          <g key={i} fill="currentColor">
            <rect x={2} y={y} width={8} height={3} />
            <rect x={14} y={y} width={8} height={3} />
          </g>
        );
      })}
    </svg>
  );
}
