"use client";

import { useEffect, useMemo, useState } from "react";

type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags?: string[];
  publishedAt?: string;
  updatedAt?: string;
};

type GeneratedFields = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
};

const emptyForm: BlogPost = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  tags: [],
  publishedAt: "",
};

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export default function AdminPostsPage() {
  const [token, setToken] = useState("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogPost>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("adminToken", token);
    }
  }, [token]);

  const headers = useMemo(() => {
    const result: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      result["x-admin-token"] = token;
    }
    return result;
  }, [token]);

  async function loadPosts() {
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (!res.ok) {
        setStatus("Failed to load posts.");
        return;
      }
      const data = (await res.json()) as BlogPost[];
      setPosts(data);
    } catch {
      setStatus("Failed to load posts.");
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function updateForm<K extends keyof BlogPost>(key: K, value: BlogPost[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setIsEditing(false);
  }

  async function generateFields(content: string): Promise<GeneratedFields | null> {
    setStatus(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/posts/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        setStatus(`Failed to generate fields: ${errorText}`);
        return null;
      }
      return (await res.json()) as GeneratedFields;
    } catch {
      setStatus("Failed to generate fields.");
      return null;
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      let nextForm = form;
      if (!isEditing) {
        if (!form.content.trim()) {
          setStatus("Content is required.");
          return;
        }
        if (!form.slug || !form.title || !form.excerpt || !form.tags?.length) {
          const generated = await generateFields(form.content);
          if (!generated) {
            return;
          }
          nextForm = {
            ...form,
            ...generated,
          };
          setForm(nextForm);
        }
      }

      const payload = {
        ...nextForm,
        tags: nextForm.tags ?? [],
        publishedAt: nextForm.publishedAt || undefined,
      };

      const res = await fetch(
        isEditing ? `/api/posts/${form.slug}` : "/api/posts",
        {
          method: isEditing ? "PUT" : "POST",
          headers,
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        setStatus(
          `Failed to ${isEditing ? "update" : "create"} post: ${errorText}`
        );
        return;
      }

      setStatus(isEditing ? "Post updated." : "Post created.");
      resetForm();
      await loadPosts();
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(slug: string) {
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        setStatus("Failed to load post.");
        return;
      }
      const data = (await res.json()) as BlogPost;
      setForm({
        slug: data.slug,
        title: data.title ?? "",
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        tags: data.tags ?? [],
        publishedAt: data.publishedAt ?? "",
      });
      setIsEditing(true);
    } catch {
      setStatus("Failed to load post.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete ${slug}?`)) return;
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const errorText = await res.text();
        setStatus(`Failed to delete post: ${errorText}`);
        return;
      }
      setStatus("Post deleted.");
      await loadPosts();
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin">
      <h1>Blog Admin</h1>
      <div className="card">
        <h2>Admin Token</h2>
        <div className="admin-row">
          <label htmlFor="admin-token">x-admin-token</label>
          <input
            id="admin-token"
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Set ADMIN_TOKEN"
          />
        </div>
        <p className="admin-help">
          This token is stored in localStorage for convenience.
        </p>
      </div>

      <div className="card">
        <div className="admin-toolbar">
          <h2>{isEditing ? "Edit Post" : "New Post"}</h2>
          {isEditing && (
            <button type="button" onClick={resetForm}>
              New post
            </button>
          )}
        </div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Content
            <textarea
              value={form.content}
              onChange={(event) => updateForm("content", event.target.value)}
              placeholder="Full content"
              required
              rows={8}
            />
          </label>
          {!isEditing && (
            <button
              type="button"
              onClick={async () => {
                if (!form.content.trim()) {
                  setStatus("Add content first.");
                  return;
                }
                const generated = await generateFields(form.content);
                if (!generated) return;
                setForm((prev) => ({ ...prev, ...generated }));
              }}
              disabled={generating || busy}
            >
              {generating ? "Generating…" : "Generate slug, title, excerpt, tags"}
            </button>
          )}
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              placeholder="my-post"
              disabled={isEditing}
            />
          </label>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Post title"
            />
          </label>
          <label>
            Excerpt
            <textarea
              value={form.excerpt}
              onChange={(event) => updateForm("excerpt", event.target.value)}
              placeholder="Short summary"
              rows={3}
            />
          </label>
          <label>
            Tags (comma-separated)
            <input
              value={(form.tags ?? []).join(", ")}
              onChange={(event) => updateForm("tags", parseTags(event.target.value))}
              placeholder="leadership, engineering"
            />
          </label>
          <label>
            Published At (optional, ISO)
            <input
              value={form.publishedAt ?? ""}
              onChange={(event) => updateForm("publishedAt", event.target.value)}
              placeholder="2024-01-15T10:00:00Z"
            />
          </label>
          <button type="submit" disabled={busy}>
            {isEditing ? "Update post" : "Create post"}
          </button>
          {status && <p className="admin-status">{status}</p>}
        </form>
      </div>

      <div className="card">
        <div className="admin-toolbar">
          <h2>Existing Posts</h2>
          <button type="button" onClick={loadPosts} disabled={busy}>
            Refresh
          </button>
        </div>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <div className="admin-list">
            {posts.map((post) => (
              <div className="admin-list-item" key={post.slug}>
                <div>
                  <strong>{post.title}</strong>
                  <div className="admin-meta">{post.slug}</div>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => handleEdit(post.slug)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(post.slug)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
