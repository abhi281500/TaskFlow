import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      duration: 3000,
      style: { borderRadius: "10px", background: "#202b42", color: "#fff", fontSize: "13px" },
      success: { iconTheme: { primary: "#35b982", secondary: "#fff" } },
      error: { iconTheme: { primary: "#f16b75", secondary: "#fff" } }
    }} />
  </React.StrictMode>
);
