import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiFolder,
  FiZap,
  FiBriefcase,
  FiUser,
  FiMail,
  FiImage,
  FiLogOut,
  FiMenu,
  FiExternalLink,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: <FiGrid />, end: true },
  { to: "/admin/projects", label: "Projects", icon: <FiFolder /> },
  { to: "/admin/skills", label: "Skills", icon: <FiZap /> },
  { to: "/admin/experience", label: "Experience", icon: <FiBriefcase /> },
  { to: "/admin/profile", label: "Profile", icon: <FiUser /> },
  { to: "/admin/messages", label: "Messages", icon: <FiMail /> },
  { to: "/admin/media", label: "Media", icon: <FiImage /> },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin">
      {open && (
        <div className="admin__scrim" onClick={() => setOpen(false)} />
      )}

      <aside className={`admin__sidebar ${open ? "is-open" : ""}`}>
        <div className="admin__brand">
          <span className="nav__logo">{"</>"}</span>
          <div>
            Portfolio
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="admin__nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin__nav-link ${isActive ? "is-active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin__sidebar-foot">
          <div className="admin__user">
            Signed in as
            <strong>{user?.name || user?.username}</strong>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <FiExternalLink /> View site
          </a>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <FiLogOut /> Log out
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <div className="admin__header">
          <button
            className="admin__burger"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <FiMenu />
          </button>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>

        <Outlet />
      </div>
    </div>
  );
}