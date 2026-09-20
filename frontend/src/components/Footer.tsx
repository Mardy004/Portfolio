import { Link } from "react-router-dom";
import {
  FiArrowUp,
  FiDownload,
  FiGithub,
  FiLinkedin,
  FiMail,
  FiMapPin,
  FiPhone,
  FiTwitter,
} from "react-icons/fi";
import type { Profile } from "../api/types";
import "./Footer.css";

const QUICK_LINKS = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

/** Used when the profile record has no phone number yet. */
const DEFAULT_PHONE = "0791352255";

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Footer({ profile }: { profile: Profile | null }) {
  const year = new Date().getFullYear();
  const name = profile?.name || "Mariette Ikuzwe";
  const role = profile?.role || "Frontend Developer";
  const socials = profile?.socials || {};
  const email = profile?.email || "ikuzwemariette@gmail.com";
  const phone = profile?.phone || DEFAULT_PHONE;
  const location = profile?.location || "Kigali, Rwanda";
  const availability = profile?.availability || "Open to work";
  const firstName = name.split(" ")[0];

  const telHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
  const hireHref = `mailto:${email}?subject=${encodeURIComponent(
    "Project inquiry"
  )}`;

  return (
    <footer className="footer">
      <div className="footer__glow" aria-hidden="true" />

      <div className="container footer__inner">
        {/* LEFT — brand */}
        <div className="footer__brand">
          <h3 className="footer__brand-title">
            {name} <span>&mdash; {role}</span>
          </h3>
          <p className="footer__brand-text">
            Follow or reach {firstName} on social media
          </p>

          <div className="footer__brand-row">
            <div className="footer__socials">
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
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <FiTwitter />
                </a>
              )}
              <a href={`mailto:${email}`} aria-label="Email">
                <FiMail />
              </a>
              <a href={telHref} aria-label={`Call ${phone}`}>
                <FiPhone />
              </a>
            </div>

            <span className="footer__status">
              <span className="footer__dot" />
              {availability}
            </span>
          </div>
        </div>

        {/* MIDDLE — link groups */}
        <div className="footer__nav">
          <nav className="footer__col" aria-label="Quick links">
            <h4 className="footer__col-title">Quick links</h4>
            <ul className="footer__links">
              {QUICK_LINKS.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    className="footer__link"
                    onClick={() => scrollToSection(link.id)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Get involved">
            <h4 className="footer__col-title">Get involved</h4>
            <ul className="footer__links">
              <li>
                <a className="footer__link" href={hireHref}>
                  Hire me
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="footer__link"
                  onClick={() => scrollToSection("contact")}
                >
                  Let&apos;s talk
                </button>
              </li>
              {profile?.resumeUrl && (
                <li>
                  <a
                    className="footer__link"
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FiDownload aria-hidden="true" /> Download CV
                  </a>
                </li>
              )}
              <li>
                <Link className="footer__link" to="/admin">
                  Admin portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* RIGHT — contact */}
        <div className="footer__col">
          <h4 className="footer__col-title">Contact</h4>
          <ul className="footer__links">
            <li>
              <a className="footer__link" href={`mailto:${email}`}>
                <FiMail aria-hidden="true" /> {email}
              </a>
            </li>
            <li>
              <a className="footer__link" href={telHref}>
                <FiPhone aria-hidden="true" /> {phone}
              </a>
            </li>
            <li>
              <span className="footer__text">
                <FiMapPin aria-hidden="true" /> {location}
              </span>
            </li>
          </ul>
        </div>

        {/* Bottom bar — LEFT | MIDDLE | RIGHT */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {year} {name} | {role}
          </p>

          <strong className="footer__made">
            {name} {year} <span aria-hidden="true">💜</span>
          </strong>

          <button
            className="footer__top"
            onClick={() => scrollToSection("home")}
            aria-label="Back to top"
            title="Back to top"
          >
            <FiArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
}
