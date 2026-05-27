"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          margin: 0,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "2.5rem",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,.06)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 0.5rem" }}>
            i-Check failed to start
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 1.5rem" }}>
            A fatal error occurred in the root layout. Please refresh the page.
            If it keeps happening, contact the administrator.
          </p>
          {process.env.NODE_ENV !== "production" && (
            <pre
              style={{
                background: "#f3f4f6",
                color: "#374151",
                fontSize: 11,
                padding: "0.75rem",
                borderRadius: 8,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                marginBottom: "1.5rem",
              }}
            >
              {error.message}
              {error.digest && `\ndigest: ${error.digest}`}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              background: "#273C97",
              color: "#fff",
              padding: "0.625rem 1.25rem",
              borderRadius: 8,
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
