import { FaHeart, FaUserCircle } from "react-icons/fa";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";

/* Spec layout: logo left (→ landing), main buttons center, favorites + profile right */
export default function Navbar() {
  const { user, logout } = useAuth();

  const item =
    "px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-brand-mist hover:text-brand-dark";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-brand-mist">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl font-bold text-brand-dark">
          TridHome
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/cerca" className={item}>Cerca casa</NavLink>
          <NavLink to="/cerca?contract=affitto" className={item}>Affitti</NavLink>
          <NavLink to="/vendi" className={item}>Vendi</NavLink>
          <NavLink to="/visite" className={item}>Le mie visite</NavLink>
          <NavLink to="/community" className={item}>Community</NavLink>
        </nav>

        <div className="flex items-center gap-4 text-brand-dark">
          <NotificationBell />
          <Link to="/preferiti" aria-label="Preferiti" className="hover:text-brand">
            <FaHeart className="w-5 h-5" />
          </Link>
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium hover:text-brand"
            >
              <FaUserCircle className="w-6 h-6" />
              {user.first_name}
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-brand transition-colors"
            >
              Accedi
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
