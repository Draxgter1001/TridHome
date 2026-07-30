import { useEffect, useState } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { createSlot, deleteSlot, fetchSlots } from "../../api/visits";

const fmtTime = (t) => t.slice(0, 5);

/* Seller side: publish the date+time windows buyers can book. */
export default function AvailabilityEditor({ listingId }) {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ date: "", start_time: "", end_time: "" });
  const [error, setError] = useState(null);

  const load = () =>
    fetchSlots(listingId).then((d) => setSlots(d.results)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [listingId]);

  const add = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await createSlot({ listing: listingId, ...form });
      setForm({ date: "", start_time: "", end_time: "" });
      load();
    } catch (err) {
      const d = err.detail || {};
      setError(Object.values(d).flat().join(" ") || "Non salvato.");
    }
  };

  const input =
    "border border-brand-mist rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light";

  return (
    <div className="bg-white border border-brand-mist rounded-2xl p-6">
      <p className="font-display text-brand-dark text-lg">Disponibilità visite</p>
      <p className="text-sm text-gray-500 mt-1">
        Pubblica giorni e orari: gli acquirenti prenotano, tu confermi con un click.
      </p>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-center gap-2">
        <input className={input} type="date" required value={form.date}
               onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className={input} type="time" required value={form.start_time}
               onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        <span className="text-gray-400 text-sm">→</span>
        <input className={input} type="time" required value={form.end_time}
               onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        <button className="bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-brand">
          Aggiungi
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 space-y-2">
        {slots.map((s) => (
          <li key={s.id}
              className="flex items-center justify-between text-sm border border-brand-mist rounded-lg px-3 py-2">
            <span>
              {new Date(s.date + "T00:00:00").toLocaleDateString("it-IT", {
                weekday: "long", day: "numeric", month: "long",
              })}{" "}
              · {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
              {s.is_booked && (
                <span className="ml-2 text-xs bg-brand-mist text-brand-dark px-2 py-0.5 rounded-full">
                  prenotato
                </span>
              )}
            </span>
            {!s.is_booked && (
              <button aria-label="Elimina orario"
                onClick={() => deleteSlot(s.id).then(load)}
                className="text-gray-400 hover:text-red-500">
                <FaTrashAlt />
              </button>
            )}
          </li>
        ))}
        {slots.length === 0 && (
          <li className="text-sm text-gray-400">Nessuna disponibilità pubblicata.</li>
        )}
      </ul>
    </div>
  );
}
