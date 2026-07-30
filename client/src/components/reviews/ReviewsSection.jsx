import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReview, fetchReviews } from "../../api/reviews";
import { useAuth } from "../../context/AuthContext";
import StarRating from "../common/StarRating";

export default function ReviewsSection({ targetId, targetName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const load = () =>
    fetchReviews(targetId).then((d) => setReviews(d.results)).catch(() => {});
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [targetId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    setError(null);
    try {
      await createReview(targetId, rating, text);
      setDone(true);
      setRating(0);
      setText("");
      load();
    } catch (err) {
      const d = err.detail || {};
      setError(Object.values(d).flat().join(" ") || "Recensione non inviata.");
    }
  };

  const isSelf = user?.id === targetId;

  return (
    <div className="mt-12">
      <h2 className="font-display text-2xl text-brand-dark">
        Recensioni su {targetName}
      </h2>

      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border border-brand-mist rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="font-medium text-brand-dark">{r.author_name}</p>
              <StarRating value={r.rating} />
            </div>
            {r.text && <p className="text-sm text-gray-600 mt-2">{r.text}</p>}
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-gray-400">
            Ancora nessuna recensione. La fiducia si costruisce: sii il primo.
          </p>
        )}
      </div>

      {!isSelf && !done && (
        <form onSubmit={submit}
              className="mt-6 bg-brand-mist/40 border border-brand-mist rounded-2xl p-5">
          <p className="text-sm font-medium text-brand-dark">Lascia una recensione</p>
          <div className="mt-2">
            <StarRating value={rating} onChange={setRating} size="text-xl" />
          </div>
          <textarea
            className="mt-3 w-full border border-brand-mist rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-light"
            rows={2}
            placeholder="Com'è andata? (opzionale)"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            disabled={!rating}
            className="mt-3 bg-brand-dark text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-brand disabled:opacity-50">
            Pubblica
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}
      {done && (
        <p className="mt-4 text-sm text-brand bg-brand-mist/60 rounded-lg p-3">
          Grazie! La tua recensione è stata pubblicata.
        </p>
      )}
    </div>
  );
}
