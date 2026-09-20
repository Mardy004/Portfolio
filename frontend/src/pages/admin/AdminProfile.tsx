import { useEffect, useState, type FormEvent } from "react";
import { FiSave, FiPlus, FiTrash2 } from "react-icons/fi";
import { api } from "../../api/client";
import type { Profile } from "../../api/types";

interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ItemResponse<Profile>>("/profile")
      .then((res) => setProfile(res.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function setSocial(
    key: keyof NonNullable<Profile["socials"]>,
    value: string
  ) {
    setProfile((prev) =>
      prev
        ? { ...prev, socials: { ...(prev.socials || {}), [key]: value } }
        : prev
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await api.put<ItemResponse<Profile>>("/profile", profile);
      setProfile(res.data);
      setStatus("Profile saved successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="admin__empty">Loading…</p>;
  }

  if (!profile) {
    return <p className="admin__empty">{error || "Profile not found."}</p>;
  }

  const stats = profile.stats || [];

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Profile</h1>
          <p>Update your personal details and social links.</p>
        </div>
      </div>

      <form className="admin__panel" onSubmit={handleSubmit}>
        <div className="admin__form">
          <div className="admin__form-row">
            <div className="field">
              <label>Full name</label>
              <input
                className="input"
                value={profile.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Role / Title</label>
              <input
                className="input"
                value={profile.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>Tagline</label>
            <input
              className="input"
              value={profile.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>

          <div className="field">
            <label>Bio</label>
            <textarea
              className="textarea"
              value={profile.bio}
              onChange={(e) => set("bio", e.target.value)}
            />
          </div>

          <div className="admin__form-row">
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                value={profile.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                className="input"
                value={profile.phone || ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+250 7xx xxx xxx"
              />
            </div>
            <div className="field">
              <label>Location</label>
              <input
                className="input"
                value={profile.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Availability</label>
              <input
                className="input"
                value={profile.availability || ""}
                onChange={(e) => set("availability", e.target.value)}
              />
            </div>
          </div>

          <div className="admin__form-row">
            <div className="field">
              <label>Résumé URL</label>
              <input
                className="input"
                value={profile.resumeUrl || ""}
                onChange={(e) => set("resumeUrl", e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div className="field">
              <label>Avatar URL</label>
              <input
                className="input"
                value={profile.avatar || ""}
                onChange={(e) => set("avatar", e.target.value)}
                placeholder="https://…"
              />
            </div>
          </div>

          <h3 style={{ fontSize: "var(--fs-lg)" }}>Social links</h3>
          <div className="admin__form-row">
            <div className="field">
              <label>GitHub</label>
              <input
                className="input"
                value={profile.socials?.github || ""}
                onChange={(e) => setSocial("github", e.target.value)}
              />
            </div>
            <div className="field">
              <label>LinkedIn</label>
              <input
                className="input"
                value={profile.socials?.linkedin || ""}
                onChange={(e) => setSocial("linkedin", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Twitter / X</label>
              <input
                className="input"
                value={profile.socials?.twitter || ""}
                onChange={(e) => setSocial("twitter", e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: "var(--fs-lg)" }}>Stats</h3>
          {stats.map((stat, index) => (
            <div key={index} className="admin__form-row">
              <div className="field">
                <label>Value</label>
                <input
                  className="input"
                  value={stat.value}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = { ...next[index], value: e.target.value };
                    set("stats", next);
                  }}
                />
              </div>
              <div className="field">
                <label>Label</label>
                <input
                  className="input"
                  value={stat.label}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = { ...next[index], label: e.target.value };
                    set("stats", next);
                  }}
                />
              </div>
              <div className="field" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    set(
                      "stats",
                      stats.filter((_, i) => i !== index)
                    )
                  }
                >
                  <FiTrash2 /> Remove
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() =>
                set("stats", [...stats, { label: "", value: "" }])
              }
            >
              <FiPlus /> Add stat
            </button>
          </div>

          {status && <p className="contact__feedback is-success">{status}</p>}
          {error && <p className="login__error">{error}</p>}

          <div className="admin__form-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={saving}
            >
              <FiSave /> {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}