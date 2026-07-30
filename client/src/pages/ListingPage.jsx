import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchListing } from "../api/listings";
import VerifiedBadge from "../components/common/VerifiedBadge";

const euro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

/* Replaces legacy PropertyListing.jsx triple fetch with the single merged endpoint. */
export default function ListingPage() {
  const { id } = useParams();
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
    <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2">
        {/* Carousel (lightweight port of ImageCarousel) */}
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
      </div>

      {/* ContactBox (ported) + Verified badge; BookingCalendar slot for Week 2 */}
      <aside className="space-y-6">
        <div className="bg-white border border-brand-mist rounded-2xl p-6">
          <p className="text-sm text-gray-500">Pubblicato da</p>
          <p className="font-display text-lg text-brand-dark mt-1">
            {agency ? agency.official_name : `${owner.first_name} ${owner.last_name}`}
          </p>
          {owner.is_verified && <div className="mt-1"><VerifiedBadge /></div>}
          {agency?.office_address && (
            <p className="text-sm text-gray-600 mt-3">{agency.office_address}</p>
          )}
          <button className="mt-5 w-full bg-brand-dark text-white font-medium py-2.5 rounded-full hover:bg-brand">
            Contatta
          </button>
        </div>
        <div className="bg-brand-mist/60 border border-brand-mist rounded-2xl p-6 text-sm text-gray-600">
          <p className="font-display text-brand-dark text-lg mb-1">Prenota una visita</p>
          Il calendario visite (richiesta → conferma del venditore → notifica) arriva
          nella prossima iterazione dell'Alpha.
        </div>
      </aside>
    </div>
  );
}
