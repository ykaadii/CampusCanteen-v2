export default function StatusBadge({ status, type = "order" }) {
  let colorClass = "bg-gray-100 text-gray-800 border-gray-300";

  if (type === "order") {
    switch (status) {
      case "PENDING":
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "ACCEPTED":
        colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "PREPARING":
        colorClass = "bg-purple-50 text-purple-700 border-purple-200";
        break;
      case "READY":
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold animate-pulse";
        break;
      case "DELIVERED":
        colorClass = "bg-gray-100 text-gray-700 border-gray-200";
        break;
      case "CANCELLED":
        colorClass = "bg-rose-50 text-rose-700 border-rose-200";
        break;
      default:
        break;
    }
  } else if (type === "payment") {
    switch (status) {
      case "SUCCESS":
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        break;
      case "PENDING":
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        break;
      case "FAILED":
        colorClass = "bg-rose-50 text-rose-700 border-rose-200";
        break;
      default:
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border ${colorClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  );
}
