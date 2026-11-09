# Scan&Go AI — Hackathon Starter

A beginner-friendly React + Express starter for a smart shopping demo.

## What works in this starter
- Product catalogue with search
- Add/remove cart items and automatic bill calculation
- Barcode scanning through the device camera (requires HTTPS or localhost and camera permission)
- Built-in budget assistant (optional Gemini API integration through the backend)
- PayPal Sandbox Orders v2 create/capture flow (requires your own sandbox credentials)

> This is a demo starter, not a production payment system. It uses a sample product catalogue and a sample INR-to-USD conversion rate of ₹83 = $1. Do not use real customer payments until the backend, currency conversion, tax, inventory, security and compliance are reviewed.

## 1. Install prerequisites
Install Node.js LTS from https://nodejs.org/. Then open this folder in VS Code.

Check installation in the VS Code terminal:
```bash
node -v
npm -v
```

## 2. Install packages
```bash
npm install
```

## 3. Configure environment
Copy `.env.example` to `.env` in the project root.

Add your PayPal **Sandbox** Client ID and Secret. Create sandbox REST API credentials in the PayPal Developer Dashboard:
https://developer.paypal.com/dashboard/

Also create `client/.env`? No: this project uses Vite at the root. Add this line to the root `.env`:
```env
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
```
Keep `PAYPAL_CLIENT_SECRET` only in the root `.env` and never expose it in frontend code or GitHub.

Optional Gemini:
```env
GEMINI_API_KEY=your_gemini_api_key
```
If this is blank, the built-in budget assistant still works. The Gemini key is only used by the backend.

Example `.env`:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
GEMINI_API_KEY=
```

## 4. Run the app
```bash
npm run dev
```
Open:
- Frontend: http://localhost:5173
- API health check: http://localhost:5000/api/health

## 5. Test without payment credentials
- Add products using the `+` buttons.
- Change the budget.
- Click **Get AI budget advice**.
- Test search.
- Try barcode scan on localhost with camera permission. You can also use the sample barcode option in the scanner window.

PayPal checkout stays unavailable until valid sandbox credentials are configured.

## 6. Test PayPal Sandbox
1. Create a Sandbox Business account and REST app in PayPal Developer Dashboard.
2. Put the Sandbox Client ID and Secret in `.env`.
3. Set `VITE_PAYPAL_CLIENT_ID` to the same Sandbox Client ID.
4. Restart `npm run dev`.
5. Use a PayPal Sandbox Personal test account to approve payment.
6. Confirm the UI shows the captured order ID.

## 7. Project structure
```text
scan-go-ai/
├── server/
│   ├── catalog.js       # Demo products and server-side price validation
│   └── index.js         # Express API, budget assistant, PayPal endpoints
├── src/
│   ├── App.jsx          # Main shopping interface
│   ├── main.jsx         # React entry point and PayPal provider
│   └── styles.css       # Responsive UI styles
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## 8. Important next improvements
- Replace sample catalogue with Supabase tables and real inventory.
- Add authentication and user-specific carts.
- Use a verified product barcode database or store-owned barcode catalogue.
- Replace sample conversion with a trusted live exchange-rate source and make currency explicit in the PayPal order.
- Add server-side order records, webhook verification, idempotency, rate limiting and input validation.
- Add real AI product recommendations with clear user consent.
- Never store card or PayPal credentials yourself.
