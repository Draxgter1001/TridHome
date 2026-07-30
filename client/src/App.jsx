import { Route, Routes } from "react-router-dom";
import TridChat from "./components/ai/TridChat";
import RequireAuth from "./components/common/RequireAuth";
import FeedbackModal from "./components/feedback/FeedbackModal";
import Footer from "./components/layout/Footer";
import Navbar from "./components/layout/Navbar";
import FavoritesPage from "./pages/FavoritesPage";
import LandingPage from "./pages/LandingPage";
import ListingPage from "./pages/ListingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SearchPage from "./pages/SearchPage";
import DashboardPage from "./pages/DashboardPage";
import SellPage from "./pages/SellPage";
import VisitsPage from "./pages/VisitsPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/cerca" element={<SearchPage />} />
          <Route path="/annunci/:id" element={<ListingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrati" element={<RegisterPage />} />
          <Route path="/vendi" element={<RequireAuth><SellPage /></RequireAuth>} />
          <Route path="/preferiti" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/visite" element={<RequireAuth><VisitsPage /></RequireAuth>} />
          <Route path="/profilo" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        </Routes>
      </main>
      <Footer />
      <TridChat />
      <FeedbackModal />
    </div>
  );
}
