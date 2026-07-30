import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { sendFeedback } from "../../api/feedback";

const FLAG = "tridhome.feedback.shown";

/* Spec pop-up: appears once per session on entry, copy from the requirements doc. */
export default function FeedbackModal() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!sessionStorage.getItem(FLAG)) {
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem(FLAG, "1");
    setOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await sendFeedback(text.trim(), location.pathname);
      setSent(true);
      sessionStorage.setItem(FLAG, "1");
      setTimeout(() => setOpen(false), 1800);
    } catch {
      close();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/30 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={close} aria-label="Chiudi"
          className="absolute top-4 right-4 text-gray-400 hover:text-brand-dark">
          <FaTimes />
        </button>

        {sent ? (
          <p className="text-brand-dark font-medium py-4 text-center">
            Grazie! Il tuo parere ci aiuta a costruire TridHome. 💚
          </p>
        ) : (
          <>
            <h2 className="font-display text-xl text-brand-dark pr-8">
              Il tuo parere conta! 💡
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Promettiamo di non offenderci: cosa funziona male o manca secondo te?
            </p>
            <form onSubmit={submit} className="mt-4">
              <textarea
                className="w-full border border-brand-mist rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
                rows={3}
                placeholder="Scrivi qui il tuo feedback…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={close}
                  className="text-sm text-gray-500 px-4 py-2 hover:text-brand-dark">
                  Più tardi
                </button>
                <button disabled={!text.trim()}
                  className="bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-brand disabled:opacity-50">
                  Invia
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
