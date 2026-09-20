import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";
import "./Navbar.css";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view (home page only).
  useEffect(() => {
    if (!isHome) return;
    const sections = LINKS.map((l) =>
      document.getElementById(l.id)
    ).filter(Boolean) as HTMLElement[];

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome]);

  // Close the drawer on route change + Escape key.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function scrollToSection(id: string) {
    // Wait a tick so the home page has mounted after navigation.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function goTo(id: string) {
    setOpen(false);
    setActive(id);
    if (isHome) {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/");
      scrollToSection(id);
    }
  }

  function goToAdmin() {
    setOpen(false);
    navigate("/admin");
  }

  return (
    <header className={`nav${scrolled ? " nav--scrolled" : ""}`}>
      <div className="nav__inner container">
        {/* Brand */}
        <button
          className="nav__brand"
          onClick={() => goTo("home")}
          aria-label="Back to top"
        >
          <span className="nav__logo">{"IM"}</span>
          <span className="nav__brand-text">
            <span className="nav__name">Ikuzwe</span>
            <span className="nav__tag"> Mariette</span>
          </span>
        </button>

        {/* Theme toggle — left of links */}
        <div className="nav__side nav__side--left">
          <ThemeToggle />
        </div>

        {/* Desktop links — centered between the two buttons */}
        <nav className="nav__links" aria-label="Primary">
          {LINKS.map((link) => (
            <button
              key={link.id}
              className={`nav__link${
                active === link.id ? " is-active" : ""
              }`}
              onClick={() => goTo(link.id)}
              aria-current={active === link.id ? "true" : undefined}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Admin — right of links */}
        <div className="nav__side nav__side--right">
          <button
            type="button"
            className="nav__admin"
            onClick={goToAdmin}
          >
            Admin
          </button>
          <button
            className="nav__burger"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && <div className="nav__scrim" onClick={() => setOpen(false)} />}

      <nav
        id="mobile-menu"
        className={`nav__drawer${open ? " is-open" : ""}`}
        aria-label="Mobile"
        aria-hidden={!open}
      >
        {LINKS.map((link) => (
          <button
            key={link.id}
            className={`nav__drawer-link${
              active === link.id ? " is-active" : ""
            }`}
            onClick={() => goTo(link.id)}
            tabIndex={open ? 0 : -1}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  );
}


