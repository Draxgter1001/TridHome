import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSlots, requestVisit } from "../../api/visits";
import { useAuth } from "../../context/AuthContext";

const fmtDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short", day: "numeric", month: "short",
  });
const fmtTime = (t) => t.slice(0, 5);

/* Buyer side of the spec flow: pick day+time, add a message, send the request. */
export default function BookingCalendar({ listingId, isOwner }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState({ busy: false, sent: false, error: null });

  useEffect(() => {
    fetchSlots(listingId).then((d) => setSlots(d.results)).catch(() => {});
  }, [listingId]);

  if (isOwner) return null;

  const submit = async () => {
    if (!user) return navigate("/login");
    setState({ busy: true, sent: false, error: null });
    try {
      await requestVisit(selected, message);
      setState({ busy: false, sent: true, error: null });
    } catch (e) {
      const d = e.detail || {};
      setState({
        busy: false, sent: false,
        error: Object.values(d).flat().join(" ") || "Richiesta non riuscita.",
      });
    }
  };

  return (
    <div className="bg-white border border-brand-mist rounded-2xl p-6">
      <p className="font-display text-brand-dark text-lg">Prenota una visita</p>

      {state.sent ? (
        <p className="mt-3 text-sm text-brand bg-brand-mist/60 rounded-lg p-3">
          Richiesta inviata! Il venditore la confermerà con un click e riceverai
          una notifica. Nessuna telefonata necessaria.
        </p>
      ) : slots.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">
          Il venditore non ha ancora pubblicato disponibilità.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">Scegli un orario disponibile:</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {slots.map((s) => (
              <button
                key={s.id}
                disabled={s.is_booked}
                onClick={() => setSelected(s.id)}
                className={`text-sm rounded-lg border px-2 py-2 text-left transition-colors ${
                  s.is_booked
                    ? "border-gray-200 text-gray-400 line-through cursor-not-allowed"
                    : selected === s.id
                    ? "border-brand bg-brand-mist text-brand-dark font-medium"
                    : "border-brand-mist hover:border-brand-light"
                }`}
              >
                <span className="block capitalize">{fmtDate(s.date)}</span>
                <span className="text-xs">
                  {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                </span>
              </button>
            ))}
          </div>
          {selected && (
            <>
              <textarea
                className="mt-3 w-full border border-brand-mist rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
                rows={2}
                placeholder="Messaggio per il venditore (opzionale)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={submit}
                disabled={state.busy}
                className="mt-3 w-full bg-brand-dark text-white font-medium py-2.5 rounded-full hover:bg-brand disabled:opacity-60"
              >
                {state.busy ? "Invio…" : "Invia richiesta di visita"}
              </button>
            </>
          )}
          {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
        </>
      )}
    </div>
  );
}
