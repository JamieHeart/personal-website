const highlights = [
  "Engineering management across product and platform teams",
  "Delivered AI-enabled clinical workflow improvements",
  "Built scalable systems with strong observability and reliability",
];

export default function ResumePage() {
  return (
    <section>
      <h1>Resume</h1>
      <div className="card">
        <h2>Summary</h2>
        <p>
          Software Engineering Manager focused on building strong teams,
          delivering customer value, and partnering cross-functionally.
        </p>
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
        <h2>Download</h2>
        <p>
          <a href="/resume.pdf">Download PDF</a>
        </p>
      </div>
    </section>
  );
}
