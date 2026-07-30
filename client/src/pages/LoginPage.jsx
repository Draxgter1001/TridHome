import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.email, form.password);
      navigate("/cerca");
    } catch {
      setError("Email o password non corretti.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full border border-brand-mist rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-light";

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-3xl text-brand-dark text-center">Bentornato</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className={input} type="email" placeholder="Email" required
               value={form.email}
               onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={input} type="password" placeholder="Password" required
               value={form.password}
               onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy}
          className="w-full bg-brand-dark text-white font-medium py-2.5 rounded-full hover:bg-brand disabled:opacity-60">
          {busy ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
      <p className="text-sm text-gray-500 text-center mt-6">
        Non hai un account?{" "}
        <Link to="/registrati" className="text-brand font-medium">Registrati</Link>
      </p>
      <p className="text-xs text-gray-400 text-center mt-4">
        Demo: agenzia@tridhome.demo / demo1234
      </p>
    </div>
  );
}
