/* Ported from legacy Footer.jsx: same 3-column structure, recolored to brand-dark */
export default function Footer() {
  const col = "space-y-2";
  const link = "block text-sm text-brand-mist/80 hover:text-white transition-colors";
  return (
    <footer className="bg-brand-dark text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        <nav className={col}>
          <h6 className="font-display text-lg mb-3">Servizi</h6>
          <a className={link}>Vendite residenziali</a>
          <a className={link}>Affitti</a>
          <a className={link}>Immobili commerciali</a>
          <a className={link}>Agenzie verificate</a>
        </nav>
        <nav className={col}>
          <h6 className="font-display text-lg mb-3">Azienda</h6>
          <a className={link}>Come e perché nasce TridHome</a>
          <a className={link}>Contatti</a>
          <a className={link}>Community</a>
        </nav>
        <div className={col}>
          <h6 className="font-display text-lg mb-3">TridHome</h6>
          <p className="text-sm text-brand-mist/80 max-w-xs">
            La fiducia è il pilastro del settore immobiliare. Noi la mettiamo al primo posto.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-brand-mist/60">
        © {new Date().getFullYear()} TridHome — versione Alpha
      </div>
    </footer>
  );
}
