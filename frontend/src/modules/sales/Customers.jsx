import {
  Building2,
  Calendar,
  Eye,
  Mail,
  Pencil,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";

function Customers({
  customers = [],
  loading = false,
  onCreate,
  onEdit,
  onView,
}) {
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
      month: "short",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center opacity-70">
        Cargando clientes...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-10 text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-tanta-primary/10 flex items-center justify-center mb-4">
          <UserRound size={26} />
        </div>

        <h3 className="text-xl font-bold">Aún no hay clientes registrados</h3>
        <p className="text-sm opacity-70 mt-2">
          Registra tu primer cliente para comenzar a construir el CRM de Tanta House.
        </p>

        <button
          type="button"
          onClick={onCreate}
          className="mt-5 rounded-2xl px-5 py-3 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-lg shadow-tanta-primary/25 hover:scale-[1.01] transition inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Nuevo cliente
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full min-w-[1220px] table-fixed text-sm">
        <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
          <tr>
            <th className="p-4 text-left w-[270px]">Cliente</th>
            <th className="p-4 text-left w-[160px]">Documento</th>
            <th className="p-4 text-left w-[190px]">Contacto</th>
            <th className="p-4 text-left w-[180px]">Ubicación</th>
            <th className="p-4 text-left w-[170px]">Canal</th>
            <th className="p-4 text-right w-[130px]">Pedidos</th>
            <th className="p-4 text-right w-[150px]">Ventas</th>
            <th className="p-4 text-left w-[140px]">Estado</th>
            <th className="p-4 text-center w-[160px]">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.customer_id}
              className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
            >
              <td className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-tanta-primary/10 flex items-center justify-center shrink-0">
                    {customer.is_corporate ? (
                      <Building2 size={18} />
                    ) : (
                      <UserRound size={18} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold truncate" title={customer.customer_name}>
                      {customer.customer_name}
                    </p>

                    <p className="text-xs opacity-65 truncate">
                      {customer.customer_code}
                      {customer.commercial_name ? ` · ${customer.commercial_name}` : ""}
                    </p>

                    {customer.referred_by_name && (
                      <p className="text-xs mt-1 text-tanta-secondary dark:text-[#f0b36d] truncate">
                        Referido: {customer.referred_by_name}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              <td className="p-4">
                <p className="font-medium">{customer.document_type || "-"}</p>
                <p className="text-xs opacity-65">{customer.document_number || "-"}</p>
              </td>

              <td className="p-4">
                <div className="space-y-1">
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="opacity-60" />
                    {customer.phone || "-"}
                  </p>
                  <p className="flex items-center gap-2 text-xs opacity-70 truncate">
                    <Mail size={14} className="opacity-60" />
                    {customer.email || "-"}
                  </p>
                </div>
              </td>

              <td className="p-4">
                <p className="font-medium truncate">
                  {customer.district || "-"}
                </p>
                <p className="text-xs opacity-65 truncate">
                  {[customer.province, customer.department].filter(Boolean).join(", ") ||
                    "-"}
                </p>
              </td>

              <td className="p-4">
                <span className="inline-flex rounded-full px-3 py-1 bg-tanta-primary/10 text-tanta-dark dark:text-[#f0d4bc] text-xs font-semibold">
                  {customer.source_channel_name || "Sin canal"}
                </span>

                {customer.accepts_promotions && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-300">
                    Acepta promociones
                  </p>
                )}
              </td>

              <td className="p-4 text-right font-semibold">
                {customer.total_orders || 0}
              </td>

              <td className="p-4 text-right font-semibold text-tanta-secondary dark:text-[#f0b36d]">
                {formatCurrency(customer.total_sales_amount)}
              </td>

              <td className="p-4">
                <div className="space-y-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      customer.is_active
                        ? "bg-green-500/10 text-green-700 dark:text-green-300"
                        : "bg-red-500/10 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {customer.is_active ? "Activo" : "Inactivo"}
                  </span>

                  <p className="text-xs opacity-60 flex items-center gap-1">
                    <Calendar size={13} />
                    {formatDate(customer.created_at)}
                  </p>
                </div>
              </td>

              <td className="p-4">
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onView(customer)}
                    className="h-9 w-9 rounded-xl bg-tanta-primary/10 hover:bg-tanta-primary/20 transition flex items-center justify-center"
                    title="Ver detalle"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="h-9 w-9 rounded-xl bg-tanta-secondary/10 hover:bg-tanta-secondary/20 transition flex items-center justify-center"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Customers;
