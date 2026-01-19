import { loadPersonalization } from "@/lib/personalization";
import { loadProfile } from "@/lib/profile";

type BlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  publishedAt?: string;
};

async function loadRecentPosts(): Promise<BlogPostSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const posts = (await res.json()) as BlogPostSummary[];
  return posts.slice(0, 3);
}

async function loadAllPosts(): Promise<BlogPostSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/posts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return (await res.json()) as BlogPostSummary[];
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function HomePage() {
  const profile = loadProfile();
  const personalization = loadPersonalization();
  const recentPosts = await loadRecentPosts();
  const allPosts = await loadAllPosts();
  const summary = personalization?.summary ?? profile.tagline ?? "Engineering leader.";
  const whatIDo =
    personalization?.whatIDo ??
    "I build resilient platforms, align teams to strategy, and deliver measurable outcomes.";
  const highlights =
    personalization?.highlights ?? [
      "Drive platform roadmaps with measurable outcomes.",
      "Lead multi-team engineering orgs across domains.",
      "Deliver cloud-native systems with high reliability.",
      "Coach managers and senior engineers to scale impact.",
    ];
  const coreCompetencies =
    personalization?.coreCompetencies ?? [
      "Engineering leadership and org execution",
      "Platform strategy and API-first systems",
      "Cloud-native architecture and reliability",
      "Cross-functional alignment and roadmapping",
      "Talent development and inclusive culture",
    ];
  const leadershipSkills =
    personalization?.skills?.leadership ?? [
      "Coaching and mentorship",
      "Operational cadence and delivery",
      "Stakeholder alignment",
      "Hiring and team development",
    ];
  const technicalSkills =
    personalization?.skills?.technical ?? [
      "AWS/GCP and cloud-native architecture",
      "API-first services and microservices",
      "Observability and reliability",
      "CI/CD and modern SDLC",
    ];
  const values =
    personalization?.values ?? [
      "Transparency and accountability",
      "Empathy and collaboration",
      "Continuous learning",
      "Outcome-driven leadership",
    ];
  const featured =
    personalization?.featured ?? [
      "Operational excellence and delivery leadership",
      "Cross-functional alignment and roadmap execution",
      "Coaching engineers into strong technical leaders",
      "AI-enabled process improvement and automation",
      "Scalable systems and reliability practices",
    ];
  const tagCounts = allPosts
    .flatMap((post) => post.tags ?? [])
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
      return acc;
    }, {});
  const tagEntries = Object.entries(tagCounts);
  const counts = tagEntries.map(([, count]) => count);
  const minCount = counts.length ? Math.min(...counts) : 0;
  const maxCount = counts.length ? Math.max(...counts) : 0;

  return (
    <section className="hero">
      <div className="card">
        <h2>Summary</h2>
        <p>{summary}</p>
        <p>{whatIDo}</p>
      </div>
      <div className="card">
        <h2>Highlights</h2>
        <ul>
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Core Competencies</h2>
        <ul>
          {coreCompetencies.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Skills</h2>
        <h3>Leadership</h3>
        <ul>
          {leadershipSkills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Technical</h3>
        <ul>
          {technicalSkills.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Values</h2>
        <ul>
          {values.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2>Latest Posts</h2>
        {recentPosts.length === 0 ? (
          <p>
            No posts yet. Create one via the{" "}
            <a href="/admin/posts">admin editor</a>.
          </p>
        ) : (
          recentPosts.map((post) => (
            <div key={post.slug} className="post-preview">
              <h3>
                <a href={`/blog/${post.slug}`}>{post.title}</a>
              </h3>
              {post.publishedAt && (
                <p className="post-date">{formatDate(post.publishedAt)}</p>
              )}
              <p>{post.excerpt}</p>
              {!!post.tags?.length && (
                <div>
                  {post.tags.map((tag) => (
                    <span className="badge" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <div className="card">
        <h2>Tag Cloud</h2>
        {tagEntries.length === 0 ? (
          <p>No tags yet.</p>
        ) : (
          <div className="tag-cloud">
            {tagEntries
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .map(([tag, count]) => {
                const weight =
                  maxCount === minCount
                    ? 0.5
                    : (count - minCount) / (maxCount - minCount);
                const size = 12 + weight * 12;
                return (
                  <span
                    key={tag}
                    className="tag-cloud-item"
                    style={{ fontSize: `${size}px` }}
                  >
                    {tag}
                  </span>
                );
              })}
          </div>
        )}
      </div>
      <div className="card">
        <h2>Featured</h2>
        <ul>
          {featured.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
