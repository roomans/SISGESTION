import { useState } from "react";
import { api } from "../../services/api";
import QuoteStatusBadge from "./QuoteStatusBadge";

function formatMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "-";

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return String(value).slice(0, 10);
  }

  return dateValue.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#ECC9A9]/40 bg-[#F3EFDC]/55 px-4 py-3 dark:border-[#56599A]/20 dark:bg-[#1B1220]">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-55">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#26172C] dark:text-[#F3EFDC]">
        {value || "-"}
      </p>
    </div>
  );
}

export default function QuoteDetailDrawer({
  open,
  onClose,
  quote,
}) {
  const [loadingPdf, setLoadingPdf] = useState(false);

  if (!open || !quote) return null;

  const getPdfBlob = async () => {
    const response = await api.get(`/quotes/${quote.quote_id}/pdf`, {
      responseType: "blob",
    });

    return new Blob([response.data], {
      type: "application/pdf",
    });
  };

  const handleOpenPdf = async () => {
    try {
      setLoadingPdf(true);
      const blob = await getPdfBlob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      console.error("Error abriendo PDF:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo abrir el PDF de la cotización"
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setLoadingPdf(true);
      const blob = await getPdfBlob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${quote.quote_number || "cotizacion"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo descargar el PDF de la cotización"
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const lines = quote.lines || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <div className="h-full w-full max-w-6xl overflow-y-auto bg-[#F3EFDC] p-5 md:p-7 dark:bg-[#160F1B]">
        <div className="mb-6 rounded-3xl border border-[#ECC9A9]/50 bg-white/75 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/85">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C97847]">
                Detalle de cotización
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-[#26172C] dark:text-[#F3EFDC]">
                  {quote.quote_number || "Sin número"}
                </h2>

                <QuoteStatusBadge status={quote.quote_status} />
              </div>

              <p className="mt-1 text-sm opacity-70">
                {quote.customer_name || "Cliente no registrado"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleOpenPdf}
                disabled={loadingPdf}
                className="rounded-2xl bg-[#26172C] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-[#C97847]"
              >
                {loadingPdf ? "Generando..." : "Ver PDF"}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={loadingPdf}
                className="rounded-2xl border border-[#C97847] px-4 py-2 text-sm font-semibold text-[#C97847] transition hover:bg-[#C97847]/10 disabled:opacity-60"
              >
                Descargar PDF
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[#ECC9A9]/60 px-4 py-2 text-sm font-semibold transition hover:bg-[#ECC9A9]/20 dark:border-[#56599A]/30"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <main className="space-y-6 min-w-0">
            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/75 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/85">
              <h3 className="mb-4 text-lg font-bold text-[#26172C] dark:text-[#F3EFDC]">
                Información del cliente
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoItem label="Cliente" value={quote.customer_name} />
                <InfoItem label="Teléfono" value={quote.customer_phone} />
                <InfoItem label="Correo" value={quote.customer_email} />
                <InfoItem label="Dirección" value={quote.customer_address} />
              </div>
            </section>

            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/75 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/85">
              <h3 className="mb-4 text-lg font-bold text-[#26172C] dark:text-[#F3EFDC]">
                Datos comerciales
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <InfoItem label="Fecha" value={formatDate(quote.quote_date)} />
                <InfoItem label="Válida hasta" value={formatDate(quote.valid_until)} />
                <InfoItem label="Campaña" value={quote.campaign_name} />
                <InfoItem label="Canal" value={quote.source_channel_name} />
                <InfoItem label="Referido por" value={quote.referred_by_name} />
                <InfoItem
                  label="Condición IGV"
                  value={
                    quote.apply_tax
                      ? quote.prices_include_tax
                        ? `Precios incluyen IGV ${quote.tax_percentage || 18}%`
                        : `Precios no incluyen IGV ${quote.tax_percentage || 18}%`
                      : "Sin IGV"
                  }
                />
              </div>
            </section>

            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/75 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/85">
              <div className="mb-4 flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[#26172C] dark:text-[#F3EFDC]">
                  Líneas de cotización
                </h3>

                <p className="text-xs opacity-65">
                  Productos, recetas, precio, IGV y total por línea.
                </p>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div
                    key={line.quote_line_id || index}
                    className="rounded-3xl border border-[#ECC9A9]/45 bg-[#F3EFDC]/55 p-4 dark:border-[#56599A]/20 dark:bg-[#1B1220]"
                  >
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                      <div className="lg:col-span-5">
                        <p className="text-xs font-semibold opacity-55">
                          Producto / receta
                        </p>

                        <p className="mt-1 font-bold text-[#26172C] dark:text-[#F3EFDC]">
                          {line.item_description || line.recipe_name || "-"}
                        </p>

                        <p className="mt-1 text-xs opacity-65">
                          {line.recipe_name
                            ? `Receta: ${line.recipe_name}`
                            : line.recipe_id
                            ? `Receta ID: ${line.recipe_id}`
                            : "Línea libre"}
                        </p>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-xs font-semibold opacity-55">
                          Cantidad
                        </p>

                        <p className="mt-1 font-semibold">
                          {Number(line.quantity || 0).toFixed(2)}
                        </p>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-xs font-semibold opacity-55">
                          Precio unit.
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatMoney(line.unit_price)}
                        </p>
                      </div>

                      <div className="lg:col-span-1">
                        <p className="text-xs font-semibold opacity-55">
                          Dscto.
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatMoney(line.discount_amount)}
                        </p>
                      </div>

                      <div className="lg:col-span-2">
                        <p className="text-xs font-semibold opacity-55">
                          Total
                        </p>

                        <p className="mt-1 text-lg font-bold text-[#C97847]">
                          {formatMoney(line.final_total_amount || line.line_total)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
                      <div className="rounded-2xl bg-white/65 px-3 py-2 text-xs dark:bg-white/10">
                        <p className="opacity-60">Base</p>
                        <strong>{formatMoney(line.taxable_amount || line.line_subtotal)}</strong>
                      </div>

                      <div className="rounded-2xl bg-white/65 px-3 py-2 text-xs dark:bg-white/10">
                        <p className="opacity-60">Exonerado</p>
                        <strong>{formatMoney(line.exempt_amount)}</strong>
                      </div>

                      <div className="rounded-2xl bg-white/65 px-3 py-2 text-xs dark:bg-white/10">
                        <p className="opacity-60">IGV calc.</p>
                        <strong>{formatMoney(line.calculated_tax_amount)}</strong>
                      </div>

                      <div className="rounded-2xl bg-white/65 px-3 py-2 text-xs dark:bg-white/10">
                        <p className="opacity-60">IGV final</p>
                        <strong>{formatMoney(line.final_tax_amount)}</strong>
                      </div>

                      <div className="rounded-2xl bg-[#ECC9A9]/45 px-3 py-2 text-xs dark:bg-[#C97847]/20">
                        <p className="opacity-70">Estado precio</p>
                        <strong>
                          {line.price_was_modified
                            ? "Modificado"
                            : line.recipe_id
                            ? "Sugerido"
                            : "Manual"}
                        </strong>
                      </div>
                    </div>

                    {(line.recipe_cost_snapshot ||
                      line.recipe_suggested_price_snapshot ||
                      line.recipe_costing_mode) && (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-white/55 px-3 py-2 text-xs dark:bg-white/10">
                          Costo receta:
                          <strong> {formatMoney(line.recipe_cost_snapshot)}</strong>
                        </div>

                        <div className="rounded-2xl bg-white/55 px-3 py-2 text-xs dark:bg-white/10">
                          Precio sugerido:
                          <strong>
                            {" "}
                            {formatMoney(line.recipe_suggested_price_snapshot)}
                          </strong>
                        </div>

                        <div className="rounded-2xl bg-white/55 px-3 py-2 text-xs dark:bg-white/10">
                          Modo costeo:
                          <strong> {line.recipe_costing_mode || "-"}</strong>
                        </div>
                      </div>
                    )}

                    {line.manual_adjustment_reason && (
                      <p className="mt-3 rounded-2xl bg-yellow-100 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200">
                        Ajuste manual: {line.manual_adjustment_reason}
                      </p>
                    )}
                  </div>
                ))}

                {lines.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-[#ECC9A9] p-8 text-center text-sm opacity-65 dark:border-[#56599A]/40">
                    Esta cotización no tiene líneas registradas.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/75 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/85">
              <h3 className="mb-3 text-lg font-bold text-[#26172C] dark:text-[#F3EFDC]">
                Notas y términos
              </h3>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-[#F3EFDC]/55 p-4 text-sm dark:bg-[#1B1220]">
                  <p className="mb-1 text-xs font-semibold uppercase opacity-55">
                    Notas
                  </p>

                  <p className="whitespace-pre-wrap">
                    {quote.notes || "Sin notas registradas."}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F3EFDC]/55 p-4 text-sm dark:bg-[#1B1220]">
                  <p className="mb-1 text-xs font-semibold uppercase opacity-55">
                    Términos comerciales
                  </p>

                  <p className="whitespace-pre-wrap">
                    {quote.commercial_terms || "Sin términos comerciales registrados."}
                  </p>
                </div>
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="sticky top-5 rounded-3xl border border-[#ECC9A9]/50 bg-white/85 p-5 shadow-lg backdrop-blur dark:border-[#56599A]/20 dark:bg-[#26172C]/95">
              <h3 className="mb-4 text-lg font-bold text-[#26172C] dark:text-[#F3EFDC]">
                Resumen financiero
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <strong>{formatMoney(quote.subtotal_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Base imponible</span>
                  <strong>{formatMoney(quote.taxable_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Exonerado</span>
                  <strong>{formatMoney(quote.exempt_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>IGV calculado</span>
                  <strong>{formatMoney(quote.calculated_tax_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>IGV final</span>
                  <strong>{formatMoney(quote.final_tax_amount || quote.tax_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Descuento</span>
                  <strong>{formatMoney(quote.discount_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <strong>{formatMoney(quote.delivery_amount)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Ajuste manual</span>
                  <strong>{formatMoney(quote.manual_adjustment_amount)}</strong>
                </div>

                {quote.manual_adjustment_reason && (
                  <div className="rounded-2xl bg-yellow-100 px-3 py-2 text-xs text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-200">
                    {quote.manual_adjustment_reason}
                  </div>
                )}

                <div className="mt-4 rounded-3xl bg-gradient-to-r from-[#26172C] to-[#C97847] px-4 py-4 text-white">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <strong className="text-xl">
                      {formatMoney(quote.total_amount)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
