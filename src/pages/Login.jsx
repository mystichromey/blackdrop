import React, { useState } from "react";

// WEB APP URL
const API_URL = "https://script.google.com/macros/s/AKfycbzws4Mt7KMVkLdc11IJNOtPyAWgZOP80cDiFffYZK1u_hJc4KQ-OEDtjo3_uZMGjV2v/exec";
export default function Login({ onLogin }) {

  const [phone, setPhone] = useState("");

  function handlePhoneChange(e) {
    const numbersOnly = e.target.value.replace(/\D/g, "");
    setPhone(numbersOnly);
  }

async function handleLogin() {

  if (!phone || phone.length < 7) {
    alert("Enter valid phone number");
    return;
  }

  try {

    const response = await fetch(API_URL + "?t=" + Date.now());

    if (!response.ok) {
      alert("Server error");
      return;
    }

    const allowedPhones = await response.json();

    // force string comparison
    const phoneString = String(phone).trim();

    const match = allowedPhones.some(p => String(p).trim() === phoneString);

    if (match) {

      onLogin(phoneString);

    } else {

      alert("This phone number is not authorized.");

    }

  } catch (err) {

    console.error(err);

    alert("Connection failed.");

  }

}

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          BLACK DROP
        </div>

        <div style={styles.subheader}>
          FIELD COMMAND
        </div>

        <div style={styles.label}>
          PHONE NUMBER
        </div>

        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          style={styles.input}
          placeholder="Enter phone number"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={15}
        />

        <button
          style={styles.button}
          onClick={handleLogin}
        >
          LOGIN
        </button>

        <div style={styles.footer}>
          Secure Access Required
        </div>

      </div>
    </div>
  );
}


const styles = {

  container: {
    background: "#0a0a0a",
    minHeight: "100vh",
    width: "100%",
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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

  label: {
    color: "#888",
    fontSize: "11px",
    letterSpacing: "2px",
    marginBottom: "8px",
  },

  input: {
    width: "100%",
    background: "#1f1f1f",
    border: "1px solid #333",
    color: "white",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "16px",
    marginBottom: "14px",
    outline: "none",
    boxSizing: "border-box",
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
    boxSizing: "border-box",
  },

  footer: {
    color: "#666",
    fontSize: "11px",
    textAlign: "center",
    marginTop: "14px",
  },

};