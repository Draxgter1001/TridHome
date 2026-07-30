import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { decideVisit, fetchVisitRequests } from "../api/visits";

const STATUS_STYLE = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-brand-mist text-brand-dark",
  denied: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};
const STATUS_LABEL = {
  pending: "In attesa", approved: "Confermata", denied: "Rifiutata", cancelled: "Annullata",
};
const fmt = (s) =>
  `${new Date(s.date + "T00:00:00").toLocaleDateString("it-IT", {
    weekday: "short", day: "numeric", month: "short",
  })} · ${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`;

export default function VisitsPage() {
  const [tab, setTab] = useState("seller");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = (t = tab) => {
    setLoading(true);
    fetchVisitRequests(t)
      .then((d) => setRows(d.results))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(tab); /* eslint-disable-next-line */ }, [tab]);

  const decide = (id, decision) => decideVisit(id, decision).then(() => load());

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-brand-dark">Le mie visite</h1>

      <div className="mt-6 flex gap-2">
        {[["seller", "Richieste ricevute"], ["buyer", "Le mie richieste"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              tab === v ? "bg-brand-dark text-white" : "bg-brand-mist text-brand-dark"}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-gray-500 text-sm">Caricamento…</p>}
        {!loading && rows.length === 0 && (
          <p className="text-gray-400 text-sm">
            {tab === "seller"
              ? "Nessuna richiesta ricevuta finora."
              : "Non hai ancora richiesto nessuna visita."}
          </p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="border border-brand-mist rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link to={`/annunci/${r.listing_id}`}
                  className="font-medium text-brand-dark hover:text-brand">
                  {r.listing_title}
                </Link>
                <p className="text-sm text-gray-500 capitalize">{fmt(r.slot_detail)}</p>
                {tab === "seller" && (
                  <p className="text-sm text-gray-600 mt-1">
                    Da <span className="font-medium">{r.buyer_name}</span>
                    {r.message && <> — “{r.message}”</>}
                  </p>
                )}
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLE[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>

            {r.status === "pending" && (
              <div className="mt-4 flex gap-2">
                {tab === "seller" ? (
                  <>
                    <button onClick={() => decide(r.id, "approve")}
                      className="bg-brand-dark text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-brand">
                      Conferma
                    </button>
                    <button onClick={() => decide(r.id, "deny")}
                      className="border border-brand-mist text-sm font-medium px-4 py-1.5 rounded-full hover:border-red-300 hover:text-red-600">
                      Rifiuta
                    </button>
                  </>
                ) : (
                  <button onClick={() => decide(r.id, "cancel")}
                    className="border border-brand-mist text-sm font-medium px-4 py-1.5 rounded-full hover:border-red-300 hover:text-red-600">
                    Annulla richiesta
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
