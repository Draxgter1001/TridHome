import { FaRegHeart } from "react-icons/fa";
import { Link } from "react-router-dom";

const euro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function PropertyCard({ listing }) {
  return (
    <Link
      to={`/annunci/${listing.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-brand-mist hover:shadow-lg transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-brand-mist">
        {listing.primary_image && (
          <img
            src={listing.primary_image}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
          />
        )}
        <span className="absolute top-3 left-3 bg-brand-dark text-white text-xs font-medium px-3 py-1 rounded-full capitalize">
          {listing.contract}
        </span>
        <button
          aria-label="Aggiungi ai preferiti"
          onClick={(e) => e.preventDefault()}
          className="absolute top-3 right-3 bg-white/90 p-2 rounded-full text-brand-dark hover:text-red-500"
        >
          <FaRegHeart />
        </button>
      </div>
      <div className="p-4">
        <p className="font-display text-lg text-brand-dark leading-snug line-clamp-2">
          {listing.title}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {listing.county}, {listing.province}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-semibold text-brand-dark">
            {euro(listing.price)}
            {listing.contract === "affitto" && <span className="text-sm font-normal">/mese</span>}
          </span>
          <span className="text-xs text-gray-500">
            {listing.surface} m² · {listing.n_rooms} locali
          </span>
        </div>
      </div>
    </Link>
  );
}
