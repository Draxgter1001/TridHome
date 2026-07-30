import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { fetchNotifications, fetchUnreadCount, markAllRead } from "../../api/notifications";
import { useAuth } from "../../context/AuthContext";

const KIND_TEXT = {
  visit_requested: "Nuova richiesta di visita per",
  visit_approved: "Visita confermata per",
  visit_denied: "Visita rifiutata per",
  verification: "Aggiornamento verifica documenti",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) return;
    const poll = () => fetchUnreadCount().then((d) => setCount(d.count)).catch(() => {});
    poll();
    const t = setInterval(poll, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!user) return null;

  const toggle = async () => {
    if (!open) {
      const d = await fetchNotifications().catch(() => null);
      if (d) setItems(d.results);
      if (count > 0) markAllRead().then(() => setCount(0)).catch(() => {});
    }
    setOpen(!open);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notifiche"
        className="relative text-brand-dark hover:text-brand">
        <FaBell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-brand-mist rounded-2xl shadow-xl p-2 z-50">
          {items.length === 0 && (
            <p className="text-sm text-gray-400 p-3">Nessuna notifica.</p>
          )}
          {items.slice(0, 8).map((n) => (
            <Link key={n.id} to="/visite" onClick={() => setOpen(false)}
              className="block p-3 rounded-xl hover:bg-brand-mist/50">
              <p className="text-sm text-brand-dark">
                {KIND_TEXT[n.kind]}{" "}
                {n.payload.listing_title && (
                  <span className="font-medium">{n.payload.listing_title}</span>
                )}
              </p>
              {n.payload.date && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {n.payload.date} · {n.payload.start_time?.slice(0, 5)}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
