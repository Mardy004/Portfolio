import { FiMapPin, FiMail, FiBriefcase, FiDownload } from "react-icons/fi";
import type { Profile } from "../api/types";
import "./About.css";

export default function About({ profile }: { profile: Profile | null }) {
  const info = [
    {
      icon: <FiBriefcase />,
      label: "Role",
      value: profile?.role || "Frontend Developer",
    },
    {
      icon: <FiMapPin />,
      label: "Location",
      value: profile?.location || "Kigali, Rwanda",
    },
    {
      icon: <FiMail />,
      label: "Email",
      value: profile?.email || "hello@example.com",
    },
    {
      icon: <FiBriefcase />,
      label: "Availability",
      value: profile?.availability || "Open to opportunities",
    },
  ];

  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="section-head reveal">
          {/* <span className="eyebrow">About me</span> */}
          <h2 className="section-title">
            Turning ideas into <span className="gradient-text">interfaces</span>
          </h2>
          <p className="section-text">
            A quick introduction to who I am and what I do.
          </p>
        </div>

        <div className="about__grid">
          <div className="about__text reveal">
            <p>{profile?.bio}</p>

            <div className="about__info">
              {info.map((item) => (
                <div key={item.label} className="about__info-item">
                  <span className="about__info-icon">{item.icon}</span>
                  <div>
                    <span className="about__info-label">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                </div>
              ))}
            </div>

            {profile?.resumeUrl && (
              <a
                className="btn btn-primary"
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download CV <FiDownload />
              </a>
            )}
          </div>

          <div className="about__stats reveal">
            {(profile?.stats || []).map((stat) => (
              <div key={stat.label} className="about__stat card">
                <strong className="gradient-text">{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}