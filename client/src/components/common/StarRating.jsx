import { useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

/* Display mode: pass value (may be fractional). Input mode: pass onChange. */
export default function StarRating({ value = 0, onChange, size = "text-base" }) {
  const [hover, setHover] = useState(0);
  const shown = onChange ? hover || value : value;

  return (
    <span className={`inline-flex items-center gap-0.5 text-amber-400 ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const Icon =
          shown >= i ? FaStar : shown >= i - 0.5 ? FaStarHalfAlt : FaRegStar;
        return onChange ? (
          <button
            key={i}
            type="button"
            aria-label={`${i} stelle`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            className="hover:scale-110 transition-transform"
          >
            <Icon />
          </button>
        ) : (
          <Icon key={i} />
        );
      })}
    </span>
  );
}
