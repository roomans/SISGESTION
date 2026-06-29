import { useEffect, useMemo, useState } from "react";
import { Info, PackagePlus, Save, X } from "lucide-react";
import { api } from "../../services/api";

const inputClass =
  "w-full rounded-xl px-4 py-2.5 text-sm bg-tanta-bg/80 dark:bg-[#2a1b30] border border-tanta-primary/20 dark:border-tanta-primary/25 outline-none focus:border-tanta-primary/60 transition";

const labelClass = "text-xs font-medium opacity-75";

function InventoryReceiptDrawer({
  ingredients = [],
  suppliers = [],
  units = [],
  presentations = [],
  warehouses = [],
  locations = [],
  defaultWarehouse,
  defaultLocation,
  loggedUser,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    ingredient_id: "",
    supplier_id: "",
    presentation_id: "",
    warehouse_id: "",
    location_id: "",
    lot_code: "",
    supplier_lot_code: "",
    received_date: new Date().toISOString().substring(0, 10),
    expiration_date: "",
    production_date: "",
    unit_id: "",
    quantity: "",
    unit_cost: "",
    currency_code: "PEN",
    source_document_number: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [referenceCost, setReferenceCost] = useState(null);
  const [loadingReferenceCost, setLoadingReferenceCost] = useState(false);
  const [referenceCostMessage, setReferenceCostMessage] = useState("");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      warehouse_id: prev.warehouse_id || defaultWarehouse?.warehouse_id || "",
      location_id: prev.location_id || defaultLocation?.location_id || "",
    }));
  }, [defaultWarehouse, defaultLocation]);

  const filteredLocations = useMemo(() => {
    if (!form.warehouse_id) return locations;

    return locations.filter(
      (item) => Number(item.warehouse_id) === Number(form.warehouse_id)
    );
  }, [locations, form.warehouse_id]);

  const selectedIngredient = useMemo(
    () =>
      ingredients.find(
        (item) => Number(item.ingredient_id) === Number(form.ingredient_id)
      ),
    [ingredients, form.ingredient_id]
  );

  useEffect(() => {
    if (selectedIngredient?.stock_unit_id && !form.unit_id) {
      setForm((prev) => ({
        ...prev,
        unit_id: selectedIngredient.stock_unit_id,
      }));
    }
  }, [selectedIngredient, form.unit_id]);

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const loadReferenceUnitCost = async (nextForm) => {
    if (
      !nextForm.ingredient_id ||
      !nextForm.supplier_id ||
      !nextForm.presentation_id
    ) {
      setReferenceCost(null);
      setReferenceCostMessage("");
      return;
    }

    try {
      setLoadingReferenceCost(true);
      setReferenceCostMessage("");

      const response = await api.get("/inventory/reference-unit-cost", {
        params: {
          ingredient_id: nextForm.ingredient_id,
          supplier_id: nextForm.supplier_id,
          presentation_id: nextForm.presentation_id,
          target_unit_id: nextForm.unit_id || undefined,
        },
      });

      if (!response.data) {
        setReferenceCost(null);
        setReferenceCostMessage(
          "No se encontró un precio activo vigente para este insumo, proveedor y presentación."
        );
        return;
      }

      const reference = response.data;

      setReferenceCost(reference);
      setReferenceCostMessage(
        "Costo unitario referencial cargado desde el precio activo del proveedor."
      );

      setForm((prev) => ({
        ...prev,
        unit_cost:
          reference.reference_unit_cost !== null &&
          reference.reference_unit_cost !== undefined
            ? reference.reference_unit_cost
            : prev.unit_cost,
        unit_id: prev.unit_id || reference.target_unit_id || reference.stock_unit_id || prev.unit_id,
        currency_code: reference.currency_code || prev.currency_code,
      }));
    } catch (error) {
      console.error("Error cargando costo referencial:", error);

      setReferenceCost(null);
      setReferenceCostMessage(
        error.response?.data?.message ||
          "No se pudo cargar el costo unitario referencial."
      );
    } finally {
      setLoadingReferenceCost(false);
    }
  };

  const updateReferenceFields = (changes) => {
    const nextForm = {
      ...form,
      ...changes,
    };

    setForm(nextForm);
    loadReferenceUnitCost(nextForm);
  };

  const handleUnitChange = (unitId) => {
    const nextForm = {
      ...form,
      unit_id: unitId,
    };

    setForm(nextForm);

    if (
      nextForm.ingredient_id &&
      nextForm.supplier_id &&
      nextForm.presentation_id
    ) {
      loadReferenceUnitCost(nextForm);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !form.ingredient_id ||
      !form.warehouse_id ||
      !form.location_id ||
      !form.unit_id ||
      !form.quantity ||
      !form.lot_code
    ) {
      alert("Completa insumo, almacén, ubicación, unidad, cantidad y lote.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/inventory/purchase-receipts", {
        ...form,
        ingredient_id: Number(form.ingredient_id),
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        presentation_id: form.presentation_id
          ? Number(form.presentation_id)
          : null,
        warehouse_id: Number(form.warehouse_id),
        location_id: Number(form.location_id),
        unit_id: Number(form.unit_id),
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
        created_by: loggedUser?.user_id || 1,
      });

      await onSaved?.();
    } catch (error) {
      console.error("Error registrando ingreso:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error registrando ingreso por compra"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] xl:w-[680px] bg-[#F3EFDC] dark:bg-[#160f1b] border-l border-tanta-primary/25 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-10 bg-[#F3EFDC]/95 dark:bg-[#160f1b]/95 backdrop-blur border-b border-tanta-primary/20 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
              Inventario
            </p>

            <h3 className="text-xl font-bold flex items-center gap-2">
              <PackagePlus size={20} />
              Ingreso por compra
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <section className="rounded-2xl p-4 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-sm font-semibold text-tanta-secondary dark:text-[#f0b36d] mb-4">
              Datos del ingreso
            </h4>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Insumo</label>
                <select
                  value={form.ingredient_id}
                  onChange={(event) =>
                    updateReferenceFields({
                      ingredient_id: event.target.value,
                      presentation_id: "",
                      unit_cost: "",
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Seleccionar insumo</option>

                  {ingredients
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <option key={item.ingredient_id} value={item.ingredient_id}>
                        {item.ingredient_code} - {item.ingredient_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Proveedor</label>
                <select
                  value={form.supplier_id}
                  onChange={(event) =>
                    updateReferenceFields({
                      supplier_id: event.target.value,
                      unit_cost: "",
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Seleccionar proveedor</option>

                  {suppliers
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <option key={item.supplier_id} value={item.supplier_id}>
                        {item.supplier_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Presentación</label>
                <select
                  value={form.presentation_id}
                  onChange={(event) =>
                    updateReferenceFields({
                      presentation_id: event.target.value,
                      unit_cost: "",
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Sin presentación</option>

                  {presentations
                    .filter(
                      (item) =>
                        !form.ingredient_id ||
                        Number(item.ingredient_id) === Number(form.ingredient_id)
                    )
                    .map((item) => (
                      <option key={item.presentation_id} value={item.presentation_id}>
                        {item.presentation_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Documento compra</label>
                <input
                  value={form.source_document_number}
                  onChange={(event) =>
                    setField("source_document_number", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Factura, boleta, guía..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-4 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-sm font-semibold text-tanta-secondary dark:text-[#f0b36d] mb-4">
              Lote y ubicación
            </h4>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Código de lote</label>
                <input
                  value={form.lot_code}
                  onChange={(event) => setField("lot_code", event.target.value)}
                  className={inputClass}
                  placeholder="Ej: LOT-HAR-20260508-001"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Lote proveedor</label>
                <input
                  value={form.supplier_lot_code}
                  onChange={(event) =>
                    setField("supplier_lot_code", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Opcional"
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Almacén</label>
                <select
                  value={form.warehouse_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      warehouse_id: event.target.value,
                      location_id: "",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Seleccionar almacén</option>

                  {warehouses
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <option key={item.warehouse_id} value={item.warehouse_id}>
                        {item.warehouse_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Ubicación</label>
                <select
                  value={form.location_id}
                  onChange={(event) => setField("location_id", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar ubicación</option>

                  {filteredLocations
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <option key={item.location_id} value={item.location_id}>
                        {item.location_name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Fecha ingreso</label>
                <input
                  type="date"
                  value={form.received_date}
                  onChange={(event) =>
                    setField("received_date", event.target.value)
                  }
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Fecha vencimiento</label>
                <input
                  type="date"
                  value={form.expiration_date}
                  onChange={(event) =>
                    setField("expiration_date", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl p-4 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <h4 className="text-sm font-semibold text-tanta-secondary dark:text-[#f0b36d] mb-4">
              Cantidad y costo
            </h4>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>Cantidad</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.quantity}
                  onChange={(event) => setField("quantity", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Unidad</label>
                <select
                  value={form.unit_id}
                  onChange={(event) => handleUnitChange(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Seleccionar unidad</option>

                  {units.map((item) => (
                    <option key={item.unit_id} value={item.unit_id}>
                      {item.unit_code} - {item.unit_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Costo unitario</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.unit_cost}
                  onChange={(event) => setField("unit_cost", event.target.value)}
                  className={inputClass}
                  placeholder={
                    loadingReferenceCost
                      ? "Cargando referencia..."
                      : "Opcional"
                  }
                />
              </div>

              <div className="xl:col-span-3">
                <div
                  className={`rounded-xl px-4 py-3 text-xs border flex items-start gap-2 ${
                    referenceCost
                      ? "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20"
                      : referenceCostMessage
                      ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20"
                      : "bg-tanta-primary/10 border-tanta-primary/15 opacity-75"
                  }`}
                >
                  <Info size={15} className="mt-0.5 shrink-0" />

                  <div>
                    {loadingReferenceCost ? (
                      <p>Cargando costo unitario referencial...</p>
                    ) : referenceCost ? (
                      <>
                        <p className="font-semibold">
                          Precio referencial activo: {referenceCost.current_price}{" "}
                          {referenceCost.currency_code}
                        </p>

                        <p className="mt-1">
                          Presentación: {referenceCost.presentation_name} ·
                          Unidad de referencia:{" "}
                          {referenceCost.target_unit_code ||
                            referenceCost.stock_unit_code}{" "}
                          · Costo unitario referencial:{" "}
                          {referenceCost.reference_unit_cost}{" "}
                          {referenceCost.currency_code}
                        </p>

                        <p className="mt-1 opacity-75">
                          Puedes modificar el costo unitario si el precio real
                          de esta compra fue distinto.
                        </p>
                      </>
                    ) : referenceCostMessage ? (
                      <p>{referenceCostMessage}</p>
                    ) : (
                      <p>
                        Selecciona insumo, proveedor y presentación para cargar
                        el costo unitario referencial del precio activo.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-3 space-y-1.5">
                <label className={labelClass}>Notas</label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(event) => setField("notes", event.target.value)}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 bg-[#F3EFDC]/90 dark:bg-[#160f1b]/90 backdrop-blur pt-3 pb-1 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Guardando..." : "Registrar ingreso"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default InventoryReceiptDrawer;
