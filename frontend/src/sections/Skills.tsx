import { useMemo } from "react";
import type { Skill } from "../api/types";
import { skillLevelLabel, skillLevelValue } from "../utils/skillLevel";
import "./Skills.css";

export default function Skills({ skills }: { skills: Skill[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Skill[]>();
    skills.forEach((skill) => {
      const key = skill.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(skill);
    });
    return Array.from(map.entries());
  }, [skills]);

  return (
    <section className="section skills" id="skills">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Skills</span>
          <h2 className="section-title">
            My <span className="gradient-text">toolbox</span>
          </h2>
          <p className="section-text">
            Technologies and tools I use to bring products to life.
          </p>
        </div>

        {skills.length === 0 ? (
          <p className="skills__empty">No skills added yet.</p>
        ) : (
          <div className="skills__groups">
            {grouped.map(([category, items]) => (
              <div key={category} className="skills__group reveal">
                <h3 className="skills__group-title">{category}</h3>
                <div className="skills__list">
                  {items.map((skill) => (
                    <div key={skill.id} className="skill">
                      <div className="skill__head">
                        <span className="skill__name">{skill.name}</span>
                        <span className="skill__level">
                          {skillLevelLabel(skill.level)}
                        </span>
                      </div>
                      <div className="skill__bar">
                        <span
                          className="skill__fill"
                          style={{ width: `${skillLevelValue(skill.level)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}