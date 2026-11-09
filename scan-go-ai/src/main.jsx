import React from "react";
import ReactDOM from "react-dom/client";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import App from "./App.jsx";
import "./styles.css";

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PayPalScriptProvider options={{ "client-id": paypalClientId, currency: "USD", intent: "capture" }}>
      <App />
    </PayPalScriptProvider>
  </React.StrictMode>
);
