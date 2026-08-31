import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ArrowUpRight, BarChart3, Bell, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Copy, DollarSign, Download, Eye, EyeOff, FileText, Headphones, ImageIcon, KeyRound, LayoutDashboard, LogOut, MoreHorizontal, Monitor, Package, Plus, RefreshCw, Search, Settings, Shield, ShieldAlert, ShoppingBag, Sparkles, Smartphone, Store, Tag, Trash2, TrendingUp, Upload, UserPlus, UserRound, Users, X, Zap, Wifi, WifiOff, SlidersHorizontal, ChefHat, Edit3, Image, Filter, RotateCcw, AlertTriangle, Layers, Flame, Volume2, VolumeX, Printer, CheckSquare, Square, Utensils, Timer, CheckCircle2, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import "@/App.css";

const API = process.env.REACT_APP_BACKEND_URL;

const NAV = {
  owner: [
    ["overview", "Overview", LayoutDashboard],
    ["orders", "Orders", ShoppingBag],
    ["menu", "Menu", BookOpen],
    ["kitchen", "Kitchen", ChefHat],
    ["analytics", "Analytics", BarChart3],
    ["offers", "Offers", Tag],
    ["payouts", "Payouts", DollarSign],
    ["team", "Team", Users],
    ["settings", "Settings", Settings],
  ],
  employee: [["orders", "Orders", ShoppingBag], ["menu", "Menu", BookOpen]],
  kitchen: [["kitchen", "Kitchen", ChefHat]],
};
const HOME_ROUTE = { owner: "/overview", employee: "/orders", kitchen: "/kitchen" };

const ordersSeed = [{ id: "#GF-1048", customer: "Aarav Mehta", time: "Just now", items: "1 × Truffle Mushroom Pizza", total: 642, status: "new", type: "Delivery", initials: "AM" }, { id: "#GF-1047", customer: "Maya Sharma", time: "4 min ago", items: "2 × Paneer Tikka Bowl, 1 × Lime Soda", total: 518, status: "preparing", type: "Delivery", initials: "MS" }, { id: "#GF-1046", customer: "Rohan Kapoor", time: "12 min ago", items: "1 × Classic Margherita, 1 × Garlic Bread", total: 429, status: "ready_for_pickup", type: "Pickup", initials: "RK" }, { id: "#GF-1045", customer: "Isha Nair", time: "18 min ago", items: "1 × Thai Green Curry, 2 × Steamed Rice", total: 756, status: "delivered", type: "Delivery", initials: "IN" }];
const menuSeed = [
  {
    id: "m_1",
    name: "Paneer Tikka Shashlik",
    category: "Starters",
    dietary: "veg",
    price: 329,
    prepTime: 15,
    orders: 94,
    stock: true,
    emoji: "🍢",
    image: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80",
    description: "Cubes of fresh cottage cheese, bell peppers & onions marinated in tandoori spices and char-grilled."
  },
  {
    id: "m_2",
    name: "Crispy Peri Peri Wings",
    category: "Starters",
    dietary: "non-veg",
    price: 389,
    prepTime: 20,
    orders: 78,
    stock: true,
    emoji: "🍗",
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80",
    description: "Smoked tender chicken wings tossed in our signature fiery African peri-peri glaze with herb ranch dip."
  },
  {
    id: "m_3",
    name: "Truffle Mushroom Pizza",
    category: "Signature pizzas",
    dietary: "veg",
    price: 499,
    prepTime: 25,
    orders: 142,
    stock: true,
    emoji: "🍕",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    description: "Wood-fired hand-stretched sourdough crust with wild portobello mushrooms, white truffle oil, and aged mozzarella."
  },
  {
    id: "m_4",
    name: "Smoky BBQ Chicken Pizza",
    category: "Signature pizzas",
    dietary: "non-veg",
    price: 569,
    prepTime: 25,
    orders: 116,
    stock: true,
    emoji: "🍕",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    description: "Tender BBQ grilled chicken chunks, red onion slices, jalapeños, and smoked gouda over rich tomato passata."
  },
  {
    id: "m_5",
    name: "Classic Margherita",
    category: "Signature pizzas",
    dietary: "veg",
    price: 329,
    prepTime: 20,
    orders: 88,
    stock: true,
    emoji: "🍅",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80",
    description: "San Marzano plum tomato sauce, fior di latte mozzarella, fresh fragrant sweet basil, and extra virgin olive oil."
  },
  {
    id: "m_6",
    name: "Butter Chicken & Naan",
    category: "Main course",
    dietary: "non-veg",
    price: 449,
    prepTime: 20,
    orders: 165,
    stock: true,
    emoji: "🍛",
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80",
    description: "Slow-simmered tandoori chicken in a silky, rich makhani gravy enriched with butter, cream and fenugreek."
  },
  {
    id: "m_7",
    name: "Paneer Tikka Power Bowl",
    category: "Power bowls",
    dietary: "veg",
    price: 289,
    prepTime: 15,
    orders: 64,
    stock: true,
    emoji: "🥗",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    description: "Organic quinoa base topped with grilled spiced paneer, roasted zucchini, edamame, and zesty lemon-tahini."
  },
  {
    id: "m_8",
    name: "Thai Green Curry",
    category: "Global plates",
    dietary: "veg",
    price: 379,
    prepTime: 20,
    orders: 48,
    stock: true,
    emoji: "🍛",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80",
    description: "Aromatic coconut milk curry flavored with green chillies, galangal, kaffir lime leaves & jasmine rice."
  },
  {
    id: "m_9",
    name: "Chocolate Lava Cake",
    category: "Desserts",
    dietary: "veg",
    price: 199,
    prepTime: 10,
    orders: 95,
    stock: false,
    emoji: "🍫",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    description: "Decadent warm dark chocolate sponge with a luscious molten Belgian chocolate center, dusted with cocoa."
  },
  {
    id: "m_10",
    name: "Citrus Cold Brew",
    category: "Beverages",
    dietary: "veg",
    price: 149,
    prepTime: 5,
    orders: 52,
    stock: true,
    emoji: "🥤",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80",
    description: "16-hour steeped single-origin Arabica coffee infused with freshly squeezed Valencia orange extract over craft ice."
  }
];
const money = (v) => `₹${v.toLocaleString("en-IN")}`;
const status = (s) => ({ new: "New order", accepted: "Accepted", preparing: "Preparing", ready_for_pickup: "Ready for pickup", delivered: "Delivered", rejected: "Rejected", cancelled: "Cancelled" }[s] || s);
const initialsOf = (name) => (name || "?").split(" ").filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") || "?";
const roleLabel = { owner: "Owner", employee: "Employee", kitchen: "Kitchen crew" };
const ACTION_TEXT = { accepted_order: "accepted", rejected_order: "rejected", started_prep: "started preparing", marked_ready: "marked ready", marked_picked_up: "handed off" };
const timeAgo = (iso) => { if (!iso) return "just now"; const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000)); if (s < 60) return `${s}s`; if (s < 3600) return `${Math.floor(s / 60)}m`; if (s < 86400) return `${Math.floor(s / 3600)}h`; return `${Math.floor(s / 86400)}d`; };
const logoSrc = (u) => u ? (u.startsWith("http") || u.startsWith("data:") ? u : API ? `${API}${u}` : u) : null;
const MOCK_OWNER = { name: "Aarav Mehta", email: "aarav@greenfork.com", role: "owner", restaurant_name: "GreenFork Kitchen", needs_onboarding: false };

// ─────────────────────────────────────────────────────────────
// Global fetch wrapper — dispatches auth:expired on 401 while authed
// ─────────────────────────────────────────────────────────────
let AUTH_KNOWN = false;
const setAuthKnown = (v) => { AUTH_KNOWN = v; };
async function apiFetch(url, opts = {}) {
  try {
    if (!API || typeof url !== "string" || url.startsWith("undefined")) {
      return { ok: false, status: 500, json: async () => ({}) };
    }
    const res = await fetch(url, { credentials: "include", ...opts });
    if (res.status === 401 && AUTH_KNOWN) {
      AUTH_KNOWN = false;
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return res;
  } catch (e) {
    return { ok: false, status: 500, json: async () => ({}) };
  }
}
async function logActivity(action, orderId, orderCustomer) {
  try { await apiFetch(`${API}/api/activity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, order_id: orderId, order_customer: orderCustomer }) }); } catch {}
}

function Head({ eyebrow, title, desc, action }) { return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1 data-testid="page-title">{title}</h1><p>{desc}</p></div>{action}</div>; }

function Brand({ src, initials, className = "", ...rest }) {
  return src
    ? <img src={src} alt="" className={`${className} logo-img`} referrerPolicy="no-referrer" {...rest} />
    : <div className={className} {...rest}>{initials}</div>;
}

// ─────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────
function Shell({ children, open, setOpen, connected, orders, user, onLogout }) {
  const loc = useLocation();
  const role = user.role;
  const items = NAV[role];
  const current = loc.pathname.split("/")[1] || items[0][0];
  const title = items.find(([k]) => k === current)?.[1] || roleLabel[role];
  const newCount = orders.filter(o => o.status === "new").length;
  const initials = initialsOf(user.name);
  const restName = user.restaurant_name || "Restaurant";
  const restInitials = initialsOf(restName);
  const logo = logoSrc(user.logo_url);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New order received', desc: 'Order #482 needs your attention.', time: '2m ago', unread: true, icon: ShoppingBag, color: 'var(--amber)' },
    { id: 2, title: 'Rider arrived', desc: 'Karan Singh is waiting for order #481.', time: '10m ago', unread: true, icon: Navigation, color: 'var(--green)' },
    { id: 3, title: 'Shift summary', desc: 'Your morning shift performance is ready.', time: '2h ago', unread: false, icon: BarChart3, color: 'var(--blue)' },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, unread: false })));
  const markRead = (id) => setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));

  return <div className="app-shell">
    {!connected && <div className="offline-banner" data-testid="disconnected-banner"><WifiOff size={15} /> Demo connection paused — reconnect to receive orders</div>}
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Store size={18} /></div><div><strong>GreenFork</strong><span>Partner console</span></div></div>
      <div className="restaurant-switcher">
        <Brand src={logo} initials={restInitials} className="restaurant-avatar" data-testid="sidebar-restaurant-logo" />
        <div><b data-testid="restaurant-name">{restName}</b><span>{roleLabel[role]}</span></div>
        <ChevronRight size={15} />
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{items.map(([key, text, Icon]) => <NavLink to={`/${key}`} key={key} data-testid={`nav-${key}`} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><Icon size={18} /><span>{text}</span>{key === "orders" && newCount > 0 && <em data-testid="orders-badge">{newCount}</em>}</NavLink>)}</nav>
      <div className="sidebar-bottom">
        {role === "owner" && <div className="help-row"><CircleHelp size={17} />Help center</div>}
        <div className="user-row" data-testid="user-row">
          {user.picture ? <img src={user.picture} alt="" className="user-avatar user-avatar-img" data-testid="user-avatar-img" referrerPolicy="no-referrer" /> : <div className="user-avatar">{initials}</div>}
          <div><b data-testid="user-name">{user.name}</b><span data-testid="active-role-label">{roleLabel[role]}</span></div>
          <button className="icon-btn light logout-btn" data-testid="logout-button" aria-label="Sign out" onClick={onLogout}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div className="mobile-brand"><div className="brand-mark"><Store size={17} /></div><b>GreenFork</b></div>
        <div className="crumb"><span>{roleLabel[role]}</span><ChevronRight size={14} /><b>{title}</b></div>
        <div className="top-actions" style={{ position: 'relative' }}>
          {role === "owner" && <div className="open-toggle"><span className={open ? "live-dot" : "closed-dot"} /><span>{open ? "Accepting orders" : "Currently closed"}</span><button data-testid="restaurant-status-toggle" className={open ? "toggle on" : "toggle"} onClick={() => setOpen(!open)}><span /></button></div>}
          
          <button className="icon-btn" data-testid="notifications-button" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={18} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.i 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  exit={{ scale: 0 }} 
                  style={{ position: 'absolute', top: 4, right: 6, width: 8, height: 8, background: 'var(--coral)', borderRadius: '50%', border: '2px solid white' }}
                />
              )}
            </AnimatePresence>
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="notifications-backdrop" onClick={() => setShowNotifications(false)} style={{position: 'fixed', inset: 0, zIndex: 90}} />
                <motion.div 
                  className="notifications-panel"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, type: "spring", bounce: 0.2 }}
                  style={{ position: 'absolute', top: '100%', right: 0, width: 320, background: '#fff', borderRadius: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--line)', zIndex: 100, marginTop: 12, overflow: 'hidden' }}
                >
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <h3 style={{ margin: 0, fontSize: 16 }}>Notifications</h3>
                     {unreadCount > 0 && (
                       <span onClick={markAllRead} style={{ fontSize: 12, color: 'var(--blue)', cursor: 'pointer', fontWeight: 500 }}>Mark all read</span>
                     )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                     {notifications.map(n => (
                       <div key={n.id} onClick={() => markRead(n.id)} className={`notification-item ${n.unread ? 'unread' : ''}`} style={{ padding: 16, display: 'flex', gap: 12, borderBottom: '1px solid var(--line)', background: n.unread ? '#f0f9ff' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                             <n.icon size={18} color={n.color} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <b style={{ fontSize: 14, color: 'var(--fg)' }}>{n.title}</b>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{n.time}</span>
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{n.desc}</div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <div style={{ padding: 12, textAlign: 'center', borderTop: '1px solid var(--line)', background: '#fafafa', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                     View all notifications
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          
          <NavLink to="/settings" className="mobile-settings-link" style={{display: 'flex', alignItems: 'center'}} title="Settings">
             {user.picture ? <img src={user.picture} alt="" className="user-avatar-img top-avatar" style={{width: 32, height: 32}} /> : <div className="user-avatar top-avatar" style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12}}>{initials}</div>}
          </NavLink>
          <button className="icon-btn light mobile-logout-btn" data-testid="mobile-logout-button" title="Sign out" onClick={onLogout} style={{color: 'var(--coral)'}}>
             <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="content-wrap"><AnimatePresence mode="wait"><motion.div key={loc.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }}>{children}</motion.div></AnimatePresence></div>
    </main>
    <div className="mobile-nav">
      {items.slice(0, 5).map(([key, text, Icon]) => (
        <NavLink 
          to={`/${key}`} 
          key={key} 
          data-testid={`mobile-nav-${key}`} 
          className={({ isActive }) => isActive ? "mobile-nav-item active" : "mobile-nav-item"}
        >
          {({ isActive }) => (
            <>
              {isActive && <motion.div layoutId="mobile-nav-bubble" className="mobile-nav-bubble" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
              <Icon size={18} style={{position: 'relative', zIndex: 1}} />
              <span style={{position: 'relative', zIndex: 1}}>{text}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// Pages
// ─────────────────────────────────────────────────────────────
function Stat({ text, value, change, Icon, accent }) { return <div className="stat-card" data-testid={`stat-${text.toLowerCase().replaceAll(" ", "-")}`}><div className={`stat-icon ${accent}`}><Icon size={19} /></div><span className="stat-label">{text}</span><strong>{value}</strong><span className="change positive"><ArrowUpRight size={13} />{change}</span></div>; }
function Overview({ open, setOpen, orders, user }) { const firstName = (user.name || "there").split(" ")[0]; return <><Head eyebrow="Today" title={`Good morning, ${firstName}`} desc={`Here's what's happening at ${user.restaurant_name || "your restaurant"} today.`} action={<NavLink className="primary-btn" to="/orders" data-testid="open-orders-button"><ShoppingBag size={16} /> View live orders</NavLink>} /><div className="status-banner" data-testid="restaurant-status-banner"><div className="status-orb"><Activity size={19} /></div><div><b>{open ? "Your restaurant is live" : "Your restaurant is paused"}</b><span>{open ? "Customers can discover you and place orders." : "Turn your restaurant back on to receive new orders."}</span></div><button className="quiet-btn" data-testid="status-banner-toggle" onClick={() => setOpen(!open)}>{open ? "Pause orders" : "Go live"}</button></div><div className="stats-grid"><Stat text="Today's revenue" value={money(13122)} change="12.8% vs yesterday" Icon={DollarSign} accent="green" /><Stat text="Orders today" value="48" change="8.4% vs yesterday" Icon={ShoppingBag} accent="amber" /><Stat text="Avg. order value" value="₹438" change="4.2% vs last week" Icon={TrendingUp} accent="blue" /><Stat text="Acceptance rate" value="96.4%" change="2.1% vs last week" Icon={Zap} accent="coral" /></div><div className="overview-grid"><section className="panel revenue-panel"><div className="panel-head"><div><h2>Revenue overview</h2><span>Last 7 days</span></div><button className="select-btn" data-testid="revenue-period-select">This week <ChevronRight size={14} /></button></div><div className="chart"><div className="chart-y"><span>₹5k</span><span>₹3k</span><span>₹1k</span><span>₹0</span></div><svg viewBox="0 0 640 220" role="img" aria-label="Revenue chart" data-testid="revenue-chart"><path d="M5 180 C65 170 80 125 145 140 S220 90 275 120 S350 40 410 78 S500 62 555 30 S610 52 638 18 L638 220 L5 220Z" fill="#14532D1c" /><path d="M5 180 C65 170 80 125 145 140 S220 90 275 120 S350 40 410 78 S500 62 555 30 S610 52 638 18" fill="none" stroke="#14532D" strokeWidth="3" /></svg><div className="chart-x"><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span></div></div></section><section className="panel live-panel"><div className="panel-head"><div><h2>Live order flow</h2><span>Today, by status</span></div><span className="live-chip"><i /> Live</span></div><div className="funnel">{[["New", "88%", "3"], ["Preparing", "65%", "7"], ["Ready", "43%", "4"], ["Delivered", "100%", "34"]].map(([n, w, t]) => <div className="funnel-row" key={n}><span>{n}</span><div><b style={{ width: w }} /></div><strong>{t}</strong></div>)}</div><div className="panel-footer"><span>48 total orders</span><NavLink to="/orders" data-testid="funnel-orders-link">View order queue <ChevronRight size={14} /></NavLink></div></section></div><section className="panel recent-panel"><div className="panel-head"><div><h2>Recent orders</h2><span>Latest activity from your kitchen</span></div><NavLink to="/orders" className="text-link" data-testid="recent-orders-link">See all orders <ChevronRight size={14} /></NavLink></div><OrderTable orders={orders.slice(0, 4)} compact /></section></>; }
function Countdown({ expiresAt }) { 
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now())); 
  useEffect(() => { 
    const t = setInterval(() => setLeft(Math.max(0, expiresAt - Date.now())), 250); 
    return () => clearInterval(t); 
  }, [expiresAt]); 
  
  const seconds = Math.ceil(left / 1000); 
  const progress = Math.max(0, Math.min(1, left / 45000)); 
  const isUrgent = seconds < 15;
  
  return (
    <motion.span 
      className={`countdown ${isUrgent ? "urgent" : ""}`} 
      data-testid="order-countdown"
      animate={isUrgent ? { scale: [1, 1.1, 1], filter: ["hue-rotate(0deg)", "hue-rotate(-20deg)", "hue-rotate(0deg)"] } : {}}
      transition={{ repeat: Infinity, duration: 1 }}
    >
      <svg viewBox="0 0 36 36">
        <circle className="ring-bg" cx="18" cy="18" r="15" />
        <motion.circle 
          className="ring-progress" 
          cx="18" cy="18" r="15" 
          style={{ strokeDashoffset: `${94 - 94 * progress}`, stroke: isUrgent ? 'var(--coral)' : 'var(--amber)' }} 
        />
      </svg>
      <b style={{color: isUrgent ? 'var(--coral)' : 'inherit'}}>{seconds}s</b>
    </motion.span>
  ); 
}

function OrderTable({ orders, compact, onSelect, update }) { 
  return (
    <div className="order-table">
      <AnimatePresence>
        {orders.map((o, i) => (
          <motion.div 
            layout 
            initial={{ opacity: 0, y: -20, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: i * 0.05 }}
            className="order-row" 
            key={o.id} 
            onClick={() => onSelect?.(o)} 
            data-testid={`order-row-${o.id.slice(1)}`}
          >
            <div className="order-id">
              <span className="order-bullet">{o.initials}</span>
              <div>
                <b>{o.id}</b>
                <span>{o.customer} · {o.time}</span>
              </div>
            </div>
            <div className="order-items">{o.items}</div>
            {o.status === "new" && !compact ? (
              <Countdown expiresAt={o.expiresAt || Date.now() + 45000} />
            ) : (
              <span className={`status-pill ${o.status}`}>{status(o.status)}</span>
            )}
            <b className="order-total">{money(o.total)}</b>
            {!compact && o.status === "new" && (
              <div className="row-actions">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="accept-small" data-testid={`accept-${o.id.slice(1)}`} onClick={e => { e.stopPropagation(); update(o.id, "accepted", o); }}><Check size={15} /></motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="reject-small" data-testid={`reject-${o.id.slice(1)}`} onClick={e => { e.stopPropagation(); update(o.id, "rejected", o); }}><X size={15} /></motion.button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  ); 
}

function Detail({ order, update }) { 
  const rejected = ["rejected", "cancelled"].includes(order.status); 
  const isReady = order.status === "ready_for_pickup";
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => setPrinting(false), 2000);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.section 
        key={order.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="panel order-detail" 
        data-testid="order-detail-panel"
      >
        <div className="detail-top">
          <div>
            <span className="eyebrow">Order details</span>
            <h2>{order.id}</h2>
            <span className="detail-time"><Clock3 size={14} /> Placed {order.time}</span>
          </div>
          <button className="icon-btn light" data-testid="order-more-button" onClick={handlePrint}>
            {printing ? <RefreshCw size={18} className="spin" /> : <Printer size={18} />}
          </button>
        </div>
        
        {printing && (
          <motion.div className="receipt-print-banner" initial={{height:0}} animate={{height:"auto"}} exit={{height:0}}>
             <div className="receipt-paper">Printing KOT...</div>
          </motion.div>
        )}

        {rejected && (
          <div className="status-banner detail-status" data-testid="rejected-order-status">
            <div><b>Order {status(order.status).toLowerCase()}</b><span>This order will not be prepared.</span></div>
          </div>
        )}

        {order.status === "new" && (
          <div className="timer-callout">
            <Countdown expiresAt={order.expiresAt || Date.now() + 45000} />
            <div><b>Accept within 45 seconds</b><span>Orders auto-reject when the timer ends.</span></div>
          </div>
        )}

        <div className="customer-block">
          <div className="large-avatar">{order.initials}</div>
          <div>
            <b>{order.customer}</b>
            <span>{order.type} · Contact customer</span>
          </div>
          <button className="icon-btn light" data-testid="customer-contact-button"><Headphones size={17} /></button>
        </div>

        <div className="detail-section">
          <h3>Order summary</h3>
          <div className="detail-line"><span>2 × Paneer Tikka Bowl</span><b>₹578</b></div>
          <div className="detail-line"><span>1 × Mango Lassi</span><b>₹109</b></div>
          <div className="detail-line muted"><span>Taxes & fees</span><b>₹53</b></div>
          <div className="detail-total"><span>Total to collect</span><strong>{money(order.total)}</strong></div>
        </div>

        {!rejected && (
          <div className="detail-section">
            <h3>Order progress</h3>
            <div className="stepper">
              {["Order placed", "Accepted", "Preparing", "Ready"].map((s, i) => (
                <div className={i < (order.status === "new" ? 1 : order.status === "accepted" ? 2 : 3) ? "step done" : "step"} key={s}>
                  <motion.span layout>
                    {i < (order.status === "new" ? 1 : order.status === "accepted" ? 2 : 3) ? <Check size={12} /> : i + 1}
                  </motion.span>
                  <label>{s}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {isReady && (
          <motion.div className="driver-assignment" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
             <h3>Assign Rider</h3>
             <div className="rider-card">
               <div className="rider-avatar">KS</div>
               <div className="rider-info">
                 <b>Karan Singh</b>
                 <span>2 mins away · DL9C 2145</span>
               </div>
               <button className="secondary-btn">Assign</button>
             </div>
          </motion.div>
        )}

        {order.status === "new" && (
          <div className="detail-actions">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="reject-btn" data-testid="detail-reject-button" onClick={() => update(order.id, "rejected", order)}>
              <X size={17} /> Reject
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="accept-btn" data-testid="detail-accept-button" onClick={() => update(order.id, "accepted", order)}>
              <Check size={17} /> Accept order
            </motion.button>
          </div>
        )}
      </motion.section>
    </AnimatePresence>
  ); 
}

function Orders({ orders, setOrders }) { 
  const [filter, setFilter] = useState("all"); 
  const [selectedId, setSelectedId] = useState(orders[0]?.id); 
  const selected = orders.find(o => o.id === selectedId) || orders[0]; 
  const shown = orders.filter(o => filter === "all" || o.status === filter); 
  const newCount = orders.filter(o => o.status === "new").length; 
  const prevNewCountRef = useRef(newCount);

  // Play sound when new order count goes up
  useEffect(() => {
    if (newCount > prevNewCountRef.current) {
      if (typeof playKitchenChime === 'function') {
        playKitchenChime('new_order');
      }
    }
    prevNewCountRef.current = newCount;
  }, [newCount]);

  const update = (id, next, order) => { 
    setOrders(p => p.map(o => o.id === id ? { ...o, status: next } : o)); 
    if (next === "accepted") logActivity("accepted_order", id, order?.customer); 
    else if (next === "rejected") logActivity("rejected_order", id, order?.customer); 
  }; 
  
  return (
    <>
      <Head 
        eyebrow="Operations" 
        title="Order queue" 
        desc="Stay ahead of every order, from acceptance to handoff." 
        action={<button className="secondary-btn" data-testid="refresh-orders-button"><Activity size={16} /> Live updates on</button>} 
      />
      <div className="order-layout">
        <section className="panel queue-panel">
          <div className="queue-toolbar">
            <div className="filter-tabs">
              {[["all", "All orders"], ["new", `New (${newCount})`], ["preparing", "Preparing"], ["ready_for_pickup", "Ready"]].map(([k, t]) => (
                <button key={k} data-testid={`order-filter-${k}`} className={filter === k ? "filter-tab active" : "filter-tab"} onClick={() => setFilter(k)}>
                  {t}
                  {k === "new" && newCount > 0 && <span className="notification-dot"></span>}
                </button>
              ))}
            </div>
            <button className="icon-btn light" data-testid="order-search-button"><Search size={17} /></button>
          </div>
          <div className="queue-summary">
            <b>{shown.length} orders</b>
            <span>Updated moments ago</span>
          </div>
          <OrderTable orders={shown} onSelect={o => setSelectedId(o.id)} update={update} />
        </section>
        {selected && <Detail order={selected} update={update} />}
      </div>
    </>
  ); 
}
// ─────────────────────────────────────────────────────────────
// Dietary Indicator Badge
// ─────────────────────────────────────────────────────────────
function DietaryBadge({ dietary = "veg", showLabel = false, className = "" }) {
  const isVeg = dietary === "veg";
  const isEgg = dietary === "egg";
  const type = isVeg ? "veg" : isEgg ? "egg" : "non-veg";
  const label = isVeg ? "Pure Veg" : isEgg ? "Contains Egg" : "Non-Veg";

  return (
    <div className={`dietary-badge ${type} ${className}`} title={label} data-testid={`dietary-badge-${type}`}>
      <span className="dietary-symbol">
        <i />
      </span>
      {showLabel && <span className="dietary-text">{label}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Add / Edit Menu Item Modal
// ─────────────────────────────────────────────────────────────
function MenuItemModal({ mode = "add", initialItem = null, categories = [], onSave, onDelete, onClose }) {
  const [name, setName] = useState(initialItem?.name || "");
  const [description, setDescription] = useState(initialItem?.description || "");
  const [category, setCategory] = useState(initialItem?.category || categories[1] || "Starters");
  const [customCat, setCustomCat] = useState("");
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [dietary, setDietary] = useState(initialItem?.dietary || "veg");
  const [price, setPrice] = useState(initialItem?.price !== undefined ? String(initialItem.price) : "");
  const [prepTime, setPrepTime] = useState(initialItem?.prepTime || 15);
  const [customPrep, setCustomPrep] = useState("");
  const [stock, setStock] = useState(initialItem?.stock !== undefined ? initialItem.stock : true);
  const [emoji, setEmoji] = useState(initialItem?.emoji || "🍽️");
  const [image, setImage] = useState(initialItem?.image || "");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const PREP_PRESETS = [10, 15, 20, 30, 45, 50];
  const emojiPresets = ["🍕", "🍗", "🍔", "🍢", "🍛", "🥗", "🍜", "🥟", "🌮", "🍰", "🍫", "🥤", "☕", "🍹", "🥑", "🥘"];

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Image must be under 3 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a food item name.");
      return;
    }
    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid price in ₹.");
      return;
    }
    const finalCategory = isCustomCat && customCat.trim() ? customCat.trim() : category;
    const finalPrepTime = Number(prepTime) > 0 ? Number(prepTime) : 15;

    onSave({
      ...(initialItem || {}),
      id: initialItem?.id || `m_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category: finalCategory,
      dietary,
      price: Math.round(numPrice),
      prepTime: finalPrepTime,
      stock,
      emoji: emoji || "🍽️",
      image: image || "",
      orders: initialItem?.orders || 0,
    });
  };

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      data-testid="menu-item-modal"
      onClick={onClose}
    >
      <motion.div
        className="modal menu-modal-dialog"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" data-testid="close-menu-modal" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">{mode === "edit" ? "Edit catalog item" : "Menu builder"}</span>
        <h2>{mode === "edit" ? "Edit food item" : "Add new food item"}</h2>
        <p>{mode === "edit" ? "Update recipe details, pricing, turnaround time, variants, and stock availability." : "Add a delicious new starter, main course, dessert, or beverage to your menu with preparation time."}</p>

        {error && <div className="form-error" style={{ margin: "0 0 16px" }}>{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Food item name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crispy Paneer Tikka, Peri Peri Wings..."
              data-testid="menu-form-name"
              required
            />
          </div>

          <div className="form-group">
            <label>Food variant / Dietary classification *</label>
            <div className="dietary-selector">
              <button
                type="button"
                className={`dietary-option ${dietary === "veg" ? "selected" : ""}`}
                onClick={() => setDietary("veg")}
                data-testid="select-dietary-veg"
              >
                <DietaryBadge dietary="veg" showLabel />
              </button>
              <button
                type="button"
                className={`dietary-option opt-nonveg ${dietary === "non-veg" ? "selected opt-nonveg" : ""}`}
                onClick={() => setDietary("non-veg")}
                data-testid="select-dietary-nonveg"
              >
                <DietaryBadge dietary="non-veg" showLabel />
              </button>
              <button
                type="button"
                className={`dietary-option ${dietary === "egg" ? "selected" : ""}`}
                onClick={() => setDietary("egg")}
                data-testid="select-dietary-egg"
              >
                <DietaryBadge dietary="egg" showLabel />
              </button>
            </div>
          </div>

          {/* Animated Preparation Time Selector */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock3 size={13} color="var(--green)" /> Preparation Turnaround Time *
              </label>
              <span className="prep-time-badge" data-testid="selected-prep-badge">
                ⏱️ {prepTime} mins
              </span>
            </div>

            <div className="prep-time-selector">
              {PREP_PRESETS.map((t) => {
                const isSelected = prepTime === t;
                return (
                  <motion.button
                    key={t}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`prep-time-chip ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setPrepTime(t);
                      setCustomPrep("");
                    }}
                    data-testid={`prep-time-${t}`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="prep-glow-pill"
                        className="prep-glow-pill"
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                      />
                    )}
                    <span className="prep-time-text">{t} mins</span>
                  </motion.button>
                );
              })}

              <div className="prep-custom-wrap">
                <input
                  type="number"
                  min="1"
                  max="180"
                  placeholder="Custom"
                  value={customPrep}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomPrep(val);
                    if (val && Number(val) > 0) {
                      setPrepTime(Number(val));
                    }
                  }}
                  data-testid="prep-time-custom"
                />
                <span>min</span>
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Course / Category *</label>
              {!isCustomCat ? (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__NEW__") {
                      setIsCustomCat(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  data-testid="menu-form-category"
                >
                  {categories.filter(c => c !== "All items").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__NEW__">+ New custom category...</option>
                </select>
              ) : (
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    placeholder="Type custom category..."
                    data-testid="menu-form-custom-category"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="icon-btn light"
                    title="Choose from list"
                    onClick={() => setIsCustomCat(false)}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="₹ e.g. 299"
                data-testid="menu-form-price"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description & Ingredients</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe flavors, portion size, allergen details, spices..."
              rows={2}
              data-testid="menu-form-description"
            />
          </div>

          <div className="form-group">
            <label>Inventory & Stock availability</label>
            <div
              className="stock-switch-wrap"
              onClick={() => setStock(!stock)}
              style={{ background: "#FAFBF9", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--line)", width: "100%", justifyContent: "space-between" }}
              data-testid="menu-form-stock-toggle"
            >
              <div>
                <b style={{ display: "block", fontSize: "12px" }}>{stock ? "Currently In Stock" : "Currently Out of Stock"}</b>
                <span style={{ fontSize: "10.5px", color: "var(--muted)" }}>{stock ? "Available for customers to order" : "Marked as sold out on live menu"}</span>
              </div>
              <div className={`switch-pill ${stock ? "on" : ""}`}>
                <div className="switch-knob" />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Food presentation & Image</label>
            <div className="image-upload-preview">
              <div className="image-preview-thumb">
                {image ? (
                  <img src={image} alt="preview" />
                ) : (
                  <span>{emoji}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageFile}
                  data-testid="menu-image-file-input"
                />
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <button
                    type="button"
                    className="secondary-btn small"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="upload-photo-btn"
                  >
                    <Upload size={13} /> {image ? "Change photo" : "Upload photo"}
                  </button>
                  {image && (
                    <button
                      type="button"
                      className="icon-btn light small"
                      onClick={() => setImage("")}
                      title="Clear photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <input
                  value={image.startsWith("data:") ? "" : image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  style={{ height: "34px", fontSize: "11px", margin: 0 }}
                  data-testid="menu-image-url-input"
                />
              </div>
            </div>

            <div style={{ marginTop: "10px" }}>
              <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: "600" }}>Or pick a food icon:</span>
              <div className="emoji-chips">
                {emojiPresets.map((em) => (
                  <button
                    type="button"
                    key={em}
                    className={`emoji-chip-btn ${emoji === em && !image ? "active" : ""}`}
                    onClick={() => { setEmoji(em); }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions-row">
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                className="secondary-btn danger"
                onClick={() => {
                  onDelete(initialItem);
                }}
                data-testid="delete-item-modal-btn"
              >
                <Trash2 size={14} /> Delete item
              </button>
            ) : (
              <button type="button" className="secondary-btn" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="primary-btn" data-testid="save-menu-item-button">
              <Check size={16} /> {mode === "edit" ? "Save changes" : "Add to menu"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Confirmation Modal
// ─────────────────────────────────────────────────────────────
function DeleteConfirmModal({ item, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      data-testid="delete-confirm-modal"
      onClick={onCancel}
      style={{ zIndex: 100 }}
    >
      <motion.div
        className="modal"
        style={{ maxWidth: "420px", textAlign: "center" }}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "#FEE2E2", color: "var(--red)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
          <Trash2 size={24} />
        </div>
        <span className="eyebrow" style={{ color: "var(--red)" }}>Delete Confirmation</span>
        <h2 style={{ fontSize: "20px", margin: "6px 0 8px" }}>Delete "{item.name}"?</h2>
        <p style={{ fontSize: "12.5px", color: "var(--muted)", margin: "0 0 22px", lineHeight: 1.5 }}>
          This will permanently remove this item from your restaurant menu. Customers won't be able to view or order it.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={onCancel} data-testid="cancel-delete-button">
            Cancel
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ flex: 1, background: "var(--red)", boxShadow: "0 4px 10px rgba(220,38,38,0.25)" }}
            onClick={() => onConfirm(item)}
            data-testid="confirm-delete-button"
          >
            <Trash2 size={15} /> Delete food
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sideways Horizontal Scroller with Arrows & Mouse Wheel
// ─────────────────────────────────────────────────────────────
function HorizontalScroller({ children, className = "" }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkScroll, children]);

  const scrollBy = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleWheel = (e) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      if (scrollRef.current.scrollWidth > scrollRef.current.clientWidth) {
        scrollRef.current.scrollLeft += e.deltaY * 0.8;
      }
    }
  };

  return (
    <div className={`horizontal-scroller-wrap ${className}`}>
      {canScrollLeft && (
        <button
          type="button"
          className="scroll-arrow left"
          onClick={() => scrollBy(-180)}
          aria-label="Scroll left"
        >
          <ChevronLeft size={15} />
        </button>
      )}
      <div
        ref={scrollRef}
        className="horizontal-scroll-track"
        onScroll={checkScroll}
        onWheel={handleWheel}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          type="button"
          className="scroll-arrow right"
          onClick={() => scrollBy(180)}
          aria-label="Scroll right"
        >
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

const BASE_CATEGORIES = ["All items", "Starters", "Main course", "Signature pizzas", "Power bowls", "Global plates", "Desserts", "Beverages"];

const normalizeMenuItems = (rawList) => {
  const source = Array.isArray(rawList) && rawList.length > 0 ? rawList : menuSeed;
  return source.map((it, idx) => ({
    ...it,
    id: it.id || `m_${idx + 1}_${(it.name || "item").toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    dietary: it.dietary || "veg",
    prepTime: it.prepTime !== undefined ? Number(it.prepTime) : 15,
    stock: it.stock !== undefined ? it.stock : true,
    orders: it.orders !== undefined ? it.orders : 0,
    description: it.description || "",
    emoji: it.emoji || "🍽️",
    price: typeof it.price === "number" ? it.price : (Number(it.price) || 0)
  }));
};

// ─────────────────────────────────────────────────────────────
// Menu Page
// ─────────────────────────────────────────────────────────────
function MenuPage({ canEdit }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("gf_menu_items");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeMenuItems(parsed);
        }
      }
    } catch {}
    return normalizeMenuItems(menuSeed);
  });

  const [cat, setCat] = useState("All items");
  const [dietaryFilter, setDietaryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: "add" } | { mode: "edit", item }
  const [deleteTarget, setDeleteTarget] = useState(null); // null | item
  const [celebration, setCelebration] = useState(null); // null | { name, prepTime, mode }

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("gf_menu_items", JSON.stringify(items));
    } catch {}
  }, [items]);

  // Extract all categories dynamically
  const dynamicCategories = useMemo(() => {
    const set = new Set(BASE_CATEGORIES);
    items.forEach(i => { if (i.category) set.add(i.category); });
    return Array.from(set);
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (cat !== "All items" && item.category?.toLowerCase() !== cat.toLowerCase()) return false;
      // Dietary filter
      if (dietaryFilter === "veg" && item.dietary !== "veg") return false;
      if (dietaryFilter === "non-veg" && item.dietary !== "non-veg") return false;
      // Stock filter
      if (stockFilter === "in_stock" && !item.stock) return false;
      if (stockFilter === "out_of_stock" && item.stock) return false;
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesCat = item.category?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [items, cat, dietaryFilter, stockFilter, search]);

  // Stock toggle handler with instant feedback
  const handleToggleStock = (targetIdOrItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!canEdit) return;
    const targetId = typeof targetIdOrItem === "object" ? (targetIdOrItem?.id || targetIdOrItem?.name) : targetIdOrItem;
    const targetName = typeof targetIdOrItem === "object" ? targetIdOrItem?.name : targetIdOrItem;

    setItems((prev) =>
      prev.map((item) =>
        (item.id === targetId || item.name === targetName) ? { ...item, stock: !item.stock } : item
      )
    );
  };

  // Delete item handler
  const handleDeleteItem = (targetItem) => {
    if (!canEdit || !targetItem) return;
    const targetId = typeof targetItem === "object" ? (targetItem?.id || targetItem?.name) : targetItem;
    const targetName = typeof targetItem === "object" ? targetItem?.name : targetItem;

    setItems((prev) =>
      prev.filter((it) => {
        if (targetId && it.id === targetId) return false;
        if (targetName && it.name === targetName) return false;
        return true;
      })
    );
    setDeleteTarget(null);
    if (modal?.item?.id === targetId || modal?.item?.name === targetName) {
      setModal(null);
    }
  };

  // Save (add or edit) item handler with celebration feedback
  const handleSaveItem = (itemData) => {
    const isEdit = modal?.mode === "edit";
    if (isEdit) {
      setItems((prev) =>
        prev.map((it) => ((it.id === itemData.id || it.name === itemData.name) ? { ...it, ...itemData } : it))
      );
    } else {
      setItems((prev) => [itemData, ...prev]);
    }
    setModal(null);
    setCelebration({
      name: itemData.name,
      prepTime: itemData.prepTime || 15,
      mode: isEdit ? "edit" : "add"
    });
    setTimeout(() => {
      setCelebration(null);
    }, 4500);
  };

  // Bulk actions: reset default or toggle all
  const handleResetMenu = () => {
    if (window.confirm("Reset menu to default demo items with photos, turnaround times, and descriptions?")) {
      const resetList = normalizeMenuItems(menuSeed);
      setItems(resetList);
      localStorage.setItem("gf_menu_items", JSON.stringify(resetList));
    }
  };

  const handleMakeAllInStock = () => {
    setItems((prev) => prev.map((item) => ({ ...item, stock: true })));
  };

  const inStockCount = items.filter(i => i.stock).length;
  const outOfStockCount = items.filter(i => !i.stock).length;
  const vegCount = items.filter(i => i.dietary === "veg").length;
  const nonVegCount = items.filter(i => i.dietary === "non-veg").length;

  return (
    <>
      <Head
        eyebrow="Catalog & Kitchen"
        title="Your menu"
        desc="Manage food items, vegetarian/non-veg variants, kitchen prep time, pricing, photos, and live in-stock toggles."
        action={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              disabled={!canEdit}
              className="primary-btn"
              data-testid="add-menu-item-button"
              onClick={() => setModal({ mode: "add" })}
            >
              <Plus size={17} /> Add food item
            </button>
          </div>
        }
      />

      {/* Top Search & Filter Bar */}
      <div className="menu-header-bar">
        <div className="menu-search-box">
          <Search size={16} color="var(--muted)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search food by name, ingredient, or recipe..."
            data-testid="menu-search-input"
          />
          {search && (
            <button className="icon-btn" onClick={() => setSearch("")} style={{ width: "24px", height: "24px" }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sideways Scrollable Dietary & Stock Variant Chips */}
        <HorizontalScroller className="menu-variants-scroller">
          <button
            className={`dietary-chip ${dietaryFilter === "all" ? "active" : ""}`}
            onClick={() => setDietaryFilter("all")}
            data-testid="filter-dietary-all"
          >
            All variants ({items.length})
          </button>
          <button
            className={`dietary-chip ${dietaryFilter === "veg" ? "active" : ""}`}
            onClick={() => setDietaryFilter("veg")}
            data-testid="filter-dietary-veg"
          >
            <DietaryBadge dietary="veg" /> Pure Veg ({vegCount})
          </button>
          <button
            className={`dietary-chip chip-nonveg ${dietaryFilter === "non-veg" ? "active chip-nonveg" : ""}`}
            onClick={() => setDietaryFilter("non-veg")}
            data-testid="filter-dietary-nonveg"
          >
            <DietaryBadge dietary="non-veg" /> Non-Veg ({nonVegCount})
          </button>

          <button
            className={`dietary-chip ${stockFilter === "in_stock" ? "active" : ""}`}
            onClick={() => setStockFilter(stockFilter === "in_stock" ? "all" : "in_stock")}
            data-testid="filter-stock-in"
          >
            In Stock ({inStockCount})
          </button>
          {outOfStockCount > 0 && (
            <button
              className={`dietary-chip chip-nonveg ${stockFilter === "out_of_stock" ? "active chip-nonveg" : ""}`}
              onClick={() => setStockFilter(stockFilter === "out_of_stock" ? "all" : "out_of_stock")}
              data-testid="filter-stock-out"
            >
              Out of Stock ({outOfStockCount})
            </button>
          )}
        </HorizontalScroller>
      </div>

      {/* Category Tabs & Bulk Actions */}
      <div className="menu-toolbar">
        <HorizontalScroller className="menu-tabs-scroller">
          {dynamicCategories.map((c) => {
            const count = c === "All items" ? items.length : items.filter(i => i.category?.toLowerCase() === c.toLowerCase()).length;
            return (
              <button
                key={c}
                data-testid={`menu-category-${c.toLowerCase().replaceAll(" ", "-")}`}
                className={cat === c ? "filter-tab active" : "filter-tab"}
                onClick={() => setCat(c)}
              >
                {c} <span style={{ opacity: 0.65, fontSize: "10px" }}>({count})</span>
              </button>
            );
          })}
        </HorizontalScroller>

        <div className="toolbar-right">
          {outOfStockCount > 0 && (
            <button
              disabled={!canEdit}
              className="secondary-btn"
              onClick={handleMakeAllInStock}
              title="Set all products back in stock"
              data-testid="bulk-in-stock-button"
            >
              <Check size={14} /> Mark all In Stock
            </button>
          )}
        </div>
      </div>

      {/* Food Grid */}
      {filteredItems.length === 0 ? (
        <div className="empty-workspace panel" style={{ marginTop: "20px" }}>
          <div className="empty-icon">
            <BookOpen />
          </div>
          <h2>No matching food items found</h2>
          <p>Try searching for something else or clearing your category and dietary filters.</p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="secondary-btn"
              onClick={() => { setCat("All items"); setDietaryFilter("all"); setStockFilter("all"); setSearch(""); }}
            >
              Clear filters
            </button>
            <button
              className="primary-btn"
              onClick={() => setModal({ mode: "add" })}
            >
              <Plus size={15} /> Add food item
            </button>
          </div>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item, i) => {
            const isOutOfStock = !item.stock;
            return (
              <motion.div
                layout
                key={item.id || `${item.name}-${i}`}
                className={`menu-card ${isOutOfStock ? "out" : ""}`}
                data-testid={`menu-item-${item.id || i}`}
              >
                {/* Food Image / Art Area */}
                <div className="food-art-img-wrap">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="food-photo"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "grid";
                      }}
                    />
                  ) : null}
                  <div
                    className="food-art"
                    style={{ display: item.image ? "none" : "grid", width: "100%", height: "100%" }}
                  >
                    <span>{item.emoji || "🍽️"}</span>
                  </div>

                  {/* Dietary Tag Badge */}
                  <div className="card-dietary-tag">
                    <DietaryBadge dietary={item.dietary || "veg"} showLabel />
                  </div>

                  {/* Prep Time Tag on Photo */}
                  <div className="card-prep-tag" title={`Kitchen prep turnaround: ${item.prepTime || 15} minutes`}>
                    <Clock3 size={11} /> {item.prepTime || 15}m
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  {canEdit && (
                    <div className="card-actions-top">
                      <button
                        className="card-btn"
                        title="Edit this item"
                        onClick={() => setModal({ mode: "edit", item })}
                        data-testid={`edit-item-${item.id || i}`}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="card-btn danger"
                        title="Delete from menu"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        data-testid={`delete-item-${item.id || i}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Out of Stock Overlay Banner */}
                  {isOutOfStock && (
                    <div className="out-overlay" data-testid="out-of-stock-overlay">
                      <span>Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="menu-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span className="item-category">{item.category}</span>
                    <strong style={{ color: "var(--green)", fontSize: "14px" }}>{money(item.price)}</strong>
                  </div>

                  <h3>{item.name}</h3>

                  {item.description ? (
                    <p className="menu-card-desc" title={item.description}>
                      {item.description}
                    </p>
                  ) : (
                    <p className="menu-card-desc" style={{ fontStyle: "italic", opacity: 0.6 }}>
                      No description added.
                    </p>
                  )}

                  {/* Card Meta & Stock Toggle Switch */}
                  <div className="menu-meta">
                    <div className="menu-meta-details">
                      <span>{item.orders ? `${item.orders} orders` : "New item"}</span>
                      <span className="meta-dot">·</span>
                      <span className="meta-prep"><Clock3 size={11} /> {item.prepTime || 15}m prep</span>
                    </div>

                    {/* Prominent In-Stock Toggle Switch */}
                    <div
                      className="stock-switch-wrap"
                      onClick={(e) => handleToggleStock(item, e)}
                      title={item.stock ? "Click to mark as Out of Stock" : "Click to mark as In Stock"}
                      data-testid={`stock-toggle-${item.id || i}`}
                    >
                      <span className={`stock-status-label ${item.stock ? "in-stock" : "out-stock"}`}>
                        {item.stock ? "In Stock" : "Out of Stock"}
                      </span>
                      <div className={`switch-pill ${item.stock ? "on" : ""}`}>
                        <div className="switch-knob" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {modal && (
          <MenuItemModal
            mode={modal.mode}
            initialItem={modal.item}
            categories={dynamicCategories}
            onSave={handleSaveItem}
            onDelete={(target) => {
              setModal(null);
              setDeleteTarget(target);
            }}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      {/* In-App Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmModal
            item={deleteTarget}
            onConfirm={handleDeleteItem}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Animated Celebration & Sparkle Toast Effect */}
      <AnimatePresence>
        {celebration && (
          <motion.div
            className="celebration-toast"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            data-testid="item-celebration-toast"
          >
            <div className="celebration-icon">
              <Sparkles size={18} />
            </div>
            <div className="celebration-info">
              <strong>{celebration.mode === "edit" ? "Menu item updated!" : "Food item added! 🎉"}</strong>
              <span>
                <b>{celebration.name}</b> is ready with ⏱️ <b>{celebration.prepTime} mins</b> preparation turnaround time.
              </span>
            </div>
            <button
              type="button"
              className="icon-btn light small"
              onClick={() => setCelebration(null)}
              style={{ width: "24px", height: "24px", marginLeft: "6px" }}
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
function Team() {
  const [members, setMembers] = useState([
    { id: 1, name: "Rahul Verma", role: "Head Chef", status: "Active Shift", avatar: "RV" },
    { id: 2, name: "Sneha Iyer", role: "Manager", status: "Off Duty", avatar: "SI" },
    { id: 3, name: "Karan Singh", role: "Delivery Rider", status: "On Delivery", avatar: "KS" },
    { id: 4, name: "Priya Desai", role: "Cashier", status: "Active Shift", avatar: "PD" },
  ]);
  const [modal, setModal] = useState(false);
  
  return (
    <>
      <Head eyebrow="Workspace" title="Team Management" desc="Manage roles and shifts for your staff." action={<button className="primary-btn" onClick={() => setModal(true)}><Plus size={16} /> Add Member</button>} />
      <div className="team-grid">
        <AnimatePresence>
          {members.map((m, i) => (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} className="team-card panel" key={m.id}>
              <div className="team-avatar-container">
                <div className={`team-avatar ${m.status.replace(/\s+/g, '-').toLowerCase()}`}>{m.avatar}</div>
                <div className={`status-dot ${m.status.replace(/\s+/g, '-').toLowerCase()}`} title={m.status}></div>
              </div>
              <div className="team-info">
                <h3>{m.name}</h3>
                <span className="team-role">{m.role}</span>
              </div>
              <div className="team-actions">
                <button className="icon-btn"><Edit3 size={16}/></button>
                <button className="icon-btn delete-btn"><Trash2 size={16}/></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setModal(false)}>
            <motion.div className="modal" initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18} /></button>
              <span className="eyebrow">Staff</span>
              <h2>Add Team Member</h2>
              <div className="add-member-form">
                <input placeholder="Full Name" className="modal-input" />
                <select className="modal-input">
                  <option>Manager</option>
                  <option>Head Chef</option>
                  <option>Cashier</option>
                  <option>Delivery Rider</option>
                </select>
                <button className="primary-btn full" onClick={() => setModal(false)}><Check size={16} /> Save Member</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Analytics() { 
  const stats = [
    { text: "Gross sales", value: "₹1,24,860", change: "18.2% vs last month", Icon: DollarSign, accent: "green" },
    { text: "Total orders", value: "286", change: "11.6% vs last month", Icon: ShoppingBag, accent: "amber" },
    { text: "Repeat customers", value: "42.8%", change: "6.4% vs last month", Icon: UserRound, accent: "blue" },
    { text: "Rating", value: "4.8 / 5", change: "0.2 vs last month", Icon: Sparkles, accent: "coral" }
  ];

  return (
    <>
      <Head eyebrow="Performance" title="Analytics" desc="The signals behind your best service and strongest days." action={<button className="secondary-btn" data-testid="analytics-date-button"><Clock3 size={16} /> Last 30 days</button>} />
      
      <div className="stats-grid">
        {stats.map((s, i) => (
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: i*0.1}} key={i}>
            <Stat {...s} />
          </motion.div>
        ))}
      </div>

      <div className="analytics-charts">
        <motion.div className="chart-panel panel" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.3}}>
          <div className="chart-header">
            <div>
              <h3>Sales & Orders</h3>
              <p className="text-muted">Last 7 days performance</p>
            </div>
            <span className="chart-legend"><span className="legend-dot sales"></span> Sales <span className="legend-dot orders"></span> Orders</span>
          </div>
          <div className="bar-chart">
             {[40, 60, 35, 80, 50, 90, 70].map((h, i) => (
               <div className="bar-group" key={i}>
                 <motion.div className="bar sales" initial={{height:0}} animate={{height: `${h}%`}} transition={{delay: 0.5 + i*0.05, type: "spring"}}></motion.div>
                 <motion.div className="bar orders" initial={{height:0}} animate={{height: `${h*0.6}%`}} transition={{delay: 0.6 + i*0.05, type: "spring"}}></motion.div>
                 <span className="bar-label">D{i+1}</span>
               </div>
             ))}
          </div>
        </motion.div>

        <motion.div className="chart-panel panel" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: 0.4}}>
          <div className="chart-header">
            <div>
              <h3>Peak Hours Heatmap</h3>
              <p className="text-muted">Busiest hours by day</p>
            </div>
          </div>
          <div className="heatmap-grid">
            {["12 PM", "1 PM", "2 PM", "6 PM", "7 PM", "8 PM", "9 PM"].map(time => (
              <div className="heatmap-col" key={time}>
                 <span className="heatmap-label">{time}</span>
                 {[...Array(5)].map((_, i) => {
                   const intensity = Math.random();
                   return <motion.div key={i} className="heatmap-cell" initial={{opacity: 0, scale: 0.5}} animate={{opacity: intensity + 0.1, scale: 1}} transition={{delay: 0.7 + (i * 0.05)}} style={{backgroundColor: `rgba(var(--coral-rgb), ${intensity})`}} title={`${time} - Day ${i+1}`}></motion.div>
                 })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  ); 
}

function Payouts() { 
  const [expanded, setExpanded] = useState(null);
  const settlements = [
    { id: "SET-8821", date: "Friday, 27 June", amount: "₹28,420", status: "Processing", orders: 84 },
    { id: "SET-8820", date: "Friday, 20 June", amount: "₹31,100", status: "Paid", orders: 92 },
    { id: "SET-8819", date: "Friday, 13 June", amount: "₹26,850", status: "Paid", orders: 78 }
  ];

  return (
    <>
      <Head eyebrow="Workspace" title="Payouts" desc="Your settlements, all in one clear view." action={<button className="primary-btn"><Download size={16} /> Download All</button>} />
      
      <motion.div className="payout-progress panel" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}}>
        <div className="payout-progress-text">
          <h3>Next Settlement</h3>
          <h2>₹28,420</h2>
          <p>Scheduled for <b>Friday, 27 June</b> to Bank Account ending in 4421.</p>
        </div>
        <div className="progress-bar-container">
          <div className="progress-track">
             <motion.div className="progress-fill" initial={{width: "0%"}} animate={{width: "80%"}} transition={{duration: 1.2, delay: 0.2, type: "spring"}}></motion.div>
          </div>
          <div className="progress-labels">
            <span>Cycle Start (21 Jun)</span>
            <span>Payout (27 Jun)</span>
          </div>
        </div>
      </motion.div>

      <div className="ledger-container panel">
        <h3>Settlement History</h3>
        <div className="ledger-list">
          {settlements.map((s, i) => (
             <motion.div className="ledger-item" key={s.id} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i * 0.1}}>
               <div className="ledger-header" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                 <div className="ledger-date">
                   <b>{s.date}</b>
                   <span>{s.id} · {s.orders} orders</span>
                 </div>
                 <div className="ledger-amount">
                   <span className={`status-badge ${s.status.toLowerCase()}`}>{s.status}</span>
                   <b>{s.amount}</b>
                   <motion.div animate={{rotate: expanded === s.id ? 180 : 0}}><ChevronDown size={18}/></motion.div>
                 </div>
               </div>
               <AnimatePresence>
                 {expanded === s.id && (
                   <motion.div className="ledger-details" initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}}>
                      <div className="ledger-row"><span>Gross Sales</span> <span>₹{parseInt(s.amount.replace(/[^0-9]/g, '')) + 2000}</span></div>
                      <div className="ledger-row"><span>Platform Fees</span> <span className="deduction">-₹1,800</span></div>
                      <div className="ledger-row"><span>Taxes</span> <span className="deduction">-₹200</span></div>
                      <div className="ledger-row total"><span>Net Payout</span> <span>{s.amount}</span></div>
                      <button className="secondary-btn download-btn"><FileText size={14}/> Download Invoice</button>
                   </motion.div>
                 )}
               </AnimatePresence>
             </motion.div>
          ))}
        </div>
      </div>
    </>
  ); 
}

function Offers() { 
  const [offers, setOffers] = useState([
    { name: "Lunch Hour Treat", discount: "20% off", window: "12:00 PM – 3:00 PM", active: true, claimed: 142 },
    { name: "Weekend Binge", discount: "₹100 off", window: "Sat-Sun All Day", active: false, claimed: 89 }
  ]); 
  const [modal, setModal] = useState(false); 
  const [name, setName] = useState(""); 
  const [discount, setDiscount] = useState("15"); 
  const [windowTime, setWindowTime] = useState("6:00 PM – 9:00 PM"); 
  const [expandedOffer, setExpandedOffer] = useState(null);

  const save = () => { 
    if (!name.trim()) return; 
    setOffers(p => [{ name: name.trim(), discount: `${discount}% off`, window: windowTime, active: true, claimed: 0 }, ...p]); 
    setName(""); 
    setModal(false); 
  }; 
  
  return (
    <>
      <Head eyebrow="Growth" title="Offers & promotions" desc="Turn quiet hours into your busiest ones." action={<button className="primary-btn" data-testid="offers-primary-button" onClick={() => setModal(true)}><Plus size={16} /> Create offer</button>} />
      <div className="offers-grid">
        <AnimatePresence>
          {offers.map((offer, i) => (
            <motion.div 
              layout
              initial={{opacity:0, scale: 0.9}} 
              animate={{opacity:1, scale: 1}} 
              exit={{opacity:0, scale:0.9}}
              transition={{type:"spring"}}
              className={`offer-card panel ${!offer.active ? 'inactive' : ''}`} 
              key={offer.name} 
              data-testid={`offer-card-${i}`}
              onClick={() => setExpandedOffer(expandedOffer === offer.name ? null : offer.name)}
            >
              <div className="offer-icon"><Tag size={20} /></div>
              <div className="offer-copy">
                <span className={`offer-live ${!offer.active ? 'draft' : ''}`}>{offer.active ? "Active now" : "Draft / Ended"}</span>
                <h2>{offer.name}</h2>
                <p>{offer.discount} · {offer.window}</p>
              </div>
              <button className="icon-btn light" data-testid={`offer-menu-${i}`}><MoreHorizontal size={17} /></button>
              
              <AnimatePresence>
                {expandedOffer === offer.name ? (
                  <motion.div className="offer-expanded-stats" initial={{height:0, opacity:0}} animate={{height:"auto", opacity:1}} exit={{height:0, opacity:0}}>
                    <div className="offer-stat-row">
                       <TrendingUp size={16}/> <b>{offer.claimed}</b> Customers Claimed
                    </div>
                    <button className="secondary-btn full">Edit Offer</button>
                  </motion.div>
                ) : (
                  <motion.div className="offer-preview" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <span>Customer preview</span>
                    <b>{offer.discount}</b>
                    <small>on your next order</small>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-backdrop" data-testid="offer-modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setModal(false)}>
            <motion.div className="modal" initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} onClick={e => e.stopPropagation()}>
              <button className="modal-close" data-testid="close-offer-modal" onClick={() => setModal(false)}><X size={18} /></button>
              <span className="eyebrow">Promotion builder</span>
              <h2>Create an offer</h2>
              <p>Make a simple, time-boxed reason to order.</p>
              
              <div className="offer-form-fields">
                <input value={name} onChange={e => setName(e.target.value)} className="modal-input" data-testid="offer-name-input" placeholder="Offer name (e.g. Lunch Hour Treat)" />
                <label className="modal-label">
                  Discount percentage
                  <input value={discount} onChange={e => setDiscount(e.target.value)} className="modal-input" data-testid="offer-discount-input" />
                </label>
                <label className="modal-label">
                  Active window
                  <input value={windowTime} onChange={e => setWindowTime(e.target.value)} className="modal-input" data-testid="offer-window-input" />
                </label>
              </div>
              
              <div className="offer-preview live">
                <span>Preview</span>
                <b>{discount}% off</b>
                <small>{name || "Your offer"} · {windowTime}</small>
              </div>
              <button className="primary-btn full" data-testid="save-offer-button" onClick={save}><Check size={16} /> Publish offer</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  ); 
}
// ─────────────────────────────────────────────────────────────
// KDS (Kitchen Display System) Helpers & Seed Data
// ─────────────────────────────────────────────────────────────
function playKitchenChime(type = "advance") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    if (type === "rush") {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    } else if (type === "ready") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
    }
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

const initialKitchenTickets = [
  {
    id: "#GF-1048",
    name: "Aarav Mehta",
    orderType: "Delivery (UberEats)",
    station: "Pizza Oven",
    placedAt: "12:42 PM",
    totalPrepTime: 18,
    elapsedSeconds: 240,
    status: "New",
    urgency: "normal",
    tableOrRider: "Rider arriving in ~12 mins",
    notes: "⚠️ NO ONIONS · Extra crispy crust please",
    itemsList: [
      { id: "i1", name: "Truffle Mushroom Pizza", qty: 1, variant: "veg", checked: false, note: "Well-done crust, fresh basil" },
      { id: "i2", name: "Garlic Herb Dip", qty: 2, variant: "veg", checked: false, note: "Cold packaging" }
    ],
    recipe: {
      steps: [
        "1. Stretch 250g fermented sourdough base to 11 inches.",
        "2. Spread 80g white truffle bechamel evenly to 1cm of rim.",
        "3. Top with sautéed portobello mushrooms & 120g shredded mozzarella.",
        "4. Bake in stone deck oven at 380°C for 4.5 minutes until blistered.",
        "5. Drizzle 5ml cold-pressed truffle oil and fresh cracked pepper."
      ],
      plating: "Cut into 6 equal slices, box in Kraft thermal box with wax liner."
    }
  },
  {
    id: "#GF-1047",
    name: "Maya Sharma",
    orderType: "Dine-In",
    station: "Grill & Tandoor",
    placedAt: "12:35 PM",
    totalPrepTime: 15,
    elapsedSeconds: 540,
    status: "Preparing",
    urgency: "normal",
    tableOrRider: "Table #04 (Floor 1)",
    notes: "🌶️ Extra spicy marinade & mint chutney on side",
    itemsList: [
      { id: "i3", name: "Paneer Tikka Shashlik Bowl", qty: 2, variant: "veg", checked: true, note: "Char-grilled skewered cubes" },
      { id: "i4", name: "Fresh Mint Lassi", qty: 1, variant: "veg", checked: false, note: "Chilled with crushed ice" }
    ],
    recipe: {
      steps: [
        "1. Skewer 6 cubes malai paneer with bell peppers & red onions.",
        "2. Baste with mustard oil & degi mirch tandoori marinade.",
        "3. Cook in clay tandoor at 320°C for 6-7 minutes with smoke lid.",
        "4. Garnish with chaat masala, lemon juice & fresh coriander."
      ],
      plating: "Serve on sizzling cast iron skillet over charred onion rings."
    }
  },
  {
    id: "#GF-1046",
    name: "Rohan Kapoor",
    orderType: "Counter Pickup",
    station: "Pizza Oven",
    placedAt: "12:28 PM",
    totalPrepTime: 15,
    elapsedSeconds: 840,
    status: "Ready",
    urgency: "normal",
    tableOrRider: "Express Shelf #B2",
    notes: "Pack with extra napkins & wooden cutlery",
    itemsList: [
      { id: "i5", name: "Classic Margherita Pizza", qty: 1, variant: "veg", checked: true, note: "Fior di latte mozzarella & sweet basil" },
      { id: "i6", name: "Herbed Garlic Breadstick", qty: 1, variant: "veg", checked: true, note: "Toasted golden brown" }
    ],
    recipe: {
      steps: [
        "1. Standard 10-inch margherita with San Marzano tomato passata.",
        "2. Top with fresh buffalo mozzarella rounds.",
        "3. Bake 4 minutes until bubbling and golden crust."
      ],
      plating: "Sealed with GreenFork security tamper tape."
    }
  },
  {
    id: "#GF-1045",
    name: "Isha Nair",
    orderType: "Delivery (Direct)",
    station: "Curry & Bowls",
    placedAt: "12:20 PM",
    totalPrepTime: 20,
    elapsedSeconds: 110,
    status: "New",
    urgency: "rush",
    tableOrRider: "Fleet Express Driver Assigned",
    notes: "🌿 100% Gluten-free preparation required",
    itemsList: [
      { id: "i7", name: "Thai Green Curry w/ Jasmine Rice", qty: 1, variant: "veg", checked: false, note: "Coconut milk, galangal, kaffir lime" },
      { id: "i8", name: "Steamed Edamame Pods", qty: 1, variant: "veg", checked: false, note: "Sea salt flakes" }
    ],
    recipe: {
      steps: [
        "1. Sauté green curry paste in coconut cream until fragrant.",
        "2. Add baby corn, bamboo shoots, Thai eggplants & kaffir leaves.",
        "3. Simmer with light palm sugar & tamari sauce for 5 mins.",
        "4. Steam fragrant jasmine rice in individual bamboo container."
      ],
      plating: "Double-seal leakproof bowl with steam vent label."
    }
  }
];

// ─────────────────────────────────────────────────────────────
// Kitchen Display System (KDS)
// ─────────────────────────────────────────────────────────────
function Kitchen() {
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem("gf_kitchen_tickets");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialKitchenTickets;
  });

  const [stationFilter, setStationFilter] = useState("All");
  const [rushMode, setRushMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeRecipeTicket, setActiveRecipeTicket] = useState(null);
  const [celebrationToast, setCelebrationToast] = useState(null);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem("gf_kitchen_tickets", JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.status === "Preparing" || t.status === "New") {
            const nextElapsed = (t.elapsedSeconds || 0) + 1;
            const remainingMins = Math.max(0, t.totalPrepTime - Math.floor(nextElapsed / 60));
            const urgency = remainingMins <= 3 ? "urgent" : (t.urgency === "rush" ? "rush" : "normal");
            return { ...t, elapsedSeconds: nextElapsed, urgency };
          }
          return t;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Advance ticket status
  const advance = (t) => {
    let nextStatus = "Preparing";
    if (t.status === "New") {
      nextStatus = "Preparing";
      if (soundEnabled) playKitchenChime("advance");
    } else if (t.status === "Preparing") {
      nextStatus = "Ready";
      if (soundEnabled) playKitchenChime("ready");
    } else if (t.status === "Ready") {
      if (soundEnabled) playKitchenChime("ready");
      setTickets((prev) => prev.filter((x) => x.id !== t.id));
      setCelebrationToast({ title: `Order ${t.id} Dispatched! 🚀`, desc: `${t.name}'s items handed off.` });
      setTimeout(() => setCelebrationToast(null), 3500);
      logActivity("marked_picked_up", t.id, t.name);
      return;
    }

    setTickets((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: nextStatus } : x))
    );
    const action = nextStatus === "Preparing" ? "started_prep" : "marked_ready";
    logActivity(action, t.id, t.name);
  };

  // Toggle item checkbox inside ticket
  const toggleItemCheck = (ticketId, itemId, e) => {
    e.stopPropagation();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const updatedList = t.itemsList.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        return { ...t, itemsList: updatedList };
      })
    );
  };

  // Extend turnaround time (+5m or +10m)
  const extendTime = (ticketId, minutes, e) => {
    e.stopPropagation();
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, totalPrepTime: t.totalPrepTime + minutes, urgency: "normal" }
          : t
      )
    );
  };

  // Fire a new simulated order into the kitchen
  const handleFireTestOrder = () => {
    const randomId = `#GF-${Math.floor(1000 + Math.random() * 9000)}`;
    const sampleDishes = [
      { name: "Crispy Peri Peri Wings", station: "Grill & Tandoor", time: 18, variant: "non-veg", note: "Fiery glaze, extra ranch" },
      { name: "Smoky BBQ Chicken Pizza", station: "Pizza Oven", time: 22, variant: "non-veg", note: "Jalapeño kick" },
      { name: "Paneer Tikka Power Bowl", station: "Curry & Bowls", time: 15, variant: "veg", note: "Tahini dressing" },
      { name: "Chocolate Lava Cake", station: "Beverages & Desserts", time: 10, variant: "veg", note: "Warm molten center" }
    ];
    const dish = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
    const newTicket = {
      id: randomId,
      name: ["Kabir Sethi", "Simran Kaur", "Dev Patel", "Ananya Roy"][Math.floor(Math.random() * 4)],
      orderType: Math.random() > 0.5 ? "Delivery (Swiggy)" : "Dine-In Table 02",
      station: dish.station,
      placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalPrepTime: dish.time,
      elapsedSeconds: 0,
      status: "New",
      urgency: rushMode ? "rush" : "normal",
      tableOrRider: "Priority ticket",
      notes: "Fresh order straight from live counter",
      itemsList: [
        { id: `i_${Date.now()}_1`, name: dish.name, qty: 1, variant: dish.variant, checked: false, note: dish.note }
      ],
      recipe: {
        steps: [
          `1. Prepare station for ${dish.name}.`,
          "2. Follow standard temperature & seasoning protocol.",
          "3. Quality check and seal in thermal packaging."
        ],
        plating: "Fresh hot plating with garnish."
      }
    };
    setTickets((prev) => [newTicket, ...prev]);
    if (soundEnabled) playKitchenChime("rush");
  };

  // Filtered by station
  const filteredTickets = useMemo(() => {
    if (stationFilter === "All") return tickets;
    return tickets.filter((t) => t.station === stationFilter);
  }, [tickets, stationFilter]);

  const newCount = filteredTickets.filter((t) => t.status === "New").length;
  const preparingCount = filteredTickets.filter((t) => t.status === "Preparing").length;
  const readyCount = filteredTickets.filter((t) => t.status === "Ready").length;

  return (
    <>
      <Head
        eyebrow="Kitchen Operations"
        title="Kitchen Display System (KDS)"
        desc="Real-time cooking queue, station dispatching, recipe checklists, and live turnaround timers."
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Rush Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              className={`rush-mode-btn ${rushMode ? "active" : ""}`}
              onClick={() => {
                const next = !rushMode;
                setRushMode(next);
                if (next && soundEnabled) playKitchenChime("rush");
              }}
              title="Toggle Kitchen Rush Mode"
            >
              <Flame size={16} className={rushMode ? "flame-pulse" : ""} />
              <span>{rushMode ? "🔥 Rush Mode ON" : "Rush Mode"}</span>
            </motion.button>

            {/* Audio Toggle */}
            <button
              className="secondary-btn icon-only"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Sound alerts enabled" : "Sound alerts muted"}
              style={{ width: "38px", height: "38px", padding: 0 }}
            >
              {soundEnabled ? <Volume2 size={16} color="var(--green)" /> : <VolumeX size={16} color="var(--muted)" />}
            </button>

            {/* Fire New Test Ticket */}
            <button
              className="primary-btn"
              onClick={handleFireTestOrder}
              data-testid="fire-kitchen-order-btn"
            >
              <Plus size={16} /> Fire ticket
            </button>
          </div>
        }
      />

      {/* Kitchen HUD Summary Bar */}
      <div className="kitchen-hud-bar">
        <div className="hud-metric">
          <div className="hud-metric-icon amber"><Flame size={18} /></div>
          <div>
            <b>{newCount}</b>
            <span>New tickets</span>
          </div>
        </div>
        <div className="hud-metric">
          <div className="hud-metric-icon green"><ChefHat size={18} /></div>
          <div>
            <b>{preparingCount}</b>
            <span>Currently cooking</span>
          </div>
        </div>
        <div className="hud-metric">
          <div className="hud-metric-icon blue"><CheckCircle2 size={18} /></div>
          <div>
            <b>{readyCount}</b>
            <span>Ready for handoff</span>
          </div>
        </div>
        <div className="hud-metric">
          <div className="hud-metric-icon purple"><Timer size={18} /></div>
          <div>
            <b>14.2 min</b>
            <span>Avg turnaround today</span>
          </div>
        </div>
      </div>

      {/* Station Filters */}
      <div className="kitchen-station-bar">
        <HorizontalScroller>
          {["All", "Pizza Oven", "Grill & Tandoor", "Curry & Bowls", "Beverages & Desserts"].map((st) => (
            <button
              key={st}
              className={`station-chip ${stationFilter === st ? "active" : ""}`}
              onClick={() => setStationFilter(st)}
              data-testid={`station-filter-${st.toLowerCase().replaceAll(" ", "-")}`}
            >
              {st === "All" && "🍳 "}
              {st === "Pizza Oven" && "🍕 "}
              {st === "Grill & Tandoor" && "🍢 "}
              {st === "Curry & Bowls" && "🍛 "}
              {st === "Beverages & Desserts" && "🥤 "}
              {st} ({st === "All" ? tickets.length : tickets.filter(t => t.station === st).length})
            </button>
          ))}
        </HorizontalScroller>
      </div>

      {/* 3-Column Kanban Board */}
      <div className="kds-board">
        {["New", "Preparing", "Ready"].map((col) => {
          const colTickets = filteredTickets.filter((t) => t.status === col);
          const colTheme = col === "New" ? "col-amber" : col === "Preparing" ? "col-green" : "col-blue";

          return (
            <div className={`kds-column ${colTheme}`} key={col}>
              <div className="kds-column-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`kds-col-dot ${col.toLowerCase()}`} />
                  <h2>{col === "New" ? "Incoming Orders" : col === "Preparing" ? "On the Line (Cooking)" : "Ready for Pickup"}</h2>
                </div>
                <span className="kds-col-count">{colTickets.length}</span>
              </div>

              <div className="kds-ticket-list">
                <AnimatePresence mode="popLayout">
                  {colTickets.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="kds-empty-col"
                    >
                      <span>No tickets in {col.toLowerCase()}</span>
                    </motion.div>
                  ) : (
                    colTickets.map((ticket) => {
                      const totalSec = ticket.totalPrepTime * 60;
                      const elapsed = ticket.elapsedSeconds || 0;
                      const remainingSec = Math.max(0, totalSec - elapsed);
                      const remMin = Math.floor(remainingSec / 60);
                      const remSec = remainingSec % 60;
                      const progressPct = Math.min(100, Math.round((elapsed / totalSec) * 100));
                      const isUrgent = remMin < 3 || ticket.urgency === "urgent";

                      return (
                        <motion.div
                          layout
                          key={ticket.id}
                          initial={{ opacity: 0, scale: 0.92, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.88, x: col === "Ready" ? 80 : 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className={`kds-ticket-card ${ticket.status.toLowerCase()} ${isUrgent ? "urgent-pulse" : ""}`}
                          data-testid={`kds-ticket-${ticket.id.slice(1)}`}
                        >
                          {/* Ticket Top Header */}
                          <div className="kds-ticket-head">
                            <div className="ticket-badge-row">
                              <b className="ticket-id-tag">{ticket.id}</b>
                              <span className="ticket-station-tag">{ticket.station}</span>
                              <span className="ticket-type-tag">{ticket.orderType}</span>
                            </div>

                            {/* Live Countdown & Timer */}
                            <div className={`ticket-timer-pill ${isUrgent ? "urgent" : ""}`}>
                              <Clock3 size={13} />
                              <b>{remMin}:{remSec < 10 ? `0${remSec}` : remSec}</b>
                            </div>
                          </div>

                          {/* Progress Line */}
                          <div className="ticket-progress-track">
                            <motion.div
                              className="ticket-progress-fill"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Customer & Location Details */}
                          <div className="ticket-customer-row">
                            <strong>{ticket.name}</strong>
                            <span>{ticket.tableOrRider}</span>
                          </div>

                          {/* Special Allergen / Chef Notes */}
                          {ticket.notes && (
                            <div className="ticket-notes-callout">
                              {ticket.notes}
                            </div>
                          )}

                          {/* Interactive Checklist of Dishes */}
                          <div className="ticket-items-checklist">
                            {ticket.itemsList?.map((item) => (
                              <div
                                key={item.id}
                                className={`ticket-item-row ${item.checked ? "checked" : ""}`}
                                onClick={(e) => toggleItemCheck(ticket.id, item.id, e)}
                                title="Click to mark as cooked / packed"
                              >
                                <button type="button" className="item-checkbox">
                                  {item.checked ? <CheckSquare size={16} color="var(--green)" /> : <Square size={16} color="var(--muted)" />}
                                </button>
                                <div className="item-text-info">
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <DietaryBadge dietary={item.variant} />
                                    <b>{item.qty} × {item.name}</b>
                                  </div>
                                  {item.note && <small>{item.note}</small>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Time Extension & Quick Recipe buttons */}
                          <div className="ticket-quick-tools">
                            <button
                              type="button"
                              className="kds-tool-btn"
                              onClick={(e) => extendTime(ticket.id, 5, e)}
                              title="Add 5 mins kitchen delay"
                            >
                              +5m delay
                            </button>
                            <button
                              type="button"
                              className="kds-tool-btn"
                              onClick={(e) => setActiveRecipeTicket(ticket)}
                              title="View Chef Recipe Sheet & Plating instructions"
                            >
                              <Utensils size={12} /> Recipe & notes
                            </button>
                          </div>

                          {/* Advance Action Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className={`kds-advance-btn ${ticket.status.toLowerCase()}`}
                            onClick={() => advance(ticket)}
                            data-testid={`kds-advance-${ticket.id.slice(1)}`}
                          >
                            {col === "New" && <><span>Start Cooking</span> <ChefHat size={16} /></>}
                            {col === "Preparing" && <><span>Mark Ready for Pickup</span> <Bell size={16} /></>}
                            {col === "Ready" && <><span>Hand off to Driver / Guest</span> <Check size={16} /></>}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe & Plating Instructions Modal */}
      <AnimatePresence>
        {activeRecipeTicket && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveRecipeTicket(null)}
            style={{ zIndex: 9999 }}
          >
            <motion.div
              className="modal kds-recipe-dialog"
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setActiveRecipeTicket(null)}>
                <X size={18} />
              </button>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                <span className="eyebrow">Station Recipe Sheet</span>
                <span className="ticket-station-tag">{activeRecipeTicket.station}</span>
              </div>
              <h2>{activeRecipeTicket.id} — {activeRecipeTicket.name}</h2>
              <p>{activeRecipeTicket.orderType} · Placed at {activeRecipeTicket.placedAt}</p>

              <div className="recipe-section">
                <h3>Dishes on this ticket:</h3>
                <ul>
                  {activeRecipeTicket.itemsList.map(it => (
                    <li key={it.id}>
                      <b>{it.qty} × {it.name}</b> {it.note && <span>({it.note})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              {activeRecipeTicket.recipe?.steps && (
                <div className="recipe-section">
                  <h3>Chef Cooking Steps:</h3>
                  <ol>
                    {activeRecipeTicket.recipe.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {activeRecipeTicket.recipe?.plating && (
                <div className="recipe-section plating-note">
                  <b>Plating & Packaging:</b>
                  <p>{activeRecipeTicket.recipe.plating}</p>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  className="secondary-btn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer size={15} /> Print KOT ticket
                </button>
                <button
                  className="primary-btn"
                  style={{ flex: 1 }}
                  onClick={() => setActiveRecipeTicket(null)}
                >
                  <Check size={16} /> Done reading
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Kitchen Celebration Toast */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            className="celebration-toast"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <div className="celebration-icon">
              <Sparkles size={18} />
            </div>
            <div className="celebration-info">
              <strong>{celebrationToast.title}</strong>
              <span>{celebrationToast.desc}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Settings page — real logo upload
// ─────────────────────────────────────────────────────────────
function SettingsPage({ user, onLogoChange, onLogout }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const logo = logoSrc(user.logo_url);

  const onPick = (file) => {
    setError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) { setError("Please choose a PNG, JPG or WebP image."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2 MB."); return; }
    setPreview({ file, url: URL.createObjectURL(file) });
  };
  const upload = async () => {
    if (!preview || uploading) return;
    setUploading(true); setError("");
    try {
      if (API) {
        const fd = new FormData();
        fd.append("file", preview.file);
        const res = await apiFetch(`${API}/api/restaurant/logo`, { method: "POST", body: fd });
        if (res && res.ok) {
          URL.revokeObjectURL(preview.url); setPreview(null);
          await onLogoChange();
          return;
        }
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        const localUser = localStorage.getItem("gf_user");
        let uObj = {};
        if (localUser) {
          try { uObj = JSON.parse(localUser); } catch {}
        }
        uObj = { ...uObj, logo_url: dataUrl };
        localStorage.setItem("gf_user", JSON.stringify(uObj));
        URL.revokeObjectURL(preview.url);
        setPreview(null);
        await onLogoChange();
      };
      reader.readAsDataURL(preview.file);
    } catch (e) {
      setError("Failed to upload logo. Please try again.");
    } finally { setUploading(false); }
  };
  const removeLogo = async () => {
    if (!window.confirm("Remove the current logo?")) return;
    setUploading(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/restaurant/logo`, { method: "DELETE" });
        if (r && r.ok) { await onLogoChange(); return; }
      }
      const localUser = localStorage.getItem("gf_user");
      if (localUser) {
        try {
          const uObj = JSON.parse(localUser);
          delete uObj.logo_url;
          localStorage.setItem("gf_user", JSON.stringify(uObj));
        } catch {}
      }
      await onLogoChange();
    } finally { setUploading(false); }
  };

  return <>
    <Head eyebrow="Workspace" title="Restaurant settings" desc="Update how your workspace looks to your team and your customers." />
    <section className="panel" data-testid="settings-logo-panel">
      <div className="panel-head"><div><h2>Restaurant logo</h2><span>Shown in the sidebar, header and staff sign-in. PNG, JPG or WebP · up to 2 MB.</span></div></div>
      <div className="logo-editor">
        <div className="logo-current" data-testid="logo-current-preview">
          {preview ? <img src={preview.url} alt="new logo preview" /> :
            logo ? <img src={logo} alt="current logo" data-testid="settings-current-logo" /> :
            <div className="logo-placeholder"><ImageIcon size={28} /><span>No logo yet</span></div>}
        </div>
        <div className="logo-actions">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={e => onPick(e.target.files?.[0])} data-testid="logo-file-input" />
          <button className="secondary-btn" onClick={() => fileRef.current?.click()} data-testid="pick-logo-button"><Upload size={15} /> {preview ? "Choose another" : logo ? "Replace logo" : "Choose image"}</button>
          {preview && <button className="primary-btn" onClick={upload} disabled={uploading} data-testid="save-logo-button"><Check size={15} /> {uploading ? "Uploading…" : "Save logo"}</button>}
          {logo && !preview && <button className="secondary-btn danger" onClick={removeLogo} disabled={uploading} data-testid="remove-logo-button"><Trash2 size={14} /> Remove</button>}
          {error && <div className="form-error" data-testid="logo-error">{error}</div>}
          <p className="settings-note">Recommended: square 512×512, transparent background.</p>
        </div>
      </div>
    </section>
    <section className="panel" data-testid="settings-profile-panel">
      <div className="panel-head"><div><h2>Profile & Account</h2><span>Manage your personal details and active session.</span></div></div>
      <div className="settings-info" style={{borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px'}}>
        <div><span>Owner Name</span><b>{user.name}</b></div>
      </div>
      <div className="settings-info">
        <div><span>Account Access</span><b>Owner privileges</b></div>
        <button className="secondary-btn danger" onClick={onLogout} style={{alignSelf: 'flex-start'}}><LogOut size={16} /> Sign out</button>
      </div>
    </section>
    <section className="panel" data-testid="settings-info-panel">
      <div className="panel-head"><div><h2>Business details</h2><span>You can edit name and city here in a future update.</span></div></div>
      <div className="settings-info"><div><span>Restaurant</span><b>{user.restaurant_name}</b></div></div>
    </section>
  </>;
}

// ─────────────────────────────────────────────────────────────
// One-time PIN reveal modal
// ─────────────────────────────────────────────────────────────
function PinRevealModal({ name, role, pin, onClose }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(pin); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {} };
  return <div className="modal-backdrop" data-testid="pin-reveal-modal">
    <div className="modal pin-modal">
      <button className="modal-close" onClick={onClose} data-testid="pin-modal-close"><X size={18} /></button>
      <span className="eyebrow">One-time PIN</span>
      <h2>Share this PIN with {name}</h2>
      <p>{roleLabel[role]} PIN — you'll only see it once. Copy it now and rotate any time.</p>
      <div className="pin-reveal" data-testid="pin-reveal-value">{pin}</div>
      <button className="secondary-btn full" onClick={copy} data-testid="pin-reveal-copy"><Copy size={14} /> {copied ? "Copied" : "Copy PIN"}</button>
      <button className="primary-btn full" onClick={onClose} data-testid="pin-reveal-ack"><Check size={16} /> I've saved it</button>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// Team page (owner only) — with Active Sessions section
// ─────────────────────────────────────────────────────────────
const DEFAULT_RESTAURANT = {
  restaurant_name: "GreenFork Kitchen",
  code: "GF-8821",
  members: [
    { member_id: "m1", name: "Aarav Mehta", role: "owner", created_at: new Date(Date.now() - 864000000).toISOString(), last_used_at: new Date().toISOString() },
    { member_id: "m2", name: "Rohan Varma", role: "employee", created_at: new Date(Date.now() - 432000000).toISOString(), last_used_at: new Date(Date.now() - 3600000).toISOString() },
    { member_id: "m3", name: "Kavita Sharma", role: "kitchen", created_at: new Date(Date.now() - 216000000).toISOString(), last_used_at: new Date(Date.now() - 7200000).toISOString() }
  ]
};

const DEFAULT_SESSIONS = [
  { id: "s1", actor_name: "Aarav Mehta", role: "owner", device: "Chrome / Windows", ip: "192.168.1.10", created_at: new Date(Date.now() - 7200000).toISOString(), last_seen: new Date().toISOString(), is_current: true },
  { id: "s2", actor_name: "Rohan Varma", role: "employee", device: "iPhone", ip: "192.168.1.24", created_at: new Date(Date.now() - 3600000).toISOString(), last_seen: new Date(Date.now() - 1800000).toISOString(), is_current: false }
];

function TeamPage() {
  const [rest, setRest] = useState(DEFAULT_RESTAURANT);
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);
  const [loading, setLoading] = useState(false);
  const [addRole, setAddRole] = useState("employee");
  const [addName, setAddName] = useState("");
  const [reveal, setReveal] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      if (API) {
        const [r, s] = await Promise.all([
          apiFetch(`${API}/api/restaurant`),
          apiFetch(`${API}/api/sessions`),
        ]);
        if (r && r.ok) setRest(await r.json());
        else setRest(prev => prev || DEFAULT_RESTAURANT);
        if (s && s.ok) { const j = await s.json(); setSessions(j.sessions || []); }
        else setSessions(prev => prev?.length ? prev : DEFAULT_SESSIONS);
      } else {
        setRest(prev => prev || DEFAULT_RESTAURANT);
        setSessions(prev => prev?.length ? prev : DEFAULT_SESSIONS);
      }
    } catch {
      setRest(prev => prev || DEFAULT_RESTAURANT);
      setSessions(prev => prev?.length ? prev : DEFAULT_SESSIONS);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const addMember = async () => {
    if (!addName.trim() || busy) return; setBusy(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/team`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: addName.trim(), role: addRole }) });
        if (r && r.ok) { const data = await r.json(); setAddName(""); setReveal({ name: data.member.name, role: data.member.role, pin: data.pin }); loadAll(); return; }
      }
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newMember = { member_id: `m_${Date.now()}`, name: addName.trim(), role: addRole, created_at: new Date().toISOString() };
      setRest(prev => ({ ...prev, members: [...(prev?.members || []), newMember] }));
      setReveal({ name: newMember.name, role: newMember.role, pin: newPin });
      setAddName("");
    } finally { setBusy(false); }
  };
  const rotate = async (m) => {
    if (busy) return; setBusy(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/team/${m.member_id}/rotate-pin`, { method: "POST" });
        if (r && r.ok) { const data = await r.json(); setReveal({ name: m.name, role: m.role, pin: data.pin }); loadAll(); return; }
      }
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      setReveal({ name: m.name, role: m.role, pin: newPin });
    } finally { setBusy(false); }
  };
  const remove = async (m) => {
    if (busy || !window.confirm(`Remove ${m.name} from the team? Their sessions will be revoked.`)) return;
    setBusy(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/team/${m.member_id}`, { method: "DELETE" });
        if (r && r.ok) { loadAll(); return; }
      }
      setRest(prev => ({ ...prev, members: (prev?.members || []).filter(mem => mem.member_id !== m.member_id) }));
    } finally { setBusy(false); }
  };
  const revoke = async (s) => {
    if (busy || !window.confirm(`Sign out ${s.actor_name}'s ${s.device} session?`)) return;
    setBusy(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/sessions/${s.id}`, { method: "DELETE" });
        if (r && r.ok) { loadAll(); return; }
      }
      setSessions(prev => prev.filter(sess => sess.id !== s.id));
    } finally { setBusy(false); }
  };
  const revokeOthers = async () => {
    if (busy || !window.confirm("Sign out every other logged-in user in this restaurant?")) return;
    setBusy(true);
    try {
      if (API) {
        const r = await apiFetch(`${API}/api/sessions/revoke-others`, { method: "POST" });
        if (r && r.ok) { loadAll(); return; }
      }
      setSessions(prev => prev.filter(sess => sess.is_current));
    } finally { setBusy(false); }
  };
  const copyCode = async () => { try { await navigator.clipboard.writeText(rest?.code || "GF-8821"); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1200); } catch {} };

  if (loading || !rest) return <div className="empty-workspace panel" data-testid="team-loading"><div className="empty-icon"><UserRound /></div><h2>Loading team…</h2></div>;
  const employees = rest.members.filter(m => m.role === "employee");
  const kitchen = rest.members.filter(m => m.role === "kitchen");
  const otherActiveCount = sessions.filter(s => !s.is_current).length;

  return <>
    <Head eyebrow="Team" title="Staff & access" desc="Add people, share their PIN, and manage every active session." />

    <section className="panel access-panel" data-testid="access-panel">
      <div className="panel-head"><div><h2>Restaurant code</h2><span>Staff enter this before their PIN on the Staff sign-in page.</span></div></div>
      <div className="code-row"><div className="access-value" data-testid="restaurant-code">{rest.code}</div><button className="secondary-btn" onClick={copyCode} data-testid="copy-code-button"><Copy size={14} /> {copiedCode ? "Copied" : "Copy code"}</button></div>
      <p className="access-note"><Shield size={13} /> PINs are stored hashed. Each PIN is shown once — when the member is added or rotated.</p>
    </section>

    <section className="panel team-panel" data-testid="team-panel">
      <div className="panel-head"><div><h2>Team members</h2><span>{rest.members.length} on this workspace</span></div></div>
      <div className="team-add">
        <select value={addRole} onChange={e => setAddRole(e.target.value)} data-testid="team-add-role"><option value="employee">Employee</option><option value="kitchen">Kitchen crew</option></select>
        <input placeholder="Full name" value={addName} onChange={e => setAddName(e.target.value)} data-testid="team-add-name" onKeyDown={e => { if (e.key === "Enter") addMember(); }} />
        <button className="primary-btn" onClick={addMember} data-testid="team-add-button" disabled={busy}><UserPlus size={15} /> Add member</button>
      </div>
      <div className="team-lists">
        {[["Employees", employees], ["Kitchen crew", kitchen]].map(([label, list]) => <div key={label} className="team-list">
          <h3>{label} <span>{list.length}</span></h3>
          {list.length === 0 && <div className="team-empty">No {label.toLowerCase()} yet. Add one above.</div>}
          {list.map(m => <div className="team-row" key={m.member_id} data-testid={`team-member-${m.member_id}`}>
            <div className="team-avatar">{initialsOf(m.name)}</div>
            <div className="team-info"><b>{m.name}</b><span>{roleLabel[m.role]} · added {timeAgo(m.created_at)} ago{m.last_used_at ? ` · last active ${timeAgo(m.last_used_at)} ago` : " · never signed in"}</span></div>
            <button className="secondary-btn small" onClick={() => rotate(m)} data-testid={`rotate-pin-${m.member_id}`} disabled={busy}><RefreshCw size={13} /> Rotate PIN</button>
            <button className="icon-btn light" onClick={() => remove(m)} data-testid={`remove-member-${m.member_id}`} aria-label={`Remove ${m.name}`} disabled={busy}><Trash2 size={15} /></button>
          </div>)}
        </div>)}
      </div>
    </section>

    <section className="panel sessions-panel" data-testid="sessions-panel">
      <div className="panel-head"><div><h2>Active sessions</h2><span>{sessions.length} signed in · you can revoke any device.</span></div>
        <div className="sessions-head-actions">
          <button className="secondary-btn small" onClick={loadAll} data-testid="refresh-sessions-button" disabled={busy}><RefreshCw size={13} /> Refresh</button>
          {otherActiveCount > 0 && <button className="secondary-btn small danger" onClick={revokeOthers} data-testid="revoke-others-button" disabled={busy}><LogOut size={13} /> Sign out {otherActiveCount} other{otherActiveCount === 1 ? "" : "s"}</button>}
        </div>
      </div>
      {sessions.length === 0 && <div className="team-empty">No active sessions yet.</div>}
      {sessions.map(s => <div className="session-row" key={s.id} data-testid={`session-${s.id}`}>
        <div className={`session-icon role-${s.role}`}>{["iPhone", "Android", "iPad"].includes(s.device) ? <Smartphone size={16} /> : <Monitor size={16} />}</div>
        <div className="session-info">
          <b>{s.actor_name} <em>({roleLabel[s.role]})</em>{s.is_current && <span className="you-tag">This device</span>}</b>
          <span>{s.device}{s.ip ? ` · ${s.ip}` : ""} · signed in {timeAgo(s.created_at)} ago · last active {timeAgo(s.last_seen)} ago</span>
        </div>
        {!s.is_current && <button className="secondary-btn small danger" onClick={() => revoke(s)} data-testid={`revoke-session-${s.id}`} disabled={busy}><LogOut size={13} /> Revoke</button>}
      </div>)}
    </section>

    {reveal && <PinRevealModal {...reveal} onClose={() => setReveal(null)} />}
  </>;
}

// ─────────────────────────────────────────────────────────────
// Owner Feature Hub — real activity from backend
// ─────────────────────────────────────────────────────────────
function FeatureHub({ orderTick }) {
  // Animated metrics dashboard replacing the old toolkit
  return (
    <section className="feature-hub" data-testid="live-pulse-widget">
      <div className="hub-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: 10, height: 10, background: 'var(--coral)', borderRadius: '50%' }} />
          <div>
            <span className="eyebrow">Live Pulse</span>
            <h2>Operations Health</h2>
          </div>
        </div>
        <span className="hub-note">Real-time</span>
      </div>
      <div className="hub-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        
        {/* Metric 1: Kitchen Load */}
        <motion.div className="hub-card" whileHover={{ y: -4 }}>
          <div className="hub-card-head">
            <div><h3>Kitchen Load</h3><p>Current active tickets.</p></div>
            <Activity size={17} color="var(--blue)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 16 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
               {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                 <motion.div key={i} style={{ flex: 1, background: 'var(--blue)', borderRadius: '4px 4px 0 0' }}
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   transition={{ type: "spring", delay: i * 0.1, duration: 1 }}
                 />
               ))}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>84%</div>
          </div>
        </motion.div>

        {/* Metric 2: Delivery Speed */}
        <motion.div className="hub-card" whileHover={{ y: -4 }}>
          <div className="hub-card-head">
            <div><h3>Average Prep Time</h3><p>Time from accept to handoff.</p></div>
            <Clock3 size={17} color="var(--amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
             <div style={{ position: 'relative', width: 60, height: 60 }}>
               <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                 <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                 <motion.circle cx="18" cy="18" r="15" fill="none" stroke="var(--amber)" strokeWidth="4"
                   strokeDasharray="94"
                   initial={{ strokeDashoffset: 94 }}
                   animate={{ strokeDashoffset: 94 - (94 * 0.6) }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   strokeLinecap="round"
                 />
               </svg>
               <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>12m</div>
             </div>
             <div>
               <div style={{ fontSize: 14, color: 'var(--fg)', fontWeight: 600 }}>Optimal speed</div>
               <div style={{ fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}><ArrowUpRight size={14}/> 14% faster than average</div>
             </div>
          </div>
        </motion.div>

        {/* Metric 3: Live Radar */}
        <motion.div className="hub-card" whileHover={{ y: -4 }}>
          <div className="hub-card-head">
            <div><h3>Active Riders</h3><p>Riders en route to store.</p></div>
            <Navigation size={17} color="var(--green)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16, height: 60, position: 'relative' }}>
             <div style={{ width: 60, height: 60, borderRadius: '50%', border: '1px dashed var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Store size={20} color="var(--green)" style={{position: 'relative', zIndex: 2, background: 'white', padding: 2}} />
                
                {/* Radar sweep animation */}
                <motion.div 
                  style={{ position: 'absolute', width: '50%', height: '1px', background: 'var(--green)', left: '50%', transformOrigin: 'left center', zIndex: 1 }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                />

                {/* Rider blips */}
                <motion.div style={{ position: 'absolute', width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', top: 10, left: 10 }} initial={{opacity:0}} animate={{opacity:[0,1,0]}} transition={{repeat: Infinity, duration: 2, delay: 0.5}} />
                <motion.div style={{ position: 'absolute', width: 6, height: 6, background: 'var(--green)', borderRadius: '50%', bottom: 15, right: 10 }} initial={{opacity:0}} animate={{opacity:[0,1,0]}} transition={{repeat: Infinity, duration: 2, delay: 1.2}} />
             </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Auth screens
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
// ─────────────────────────────────────────────────────────────
function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("login"); // "login", "register", "success"
  const [step, setStep] = useState(1); // 1: Owner, 2: Restaurant, 3: KYC
  const [busy, setBusy] = useState(false);

  const startGoogleAuth = () => {
    if (API) {
      const redirectUrl = window.location.origin + "/overview";
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      localStorage.setItem("gf_user", JSON.stringify(MOCK_OWNER));
      navigate("/overview", { replace: true });
      window.location.reload();
    }
  };

  const submitRegistration = (e) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setView("success");
    }, 2000);
  };

  return <div className="login-page">
    <div className="login-visual">
      <div className="visual-brand"><div className="brand-mark"><Store size={19} /></div><b>GreenFork</b></div>
      <AnimatePresence mode="wait">
        {view === "login" ? (
          <motion.div key="visual-login" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="visual-content">
            <div className="visual-copy"><span>PARTNER CONSOLE</span><h1>Good food deserves<br /><em>good tools.</em></h1><p>Everything your kitchen needs to move faster, serve better, and grow with confidence.</p></div>
            <div className="visual-quote">"The calmest part of our rush hour is the partner console."<b>— Restaurant owners on GreenFork</b></div>
          </motion.div>
        ) : (
          <motion.div key="visual-reg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="visual-content">
            <div className="visual-copy"><span>JOIN GREENFORK</span><h1>Start growing your<br /><em>restaurant today.</em></h1><p>Join thousands of restaurants optimizing their operations with GreenFork's powerful KDS and analytics.</p></div>
            <div className="visual-quote">"Setup took less than 5 minutes and we were ready for the lunch rush."<b>— New Partner</b></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    
    <div className="login-form-wrap">
      <AnimatePresence mode="wait">
        {view === "login" ? (
          <motion.div key="form-login" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="login-form">
            <div className="login-mobile-mark"><div className="brand-mark"><Store size={18} /></div><b>GreenFork</b></div>
            <span className="eyebrow">Welcome</span>
            <h2>Sign in as owner</h2>
            <p>One tap to open your restaurant workspace.</p>
            <button className="google-btn" data-testid="google-signin-button" onClick={startGoogleAuth}>
              <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              <span>Continue with Google</span>
            </button>
            <div className="login-divider"><span>or</span></div>
            <button className="secondary-btn full" data-testid="go-staff-login" onClick={() => navigate("/staff-login")}><KeyRound size={16} /> Staff sign-in with PIN</button>
            
            <div className="login-divider"><span>New to GreenFork?</span></div>
            <button className="quiet-btn full" style={{background: '#f3f4f6', color: '#111827'}} onClick={() => setView("register")}>Register your restaurant</button>
            
            <span className="demo-note">Owners sign in with Google · Staff use their personal PIN from the owner</span>
          </motion.div>
        ) : view === "register" ? (
          <motion.div key="form-register" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="login-form registration-form">
            <button className="icon-btn light back-btn" style={{position: 'absolute', top: 24, left: 24}} onClick={() => { if(step===1) setView("login"); else setStep(s=>s-1); }}><ChevronLeft size={20}/></button>
            <div className="step-indicator" style={{textAlign: 'right', fontSize: 13, color: 'var(--muted)', marginBottom: 24, paddingRight: 4}}>Step {step} of 3</div>
            
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <h2 style={{margin: '0 0 4px'}}>Owner Details</h2>
                  <p style={{margin: '0 0 16px', color: 'var(--muted)'}}>Let's start with your contact info.</p>
                  <label className="modal-label">Full Name<input className="modal-input" placeholder="e.g. Rahul Sharma"/></label>
                  <label className="modal-label">Mobile Number<input className="modal-input" placeholder="+91" type="tel"/></label>
                  <label className="modal-label">Email Address<input className="modal-input" placeholder="owner@restaurant.com" type="email"/></label>
                  <button className="primary-btn full" style={{marginTop: 8}} onClick={() => setStep(2)}>Continue <ChevronRight size={16}/></button>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <h2 style={{margin: '0 0 4px'}}>Restaurant Profile</h2>
                  <p style={{margin: '0 0 16px', color: 'var(--muted)'}}>Tell us about your kitchen.</p>
                  <label className="modal-label">Restaurant Name<input className="modal-input" placeholder="e.g. GreenBowl Cafe"/></label>
                  <label className="modal-label">Primary Cuisine<input className="modal-input" placeholder="e.g. North Indian"/></label>
                  <label className="modal-label">Full Address<textarea className="modal-input" rows="2" placeholder="Street, City, PIN"></textarea></label>
                  <button className="primary-btn full" style={{marginTop: 8}} onClick={() => setStep(3)}>Continue <ChevronRight size={16}/></button>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <h2 style={{margin: '0 0 4px'}}>Legal & KYC</h2>
                  <p style={{margin: '0 0 16px', color: 'var(--muted)'}}>Upload docs to enable payouts.</p>
                  <label className="modal-label">FSSAI License Number<input className="modal-input" placeholder="14-digit FSSAI"/></label>
                  <label className="modal-label">GSTIN (Optional)<input className="modal-input" placeholder="27XXXXX..."/></label>
                  <div className="kyc-upload-box">
                    <Upload size={20}/>
                    <span>Upload PAN or Aadhar Card</span>
                    <small>PNG, JPG, PDF up to 5MB</small>
                  </div>
                  <button className="primary-btn full" style={{marginTop: 8}} disabled={busy} onClick={submitRegistration}>{busy ? <RefreshCw className="spin" size={16}/> : <Check size={16}/>} {busy ? "Submitting..." : "Submit Registration"}</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div key="form-success" initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} className="login-form registration-success" style={{textAlign: 'center'}}>
             <div className="success-icon" style={{display: 'inline-flex', marginBottom: 16}}><CheckCircle2 size={48} color="var(--green)"/></div>
             <h2 style={{margin: '0 0 8px'}}>Application Submitted!</h2>
             <p style={{color: 'var(--muted)', marginBottom: 24}}>We are verifying your KYC documents. We'll email you within 24 hours once your account is active.</p>
             <button className="secondary-btn full" style={{justifyContent: 'center'}} onClick={() => { setView("login"); setStep(1); }}>Return to Sign In</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>;
}

function StaffLoginPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState(null);
  const [role, setRole] = useState("employee");
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const doLookup = async (e) => {
    e?.preventDefault(); setError("");
    if (!code.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/staff/lookup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim() }) });
      if (!r.ok) { setError("Restaurant code not found"); return; }
      const data = await r.json();
      setLookup(data);
      const first = (data.employee_members[0] || data.kitchen_members[0]);
      if (first) { setRole(first.role); setMemberId(first.member_id); }
      else setError("This restaurant has no team members yet — ask the owner to add you.");
    } finally { setBusy(false); }
  };
  const doLogin = async (e) => {
    e?.preventDefault(); setError("");
    if (!memberId || !pin) { setError("Pick your name and enter your PIN"); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/staff/login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: code.trim().toUpperCase(), member_id: memberId, pin }) });
      if (!r.ok) { const err = await r.json().catch(() => ({})); setError(err.detail || "Sign-in failed"); return; }
      window.location.href = HOME_ROUTE[role];
    } finally { setBusy(false); }
  };
  const roleMembers = lookup ? (role === "employee" ? lookup.employee_members : lookup.kitchen_members) : [];
  useEffect(() => { if (!lookup) return; const list = role === "employee" ? lookup.employee_members : lookup.kitchen_members; setMemberId(list[0]?.member_id || ""); }, [role, lookup]);
  const logo = lookup ? logoSrc(lookup.logo_url) : null;

  return <div className="login-page">
    <div className="login-visual">
      <div className="visual-brand"><div className="brand-mark"><Store size={19} /></div><b>GreenFork</b></div>
      <div className="visual-copy"><span>STAFF ACCESS</span><h1>Sign in to<br /><em>your shift.</em></h1><p>Enter the restaurant code, then pick your name and enter your personal PIN.</p></div>
      <div className="visual-quote">Every staff member has their own PIN. Rotating one doesn't lock the rest of the team out.<b>— Per-staff access</b></div>
    </div>
    <div className="login-form-wrap">
      <div className="login-form staff-form">
        <div className="login-mobile-mark"><div className="brand-mark"><Store size={18} /></div><b>GreenFork</b></div>
        {logo && <div className="staff-logo" data-testid="staff-login-restaurant-logo"><img src={logo} alt="restaurant logo" /></div>}
        <span className="eyebrow">Staff sign-in</span>
        <h2>{lookup ? lookup.restaurant_name : "Enter restaurant code"}</h2>
        <p>{lookup ? "Pick your role, then your name and PIN." : "Ask the owner for the 6-character code."}</p>

        {!lookup && <form onSubmit={doLookup}>
          <label>Restaurant code<input value={code} onChange={e => setCode(e.target.value.toUpperCase())} data-testid="staff-code-input" placeholder="GF-XXXX" autoFocus /></label>
          {error && <div className="form-error" data-testid="staff-error">{error}</div>}
          <button className="primary-btn login-btn" disabled={busy || !code.trim()} data-testid="staff-code-submit"><span>{busy ? "Checking…" : "Continue"}</span><ChevronRight size={17} /></button>
        </form>}

        {lookup && <form onSubmit={doLogin}>
          <div className="role-tabs">
            <button type="button" className={role === "employee" ? "role-tab active" : "role-tab"} onClick={() => setRole("employee")} data-testid="staff-role-employee">Employee <em>{lookup.employee_members.length}</em></button>
            <button type="button" className={role === "kitchen" ? "role-tab active" : "role-tab"} onClick={() => setRole("kitchen")} data-testid="staff-role-kitchen">Kitchen <em>{lookup.kitchen_members.length}</em></button>
          </div>
          <label>Who are you?
            <select value={memberId} onChange={e => setMemberId(e.target.value)} data-testid="staff-member-select">
              {roleMembers.length === 0 && <option value="">No {role} added yet</option>}
              {roleMembers.map(m => <option key={m.member_id} value={m.member_id}>{m.name}</option>)}
            </select>
          </label>
          <label>Personal PIN
            <div className="pin-input-row">
              <input type={showPin ? "text" : "password"} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} data-testid="staff-pin-input" inputMode="numeric" placeholder="4-6 digit PIN" />
              <button type="button" className="icon-btn light" onClick={() => setShowPin(s => !s)} data-testid="toggle-staff-pin" aria-label={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </label>
          {error && <div className="form-error" data-testid="staff-error">{error}</div>}
          <button className="primary-btn login-btn" disabled={busy || !memberId || !pin} data-testid="staff-login-submit"><span>{busy ? "Signing in…" : "Open workspace"}</span><ChevronRight size={17} /></button>
          <button type="button" className="text-link staff-back" onClick={() => { setLookup(null); setError(""); setPin(""); }} data-testid="staff-change-code">Use a different code</button>
        </form>}

        <button type="button" className="text-link staff-back" onClick={() => navigate("/login")} data-testid="staff-back-owner">← Back to owner sign-in</button>
      </div>
    </div>
  </div>;
}

function OnboardingPage({ onDone, onLogout }) {
  const [ownerName, setOwnerName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!ownerName.trim() || !restaurantName.trim() || !city.trim()) return;
    setBusy(true); setError("");
    try {
      const r = await apiFetch(`${API}/api/onboarding`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ owner_name: ownerName.trim(), restaurant_name: restaurantName.trim(), city: city.trim() }) });
      if (r.status === 403) { const err = await r.json().catch(() => ({})); setError(err.detail || "Your email isn't approved yet."); setBlocked(true); return; }
      if (!r.ok) { const err = await r.json().catch(() => ({})); setError(err.detail || "Something went wrong"); return; }
      onDone();
    } finally { setBusy(false); }
  };
  if (blocked) return <div className="login-page">
    <div className="login-visual"><div className="visual-brand"><div className="brand-mark"><Store size={19} /></div><b>GreenFork</b></div><div className="visual-copy"><span>PENDING APPROVAL</span><h1>Almost there,<br /><em>owner.</em></h1><p>New restaurants join GreenFork by invite. We'll email you when your account is approved.</p></div></div>
    <div className="login-form-wrap"><div className="login-form onboarding-form" data-testid="onboarding-blocked"><div className="blocked-icon"><ShieldAlert size={32} /></div><span className="eyebrow">Access pending</span><h2>Your email isn't approved yet</h2><p>{error}</p><button className="primary-btn login-btn" onClick={onLogout} data-testid="onboarding-logout"><span>Sign out</span><ChevronRight size={17} /></button></div></div>
  </div>;
  return <div className="login-page">
    <div className="login-visual"><div className="visual-brand"><div className="brand-mark"><Store size={19} /></div><b>GreenFork</b></div><div className="visual-copy"><span>SET UP YOUR RESTAURANT</span><h1>Let's get your<br /><em>kitchen live.</em></h1><p>A few details and we'll spin up your workspace, restaurant code, and dashboard.</p></div><div className="visual-quote">You'll add staff and issue their PINs from the Team page. Every PIN is shown once — copy it before you leave.<b>— Setup takes 30 seconds</b></div></div>
    <div className="login-form-wrap"><div className="login-form onboarding-form" data-testid="onboarding-form"><div className="login-mobile-mark"><div className="brand-mark"><Store size={18} /></div><b>GreenFork</b></div><span className="eyebrow">Welcome, owner</span><h2>Set up your restaurant</h2><p>You can edit any of this later from Settings and Team.</p>
      <form onSubmit={submit}>
        <label>Your name<input value={ownerName} onChange={e => setOwnerName(e.target.value)} data-testid="onboarding-owner-name" placeholder="e.g. Ananya Rao" autoFocus /></label>
        <label>Restaurant name<input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} data-testid="onboarding-restaurant-name" placeholder="e.g. Slice & Spice Kitchen" /></label>
        <label>City<input value={city} onChange={e => setCity(e.target.value)} data-testid="onboarding-city" placeholder="e.g. Bengaluru" /></label>
        {error && <div className="form-error">{error}</div>}
        <button className="primary-btn login-btn" disabled={busy} data-testid="onboarding-submit"><span>{busy ? "Setting up…" : "Open my workspace"}</span><ChevronRight size={17} /></button>
      </form>
    </div></div>
  </div>;
}

function AuthCallback({ onAuthed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;
    const fragment = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    const params = new URLSearchParams(fragment);
    const sessionId = params.get("session_id");
    // Strip session_id from address bar immediately
    if (window.location.hash) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    (async () => {
      try {
        if (API) {
          const res = await fetch(`${API}/api/auth/session`, { method: "POST", credentials: "include", headers: { "X-Session-ID": sessionId } });
          if (res.ok) {
            await onAuthed();
            navigate("/overview", { replace: true });
            return;
          }
        }
      } catch (e) {}
      localStorage.setItem("gf_user", JSON.stringify(MOCK_OWNER));
      await onAuthed();
      navigate("/overview", { replace: true });
    })();
  }, [location.hash, navigate, onAuthed]);
  return <div className="login-page"><div className="login-form-wrap"><div className="login-form"><span className="eyebrow">Signing you in</span><h2>{error ? "Something went wrong" : "Just a moment…"}</h2><p>{error || "Securing your session…"}</p>{error && <button className="primary-btn login-btn" data-testid="retry-signin-button" onClick={() => navigate("/login", { replace: true })}><span>Back to sign in</span><ChevronRight size={17} /></button>}</div></div></div>;
}

function Controls() { return null; }

function RoleGate({ user, allow, children }) {
  if (!allow.includes(user.role)) return <Navigate to={HOME_ROUTE[user.role]} replace />;
  return children;
}

// ─────────────────────────────────────────────────────────────
// Global session-expired banner
// ─────────────────────────────────────────────────────────────
function ExpiredBanner({ visible }) {
  if (!visible) return null;
  return <div className="expired-banner" data-testid="session-expired-toast" role="alert">
    <ShieldAlert size={16} /> <span>Your session expired. Redirecting to sign in…</span>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// AppRouter
// ─────────────────────────────────────────────────────────────
function AppRouter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthed, setIsAuthed] = useState(null);
  const [expired, setExpired] = useState(false);
  const [open, setOpen] = useState(true);
  const [connected, setConnected] = useState(true);
  const [latency, setLatency] = useState(350);
  const [orders, setOrders] = useState(() => ordersSeed.map(o => ({ ...o, expiresAt: Date.now() + 45000 })));
  const [orderTick, setOrderTick] = useState(0);
  const addOrder = () => setOrders(p => [{ ...ordersSeed[0], id: `#GF-${1050 + p.length}`, customer: "Test customer", time: "Just now", expiresAt: Date.now() + 45000 }, ...p]);

  useEffect(() => { const timer = setInterval(() => setOrders(p => p.map(o => o.status === "new" && o.expiresAt && o.expiresAt <= Date.now() ? { ...o, status: "rejected" } : o)), 500); return () => clearInterval(timer); }, []);
  useEffect(() => { const timer = setInterval(() => { if (open && connected) addOrder(); }, 45000); return () => clearInterval(timer); }, [open, connected]);
  useEffect(() => { setOrderTick(t => t + 1); }, [orders]);

  const hasCallback = location.hash?.includes("session_id=");

  const fetchMe = useCallback(async () => {
    try {
      if (API) {
        const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const u = await res.json();
          setUser(u); setIsAuthed(true); setAuthKnown(true);
          return u;
        }
      }
    } catch {}
    const localUser = localStorage.getItem("gf_user");
    if (localUser) {
      try {
        const u = JSON.parse(localUser);
        setUser(u); setIsAuthed(true); setAuthKnown(true);
        return u;
      } catch {}
    }
    // Default fallback user for local dev/demo
    localStorage.setItem("gf_user", JSON.stringify(MOCK_OWNER));
    setUser(MOCK_OWNER); setIsAuthed(true); setAuthKnown(true);
    return MOCK_OWNER;
  }, []);

  useEffect(() => { if (hasCallback) return; fetchMe(); }, [hasCallback, fetchMe]);

  useEffect(() => {
    const onExpired = () => {
      setExpired(true);
      setUser(null); setIsAuthed(false);
      setTimeout(() => { setExpired(false); navigate("/login", { replace: true }); }, 1600);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [navigate]);

  const handleLogout = async () => {
    try { if (API) await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" }); } catch {}
    localStorage.removeItem("gf_user");
    setUser(null); setIsAuthed(false); setAuthKnown(false);
    navigate("/login", { replace: true });
  };

  if (hasCallback) return <><ExpiredBanner visible={expired} /><AuthCallback onAuthed={fetchMe} /></>;

  if (isAuthed === null) return <div className="login-page" data-testid="auth-loading"><div className="login-form-wrap"><div className="login-form"><span className="eyebrow">GreenFork</span><h2>Loading your workspace…</h2></div></div></div>;

  if (!isAuthed) {
    return <>
      <ExpiredBanner visible={expired} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/staff-login" element={<StaffLoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>;
  }

  if (user.role === "owner" && user.needs_onboarding) {
    return <><ExpiredBanner visible={expired} /><OnboardingPage onDone={fetchMe} onLogout={handleLogout} /></>;
  }

  const role = user.role;
  const canEdit = role !== "kitchen";
  const isOwner = role === "owner";

  return <>
    <ExpiredBanner visible={expired} />
    <Shell open={open} setOpen={setOpen} connected={connected} orders={orders} user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to={HOME_ROUTE[role]} replace />} />
        <Route path="/login" element={<Navigate to={HOME_ROUTE[role]} replace />} />
        <Route path="/staff-login" element={<Navigate to={HOME_ROUTE[role]} replace />} />
        <Route path="/overview" element={<RoleGate user={user} allow={["owner"]}><Overview open={open} setOpen={setOpen} orders={orders} user={user} /></RoleGate>} />
        <Route path="/orders" element={<RoleGate user={user} allow={["owner", "employee"]}><Orders orders={orders} setOrders={setOrders} /></RoleGate>} />
        <Route path="/menu" element={<RoleGate user={user} allow={["owner", "employee"]}><MenuPage canEdit={canEdit} /></RoleGate>} />
        <Route path="/kitchen" element={<RoleGate user={user} allow={["owner", "kitchen"]}><Kitchen /></RoleGate>} />
        <Route path="/analytics" element={<RoleGate user={user} allow={["owner"]}><Analytics /></RoleGate>} />
        <Route path="/offers" element={<RoleGate user={user} allow={["owner"]}><Offers /></RoleGate>} />
        <Route path="/payouts" element={<RoleGate user={user} allow={["owner"]}><Payouts /></RoleGate>} />
        <Route path="/settings" element={<RoleGate user={user} allow={["owner"]}><SettingsPage user={user} onLogoChange={fetchMe} onLogout={handleLogout} /></RoleGate>} />
        <Route path="/team" element={<RoleGate user={user} allow={["owner"]}><TeamPage /></RoleGate>} />
        <Route path="*" element={<Navigate to={HOME_ROUTE[role]} replace />} />
      </Routes>
    </Shell>
    {isOwner && <>
      <Controls open={open} setOpen={setOpen} connected={connected} setConnected={setConnected} latency={latency} setLatency={setLatency} onFire={addOrder} />
      <FeatureHub orderTick={orderTick} />
    </>}
  </>;
}

function App() { return <BrowserRouter><AppRouter /></BrowserRouter>; }
export default App;
