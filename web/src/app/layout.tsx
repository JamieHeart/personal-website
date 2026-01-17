import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Name - Engineering Leader",
  description: "Personal site, resume, and blog.",
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
              Your Name
            </a>
            <nav className="nav">
              <a href="/resume">Resume</a>
              <a href="/blog">Blog</a>
              <a
                href="https://www.linkedin.com/in/your-linkedin"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
              <a href="https://github.com/your-github" target="_blank" rel="noreferrer">
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="container">© {new Date().getFullYear()} Your Name</div>
        </footer>
      </body>
    </html>
  );
}
