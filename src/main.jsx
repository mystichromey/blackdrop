import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SubmitTicket from "./pages/SubmitTicket.jsx";
import Queue from "./pages/Queue.jsx";

function App() {

  const [phone, setPhone] = useState(null);
  const [page, setPage] = useState("login");
  const [editTicket, setEditTicket] = useState(null);

  function handleLogin(phoneNumber) {
    setPhone(phoneNumber);
    setPage("dashboard");
  }

  function handleOpenQueue() {
  setPage("queue");
  }

  function handleLogout() {
    setPhone(null);
    setPage("login");
  }

  function handleStartTicket() {
    setPage("submit");
  }

  function handleTicketComplete() {
    setPage("dashboard");
  }

  if (!phone) {
    return <Login onLogin={handleLogin} />;
  }

  if (page === "dashboard") {
    return (
      <Dashboard
  phone={phone}
  onLogout={handleLogout}
  onStartTicket={() => {
    setEditTicket(null);
    setPage("submit");
  }}
  onOpenQueue={handleOpenQueue}
/>
    );
  }

  if (page === "queue") {
  return (
    <Queue
      phone={phone}
      onBack={() => setPage("dashboard")}
      onEdit={(ticket) => {
        setEditTicket(ticket);
        setPage("submit");
      }}
    />
  );
}

  if (page === "submit") {
  return (
    <SubmitTicket
      phone={phone}
      editTicket={editTicket}
      onComplete={() => {
        setEditTicket(null);
        setPage("dashboard");
      }}
    />
  );
}
  return <div style={{color:"#fff", padding:20}}>Unknown page state</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);