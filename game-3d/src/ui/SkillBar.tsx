import { SKILLS_BY_CLASS, type SkillDef } from "../data/skills";
import type { ClassId } from "../types";

export interface SkillBarProps {
  cls: ClassId;
  mp: number;
  cooldowns: Record<string, number>;
  /** Active buff with skill id (if any). */
  buffSkill?: string | null;
  buffUntil?: number | null;
  onCast: (skill: SkillDef) => void;
}

export function SkillBar({
  cls,
  mp,
  cooldowns,
  buffSkill,
  buffUntil,
  onCast,
}: SkillBarProps) {
  const skills = SKILLS_BY_CLASS[cls] ?? SKILLS_BY_CLASS.knight;
  const now = Date.now();
  return (
    <div className="skill-bar">
      {skills.slice(0, 4).map((s, i) => {
        const cdLeft = Math.max(0, (cooldowns[s.id] ?? 0) - now) / 1000;
        const onCd = cdLeft > 0;
        const noMp = mp < s.mp;
        const disabled = onCd || noMp;
        const buffActive =
          buffSkill === s.id && buffUntil !== null && buffUntil !== undefined && buffUntil > now;
        const cdRatio = onCd ? cdLeft / s.cd : 0;
        return (
          <button
            key={s.id}
            className={`skill-slot ${disabled ? "skill-disabled" : ""} ${buffActive ? "skill-buffed" : ""}`}
            onClick={() => !disabled && onCast(s)}
            title={`${s.name}\n${s.desc}\nMP ${s.mp} · CD ${s.cd}s`}
          >
            <span className="skill-icon">{s.icon}</span>
            <span className="skill-key">{i + 1}</span>
            {onCd && (
              <>
                <span
                  className="skill-cd-overlay"
                  style={{ height: `${cdRatio * 100}%` }}
                />
                <span className="skill-cd-text">{cdLeft.toFixed(1)}</span>
              </>
            )}
            {!onCd && noMp && <span className="skill-cd-text">no MP</span>}
            {buffActive && (
              <span className="skill-buff-glow" />
            )}
          </button>
        );
      })}
    </div>
  );
}
