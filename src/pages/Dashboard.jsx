import React from "react";

export default function Dashboard({ phone, onLogout, onStartTicket, onOpenQueue }) {
console.log("onOpenQueue:", onOpenQueue);
  return (
    <div style={styles.container}>

      <div style={styles.card}>

        <div style={styles.header}>
          BLACK DROP
        </div>

        <div style={styles.subheader}>
          FIELD COMMAND
        </div>

        <div style={styles.phone}>
          LOGGED IN: {phone}
        </div>

        <button style={styles.button} onClick={onStartTicket}>
          SUBMIT TICKET
        </button>

        <button style={styles.buttonGhost} onClick={onOpenQueue}>
  BOUNCE BACK QUEUE
</button>

        <button style={styles.buttonGhost} onClick={onLogout}>
          LOG OUT
        </button>

      </div>

    </div>
  );
}


const styles = {

  container: {
    background: "#0a0a0a",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "16px",
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "380px",
    background: "#141414",
    padding: "20px",
    borderRadius: "12px",
    borderLeft: "4px solid #D4AF37",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    boxSizing: "border-box",
  },

  header: {
    color: "#D4AF37",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "3px",
    textAlign: "center",
    marginBottom: "4px",
  },

  subheader: {
    color: "#D4AF37",
    fontSize: "20px",
    fontWeight: "900",
    letterSpacing: "2px",
    textAlign: "center",
    marginBottom: "20px",
  },

  phone: {
    color: "#888",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
  },

  button: {
    width: "100%",
    background: "#D4AF37",
    color: "black",
    border: "none",
    padding: "12px",
    fontWeight: "900",
    letterSpacing: "2px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },

  buttonGhost: {
    width: "100%",
    background: "#1f1f1f",
    color: "white",
    border: "1px solid #333",
    padding: "12px",
    fontWeight: "900",
    letterSpacing: "2px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
    marginBottom: "10px",
    boxSizing: "border-box",
  },

};