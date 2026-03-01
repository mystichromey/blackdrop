import React from "react";

export default function TicketSuccess({ onBack }) {
  return (
    <div style={styles.container}>
      
      <div style={styles.card}>
        <div style={styles.checkmark}>✓</div>
        <h1 style={styles.title}>Ticket Submitted</h1>
        <p style={styles.subtitle}>Your ticket has been successfully sent.</p>

        <button style={styles.button} onClick={onBack}>
          Back to Dashboard
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    animation: "fadeIn 0.4s ease-out"
  },
  card: {
    background: "#111827",
    padding: "50px",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0,0,0,0.5)",
    animation: "pop 0.4s ease-out"
  },
  checkmark: {
    fontSize: "60px",
    color: "#22c55e",
    marginBottom: "20px"
  },
  title: {
    color: "white",
    marginBottom: "10px"
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: "30px"
  },
  button: {
    padding: "12px 30px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "600",
    cursor: "pointer"
  }
};