import { useState } from "react";
import { Link } from "react-router-dom";
import AvailabilityEditor from "../components/calendar/AvailabilityEditor";
import PropertyForm from "../components/sell/PropertyForm";

export default function SellPage() {
  const [created, setCreated] = useState(null);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {!created ? (
        <>
          <h1 className="font-display text-3xl text-brand-dark">
            Metti in vendita la tua proprietà
          </h1>
          <p className="text-gray-500 mt-2 mb-8">
            Quattro passaggi per pubblicare un annuncio dettagliato.
          </p>
          <div className="bg-white border border-brand-mist rounded-2xl p-6 md:p-10">
            <PropertyForm onCreated={setCreated} />
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-brand-mist/60 border border-brand-light rounded-2xl p-8 text-center">
            <h1 className="font-display text-2xl text-brand-dark">
              Annuncio pubblicato! 🎉
            </h1>
            <p className="text-gray-600 mt-2">
              Codice annuncio: <span className="font-semibold">{created.advert_code}</span>
            </p>
            <Link to={`/annunci/${created.id}`}
              className="inline-block mt-4 bg-brand-dark text-white font-medium px-6 py-2.5 rounded-full hover:bg-brand">
              Vedi l'annuncio
            </Link>
          </div>
          <AvailabilityEditor listingId={created.id} />
        </div>
      )}
    </div>
  );
}
