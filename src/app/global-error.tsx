"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#FFF5EE",
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "9999px",
            backgroundColor: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 30px rgba(78, 0, 48, 0.10)",
            marginBottom: "1.5rem",
          }}
        >
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#F10897",
            }}
          >
            !
          </span>
        </div>

        <h2
          style={{
            fontSize: "1.875rem",
            fontWeight: 800,
            color: "#4E0030",
            margin: 0,
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            fontSize: "0.875rem",
            color: "rgba(78, 0, 48, 0.7)",
            maxWidth: "28rem",
            marginTop: "0.75rem",
            lineHeight: 1.6,
          }}
        >
          An unexpected error occurred. Don&apos;t worry — your data is safe.
          Try again, or refresh the page.
        </p>

        {error.digest && (
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.6875rem",
              color: "rgba(78, 0, 48, 0.4)",
              marginTop: "0.5rem",
            }}
          >
            Error ID: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "2rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            borderRadius: "9999px",
            backgroundColor: "#F10897",
            color: "#FFFFFF",
            padding: "0.875rem 1.75rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 10px 30px rgba(78, 0, 48, 0.25)",
            transition: "transform 0.2s",
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
