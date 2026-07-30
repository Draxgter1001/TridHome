import { FaArrowUp, FaCalendarCheck, FaComments, FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

/* Spec structure: Hero video → main CTAs → COME E PERCHÉ → vantaggi → footer + scroll-top.
   Week 2 replaces the hero gradient with the real /media/hero.mp4 overlay. */
export default function LandingPage() {
  return (
    <div>
      {/* HERO — video slot */}
      <section className="relative min-h-[70vh] flex items-center justify-center bg-brand-dark overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          src="/media/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="relative text-center px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl text-white leading-tight">
            La casa giusta,
            <br />
            <em className="text-brand-light not-italic">senza perdite di tempo.</em>
          </h1>
          <p className="mt-6 text-brand-mist text-lg">
            Cerca, visita e vendi immobili con la fiducia al primo posto: profili
            verificati, calendario visite integrato e zero telefonate inutili.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/cerca"
              className="bg-brand-light text-brand-dark font-semibold px-8 py-3 rounded-full hover:bg-white transition-colors"
            >
              Cerca casa
            </Link>
            <Link
              to="/vendi"
              className="border border-brand-light text-white font-semibold px-8 py-3 rounded-full hover:bg-brand transition-colors"
            >
              Vendi il tuo immobile
            </Link>
          </div>
        </div>
      </section>

      {/* COME E PERCHÉ */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-3xl md:text-4xl text-brand-dark">
          Come e perché nasce TridHome
        </h2>
        <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
          La fiducia è ciò che più manca nel settore immobiliare. TridHome nasce per
          rimetterla al centro: ogni privato e ogni agenzia può dimostrare chi è con il
          badge <span className="text-brand font-medium">Verificato</span>, e ogni visita
          si prenota in un click direttamente dal calendario del venditore.
        </p>
      </section>

      {/* VANTAGGI */}
      <section className="bg-brand-mist/60 py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FaShieldAlt />,
              title: "Fiducia verificata",
              text: "Documenti controllati, stelle e recensioni per privati e agenzie.",
            },
            {
              icon: <FaCalendarCheck />,
              title: "Visite senza telefonate",
              text: "Il venditore pubblica le disponibilità, tu prenoti; lui conferma con un click.",
            },
            {
              icon: <FaComments />,
              title: "Trid, l'agente AI",
              text: "Ti aiuta a cercare casa, creare annunci e organizzare gli appuntamenti.",
            },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl p-8 border border-brand-mist">
              <div className="text-brand text-2xl">{v.icon}</div>
              <h3 className="font-display text-xl text-brand-dark mt-4">{v.title}</h3>
              <p className="text-gray-600 mt-2 text-sm leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Torna su"
        className="fixed bottom-6 right-6 bg-brand-dark text-white p-3 rounded-full shadow-lg hover:bg-brand"
      >
        <FaArrowUp />
      </button>
    </div>
  );
}
