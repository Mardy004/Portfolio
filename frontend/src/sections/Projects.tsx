import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
  FiGithub,
} from "react-icons/fi";
import type { Project } from "../api/types";
import { resolveMediaUrl } from "../api/client";
import "./Projects.css";

export default function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState("All");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [projects]);

  const visible = useMemo(
    () =>
      filter === "All"
        ? projects
        : projects.filter((p) => p.category === filter),
    [projects, filter]
  );

  // Reset the carousel whenever the filter changes.
  useEffect(() => {
    setIndex(0);
  }, [filter]);

  const go = useCallback(
    (dir: number) => {
      setIndex((current) => {
        if (visible.length === 0) return 0;
        return (current + dir + visible.length) % visible.length;
      });
    },
    [visible.length]
  );

  // Autoplay
  useEffect(() => {
    if (paused || visible.length <= 1) return;
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [paused, visible.length, go]);

  // Keep the active card in view on small screens.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (card) {
      track.scrollTo({
        left: card.offsetLeft - track.offsetLeft,
        behavior: "smooth",
      });
    }
  }, [index]);

  return (
    <section className="section projects" id="projects">
      <div className="container">
        <div className="section-head reveal">
          <span className="eyebrow">Portfolio</span>
          <h2 className="section-title">
            Featured <span className="gradient-text">projects</span>
          </h2>
          <p className="section-text">
            A selection of things I have designed and built.
          </p>
        </div>

        {projects.length === 0 ? (
          <p className="projects__empty">No projects added yet.</p>
        ) : (
          <>
            {categories.length > 2 && (
              <div className="projects__filters reveal">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`projects__filter ${
                      filter === cat ? "is-active" : ""
                    }`}
                    onClick={() => setFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div
              className="carousel reveal"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="carousel__track" ref={trackRef}>
                {visible.map((project, i) => (
                  <article
                    key={project.id}
                    className={`project-card ${
                      i === index ? "is-active" : ""
                    }`}
                  >
                    <div className="project-card__media">
                      {project.image ? (
                        <img
                          src={resolveMediaUrl(project.image)}
                          alt={project.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="project-card__placeholder">
                          <span>{"</>"}</span>
                        </div>
                      )}
                      {project.featured && (
                        <span className="project-card__badge">Featured</span>
                      )}
                    </div>

                    <div className="project-card__body">
                      <span className="project-card__category">
                        {project.category}
                      </span>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>

                      <div className="project-card__tech">
                        {project.technologies?.map((tech) => (
                          <span key={tech}>{tech}</span>
                        ))}
                      </div>

                      <div className="project-card__links">
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            <FiExternalLink /> Live
                          </a>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <FiGithub /> Code
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {visible.length > 1 && (
                <>
                  <button
                    className="carousel__nav carousel__nav--prev"
                    onClick={() => go(-1)}
                    aria-label="Previous project"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    className="carousel__nav carousel__nav--next"
                    onClick={() => go(1)}
                    aria-label="Next project"
                  >
                    <FiChevronRight />
                  </button>

                  <div className="carousel__dots">
                    {visible.map((project, i) => (
                      <button
                        key={project.id}
                        className={`carousel__dot ${
                          i === index ? "is-active" : ""
                        }`}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to project ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}