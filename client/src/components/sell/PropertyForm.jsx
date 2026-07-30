import { useState } from "react";
import { createListing } from "../../api/listings";

/* Port of legacy PropertyForm: same field set, same step UX (posizione →
   dettagli → annuncio → foto), submitting once to the merged endpoint. */
const CATEGORIES = ["appartamento", "casa", "villa", "ufficio", "negozio", "capannone"];
const TYPOLOGIES = ["monolocale", "bilocale", "trilocale", "quadrilocale", "villa", "attico"];

const STEPS = ["Posizione", "Dettagli", "Annuncio", "Foto"];

export default function PropertyForm({ onCreated }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    province: "", county: "", post_code: "", address: "",
    category: "appartamento", typology: "bilocale", contract: "vendita",
    price: "", surface: "", n_rooms: "", floor_level: "",
    title: "", description: "",
    image_urls: [""],
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const input =
    "w-full border border-brand-mist rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light";
  const label = "block text-sm font-medium text-brand-dark mb-1";

  const stepValid = () => {
    if (step === 0) return form.province && form.county && form.post_code && form.address;
    if (step === 1) return form.price && form.surface && form.n_rooms && form.floor_level;
    if (step === 2) return form.title && form.description;
    return true;
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        surface: Number(form.surface),
        n_rooms: Number(form.n_rooms),
        image_urls: form.image_urls.filter(Boolean),
      };
      const listing = await createListing(payload);
      onCreated(listing);
    } catch (err) {
      const d = err.detail || {};
      setError(
        Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(" ")}`).join(" · ")
        || "Pubblicazione non riuscita."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full text-sm flex items-center justify-center font-medium ${
              i <= step ? "bg-brand-dark text-white" : "bg-brand-mist text-brand-dark"}`}>
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? "text-brand-dark font-medium" : "text-gray-400"}`}>
              {s}
            </span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-brand-mist" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={label}>Provincia</label>
            <input className={input} value={form.province} onChange={set("province")} placeholder="Roma" /></div>
          <div><label className={label}>Comune / Zona</label>
            <input className={input} value={form.county} onChange={set("county")} placeholder="Trastevere" /></div>
          <div><label className={label}>CAP</label>
            <input className={input} value={form.post_code} onChange={set("post_code")} placeholder="00153" /></div>
          <div><label className={label}>Indirizzo</label>
            <input className={input} value={form.address} onChange={set("address")} placeholder="Via …, n." /></div>
        </div>
      )}

      {step === 1 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className={label}>Categoria</label>
            <select className={input} value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className={label}>Tipologia</label>
            <select className={input} value={form.typology} onChange={set("typology")}>
              {TYPOLOGIES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
          <div><label className={label}>Contratto</label>
            <select className={input} value={form.contract} onChange={set("contract")}>
              <option value="vendita">Vendita</option>
              <option value="affitto">Affitto</option>
            </select></div>
          <div><label className={label}>Prezzo (€)</label>
            <input className={input} type="number" min="0" value={form.price} onChange={set("price")} /></div>
          <div><label className={label}>Superficie (m²)</label>
            <input className={input} type="number" min="1" value={form.surface} onChange={set("surface")} /></div>
          <div><label className={label}>Locali</label>
            <input className={input} type="number" min="1" value={form.n_rooms} onChange={set("n_rooms")} /></div>
          <div><label className={label}>Piano</label>
            <input className={input} value={form.floor_level} onChange={set("floor_level")} placeholder="2, terra, attico…" /></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div><label className={label}>Titolo dell'annuncio</label>
            <input className={input} value={form.title} onChange={set("title")}
                   placeholder="Trilocale luminoso con balcone…" /></div>
          <div><label className={label}>Descrizione</label>
            <textarea className={input} rows={6} value={form.description} onChange={set("description")}
                      placeholder="Racconta l'immobile: stato, esposizione, contesto…" /></div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Incolla gli URL delle foto (l'upload diretto arriva nella prossima versione).
          </p>
          {form.image_urls.map((u, i) => (
            <input key={i} className={input} placeholder="https://…" value={u}
              onChange={(e) => {
                const next = [...form.image_urls];
                next[i] = e.target.value;
                setForm({ ...form, image_urls: next });
              }} />
          ))}
          <button type="button"
            onClick={() => setForm({ ...form, image_urls: [...form.image_urls, ""] })}
            className="text-sm text-brand font-medium hover:text-brand-dark">
            + Aggiungi foto
          </button>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0}
          className="text-sm text-gray-500 hover:text-brand-dark disabled:invisible">
          ← Indietro
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!stepValid()}
            className="bg-brand-dark text-white font-medium px-6 py-2.5 rounded-full hover:bg-brand disabled:opacity-50">
            Continua
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy}
            className="bg-brand-dark text-white font-medium px-6 py-2.5 rounded-full hover:bg-brand disabled:opacity-60">
            {busy ? "Pubblicazione…" : "Pubblica annuncio"}
          </button>
        )}
      </div>
    </div>
  );
}
