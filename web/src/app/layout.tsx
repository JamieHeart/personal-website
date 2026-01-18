import "./globals.css";
import type { Metadata } from "next";
import { loadProfile } from "@/lib/profile";

const profile = loadProfile();

export const metadata: Metadata = {
  title: `${profile.name} - ${profile.title}`,
  description: profile.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="container">
            <a className="brand" href="/">
              {profile.name}
            </a>
            <nav className="nav">
              <a className="nav-link" href="/resume">
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 3v6h6M8.5 13h7M8.5 16h7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Resume
              </a>
              <a className="nav-link" href="/blog">
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Blog
              </a>
              <a
                className="nav-link"
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      d="M4 4h4v4H4V4Zm0 6h4v10H4V10Zm6 0h4v2h.1c.6-1.1 2-2.3 4.2-2.3 4.5 0 5.3 2.9 5.3 6.7V20h-4v-5.6c0-1.3 0-3-1.8-3s-2 1.4-2 2.9V20h-4V10Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                LinkedIn
              </a>
              <a
                className="nav-link"
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      d="M12 3a9 9 0 0 0-2.8 17.6c.4.1.6-.2.6-.4v-2.1c-2.5.5-3-1-3-1-.4-1.1-1-1.4-1-1.4-.8-.5.1-.5.1-.5 1 0 1.5 1 1.5 1 .8 1.5 2.2 1.1 2.7.8.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.5 0-1 .4-1.8 1-2.5-.1-.2-.4-1.2.1-2.5 0 0 .8-.2 2.6 1a9.2 9.2 0 0 1 4.8 0c1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.5 0 3.5-2.1 4.3-4.1 4.5.3.3.6.8.6 1.7v2.5c0 .2.2.5.6.4A9 9 0 0 0 12 3Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">
            © {new Date().getFullYear()} {profile.name}
          </div>
        </footer>
      </body>
    </html>
  );
}
