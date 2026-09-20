import { useEffect, useState } from "react";
import { FiArrowRight, FiDownload, FiGithub, FiLinkedin, FiMail} from "react-icons/fi";
import type { Profile } from "../api/types";
import "./Hero.css";

const ROLES = [
  "Frontend Developer",
  "React Enthusiast",
  "UI Engineer",
  "Problem Solver",
];

export default function Hero({ profile }: { profile: Profile | null }) {
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRoleIndex((i) => (i + 1) % ROLES.length);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  const name = profile?.name || "Mariette Ikuzwe";
  const tagline =
    profile?.tagline || "I build clean, modern and responsive web experiences.";
  const socials = profile?.socials || {};
  const contactEmail = profile?.email || "ikuzwemariette@gmail.com";

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="hero section" id="home">
      <div className="container hero__inner">
        <div className="hero__content reveal">
          <span className="eyebrow">Available for work</span>

          <h1 className="hero__title">
            Hi, I am <span className="gradient-text">{name}</span>
          </h1>

          <p className="hero__role">
            <span className="hero__role-static">I am a</span>{" "}
            <span key={roleIndex} className="hero__role-dynamic">
              {ROLES[roleIndex]}
            </span>
          </p>

          <p className="hero__tagline">{tagline}</p>

          <div className="hero__actions">
            <button
              className="btn btn-primary"
              onClick={() => scrollTo("projects")}
            >
              View my work <FiArrowRight />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => scrollTo("contact")}
            >
              Get in touch
            </button>
          </div>

          <div className="hero__socials">
            {socials.github && (
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FiGithub />
              </a>
            )}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FiLinkedin />
              </a>
              
            )}
            <a
             href={`mailto:${contactEmail}`}
              aria-label="Email"
                          >
              <FiMail />
              </a>
            {profile?.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hero__resume"
              >
                <FiDownload /> Résumé
              </a>
            )}
          </div>
        </div>

        <div className="hero__visual reveal">
          <div className="hero__code">
            <div className="hero__code-bar">
              <span /> <span /> <span />
              <em>developer.ts</em>
            </div>
            <pre>
              <code>
                <span className="c-key">const</span>{" "}
                <span className="c-var">developer</span> = {"{"}
                {"\n"}  name: <span className="c-str">"{name}"</span>,
                {"\n"}  role:{" "}
                <span className="c-str">"{profile?.role || "Frontend Dev"}"</span>,
                {"\n"}  location:{" "}
                <span className="c-str">"{profile?.location || "Remote"}"</span>,
                {"\n"}  skills: [
                <span className="c-str">"React"</span>,{" "}
                <span className="c-str">"TS"</span>],
                {"\n"}  available: <span className="c-bool">true</span>,
                {"\n"}
                {"}"};
              </code>
            </pre>
          </div>

          {profile?.stats && profile.stats.length > 0 && (
            <div className="hero__stats">
              {profile.stats.map((stat) => (
                <div key={stat.label} className="hero__stat">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}