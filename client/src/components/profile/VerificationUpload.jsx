import { useEffect, useState } from "react";
import { fetchMyDocs, uploadVerificationDoc } from "../../api/verification";
import { useAuth } from "../../context/AuthContext";
import VerifiedBadge from "../common/VerifiedBadge";

const DOC_TYPES = {
  private: [
    ["id_card", "Documento d'identità"],
    ["other", "Altro documento"],
  ],
  agency: [
    ["vat_cert", "Certificato P.IVA / Visura"],
    ["chamber_reg", "Iscrizione Camera di Commercio"],
    ["other", "Altro documento"],
  ],
};
const STATUS = {
  pending: ["In verifica", "bg-amber-100 text-amber-800"],
  approved: ["Approvato", "bg-brand-mist text-brand-dark"],
  rejected: ["Rifiutato", "bg-red-100 text-red-700"],
};

export default function VerificationUpload() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const types = DOC_TYPES[user?.role] || DOC_TYPES.private;

  const load = () =>
    fetchMyDocs().then((d) => setDocs(d.results ?? d)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!docType || !file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadVerificationDoc(docType, file);
      setFile(null);
      setDocType("");
      load();
    } catch {
      setError("Upload non riuscito: controlla il file (max 10 MB).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-brand-mist rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-brand-dark">Badge Verificato</h2>
        {user?.is_verified && <VerifiedBadge />}
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {user?.is_verified
          ? "La tua identità è verificata: il badge è visibile su tutti i tuoi annunci."
          : "Carica un documento: dopo l'approvazione, il badge Verificato comparirà sul tuo profilo e sui tuoi annunci. La fiducia porta più contatti."}
      </p>

      {!user?.is_verified && (
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="border border-brand-mist rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            value={docType} onChange={(e) => setDocType(e.target.value)} required>
            <option value="">Tipo di documento…</option>
            {types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="file" accept="image/*,.pdf" required
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-mist file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark hover:file:bg-brand-light/50" />
          <button disabled={busy || !docType || !file}
            className="bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-brand disabled:opacity-50">
            {busy ? "Caricamento…" : "Invia"}
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {docs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {docs.map((d) => {
            const [label, style] = STATUS[d.status];
            return (
              <li key={d.id}
                className="flex items-center justify-between text-sm border border-brand-mist rounded-lg px-3 py-2">
                <span className="text-gray-700 capitalize">
                  {d.doc_type.replace("_", " ")}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${style}`}>
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
