import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { fetchVisitRequests } from "../api/visits";
import StarRating from "../components/common/StarRating";
import VerifiedBadge from "../components/common/VerifiedBadge";
import PropertyCard from "../components/listings/PropertyCard";
import VerificationUpload from "../components/profile/VerificationUpload";
import { useAuth } from "../context/AuthContext";

/* Alpha 'agenda' from the spec: profile, badge, my listings, pending visits. */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [mine, setMine] = useState([]);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    api("/listings/mine/").then(setMine).catch(() => {});
    fetchVisitRequests("seller")
      .then((d) => setPending(d.results.filter((r) => r.status === "pending").length))
      .catch(() => {});
  }, []);

  const agency = user?.agency_profile;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      {/* Header card */}
      <div className="bg-brand-dark text-white rounded-2xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">
              {agency ? agency.official_name : `${user.first_name} ${user.last_name}`}
            </h1>
            <p className="text-brand-mist mt-1 text-sm">
              {user.email} · {user.role === "agency" ? "Agenzia" : "Privato"}
            </p>
            <div className="mt-3 flex items-center gap-4">
              {user.is_verified && (
                <span className="bg-white/10 rounded-full px-3 py-1"><VerifiedBadge small /></span>
              )}
            </div>
            {agency && (
              <div className="mt-4 text-sm text-brand-mist space-y-1">
                <p>P.IVA {agency.vat_number} · {agency.office_address}</p>
                {agency.website && <p>{agency.website}</p>}
              </div>
            )}
          </div>
          <button onClick={logout}
            className="text-sm border border-white/30 rounded-full px-4 py-2 hover:bg-white/10">
            Esci
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-2xl font-semibold">{mine.length}</p>
            <p className="text-xs text-brand-mist">Annunci attivi</p>
          </div>
          <Link to="/visite" className="bg-white/10 rounded-xl p-4 hover:bg-white/20">
            <p className="text-2xl font-semibold">{pending}</p>
            <p className="text-xs text-brand-mist">Richieste di visita in attesa</p>
          </Link>
          <Link to="/vendi" className="bg-brand-light text-brand-dark rounded-xl p-4 hover:bg-white transition-colors">
            <p className="text-sm font-semibold mt-2">+ Nuovo annuncio</p>
          </Link>
        </div>
      </div>

      <VerificationUpload />

      <div>
        <h2 className="font-display text-2xl text-brand-dark mb-4">I miei annunci</h2>
        {mine.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Nessun annuncio ancora. <Link to="/vendi" className="text-brand font-medium">Pubblica il primo</Link>.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mine.map((l) => <PropertyCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}
