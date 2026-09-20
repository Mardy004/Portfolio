import { useEffect, useState, type FormEvent } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { api } from "../../api/client";
import type { Skill } from "../../api/types";
import {
  DEFAULT_SKILL_LEVEL,
  SKILL_LEVELS,
  skillLevelLabel,
  skillLevelValue,
} from "../../utils/skillLevel";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

const EMPTY = {
  name: "",
  level: DEFAULT_SKILL_LEVEL,
  category: "Frontend",
  icon: "",
};

export default function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<Skill>>("/skills");
      setSkills(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function openEdit(skill: Skill) {
    setEditing(skill);
    setForm({
      name: skill.name,
      level: skillLevelValue(skill.level),
      category: skill.category,
      icon: skill.icon || "",
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...form, level: Number(form.level) };

    try {
      if (editing) {
        const res = await api.put<ItemResponse<Skill>>(
          `/skills/${editing.id}`,
          payload
        );
        setSkills((prev) =>
          prev.map((s) => (s.id === editing.id ? res.data : s))
        );
      } else {
        const res = await api.post<ItemResponse<Skill>>("/skills", payload);
        setSkills((prev) => [...prev, res.data]);
      }
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(skill: Skill) {
    if (!window.confirm(`Delete "${skill.name}"?`)) return;
    await api.del(`/skills/${skill.id}`);
    setSkills((prev) => prev.filter((s) => s.id !== skill.id));
  }

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Skills</h1>
          <p>Manage the skills shown on your portfolio.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> New skill
        </button>
      </div>

      <div className="admin__panel">
        {loading ? (
          <p className="admin__empty">Loading…</p>
        ) : skills.length === 0 ? (
          <p className="admin__empty">No skills yet.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Level</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <strong>{skill.name}</strong>
                    </td>
                    <td>
                      <span className="badge">{skill.category}</span>
                    </td>
                    <td>{skillLevelLabel(skill.level)}</td>
                    <td>
                      <div className="admin__row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(skill)}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(skill)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal" onClick={() => setShowForm(false)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <h2>{editing ? "Edit skill" : "New skill"}</h2>
              <button
                className="modal__close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <form className="admin__form" onSubmit={handleSubmit}>
              <div className="admin__form-row">
                <div className="field">
                  <label>Name *</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label>Category</label>
                  <input
                    className="input"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    placeholder="Frontend"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="skill-level">Level</label>
                <select
                  id="skill-level"
                  className="select"
                  value={String(skillLevelValue(form.level))}
                  onChange={(e) =>
                    setForm({ ...form, level: Number(e.target.value) })
                  }
                >
                  {SKILL_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && <p className="login__error">{error}</p>}

              <div className="admin__form-actions">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}