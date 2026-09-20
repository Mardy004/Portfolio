import { useEffect, useMemo, useState, type FormEvent } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { api } from "../../api/client";
import type { Experience } from "../../api/types";
import {
  experiencePeriod,
  sortExperience,
} from "../../utils/experienceSort";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

const EMPTY = {
  role: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  highlights: [] as string[],
};

export default function AdminExperience() {
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Experience | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [highlightInput, setHighlightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<Experience>>("/experience");
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setHighlightInput("");
    setError("");
    setShowForm(true);
  }

  function openEdit(item: Experience) {
    setEditing(item);
    setForm({
      role: item.role,
      company: item.company,
      location: item.location || "",
      startDate: item.startDate,
      endDate: item.endDate || "",
      description: item.description,
      highlights: item.highlights || [],
    });
    setHighlightInput((item.highlights || []).join("\n"));
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      highlights: highlightInput
        .split("\n")
        .map((h) => h.trim())
        .filter(Boolean),
    };

    try {
      if (editing) {
        const res = await api.put<ItemResponse<Experience>>(
          `/experience/${editing.id}`,
          payload
        );
        setItems((prev) =>
          prev.map((it) => (it.id === editing.id ? res.data : it))
        );
      } else {
        const res = await api.post<ItemResponse<Experience>>(
          "/experience",
          payload
        );
        setItems((prev) => [...prev, res.data]);
      }
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Experience) {
    if (!window.confirm(`Delete "${item.role} at ${item.company}"?`)) return;
    await api.del(`/experience/${item.id}`);
    setItems((prev) => prev.filter((it) => it.id !== item.id));
  }

  // Same order as the public timeline: current roles first, then newest year.
  const ordered = useMemo(() => sortExperience(items), [items]);

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Experience</h1>
          <p>Manage your professional timeline.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> New entry
        </button>
      </div>

      <div className="admin__panel">
        {loading ? (
          <p className="admin__empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="admin__empty">No experience yet.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Period</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.role}</strong>
                    </td>
                    <td>{item.company}</td>
                    <td>
                      <span className="badge">
                        {experiencePeriod(item)}
                      </span>
                    </td>
                    <td>
                      <div className="admin__row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(item)}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item)}
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
              <h2>{editing ? "Edit experience" : "New experience"}</h2>
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
                  <label>Role *</label>
                  <input
                    className="input"
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label>Company *</label>
                  <input
                    className="input"
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="admin__form-row">
                <div className="field">
                  <label>Location</label>
                  <input
                    className="input"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="Remote"
                  />
                </div>
                <div className="field">
                  <label>Start date</label>
                  <input
                    className="input"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    placeholder="2023"
                  />
                </div>
                <div className="field">
                  <label>End date</label>
                  <input
                    className="input"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    placeholder="Present"
                  />
                </div>
              </div>
              <span className="admin__hint">
                Use a year, e.g. 2023. Leave the end date empty (or type Present)
                if this is your current role — current roles are always listed
                first, then the newest years.
              </span>

              <div className="field">
                <label>Description</label>
                <textarea
                  className="textarea"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="field">
                <label>Highlights (one per line)</label>
                <textarea
                  className="textarea"
                  value={highlightInput}
                  onChange={(e) => setHighlightInput(e.target.value)}
                  placeholder={"Delivered 15+ projects\nImproved performance"}
                />
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