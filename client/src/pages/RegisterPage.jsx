import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* Spec: role choice can live on the site rather than in classic registration —
   implemented as a pre-step selector (Privato / Agenzia). */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [form, setForm] = useState({
    email: "", password: "", first_name: "", last_name: "", phone: "",
    agency: { official_name: "", vat_number: "", office_address: "", website: "" },
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const input =
    "w-full border border-brand-mist rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-light";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { ...form, role };
    if (role !== "agency") delete payload.agency;
    try {
      await register(payload);
      navigate("/cerca");
    } catch (err) {
      const d = err.detail || {};
      setError(Object.values(d).flat().join(" ") || "Registrazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  if (!role)
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-brand-dark">Chi sei?</h1>
        <p className="text-gray-500 mt-2">Scegli il tipo di account per iniziare.</p>
        <div className="grid sm:grid-cols-2 gap-6 mt-10">
          {[
            ["private", "Privato", "Cerca casa, salva i preferiti e vendi il tuo immobile."],
            ["agency", "Agenzia", "Profilo professionale con P.IVA, sede, orari e badge Verificato."],
          ].map(([value, title, text]) => (
            <button key={value} onClick={() => setRole(value)}
              className="border-2 border-brand-mist rounded-2xl p-8 text-left hover:border-brand-light hover:bg-brand-mist/40 transition-colors">
              <p className="font-display text-xl text-brand-dark">{title}</p>
              <p className="text-sm text-gray-600 mt-2">{text}</p>
            </button>
          ))}
        </div>
      </div>
    );

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setA = (k) => (e) =>
    setForm({ ...form, agency: { ...form.agency, [k]: e.target.value } });

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-3xl text-brand-dark text-center">
        {role === "agency" ? "Registra la tua agenzia" : "Crea il tuo account"}
      </h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input className={input} placeholder="Nome" required value={form.first_name} onChange={setF("first_name")} />
          <input className={input} placeholder="Cognome" required value={form.last_name} onChange={setF("last_name")} />
        </div>
        <input className={input} type="email" placeholder="Email" required value={form.email} onChange={setF("email")} />
        <input className={input} type="password" placeholder="Password (min. 8 caratteri)" required value={form.password} onChange={setF("password")} />
        <input className={input} placeholder="Telefono" value={form.phone} onChange={setF("phone")} />

        {role === "agency" && (
          <div className="space-y-4 border-t border-brand-mist pt-4">
            <input className={input} placeholder="Nome ufficiale agenzia" required value={form.agency.official_name} onChange={setA("official_name")} />
            <input className={input} placeholder="Partita IVA" required value={form.agency.vat_number} onChange={setA("vat_number")} />
            <input className={input} placeholder="Indirizzo sede" required value={form.agency.office_address} onChange={setA("office_address")} />
            <input className={input} placeholder="Sito web (opzionale)" value={form.agency.website} onChange={setA("website")} />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy}
          className="w-full bg-brand-dark text-white font-medium py-2.5 rounded-full hover:bg-brand disabled:opacity-60">
          {busy ? "Creazione account…" : "Registrati"}
        </button>
        <button type="button" onClick={() => setRole(null)}
          className="w-full text-sm text-gray-500 hover:text-brand-dark">
          ← Cambia tipo di account
        </button>
      </form>
    </div>
  );
}
