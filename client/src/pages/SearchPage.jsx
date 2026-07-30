import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchListings } from "../api/listings";
import PropertyCard from "../components/listings/PropertyCard";

/* Ported skeleton of legacy Request.jsx: single merged fetch, filters map 1:1
   to server ListingFilter. Full FilterForm port lands next iteration. */
const CATEGORIES = ["appartamento", "casa", "villa", "ufficio", "negozio", "capannone"];

export default function SearchPage() {
  const [params] = useSearchParams();
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    contract: params.get("contract") || "",
    min_price: "",
    max_price: "",
  });
  const [data, setData] = useState({ results: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = (f = filters) => {
    setLoading(true);
    setError(null);
    fetchListings(f)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const input =
    "border border-brand-mist rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light";

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-brand-dark mb-6">Trova la tua casa</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="bg-brand-mist/50 rounded-2xl p-4 flex flex-wrap gap-3 items-end mb-8"
      >
        <input
          className={`${input} flex-1 min-w-48`}
          placeholder="Zona, indirizzo, parola chiave…"
          value={filters.search}
          onChange={set("search")}
        />
        <select className={input} value={filters.category} onChange={set("category")}>
          <option value="">Categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>
        <select className={input} value={filters.contract} onChange={set("contract")}>
          <option value="">Contratto</option>
          <option value="vendita">Vendita</option>
          <option value="affitto">Affitto</option>
        </select>
        <input className={`${input} w-28`} type="number" placeholder="Prezzo min"
               value={filters.min_price} onChange={set("min_price")} />
        <input className={`${input} w-28`} type="number" placeholder="Prezzo max"
               value={filters.max_price} onChange={set("max_price")} />
        <button className="bg-brand-dark text-white font-medium px-6 py-2 rounded-lg hover:bg-brand">
          Cerca
        </button>
      </form>

      {loading && <p className="text-gray-500">Caricamento annunci…</p>}
      {error && <p className="text-red-600">Errore: {error}</p>}
      {!loading && !error && (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.count} annunci trovati</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.results.map((l) => (
              <PropertyCard key={l.id} listing={l} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
