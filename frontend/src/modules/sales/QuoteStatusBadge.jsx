const STATUS_LABELS = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CONVERTED: "Convertida",
  EXPIRED: "Vencida",
};

const STATUS_CLASSES = {
  DRAFT:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-400/20",
  SENT:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-400/20",
  APPROVED:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-200 dark:border-green-400/20",
  REJECTED:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-400/20",
  CONVERTED:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-200 dark:border-purple-400/20",
  EXPIRED:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-400/20",
};

export default function QuoteStatusBadge({ status }) {
  const normalizedStatus = status || "DRAFT";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
        STATUS_CLASSES[normalizedStatus] || STATUS_CLASSES.DRAFT
      }`}
    >
      {STATUS_LABELS[normalizedStatus] || normalizedStatus}
    </span>
  );
}
