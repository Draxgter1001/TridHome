import { useEffect, useState } from "react";
import { fetchFavorites } from "../api/favorites";
import VerifiedBadge from "../components/common/VerifiedBadge";
import PropertyCard from "../components/listings/PropertyCard";

export default function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites()
      .then((d) => setItems(d.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const listings = items.filter((f) => f.listing_detail);
  const agencies = items.filter((f) => f.agency_detail);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl text-brand-dark">I miei preferiti</h1>
      {loading && <p className="mt-6 text-gray-500 text-sm">Caricamento…</p>}

      {!loading && listings.length === 0 && agencies.length === 0 && (
        <p className="mt-6 text-gray-400">
          Ancora vuoto: tocca il cuore su un annuncio o un'agenzia per salvarli qui.
        </p>
      )}

      {listings.length > 0 && (
        <>
          <h2 className="font-display text-xl text-brand-dark mt-8 mb-4">Case</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((f) => (
              <PropertyCard key={f.id} listing={f.listing_detail} />
            ))}
          </div>
        </>
      )}

      {agencies.length > 0 && (
        <>
          <h2 className="font-display text-xl text-brand-dark mt-10 mb-4">Agenzie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((f) => {
              const a = f.agency_detail;
              return (
                <div key={f.id} className="border border-brand-mist rounded-2xl p-6">
                  <p className="font-display text-lg text-brand-dark">
                    {a.agency_profile?.official_name || `${a.first_name} ${a.last_name}`}
                  </p>
                  {a.is_verified && <VerifiedBadge small />}
                  {a.agency_profile?.office_address && (
                    <p className="text-sm text-gray-500 mt-2">{a.agency_profile.office_address}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
