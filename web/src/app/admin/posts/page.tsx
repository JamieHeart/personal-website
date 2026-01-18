"use client";

import { useEffect, useMemo, useState } from "react";
import StatusMessage, { type StatusVariant } from "@/components/StatusMessage";
import {
  mergeGeneratedFields,
  type BlogPost,
  type GeneratedFields,
} from "@/lib/adminPosts";

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
  const [status, setStatus] = useState<{ message: string; variant: StatusVariant } | null>(null);
  const [slugStatus, setSlugStatus] = useState<{ message: string; variant: StatusVariant } | null>(null);
  const [busy, setBusy] = useState(false);
  const [listAction, setListAction] = useState<
    { type: "edit" | "delete"; slug: string } | null
  >(null);
  const [generating, setGenerating] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("adminToken", token);
    } else {
      window.localStorage.removeItem("adminToken");
    }
  }, [token]);

  const headers = useMemo(() => {
    const result: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      result["x-admin-token"] = token;
    }
    return result;
  }, [token]);

  function setStatusMessage(message: string, variant: StatusVariant = "info") {
    setStatus({ message, variant });
  }

  function setSlugStatusMessage(
    message: string,
    variant: StatusVariant = "info"
  ) {
    setSlugStatus({ message, variant });
  }

  async function loadPosts() {
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (!res.ok) {
        setStatusMessage("Failed to load posts.", "error");
        return;
      }
      const data = (await res.json()) as BlogPost[];
      setPosts(data);
    } catch {
      setStatusMessage("Failed to load posts.", "error");
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
    setSlugStatus(null);
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
        setStatusMessage(`Failed to generate fields: ${errorText}`, "error");
        return null;
      }
      return (await res.json()) as GeneratedFields;
    } catch {
      setStatusMessage("Failed to generate fields.", "error");
      return null;
    } finally {
      setGenerating(false);
    }
  }

  async function checkSlugConflict(slug: string): Promise<boolean> {
    const normalized = slug.trim();
    if (!normalized) {
      setSlugStatus(null);
      return false;
    }
    setSlugChecking(true);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(normalized)}`, {
        cache: "no-store",
      });
      if (res.status === 404) {
        setSlugStatus(null);
        return false;
      }
      if (res.ok) {
        setSlugStatusMessage("Slug already exists.", "warning");
        return true;
      }
      setSlugStatusMessage("Failed to validate slug.", "error");
      return true;
    } catch {
      setSlugStatusMessage("Failed to validate slug.", "error");
      return true;
    } finally {
      setSlugChecking(false);
    }
  }

  useEffect(() => {
    if (isEditing) {
      setSlugStatus(null);
      return;
    }
    const slug = form.slug.trim();
    if (!slug) {
      setSlugStatus(null);
      return;
    }
    const handle = window.setTimeout(() => {
      void checkSlugConflict(slug);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [form.slug, isEditing]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus(null);
    setBusy(true);
    try {
      let nextForm = form;
      if (!isEditing) {
        if (!form.content.trim()) {
          setStatusMessage("Content is required.", "warning");
          return;
        }
        if (!form.slug || !form.title || !form.excerpt || !form.tags?.length) {
          const generated = await generateFields(form.content);
          if (!generated) {
            return;
          }
          nextForm = mergeGeneratedFields(form, generated);
          setForm(nextForm);
        }
      }

      if (!isEditing) {
        const hasConflict = await checkSlugConflict(nextForm.slug);
        if (hasConflict) {
          return;
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
        if (res.status === 409) {
          setSlugStatusMessage("Slug already exists.", "warning");
          return;
        }
        setStatusMessage(
          `Failed to ${isEditing ? "update" : "create"} post: ${errorText}`,
          "error"
        );
        return;
      }

      setStatusMessage(isEditing ? "Post updated." : "Post created.", "info");
      resetForm();
      await loadPosts();
    } catch {
      setStatusMessage("Request failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit(slug: string) {
    setStatus(null);
    setBusy(true);
    setListAction({ type: "edit", slug });
    try {
      const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        setStatusMessage("Failed to load post.", "error");
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
      setStatusMessage("Failed to load post.", "error");
    } finally {
      setBusy(false);
      setListAction(null);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete ${slug}?`)) return;
    setStatus(null);
    setBusy(true);
    setListAction({ type: "delete", slug });
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const errorText = await res.text();
        setStatusMessage(`Failed to delete post: ${errorText}`, "error");
        return;
      }
      setStatusMessage("Post deleted.", "info");
      await loadPosts();
    } catch {
      setStatusMessage("Request failed.", "error");
    } finally {
      setBusy(false);
      setListAction(null);
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
                  setStatusMessage("Add content first.", "warning");
                  return;
                }
                const generated = await generateFields(form.content);
                if (!generated) return;
                const nextForm = mergeGeneratedFields(form, generated);
                setForm(nextForm);
                await checkSlugConflict(nextForm.slug);
              }}
              disabled={generating || busy || slugChecking}
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
            {slugStatus && (
              <StatusMessage
                message={slugStatus.message}
                variant={slugStatus.variant}
              />
            )}
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
          {status && (
            <StatusMessage message={status.message} variant={status.variant} />
          )}
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
                  <button
                    type="button"
                    onClick={() => handleEdit(post.slug)}
                    disabled={busy}
                  >
                    {busy && listAction?.type === "edit" && listAction.slug === post.slug
                      ? "Loading…"
                      : "Edit"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(post.slug)}
                    disabled={busy}
                  >
                    {busy && listAction?.type === "delete" && listAction.slug === post.slug
                      ? "Deleting…"
                      : "Delete"}
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
