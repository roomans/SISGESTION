import {
  Building2,
  Calendar,
  Gift,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Tag,
  UserRound,
  X,
} from "lucide-react";

function CustomerDetailDrawer({ customer, onClose, onEdit }) {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  };

  const InfoCard = ({ icon: Icon, label, value, helper }) => (
    <div className="rounded-2xl p-4 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-tanta-primary/10 flex items-center justify-center shrink-0">
          <Icon size={17} />
        </div>

        <div className="min-w-0">
          <p className="text-xs opacity-65">{label}</p>
          <p className="font-semibold mt-1 break-words">{value || "-"}</p>
          {helper && <p className="text-xs opacity-60 mt-1">{helper}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] xl:w-[680px] bg-[#F3EFDC] dark:bg-[#160f1b] border-l border-tanta-primary/25 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-20 bg-[#F3EFDC]/95 dark:bg-[#160f1b]/95 backdrop-blur border-b border-tanta-primary/20 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-tanta-primary/15 flex items-center justify-center shrink-0">
              {customer.is_corporate ? <Building2 size={22} /> : <UserRound size={22} />}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                {customer.customer_code}
              </p>
              <h3 className="text-xl font-bold truncate">
                {customer.customer_name}
              </h3>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
              title="Editar"
            >
              <Pencil size={19} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-tanta-primary/15 to-tanta-secondary/10 border border-tanta-primary/15">
              <p className="text-xs opacity-70">Pedidos</p>
              <h2 className="text-2xl font-bold mt-1">
                {customer.total_orders || 0}
              </h2>
            </div>

            <div className="rounded-2xl p-4 bg-gradient-to-br from-tanta-primary/15 to-tanta-secondary/10 border border-tanta-primary/15">
              <p className="text-xs opacity-70">Venta histórica</p>
              <h2 className="text-xl font-bold mt-1">
                {formatCurrency(customer.total_sales_amount)}
              </h2>
            </div>

            <div className="rounded-2xl p-4 bg-gradient-to-br from-tanta-primary/15 to-tanta-secondary/10 border border-tanta-primary/15">
              <p className="text-xs opacity-70">Promociones</p>
              <h2 className="text-lg font-bold mt-1">
                {customer.accepts_promotions ? "Sí acepta" : "No acepta"}
              </h2>
            </div>
          </section>

          <section className="rounded-2xl p-5 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-lg font-bold mb-4">Información general</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard
                icon={Tag}
                label="Documento"
                value={
                  customer.document_type || customer.document_number
                    ? `${customer.document_type || ""} ${customer.document_number || ""}`
                    : "-"
                }
              />

              <InfoCard
                icon={Building2}
                label="Nombre comercial"
                value={customer.commercial_name}
                helper={customer.is_corporate ? "Cliente corporativo" : "Cliente persona natural"}
              />

              <InfoCard
                icon={Phone}
                label="Celular principal"
                value={customer.phone}
              />

              <InfoCard
                icon={Phone}
                label="Celular secundario"
                value={customer.secondary_phone}
              />

              <InfoCard
                icon={Mail}
                label="Correo"
                value={customer.email}
              />

              <InfoCard
                icon={Gift}
                label="Cumpleaños"
                value={formatDate(customer.birth_date)}
              />
            </div>
          </section>

          <section className="rounded-2xl p-5 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-lg font-bold mb-4">Dirección y contacto comercial</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoCard
                icon={MapPin}
                label="Ubicación"
                value={[customer.district, customer.province, customer.department]
                  .filter(Boolean)
                  .join(", ")}
              />

              <InfoCard
                icon={MapPin}
                label="Dirección"
                value={customer.address}
                helper={customer.address_reference}
              />

              <InfoCard
                icon={Tag}
                label="Canal de origen"
                value={customer.source_channel_name}
              />

              <InfoCard
                icon={UserRound}
                label="Referido por"
                value={customer.referred_by_name}
              />

              <InfoCard
                icon={Calendar}
                label="Registro"
                value={formatDate(customer.created_at)}
              />

              <InfoCard
                icon={Calendar}
                label="Última compra"
                value={formatDate(customer.last_purchase_at)}
              />
            </div>
          </section>

          <section className="rounded-2xl p-5 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-lg font-bold mb-2">Notas internas</h4>
            <p className="text-sm opacity-75 whitespace-pre-wrap">
              {customer.notes || "Sin notas registradas."}
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default CustomerDetailDrawer;
