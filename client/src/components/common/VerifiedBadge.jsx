import { FaCheckCircle } from "react-icons/fa";

export default function VerifiedBadge({ small = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-brand font-medium ${
        small ? "text-xs" : "text-sm"
      }`}
      title="Identità verificata da TridHome"
    >
      <FaCheckCircle /> Verificato
    </span>
  );
}
