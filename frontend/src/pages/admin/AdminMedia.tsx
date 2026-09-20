import { useEffect, useState } from "react";
import { FiTrash2, FiUploadCloud, FiCopy } from "react-icons/fi";
import { api, resolveMediaUrl } from "../../api/client";
import type { MediaItem } from "../../api/types";

interface ListResponse<T> {
  success: boolean;
  data: T[];
}
interface ItemResponse<T> {
  success: boolean;
  data: T;
}

export default function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<ListResponse<MediaItem>>("/uploads");
      setItems(res.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.upload<ItemResponse<MediaItem>>(
          "/uploads",
          formData
        );
        setItems((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!window.confirm(`Remove "${item.originalName}" from the library?`))
      return;
    await api.del(`/uploads/${item.id}`);
    setItems((prev) => prev.filter((m) => m.id !== item.id));
  }

  function copyUrl(item: MediaItem) {
    navigator.clipboard?.writeText(resolveMediaUrl(item.url));
    alert("Image URL copied to clipboard.");
  }

  return (
    <>
      <div className="admin__header">
        <div>
          <h1>Media</h1>
          <p>Upload and manage images used across your portfolio.</p>
        </div>
        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          <FiUploadCloud /> {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="login__error">{error}</p>}

      <div className="admin__panel">
        {loading ? (
          <p className="admin__empty">Loading…</p>
        ) : items.length === 0 ? (
          <p className="admin__empty">
            No media yet. Upload your first image.
          </p>
        ) : (
          <div className="media-grid">
            {items.map((item) => (
              <div key={item.id} className="media-item">
                <img src={resolveMediaUrl(item.url)} alt={item.originalName} />
                <div className="media-item__foot">
                  <span title={item.originalName}>
                    {item.originalName.length > 16
                      ? item.originalName.slice(0, 14) + "…"
                      : item.originalName}
                  </span>
                  <span style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={() => copyUrl(item)}
                      title="Copy URL"
                      style={{ color: "var(--accent)" }}
                    >
                      <FiCopy />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}