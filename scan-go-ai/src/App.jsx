import { useEffect, useMemo, useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { Html5Qrcode } from "html5-qrcode";
import {
  ScanLine, ShoppingBag, Sparkles, Wallet, Plus, Minus, Trash2,
  Search, Camera, X, CheckCircle2, AlertCircle, Leaf, ShieldCheck
} from "lucide-react";

const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(500);
  const [advice, setAdvice] = useState("Add products to your cart and ask the assistant to check your budget.");
  const [assistantSource, setAssistantSource] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");

  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then(setProducts).catch(() => setNotice("Could not connect to the API. Start the backend server."));
  }, []);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const filtered = products.filter(p => `${p.name} ${p.category} ${p.barcode}`.toLowerCase().includes(query.toLowerCase()));
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addProduct(product) {
    setCart(current => {
      const found = current.find(item => item.id === product.id);
      if (found) return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} added to your cart.`);
    setPaymentSuccess("");
  }

  function changeQuantity(id, delta) {
    setCart(current => current.map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  }

  async function askAssistant() {
    try {
      const response = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: Number(budget), items: cart })
      });
      const data = await response.json();
      setAdvice(data.advice || data.error || "No advice available.");
      setAssistantSource(data.source || "");
    } catch {
      setAdvice("Assistant is unavailable. Check that the backend is running.");
    }
  }

  async function startScanner() {
    setScanOpen(true);
    setScanMessage("Allow camera access when your browser asks.");
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 160 } },
          async (decodedText) => {
            const found = products.find(p => p.barcode === decodedText || p.id === decodedText);
            if (found) {
              await scanner.stop().catch(() => {});
              setScanOpen(false);
              addProduct(found);
            } else {
              setScanMessage(`Barcode ${decodedText} is not in this demo catalogue. Try a sample product barcode below.`);
            }
          },
          () => {}
        );
      } catch (error) {
        setScanMessage(`Camera could not start: ${error.message}. You can still search and add products manually.`);
      }
    }, 100);
  }

  async function createOrder() {
    const response = await fetch("/api/paypal/create-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart.map(({ id, quantity }) => ({ id, quantity })) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create PayPal order.");
    return data.id;
  }

  async function captureOrder(data) {
    const response = await fetch("/api/paypal/capture-order", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderID: data.orderID })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Payment could not be captured.");
    setPaymentSuccess(`Payment completed! PayPal order: ${result.orderID}`);
    setCart([]);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark"><ShoppingBag size={20}/></span><span>Scan<span className="brand-accent">&</span>Go <small>AI</small></span></a>
        <div className="top-actions"><span className="secure"><ShieldCheck size={15}/> Secure demo checkout</span><div className="avatar">S</div></div>
      </header>

      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15}/> SMARTER SHOPPING STARTS HERE</div>
            <h1>Scan less.<br/><span>Shop smarter.</span></h1>
            <p>Scan products, track your spending, and check out with a smoother shopping experience.</p>
            <div className="hero-pills"><span><ScanLine size={14}/> Quick scan</span><span><Sparkles size={14}/> AI budget tips</span><span><ShieldCheck size={14}/> PayPal checkout</span></div>
          </div>
          <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="phone-card"><div className="phone-top"/><div className="scan-frame"><ScanLine size={58}/></div><b>Ready to scan</b><small>Point your camera at a barcode</small><div className="phone-bottom"><span/><span/><span/></div></div><div className="floating-tag"><CheckCircle2 size={16}/> Smart cart ready</div></div>
        </section>

        {notice && <div className="notice" role="status"><CheckCircle2 size={16}/>{notice}<button onClick={() => setNotice("")}><X size={15}/></button></div>}
        {paymentSuccess && <div className="success" role="status"><CheckCircle2 size={18}/>{paymentSuccess}</div>}

        <div className="section-heading"><div><span className="eyebrow muted">YOUR SHOPPING SPACE</span><h2>Shop & scan</h2></div><button className="scan-button" onClick={startScanner}><Camera size={17}/> Scan barcode</button></div>

        <div className="content-grid">
          <section className="catalog-panel panel">
            <div className="panel-heading"><div><h3>Popular products</h3><p>Choose an item or scan its barcode</p></div><span className="count-badge">{products.length} items</span></div>
            <div className="search-box"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products or barcode..."/></div>
            <div className="product-grid">
              {filtered.map(product => <article className="product-card" key={product.id}>
                <div className="product-visual"><span>{product.emoji}</span><small>{product.category}</small></div>
                <div className="product-info"><h4>{product.name}</h4><div className="product-bottom"><b>{money(product.price)}</b><button aria-label={`Add ${product.name}`} onClick={() => addProduct(product)}><Plus size={17}/></button></div></div>
              </article>)}
              {filtered.length === 0 && <div className="empty-state">No products match your search.</div>}
            </div>
            <div className="catalog-note"><Leaf size={15}/> Demo catalogue. Add your own products and real barcodes in <code>server/catalog.js</code>.</div>
          </section>

          <aside className="side-column">
            <section className="panel cart-panel">
              <div className="panel-heading"><div><h3>Your cart</h3><p>{itemCount} items selected</p></div><span className="cart-icon"><ShoppingBag size={18}/></span></div>
              {cart.length === 0 ? <div className="empty-cart"><div className="empty-bag"><ShoppingBag size={25}/></div><b>Your cart is empty</b><p>Add a product to see your bill here.</p></div> :
                <div className="cart-list">{cart.map(item => <div className="cart-row" key={item.id}><div className="cart-emoji">{item.emoji}</div><div className="cart-name"><b>{item.name}</b><small>{money(item.price)} each</small></div><div className="qty-control"><button onClick={() => changeQuantity(item.id, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)}><Plus size={13}/></button></div><b className="line-total">{money(item.price * item.quantity)}</b></div>)}</div>}
              <div className="bill-total"><span>Subtotal</span><b>{money(total)}</b></div>
              <div className="bill-total muted-line"><span>Estimated tax</span><span>Included in demo prices</span></div>
              <div className="grand-total"><span>Total</span><strong>{money(total)}</strong></div>
              {cart.length > 0 && <button className="clear-button" onClick={() => setCart([])}><Trash2 size={14}/> Clear cart</button>}
            </section>

            <section className="panel budget-panel">
              <div className="panel-heading"><div><h3><Sparkles size={17}/> AI budget assistant</h3><p>Keep your shopping on track</p></div></div>
              <label className="field-label">Your budget (INR)</label>
              <div className="budget-input"><span>₹</span><input type="number" min="1" value={budget} onChange={e => setBudget(e.target.value)}/></div>
              <div className="budget-progress"><div style={{ width: `${Math.min(100, budget > 0 ? total / budget * 100 : 0)}%` }}/></div>
              <div className="budget-stats"><span>Spent: <b>{money(total)}</b></span><span>Budget: <b>{money(Number(budget) || 0)}</b></span></div>
              <button className="assistant-button" onClick={askAssistant}><Sparkles size={15}/> Get AI budget advice</button>
              <div className="advice-box"><Sparkles size={15}/><p>{advice}</p></div>
              {assistantSource && <small className="source-note">Powered by: {assistantSource}</small>}
            </section>

            <section className="panel payment-panel">
              <div className="panel-heading"><div><h3>Checkout</h3><p>Pay securely with PayPal Sandbox</p></div><ShieldCheck className="green-icon"/></div>
              {!import.meta.env.VITE_PAYPAL_CLIENT_ID || import.meta.env.VITE_PAYPAL_CLIENT_ID === "test" ? <div className="setup-warning"><AlertCircle size={16}/> Add your PayPal Sandbox Client ID to <code>.env</code> to enable checkout.</div> : null}
              {cart.length === 0 ? <p className="payment-hint">Add products to your cart to enable payment.</p> :
                <PayPalButtons style={{ layout: "vertical", shape: "rect", label: "paypal" }} disabled={cart.length === 0}
                  createOrder={createOrder}
                  onApprove={captureOrder}
                  onError={(err) => setNotice(err?.message || "PayPal checkout error. Check your sandbox setup.")}/>
              }
              <small className="currency-note">Payment demo converts INR to USD at a sample rate of ₹83 = $1. Update this before deployment.</small>
            </section>
          </aside>
        </div>
        <footer><span>© 2026 Scan&Go AI</span><span>Built for smarter, simpler shopping</span></footer>
      </main>

      {scanOpen && <div className="modal-backdrop" onClick={() => setScanOpen(false)}><div className="scanner-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><h3>Scan a product</h3><p>Allow camera access to scan a barcode</p></div><button onClick={() => setScanOpen(false)}><X/></button></div><div id="reader"/><p className="scan-message">{scanMessage}</p><div className="sample-codes"><b>Sample barcode:</b><button onClick={() => { const p = products[0]; setScanOpen(false); addProduct(p); }}>Milk — 8901234567012</button></div></div></div>}
    </div>
  );
}
