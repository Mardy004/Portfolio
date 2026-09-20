import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiFolder,
  FiZap,
  FiBriefcase,
  FiMail,
  FiArrowRight,
} from "react-icons/fi";
import { api } from "../../api/client";
import type {
  ContactMessage,
  Experience,
  Project,
  Skill,
} from "../../api/types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

export default function Dashboard() {
  const [counts, setCounts] = useState({
    projects: 0,
    skills: 0,
    experience: 0,
    messages: 0,
    unread: 0,
  });
  const [recent, setRecent] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ListResponse<Project>>("/projects"),
      api.get<ListResponse<Skill>>("/skills"),
      api.get<ListResponse<Experience>>("/experience"),
      api.get<ListResponse<ContactMessage>>("/messages"),
    ])
      .then(([projects, skills, experience, messages]) => {
        const msgs = messages.data || [];
        setCounts({
          projects: projects.data?.length || 0,
          skills: skills.data?.length || 0,
          experience: experience.data?.length || 0,
          messages: msgs.length,
          unread: msgs.filter((m) => !m.read).length,
        });
        setRecent(msgs.slice(0, 5));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Projects", value: counts.projects, icon: <FiFolder />, to: "/admin/projects" },
    { label: "Skills", value: counts.skills, icon: <FiZap />, to: "/admin/skills" },
    { label: "Experience", value: counts.experience, icon: <FiBriefcase />, to: "/admin/experience" },
    { label: "Messages", value: counts.messages, icon: <FiMail />, to: "/admin/messages" },
  ];

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your portfolio content.</p>
        </div>
      </div>

      <div className="admin__stats">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="admin__stat">
            <span>
              {card.icon} {card.label}
            </span>
            <strong>{loading ? "—" : card.value}</strong>
          </Link>
        ))}
      </div>

      <div className="admin__panel">
        <div className="admin__panel-head">
          <h2>Recent messages</h2>
          <Link to="/admin/messages" className="btn btn-ghost btn-sm">
            View all <FiArrowRight />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="admin__empty">No messages yet.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <strong>{msg.name}</strong>
                      <br />
                      <span style={{ color: "var(--text-dim)" }}>
                        {msg.email}
                      </span>
                    </td>
                    <td>{msg.subject || "—"}</td>
                    <td>
                      {msg.read ? (
                        <span className="badge">Read</span>
                      ) : (
                        <span className="badge badge--new">New</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}