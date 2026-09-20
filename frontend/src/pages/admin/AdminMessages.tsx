import { useEffect, useState } from "react";
import { FiMail, FiTrash2, FiCheck, FiX } from "react-icons/fi";
import { api } from "../../api/client";
import type { ContactMessage } from "../../api/types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<ContactMessage>>("/messages");
      setMessages(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(msg: ContactMessage) {
    const res = await api.patch<ItemResponse<ContactMessage>>(
      `/messages/${msg.id}`,
      { read: !msg.read }
    );
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? res.data : m))
    );
  }

  async function handleDelete(msg: ContactMessage) {
    if (!window.confirm(`Delete the message from ${msg.name}?`)) return;
    await api.del(`/messages/${msg.id}`);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    if (selected?.id === msg.id) setSelected(null);
  }

  async function openMessage(msg: ContactMessage) {
    setSelected(msg);
    if (!msg.read) {
      try {
        const res = await api.patch<ItemResponse<ContactMessage>>(
          `/messages/${msg.id}`,
          { read: true }
        );
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? res.data : m))
        );
        setSelected(res.data);
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Messages</h1>
          <p>Messages received through your contact form.</p>
        </div>
      </div>

      <div className="admin__panel">
        {loading ? (
          <p className="admin__empty">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="admin__empty">No messages yet.</p>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Email</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <button
                        onClick={() => openMessage(msg)}
                        style={{ textAlign: "left" }}
                      >
                        <strong>{msg.name}</strong>
                        <br />
                        <span style={{ color: "var(--text-dim)" }}>
                          {msg.email}
                        </span>
                      </button>
                    </td>
                    <td>{msg.subject || "—"}</td>
                    <td>
                      {msg.read ? (
                        <span className="badge">Read</span>
                      ) : (
                        <span className="badge badge--new">New</span>
                      )}
                    </td>
                    <td>
                      {msg.emailed ? (
                        <span className="badge badge--new">Emailed</span>
                      ) : (
                        <span
                          className="badge"
                          title={msg.mailError || "Email was not delivered"}
                        >
                          Saved only
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="admin__row-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openMessage(msg)}
                        >
                          <FiMail /> View
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => toggleRead(msg)}
                          title={msg.read ? "Mark unread" : "Mark read"}
                        >
                          {msg.read ? <FiX /> : <FiCheck />}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(msg)}
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

      {selected && (
        <div className="modal" onClick={() => setSelected(null)}>
          <div className="modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="modal__head">
              <div>
                <h2>{selected.subject || "No subject"}</h2>
                <span style={{ color: "var(--text-muted)", fontSize: "var(--fs-sm)" }}>
                  {selected.name} · {selected.email}
                </span>
              </div>
              <button
                className="modal__close"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                <FiX />
              </button>
            </div>

            <p style={{ whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>
              {selected.message}
            </p>

            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-dim)" }}>
              Email delivery:{" "}
              {selected.emailed ? (
                <span className="badge badge--new">Sent</span>
              ) : (
                <span className="badge">Not sent</span>
              )}{" "}
              {selected.mailError ? (
                <span style={{ color: "var(--danger, #f87171)" }}>
                  {selected.mailError}
                </span>
              ) : null}
            </p>

            <div className="admin__form-actions" style={{ marginTop: "1.5rem" }}>
              <a
                className="btn btn-primary"
                href={`mailto:${selected.email}?subject=Re: ${
                  selected.subject || "Your message"
                }`}
              >
                <FiMail /> Reply by email
              </a>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(selected)}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}