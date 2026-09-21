import { useMemo } from "react";
import { FiBriefcase, FiCalendar, FiMapPin } from "react-icons/fi";
import type { Experience as ExperienceItem } from "../api/types";
import {
  experiencePeriod,
  isCurrentExperience,
  sortExperience,
} from "../utils/experienceSort";
import "./Experience.css";

export default function Experience({
  experience,
}: {
  experience: ExperienceItem[];
}) {
  // Current roles first, then the newest start year.
  const timeline = useMemo(() => sortExperience(experience), [experience]);

  return (
    <section className="section experience" id="experience">
      <div className="container">
        <div className="section-head reveal">
          {/* <span className="eyebrow">Career</span> */}
          <h2 className="section-title">
            My <span className="gradient-text">experience</span>
          </h2>
          <p className="section-text">
            Where I have worked and what I have accomplished.
          </p>
        </div>

        {timeline.length === 0 ? (
          <p className="experience__empty">No experience added yet.</p>
        ) : (
          <div className="timeline">
            {timeline.map((item) => (
              <article key={item.id} className="timeline__item reveal">
                <div className="timeline__marker">
                  <FiBriefcase />
                </div>

                <div className="timeline__card card">
                  <div className="timeline__top">
                    <div>
                      <h3>{item.role}</h3>
                      <span className="timeline__company">
                        {item.company}
                      </span>
                    </div>
                    <span
                      className={`timeline__period${
                        isCurrentExperience(item)
                          ? " timeline__period--current"
                          : ""
                      }`}
                    >
                      <FiCalendar />
                      {experiencePeriod(item)}
                    </span>
                  </div>

                  {item.location && (
                    <span className="timeline__location">
                      <FiMapPin /> {item.location}
                    </span>
                  )}

                  <p className="timeline__desc">{item.description}</p>

                  {item.highlights && item.highlights.length > 0 && (
                    <ul className="timeline__highlights">
                      {item.highlights.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}