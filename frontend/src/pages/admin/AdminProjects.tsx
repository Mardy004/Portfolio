import { useEffect, useState, type FormEvent } from "react";
import { FiEdit2, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { api, resolveMediaUrl } from "../../api/client";
import type { MediaItem, Project } from "../../api/types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

const EMPTY: Omit<Project, "id"> = {
  title: "",
  description: "",
  technologies: [],
  category: "",
  link: "",
  image: "",
  featured: false,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Project, "id">>(EMPTY);
  const [techInput, setTechInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<Project>>("/projects");
      setProjects(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setTechInput("");
    setError("");
    setShowForm(true);
  }

  function openEdit(project: Project) {
    setEditing(project);
    setForm({
      title: project.title,
      description: project.description,
      technologies: project.technologies || [],
      category: project.category,
      link: project.link,
      image: project.image || "",
      featured: Boolean(project.featured),
    });
    setTechInput((project.technologies || []).join(", "));
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      technologies: techInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      if (editing) {
        const res = await api.put<ItemResponse<Project>>(
          `/projects/${editing.id}`,
          payload
        );
        setProjects((prev) =>
          prev.map((p) => (p.id === editing.id ? res.data : p))
        );
      } else {
        const res = await api.post<ItemResponse<Project>>("/projects", payload);
        setProjects((prev) => [...prev, res.data]);
      }
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    await api.del(`/projects/${project.id}`);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
  }

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.upload<ItemResponse<MediaItem>>(
      "/uploads",
      formData
    );
    setForm((prev) => ({ ...prev, image: res.data.url }));
  }

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Projects</h1>
          <p>Add, edit and delete portfolio projects.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <FiPlus /> New project
        </button>
      </div>

      <div className="admin__panel">
        {loading ? (
          <p className="admin__empty">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="admin__empty">No projects yet. Create your first one.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Featured</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      {project.image ? (
                        <img
                          src={resolveMediaUrl(project.image)}
                          alt={project.title}
                        />
                      ) : (
                        <span className="badge">none</span>
                      )}
                    </td>
                    <td>
                      <strong>{project.title}</strong>
                      <br />
                      <span style={{ color: "var(--text-dim)" }}>
                        {(project.technologies || []).join(", ")}
                      </span>
                    </td>
                    <td>{project.category}</td>
                    <td>
                      {project.featured ? (
                        <span className="badge badge--new">Yes</span>
                      ) : (
                        <span className="badge">No</span>
                      )}
                    </td>
                    <td>
                      <div className="admin__row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(project)}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(project)}
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
              <h2>{editing ? "Edit project" : "New project"}</h2>
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
                  <label>Title *</label>
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
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
                    placeholder="Web App"
                  />
                </div>
              </div>

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

              <div className="admin__form-row">
                <div className="field">
                  <label>Technologies (comma separated)</label>
                  <input
                    className="input"
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    placeholder="React, TypeScript"
                  />
                </div>
                <div className="field">
                  <label>Project link</label>
                  <input
                    className="input"
                    value={form.link}
                    onChange={(e) =>
                      setForm({ ...form, link: e.target.value })
                    }
                    placeholder="https://…"
                  />
                </div>
              </div>

              <div className="field">
                <label>Image</label>
                <div className="admin__form-row">
                  <input
                    className="input"
                    value={form.image}
                    onChange={(e) =>
                      setForm({ ...form, image: e.target.value })
                    }
                    placeholder="Image URL or upload"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </div>
                <span className="admin__hint">
                  Upload an image or paste a URL. Uploaded files appear in Media.
                </span>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "var(--fs-sm)",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                />
                Featured project
              </label>

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