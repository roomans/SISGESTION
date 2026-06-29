import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import QuoteStatusBadge from "./QuoteStatusBadge";

const EMPTY_LINE = {
  line_type: "RECIPE",
  recipe_id: "",
  item_description: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  recipe_cost_snapshot: 0,
  recipe_suggested_price_snapshot: 0,
  recipe_costing_mode: "SUPPLIER",
  price_was_modified: false,
};

const inputClass =
  "w-full rounded-2xl border border-[#ECC9A9]/50 bg-white/80 px-3 py-2.5 text-sm outline-none transition focus:border-[#C97847] dark:border-[#56599A]/20 dark:bg-[#26172C]";

const readOnlyClass =
  "w-full rounded-2xl border border-[#ECC9A9]/50 bg-[#F3EFDC]/45 px-3 py-2.5 text-sm opacity-80 outline-none dark:border-[#56599A]/20 dark:bg-[#1B1220]";


function calculateLineTaxPreview(line, form) {
  const quantity = Number(line.quantity || 0);
  const unitPrice = Number(line.unit_price || 0);
  const discount = Number(line.discount_amount || 0);

  const applyTax =
    line.apply_tax === undefined || line.apply_tax === null
      ? Boolean(form.apply_tax)
      : Boolean(line.apply_tax);

  const pricesIncludeTax =
    line.prices_include_tax === undefined || line.prices_include_tax === null
      ? Boolean(form.prices_include_tax)
      : Boolean(line.prices_include_tax);

  const taxPercentage =
    line.tax_percentage === undefined ||
    line.tax_percentage === null ||
    line.tax_percentage === ""
      ? Number(form.tax_percentage || 18)
      : Number(line.tax_percentage || 18);

  const gross = Math.max(quantity * unitPrice - discount, 0);
  const rate = taxPercentage / 100;

  if (!applyTax) {
    return {
      applyTax,
      pricesIncludeTax,
      taxPercentage,
      taxableAmount: 0,
      exemptAmount: gross,
      taxAmount: 0,
      lineSubtotal: gross,
      lineTotal: gross,
    };
  }

  if (pricesIncludeTax) {
    const taxableAmount = rate > 0 ? gross / (1 + rate) : gross;
    const taxAmount = gross - taxableAmount;

    return {
      applyTax,
      pricesIncludeTax,
      taxPercentage,
      taxableAmount,
      exemptAmount: 0,
      taxAmount,
      lineSubtotal: taxableAmount,
      lineTotal: gross,
    };
  }

  const taxableAmount = gross;
  const taxAmount = taxableAmount * rate;

  return {
    applyTax,
    pricesIncludeTax,
    taxPercentage,
    taxableAmount,
    exemptAmount: 0,
    taxAmount,
    lineSubtotal: taxableAmount,
    lineTotal: taxableAmount + taxAmount,
  };
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-xs font-semibold opacity-70">{label}</label>
      {children}
    </div>
  );
}

export default function QuoteFormDrawer({
  open,
  onClose,
  quote,
  customers = [],
  campaigns = [],
  sourceChannels = [],
  recipes = [],
  loggedUser,
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [loadingRecipeIndex, setLoadingRecipeIndex] = useState(null);

  const [form, setForm] = useState({
    customer_id: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    quote_date: new Date().toISOString().slice(0, 10),
    quote_status: "DRAFT",
    campaign_id: "",
    source_channel_id: "",
    referred_by_name: "",
    apply_tax: true,
    prices_include_tax: true,
    tax_percentage: 18,
    discount_amount: 0,
    delivery_amount: 0,
    manual_adjustment_amount: 0,
    manual_adjustment_reason: "",
    notes: "",
    lines: [{ ...EMPTY_LINE }],
  });

  useEffect(() => {
    if (quote) {
      setForm({
        customer_id: quote.customer_id || "",
        customer_name: quote.customer_name || "",
        customer_phone: quote.customer_phone || "",
        customer_email: quote.customer_email || "",
        customer_address: quote.customer_address || "",
        quote_date: quote.quote_date ? String(quote.quote_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
        quote_status: quote.quote_status || "DRAFT",
        campaign_id: quote.campaign_id || "",
        source_channel_id: quote.source_channel_id || "",
        referred_by_name: quote.referred_by_name || "",
        apply_tax: quote.apply_tax ?? true,
        prices_include_tax: quote.prices_include_tax ?? true,
        tax_percentage: quote.tax_percentage || 18,
        discount_amount: quote.discount_amount || 0,
        delivery_amount: quote.delivery_amount || 0,
        manual_adjustment_amount: quote.manual_adjustment_amount || 0,
        manual_adjustment_reason: quote.manual_adjustment_reason || "",
        notes: quote.notes || "",
        lines: quote.lines?.length
          ? quote.lines.map((line) => ({
              line_type: line.recipe_id ? "RECIPE" : "FREE",
              ...line,
            }))
          : [{ ...EMPTY_LINE }],
      });
    } else {
      setForm({
        customer_id: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        customer_address: "",
        quote_status: "DRAFT",
        campaign_id: "",
        source_channel_id: "",
        referred_by_name: "",
        apply_tax: true,
        prices_include_tax: true,
        tax_percentage: 18,
        discount_amount: 0,
        delivery_amount: 0,
        manual_adjustment_amount: 0,
        manual_adjustment_reason: "",
        notes: "",
        lines: [{ ...EMPTY_LINE }],
      });
    }
  }, [quote, open]);

  const selectedCustomer = useMemo(() => {
    if (!form.customer_id) return null;

    return customers.find(
      (item) => Number(item.customer_id) === Number(form.customer_id)
    );
  }, [customers, form.customer_id]);

  if (!open) return null;

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(
      (item) => Number(item.customer_id) === Number(customerId)
    );

    setForm((prev) => ({
      ...prev,
      customer_id: customerId,
      customer_name: customer?.customer_name || "",
      customer_phone: customer?.phone || "",
      customer_email: customer?.email || "",
      customer_address: customer?.address || "",
      source_channel_id: customer?.source_channel_id || prev.source_channel_id || "",
      referred_by_name: customer?.referred_by_name || prev.referred_by_name || "",
    }));
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...EMPTY_LINE }],
    }));
  };

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lines:
        prev.lines.length === 1
          ? [{ ...EMPTY_LINE }]
          : prev.lines.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateLine = (index, field, value) => {
    setForm((prev) => {
      const lines = [...prev.lines];

      const current = {
        ...lines[index],
        [field]: value,
      };

      if (field === "unit_price") {
        const suggested = Number(current.recipe_suggested_price_snapshot || 0);
        const currentPrice = Number(value || 0);

        current.price_was_modified =
          Boolean(current.recipe_id) && suggested > 0 && currentPrice !== suggested;
      }

      if (field === "line_type" && value === "FREE") {
        current.recipe_id = "";
        current.recipe_cost_snapshot = 0;
        current.recipe_suggested_price_snapshot = 0;
        current.recipe_costing_mode = null;
        current.price_was_modified = false;
        current.item_description = "";
      }

      lines[index] = current;

      return {
        ...prev,
        lines,
      };
    });
  };

  const loadRecipePrice = async (index, recipeId) => {
    if (!recipeId) return;

    try {
      setLoadingRecipeIndex(index);

      const response = await api.get(`/commercial/recipe-price/${recipeId}`);

      const defaults = response.data?.quote_line_defaults || {};

      setForm((prev) => {
        const lines = [...prev.lines];

        lines[index] = {
          ...lines[index],
          line_type: "RECIPE",
          recipe_id: defaults.recipe_id || recipeId,
          item_description: defaults.item_description || "",
          quantity: defaults.quantity || lines[index].quantity || 1,
          unit_id: defaults.unit_id || lines[index].unit_id || "",
          unit_price: defaults.unit_price || 0,
          recipe_cost_snapshot: defaults.recipe_cost_snapshot || 0,
          recipe_suggested_price_snapshot:
            defaults.recipe_suggested_price_snapshot || defaults.unit_price || 0,
          recipe_costing_mode: defaults.recipe_costing_mode || "SUPPLIER",
          price_was_modified: false,
        };

        return {
          ...prev,
          lines,
        };
      });
    } catch (error) {
      console.error("Error recuperando precio de receta:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo recuperar el precio/costo de la receta"
      );
    } finally {
      setLoadingRecipeIndex(null);
    }
  };

  const saveQuote = async () => {
    if (!form.customer_id) {
      alert("Selecciona un cliente registrado para crear la cotización.");
      return;
    }

    if (!form.lines.some((line) => line.item_description && Number(line.quantity) > 0)) {
      alert("Agrega al menos una línea válida.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        campaign_id: form.campaign_id ? Number(form.campaign_id) : null,
        source_channel_id: form.source_channel_id
          ? Number(form.source_channel_id)
          : null,
        apply_tax: Boolean(form.apply_tax),
        prices_include_tax: Boolean(form.prices_include_tax),
        tax_percentage: Number(form.tax_percentage || 18),
        discount_amount: Number(form.discount_amount || 0),
        delivery_amount: Number(form.delivery_amount || 0),
        manual_adjustment_amount: Number(form.manual_adjustment_amount || 0),
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
        lines: form.lines
          .filter((line) => line.item_description && Number(line.quantity) > 0)
          .map((line) => ({
            ...line,
            recipe_id: line.recipe_id ? Number(line.recipe_id) : null,
            quantity: Number(line.quantity || 1),
            unit_price: Number(line.unit_price || 0),
            discount_amount: Number(line.discount_amount || 0),
            recipe_cost_snapshot: Number(line.recipe_cost_snapshot || 0),
            recipe_suggested_price_snapshot: Number(
              line.recipe_suggested_price_snapshot || 0
            ),
            price_was_modified: Boolean(line.price_was_modified),
          })),
      };

      if (quote?.quote_id) {
        await api.put(`/quotes/${quote.quote_id}`, payload);
      } else {
        await api.post("/quotes", payload);
      }

      await onSaved?.();
      onClose();
    } catch (error) {
      console.error("Error guardando cotización:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo guardar la cotización"
      );
    } finally {
      setSaving(false);
    }
  };

  const estimatedSubtotal = form.lines.reduce((total, line) => {
    return total + calculateLineTaxPreview(line, form).lineSubtotal;
  }, 0);

  const estimatedTax = form.lines.reduce((total, line) => {
    return total + calculateLineTaxPreview(line, form).taxAmount;
  }, 0);

  const estimatedLineTotal = form.lines.reduce((total, line) => {
    return total + calculateLineTaxPreview(line, form).lineTotal;
  }, 0);

  const estimatedTotal =
    estimatedLineTotal -
    Number(form.discount_amount || 0) +
    Number(form.delivery_amount || 0) +
    Number(form.manual_adjustment_amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <div className="h-full w-full max-w-7xl overflow-y-auto bg-[#F3EFDC] p-5 md:p-7 dark:bg-[#160F1B]">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-[#ECC9A9]/50 bg-white/70 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/80 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#C97847]">
              Cotizaciones
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-[#26172C] dark:text-[#F3EFDC]">
                {quote ? "Editar cotización" : "Nueva cotización"}
              </h2>

              <QuoteStatusBadge status={form.quote_status} />
            </div>

            <p className="mt-1 text-sm opacity-70">
              Selecciona cliente, agrega productos desde recetas o líneas libres y
              define condiciones tributarias.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#ECC9A9]/60 px-4 py-2 text-sm transition hover:bg-[#ECC9A9]/20 dark:border-[#56599A]/30"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_360px]">
          <div className="space-y-6 min-w-0">
            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/70 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/80">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#26172C] dark:text-[#F3EFDC]">
                    Cliente y datos comerciales
                  </h3>
                  <p className="text-xs opacity-65">
                    Selecciona el cliente registrado, campaña, canal y referido.
                  </p>
                </div>

                <Field label="Estado" className="w-full md:w-56">
                  <select
                    value={form.quote_status || "DRAFT"}
                    onChange={(event) => setField("quote_status", event.target.value)}
                    className={inputClass}
                  >
                    <option value="DRAFT">Borrador</option>
                    <option value="SENT">Enviada</option>
                    <option value="APPROVED">Aprobada</option>
                    <option value="REJECTED">Rechazada</option>
                    <option value="CONVERTED">Convertida</option>
                  </select>
                </Field>

                <Field label="Fecha" className="w-full md:w-48">
                  <input
                    type="date"
                    value={form.quote_date || ""}
                    onChange={(event) => setField("quote_date", event.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Cliente" className="md:col-span-2">
                  <select
                    value={form.customer_id || ""}
                    onChange={(event) => handleCustomerChange(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Seleccionar cliente registrado</option>

                    {customers.map((customer) => (
                      <option key={customer.customer_id} value={customer.customer_id}>
                        {customer.customer_name}
                        {customer.document_number
                          ? ` - ${customer.document_number}`
                          : ""}
                        {customer.phone ? ` - ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Celular">
                  <input
                    type="text"
                    value={form.customer_phone || ""}
                    readOnly
                    placeholder="Celular"
                    className={readOnlyClass}
                  />
                </Field>

                <Field label="Correo">
                  <input
                    type="text"
                    value={form.customer_email || ""}
                    readOnly
                    placeholder="Correo"
                    className={readOnlyClass}
                  />
                </Field>

                <Field label="Dirección registrada" className="md:col-span-2">
                  <input
                    type="text"
                    value={form.customer_address || ""}
                    readOnly
                    placeholder="Dirección registrada"
                    className={readOnlyClass}
                  />
                </Field>
              </div>

              {selectedCustomer && (
                <p className="mt-3 rounded-2xl bg-[#ECC9A9]/30 px-4 py-3 text-xs text-[#26172C] dark:bg-white/10 dark:text-[#F3EFDC]">
                  Cliente seleccionado: <strong>{selectedCustomer.customer_name}</strong>
                  {selectedCustomer.source_channel_name
                    ? ` · Canal: ${selectedCustomer.source_channel_name}`
                    : ""}
                </p>
              )}

              <div className="mt-5 border-t border-[#ECC9A9]/40 pt-5 dark:border-[#56599A]/20">
                <h4 className="mb-3 text-sm font-bold text-[#26172C] dark:text-[#F3EFDC]">
                  Datos comerciales
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field label="Campaña">
                    <select
                      value={form.campaign_id || ""}
                      onChange={(event) => setField("campaign_id", event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Sin campaña</option>

                      {campaigns.map((campaign) => (
                        <option key={campaign.campaign_id} value={campaign.campaign_id}>
                          {campaign.campaign_name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Canal de origen">
                    <select
                      value={form.source_channel_id || ""}
                      onChange={(event) =>
                        setField("source_channel_id", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">Sin canal</option>

                      {sourceChannels.map((channel) => (
                        <option
                          key={channel.source_channel_id}
                          value={channel.source_channel_id}
                        >
                          {channel.source_channel_name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Referido por">
                    <input
                      type="text"
                      value={form.referred_by_name || ""}
                      onChange={(event) =>
                        setField("referred_by_name", event.target.value)
                      }
                      placeholder="Referido por"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/70 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/80">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#26172C] dark:text-[#F3EFDC]">
                    Productos / Recetas
                  </h3>

                  <p className="text-xs opacity-65">
                    Selecciona recetas por nombre o registra líneas libres.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addLine}
                  className="rounded-2xl bg-[#C97847] px-4 py-2 text-sm font-semibold text-white"
                >
                  Agregar línea
                </button>
              </div>

              <div className="space-y-4">
                {form.lines.map((line, index) => {
                  const lineTaxPreview = calculateLineTaxPreview(line, form);

                  return (
                  <div
                    key={index}
                    className="rounded-3xl border border-[#ECC9A9]/50 bg-[#F3EFDC]/45 p-4 dark:border-[#56599A]/20 dark:bg-[#1B1220]"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Línea {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="rounded-xl border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                      <Field label="Tipo" className="xl:col-span-2">
                        <select
                          value={line.line_type || "RECIPE"}
                          onChange={(event) =>
                            updateLine(index, "line_type", event.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="RECIPE">Receta</option>
                          <option value="FREE">Libre</option>
                        </select>
                      </Field>

                      {line.line_type !== "FREE" ? (
                        <Field label="Receta" className="xl:col-span-5">
                          <select
                            value={line.recipe_id || ""}
                            onChange={(event) => {
                              updateLine(index, "recipe_id", event.target.value);
                              loadRecipePrice(index, event.target.value);
                            }}
                            className={inputClass}
                          >
                            <option value="">Seleccionar receta</option>

                            {recipes.map((recipe) => (
                              <option key={recipe.recipe_id} value={recipe.recipe_id}>
                                {recipe.recipe_name}
                                {recipe.recipe_code ? ` - ${recipe.recipe_code}` : ""}
                              </option>
                            ))}
                          </select>
                        </Field>
                      ) : (
                        <Field label="Producto libre" className="xl:col-span-5">
                          <input
                            type="text"
                            value={line.item_description || ""}
                            onChange={(event) =>
                              updateLine(index, "item_description", event.target.value)
                            }
                            placeholder="Descripción libre"
                            className={inputClass}
                          />
                        </Field>
                      )}

                      <Field label="Descripción" className="xl:col-span-5">
                        <input
                          type="text"
                          value={line.item_description || ""}
                          onChange={(event) =>
                            updateLine(index, "item_description", event.target.value)
                          }
                          placeholder="Descripción"
                          className={inputClass}
                        />
                      </Field>

                      <Field label="Cantidad" className="xl:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.quantity ?? ""}
                          onChange={(event) =>
                            updateLine(index, "quantity", event.target.value)
                          }
                          placeholder="Cantidad"
                          className={`${inputClass} text-right font-semibold`}
                        />
                      </Field>

                      <Field label="Precio unit." className="xl:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price ?? ""}
                          onChange={(event) =>
                            updateLine(index, "unit_price", event.target.value)
                          }
                          placeholder="Precio"
                          className={`${inputClass} text-right font-semibold`}
                        />
                      </Field>

                      <Field label="Dscto." className="xl:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.discount_amount ?? ""}
                          onChange={(event) =>
                            updateLine(index, "discount_amount", event.target.value)
                          }
                          placeholder="Descuento"
                          className={`${inputClass} text-right`}
                        />
                      </Field>

                      <Field label="Total estimado" className="xl:col-span-2">
                        <div className="rounded-2xl border border-[#ECC9A9]/50 bg-white/70 px-3 py-2.5 text-right text-sm font-bold dark:border-[#56599A]/20 dark:bg-[#26172C]">
                          S/{" "}
                          {formatMoney(lineTaxPreview.lineTotal)}
                        </div>
                      </Field>

                      <Field label="Estado precio" className="xl:col-span-4">
                        <div className="rounded-2xl border border-[#ECC9A9]/50 bg-white/70 px-3 py-2.5 text-xs dark:border-[#56599A]/20 dark:bg-[#26172C]">
                          {loadingRecipeIndex === index
                            ? "Cargando receta..."
                            : line.price_was_modified
                            ? "Precio modificado manualmente"
                            : "Precio sugerido"}
                        </div>
                      </Field>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white/60 px-3 py-2 text-xs dark:bg-white/10">
                        Costo snapshot:
                        <strong> S/ {Number(line.recipe_cost_snapshot || 0).toFixed(2)}</strong>
                      </div>

                      <div className="rounded-2xl bg-white/60 px-3 py-2 text-xs dark:bg-white/10">
                        Precio sugerido:
                        <strong>
                          {" "}
                          S/{" "}
                          {Number(
                            line.recipe_suggested_price_snapshot || 0
                          ).toFixed(2)}
                        </strong>
                      </div>

                      <div className="rounded-2xl bg-white/60 px-3 py-2 text-xs dark:bg-white/10">
                        Modo:
                        <strong> {line.recipe_costing_mode || "-"}</strong>
                      </div>
                    </div>

                    <div className="mt-3 rounded-3xl border border-[#ECC9A9]/40 bg-white/70 p-3 dark:border-[#56599A]/20 dark:bg-[#26172C]/70">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#C97847]">
                          IGV de la línea
                        </p>

                        <span className="rounded-full bg-[#ECC9A9]/45 px-3 py-1 text-[11px] font-semibold dark:bg-white/10">
                          {lineTaxPreview.applyTax
                            ? lineTaxPreview.pricesIncludeTax
                              ? `Incluye IGV ${lineTaxPreview.taxPercentage}%`
                              : `IGV ${lineTaxPreview.taxPercentage}% no incluido`
                            : "Sin IGV"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <div className="rounded-2xl bg-[#F3EFDC]/70 px-3 py-2 text-xs dark:bg-[#1B1220]">
                          <p className="opacity-60">Base</p>
                          <strong>S/ {formatMoney(lineTaxPreview.taxableAmount)}</strong>
                        </div>

                        <div className="rounded-2xl bg-[#F3EFDC]/70 px-3 py-2 text-xs dark:bg-[#1B1220]">
                          <p className="opacity-60">Exonerado</p>
                          <strong>S/ {formatMoney(lineTaxPreview.exemptAmount)}</strong>
                        </div>

                        <div className="rounded-2xl bg-[#F3EFDC]/70 px-3 py-2 text-xs dark:bg-[#1B1220]">
                          <p className="opacity-60">IGV</p>
                          <strong>S/ {formatMoney(lineTaxPreview.taxAmount)}</strong>
                        </div>

                        <div className="rounded-2xl bg-[#ECC9A9]/50 px-3 py-2 text-xs dark:bg-[#C97847]/20">
                          <p className="opacity-70">Total línea</p>
                          <strong>S/ {formatMoney(lineTaxPreview.lineTotal)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/70 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/80">
              <h3 className="mb-4 text-lg font-semibold text-[#26172C] dark:text-[#F3EFDC]">
                Tributario y ajustes
              </h3>

              <div className="space-y-4">
                <label className="flex items-center gap-3 rounded-2xl bg-[#F3EFDC]/60 px-4 py-3 text-sm dark:bg-[#1B1220]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.apply_tax)}
                    onChange={(event) => setField("apply_tax", event.target.checked)}
                  />
                  Aplica IGV
                </label>

                <label className="flex items-center gap-3 rounded-2xl bg-[#F3EFDC]/60 px-4 py-3 text-sm dark:bg-[#1B1220]">
                  <input
                    type="checkbox"
                    checked={Boolean(form.prices_include_tax)}
                    onChange={(event) =>
                      setField("prices_include_tax", event.target.checked)
                    }
                  />
                  Precio incluye IGV
                </label>

                <Field label="% IGV">
                  <input
                    type="number"
                    value={form.tax_percentage}
                    onChange={(event) =>
                      setField("tax_percentage", event.target.value)
                    }
                    placeholder="% IGV"
                    className={inputClass}
                  />
                </Field>

                <Field label="Delivery">
                  <input
                    type="number"
                    value={form.delivery_amount}
                    onChange={(event) =>
                      setField("delivery_amount", event.target.value)
                    }
                    placeholder="Delivery"
                    className={inputClass}
                  />
                </Field>

                <Field label="Descuento cabecera">
                  <input
                    type="number"
                    value={form.discount_amount}
                    onChange={(event) =>
                      setField("discount_amount", event.target.value)
                    }
                    placeholder="Descuento"
                    className={inputClass}
                  />
                </Field>

                <Field label="Notas">
                  <textarea
                    rows="4"
                    value={form.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    placeholder="Notas de cotización"
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-3xl border border-[#ECC9A9]/50 bg-white/80 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#26172C]/90">
              <h3 className="mb-4 text-lg font-semibold text-[#26172C] dark:text-[#F3EFDC]">
                Resumen estimado
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base / subtotal líneas</span>
                  <strong>S/ {estimatedSubtotal.toFixed(2)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>IGV estimado</span>
                  <strong>S/ {estimatedTax.toFixed(2)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Total líneas</span>
                  <strong>S/ {estimatedLineTotal.toFixed(2)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Descuento</span>
                  <strong>S/ {Number(form.discount_amount || 0).toFixed(2)}</strong>
                </div>

                <div className="flex justify-between">
                  <span>Delivery</span>
                  <strong>S/ {Number(form.delivery_amount || 0).toFixed(2)}</strong>
                </div>

                <div className="mt-3 flex justify-between rounded-2xl bg-[#ECC9A9]/40 px-4 py-3 text-base">
                  <span>Total estimado</span>
                  <strong>S/ {estimatedTotal.toFixed(2)}</strong>
                </div>
              </div>
            </section>

            <div className="sticky bottom-0 rounded-3xl border border-[#ECC9A9]/50 bg-white/90 p-4 shadow-lg backdrop-blur dark:border-[#56599A]/20 dark:bg-[#26172C]/95">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-[#ECC9A9]/60 px-5 py-3 text-sm font-semibold"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={saveQuote}
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-[#26172C] to-[#C97847] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
