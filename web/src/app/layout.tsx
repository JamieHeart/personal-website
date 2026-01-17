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
              <a href="/resume">Resume</a>
              <a href="/blog">Blog</a>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a href={profile.githubUrl} target="_blank" rel="noreferrer">
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
