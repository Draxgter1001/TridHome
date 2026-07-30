import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { fetchListing } from "../api/listings";
import AvailabilityEditor from "../components/calendar/AvailabilityEditor";
import BookingCalendar from "../components/calendar/BookingCalendar";
import StarRating from "../components/common/StarRating";
import VerifiedBadge from "../components/common/VerifiedBadge";
import ReviewsSection from "../components/reviews/ReviewsSection";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

const euro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function ListingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { agencyIds, toggle } = useFavorites();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetchListing(id).then(setListing).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="p-10 text-red-600">Errore: {error}</p>;
  if (!listing) return <p className="p-10 text-gray-500">Caricamento…</p>;

  const owner = listing.owner;
  const agency = owner.agency_profile;
  const ownerName = agency
    ? agency.official_name
    : `${owner.first_name} ${owner.last_name}`;
  const isOwner = user?.id === owner.id;
  const agencyFavorited = agencyIds.has(owner.id);

  const onAgencyHeart = () => {
    if (!user) return navigate("/login");
    toggle({ agency: owner.id }).catch(() => {});
  };

  const characteristics = [
    ["Categoria", listing.category],
    ["Tipologia", listing.typology],
    ["Contratto", listing.contract],
    ["Superficie", `${listing.surface} m²`],
    ["Locali", listing.n_rooms],
    ["Piano", listing.floor_level],
    ["CAP", listing.post_code],
    ["Codice annuncio", listing.advert_code],
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-brand-mist">
            {listing.images[active] && (
              <img src={listing.images[active].url} alt={listing.title}
                   className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex gap-2 mt-3">
            {listing.images.map((img, i) => (
              <button key={img.id} onClick={() => setActive(i)}
                className={`w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 ${
                  i === active ? "border-brand" : "border-transparent"}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <h1 className="font-display text-3xl text-brand-dark mt-8">{listing.title}</h1>
          <p className="text-gray-500 mt-1">
            {listing.address}, {listing.county} ({listing.province})
          </p>
          <p className="font-semibold text-2xl text-brand-dark mt-4">
            {euro(listing.price)}
            {listing.contract === "affitto" && <span className="text-base font-normal">/mese</span>}
          </p>

          <h2 className="font-display text-xl text-brand-dark mt-8 mb-3">Descrizione</h2>
          <p className="text-gray-700 leading-relaxed">{listing.description}</p>

          <h2 className="font-display text-xl text-brand-dark mt-8 mb-3">Caratteristiche</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            {characteristics.map(([k, v]) => (
              <div key={k} className="border-b border-brand-mist pb-2">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-medium capitalize text-brand-dark">{v}</dd>
              </div>
            ))}
          </dl>

          <ReviewsSection targetId={owner.id} targetName={ownerName} />
        </div>

        <aside className="space-y-6">
          <div className="bg-white border border-brand-mist rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Pubblicato da</p>
                <p className="font-display text-lg text-brand-dark mt-1">{ownerName}</p>
              </div>
              {owner.role === "agency" && !isOwner && (
                <button onClick={onAgencyHeart}
                  aria-label={agencyFavorited ? "Rimuovi agenzia dai preferiti" : "Salva agenzia nei preferiti"}
                  className="p-2 text-brand-dark hover:scale-110 transition-transform">
                  {agencyFavorited ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                </button>
              )}
            </div>
            {owner.is_verified && <div className="mt-1"><VerifiedBadge /></div>}
            {owner.rating_count > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <StarRating value={owner.rating_avg} />
                {owner.rating_avg} · {owner.rating_count}{" "}
                {owner.rating_count === 1 ? "recensione" : "recensioni"}
              </div>
            )}
            {agency?.office_address && (
              <p className="text-sm text-gray-600 mt-3">{agency.office_address}</p>
            )}
            <button className="mt-5 w-full bg-brand-dark text-white font-medium py-2.5 rounded-full hover:bg-brand">
              Contatta
            </button>
          </div>

          {isOwner ? (
            <AvailabilityEditor listingId={listing.id} />
          ) : (
            <BookingCalendar listingId={listing.id} isOwner={isOwner} />
          )}
        </aside>
      </div>
    </div>
  );
}
