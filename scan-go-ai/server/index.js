import "dotenv/config";
import express from "express";
import cors from "cors";
import { products, getCartFromIds } from "./catalog.js";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

const paypalBase = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function paypalAccessToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret || id.startsWith("replace_")) {
    throw new Error("PayPal credentials are missing. Add sandbox credentials to server/.env or the root .env.");
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64");
  const response = await fetch(`${paypalBase}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "Could not authenticate with PayPal");
  return data.access_token;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "Scan&Go AI API" }));
app.get("/api/products", (_req, res) => res.json(products));

app.post("/api/assistant", async (req, res) => {
  const { budget, items = [] } = req.body || {};
  const total = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);
  const remaining = Number(budget || 0) - total;

  // Optional Gemini integration. If no API key is configured, use a transparent rule-based helper.
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are a concise shopping budget assistant. Budget: INR ${budget}. Cart total: INR ${total}. Remaining: INR ${remaining}. Cart: ${items.map(i => `${i.name} x${i.quantity}`).join(", ")}. Give 2 practical suggestions in under 70 words. Do not claim to make purchases.`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await response.json();
      const advice = data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n");
      if (response.ok && advice) return res.json({ advice, source: "Gemini" });
    } catch (error) {
      console.error("Gemini assistant fallback:", error.message);
    }
  }

  let advice;
  if (!budget || Number(budget) <= 0) {
    advice = "Set a shopping budget to get a personalised budget check.";
  } else if (remaining >= 0) {
    advice = `Great! Your cart is within budget. You have ₹${remaining.toFixed(2)} left. Check whether you need every item before checkout.`;
  } else {
    advice = `Your cart is ₹${Math.abs(remaining).toFixed(2)} over budget. Remove an optional item or increase your budget before checkout.`;
  }
  res.json({ advice, source: "Built-in budget assistant" });
});

app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const cart = getCartFromIds(req.body.items);
    if (!cart.length) return res.status(400).json({ error: "Your cart is empty." });
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const accessToken = await paypalAccessToken();
    const response = await fetch(`${paypalBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `scango-${Date.now()}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: (total / 83).toFixed(2) },
          description: "Scan&Go AI demo shopping cart"
        }]
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || "PayPal order creation failed", details: data });
    res.json({ id: data.id, totalINR: total, note: "Demo conversion used: ₹83 = $1. Set your preferred rate before a real deployment." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderID } = req.body || {};
    if (!orderID) return res.status(400).json({ error: "Missing PayPal order ID." });
    const accessToken = await paypalAccessToken();
    const response = await fetch(`${paypalBase}/v2/checkout/orders/${encodeURIComponent(orderID)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || "Payment capture failed", details: data });
    res.json({ status: data.status, orderID: data.id, payer: data.payer?.name?.given_name || "Customer" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Scan&Go API running at http://localhost:${PORT}`));
