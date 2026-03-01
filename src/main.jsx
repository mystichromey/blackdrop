import React, { useState } from "react";
import ReactDOM from "react-dom/client";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SubmitTicket from "./pages/SubmitTicket.jsx";
import Queue from "./pages/Queue.jsx";
import TicketSuccess from "./pages/TicketSuccess.jsx";

function App() {

  const [phone, setPhone] = useState(() => {
    return localStorage.getItem("bd_phone");
  });
  const [page, setPage] = useState(() => {
    return localStorage.getItem("bd_phone") ? "dashboard" : "login";
  });
  const [editTicket, setEditTicket] = useState(null);

  function handleLogin(phoneNumber) {
  localStorage.setItem("bd_phone", phoneNumber);
  setPhone(phoneNumber);
  setPage("dashboard");
}

  function handleOpenQueue() {
  setPage("queue");
  }

  function handleLogout() {
  localStorage.removeItem("bd_phone");
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

if (page === "success") {
  return (
    <TicketSuccess
      onBack={() => setPage("dashboard")}
    />
  );
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
        setPage("success");
      }}
    />
  );
}
  return <div style={{color:"#fff", padding:20}}>Unknown page state</div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);