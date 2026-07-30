import { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaRobot, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { tridChat } from "../../api/ai";

const euro = (n) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const SUGGESTIONS = [
  "Un trilocale in affitto a Trastevere sotto i 1.500€",
  "Vorrei comprare una villa vicino Roma",
  "Come funzionano le visite su TridHome?",
];

/* Trid — spec: AI button bottom-LEFT (scroll-to-top stays bottom-right). */
export default function TridChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    const history = [...messages, { role: "user", content }];
    setMessages(history);
    setBusy(true);
    try {
      const d = await tridChat(
        history.map(({ role, content }) => ({ role, content }))
      );
      setMessages([
        ...history,
        { role: "assistant", content: d.reply, listings: d.listings },
      ]);
    } catch {
      setMessages([
        ...history,
        {
          role: "assistant",
          content: "Ops, ho avuto un problema. Riprova tra qualche secondo.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Launcher — bottom-left per spec */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Apri Trid, l'agente AI"
        className="fixed bottom-6 left-6 z-50 bg-brand-dark text-white rounded-full shadow-xl hover:bg-brand transition-colors flex items-center gap-2 pl-4 pr-5 py-3"
      >
        <FaRobot className="w-5 h-5" />
        <span className="text-sm font-medium">Trid</span>
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-50 w-[min(24rem,calc(100vw-3rem))] h-[32rem] bg-white border border-brand-mist rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-brand-dark text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaRobot />
              <div>
                <p className="font-medium text-sm leading-tight">Trid</p>
                <p className="text-[11px] text-brand-mist leading-tight">
                  L'agente AI di TridHome
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Chiudi chat"
              className="hover:text-brand-light">
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-brand-mist/20">
            {messages.length === 0 && (
              <div>
                <div className="bg-white border border-brand-mist rounded-2xl rounded-tl-sm p-3 text-sm text-gray-700">
                  Ciao! 👋 Sono Trid. Dimmi che casa cerchi e ti mostro subito gli
                  annunci giusti — poi prenoti la visita in un click.
                </div>
                <div className="mt-3 space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="block w-full text-left text-xs border border-brand-light text-brand-dark rounded-xl px-3 py-2 hover:bg-brand-mist transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i}>
                <div className={
                  m.role === "user"
                    ? "bg-brand-dark text-white rounded-2xl rounded-tr-sm p-3 text-sm ml-8"
                    : "bg-white border border-brand-mist rounded-2xl rounded-tl-sm p-3 text-sm text-gray-700 mr-8"
                }>
                  {m.content}
                </div>
                {m.listings?.length > 0 && (
                  <div className="mt-2 space-y-2 mr-8">
                    {m.listings.map((l) => (
                      <Link key={l.id} to={`/annunci/${l.id}`} onClick={() => setOpen(false)}
                        className="flex gap-3 bg-white border border-brand-mist rounded-xl p-2 hover:border-brand-light transition-colors">
                        <div className="w-16 h-12 rounded-lg bg-brand-mist overflow-hidden shrink-0">
                          {l.primary_image && (
                            <img src={l.primary_image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-brand-dark truncate">{l.title}</p>
                          <p className="text-[11px] text-gray-500">{l.county} · {l.n_rooms} locali · {l.surface} m²</p>
                          <p className="text-xs font-semibold text-brand-dark">
                            {euro(l.price)}{l.contract === "affitto" && "/mese"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {busy && (
              <div className="bg-white border border-brand-mist rounded-2xl rounded-tl-sm p-3 text-sm text-gray-400 mr-8">
                Trid sta scrivendo…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="border-t border-brand-mist p-3 flex gap-2">
            <input
              className="flex-1 border border-brand-mist rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
              placeholder="Scrivi a Trid…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={() => send()} disabled={busy || !input.trim()}
              aria-label="Invia"
              className="bg-brand-dark text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-brand disabled:opacity-50">
              <FaPaperPlane className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
