import { useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { api } from "../../services/api";

const documentTypes = [
  { value: "", label: "Sin documento" },
  { value: "DNI", label: "DNI" },
  { value: "RUC", label: "RUC" },
  { value: "CE", label: "Carné de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "OTRO", label: "Otro" },
];

const steps = [
  {
    key: "general",
    label: "General",
    description: "Identificación del cliente",
  },
  {
    key: "contact",
    label: "Contacto",
    description: "Teléfonos, correo y redes",
  },
  {
    key: "address",
    label: "Dirección",
    description: "Ubicación referencial",
  },
  {
    key: "commercial",
    label: "Comercial",
    description: "Canal, referido y CRM",
  },
];

const inputClass =
  "w-full rounded-xl px-4 py-2.5 text-sm bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 dark:border-tanta-primary/25 outline-none focus:border-tanta-primary/60 transition";

const labelClass = "text-xs font-medium opacity-75";

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function CustomerFormDrawer({
  customer,
  sourceChannels = [],
  loggedUser,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(customer?.customer_id);

  const [activeStep, setActiveStep] = useState("general");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_name: customer?.customer_name || "",
    commercial_name: customer?.commercial_name || "",
    document_type: customer?.document_type || "",
    document_number: customer?.document_number || "",
    phone: customer?.phone || "",
    secondary_phone: customer?.secondary_phone || "",
    email: customer?.email || "",
    department: customer?.department || "Lima",
    province: customer?.province || "Lima",
    district: customer?.district || "",
    address: customer?.address || "",
    address_reference: customer?.address_reference || "",
    instagram: customer?.instagram || "",
    tiktok: customer?.tiktok || "",
    birth_date: customer?.birth_date
      ? String(customer.birth_date).substring(0, 10)
      : "",
    accepts_promotions: Boolean(customer?.accepts_promotions),
    is_corporate: Boolean(customer?.is_corporate),
    source_channel_id: customer?.source_channel_id || "",
    referred_by_name: customer?.referred_by_name || "",
    notes: customer?.notes || "",
    is_active: customer?.is_active ?? true,
  });

  const currentStepIndex = steps.findIndex((item) => item.key === activeStep);
  const currentStep = steps[currentStepIndex];

  const progress = useMemo(() => {
    return Math.round(((currentStepIndex + 1) / steps.length) * 100);
  }, [currentStepIndex]);

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.customer_name.trim()) {
      alert("El nombre del cliente es obligatorio.");
      setActiveStep("general");
      return false;
    }

    if (
      form.document_type === "DNI" &&
      form.document_number &&
      form.document_number.length !== 8
    ) {
      alert("El DNI debe tener 8 dígitos.");
      setActiveStep("general");
      return false;
    }

    if (
      form.document_type === "RUC" &&
      form.document_number &&
      form.document_number.length !== 11
    ) {
      alert("El RUC debe tener 11 dígitos.");
      setActiveStep("general");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        ...form,
        source_channel_id: form.source_channel_id
          ? Number(form.source_channel_id)
          : null,
        accepts_promotions: Boolean(form.accepts_promotions),
        is_corporate: Boolean(form.is_corporate),
      };

      if (isEdit) {
        await api.put(`/customers/${customer.customer_id}`, {
          ...payload,
          updated_by: loggedUser?.user_id || 1,
        });
      } else {
        await api.post("/customers", {
          ...payload,
          created_by: loggedUser?.user_id || 1,
        });
      }

      await onSaved?.();
    } catch (error) {
      console.error("Error guardando cliente:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo guardar el cliente"
      );
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    const next = steps[currentStepIndex + 1];
    if (next) setActiveStep(next.key);
  };

  const goBack = () => {
    const previous = steps[currentStepIndex - 1];
    if (previous) setActiveStep(previous.key);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[620px] xl:w-[760px] bg-[#F3EFDC] dark:bg-[#160f1b] border-l border-tanta-primary/25 shadow-2xl overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 z-20 bg-[#F3EFDC]/95 dark:bg-[#160f1b]/95 backdrop-blur border-b border-tanta-primary/20">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-tanta-primary/15 flex items-center justify-center">
                {form.is_corporate ? (
                  <Building2 size={22} />
                ) : (
                  <UserRound size={22} />
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                  CRM / Clientes
                </p>

                <h3 className="text-xl font-bold">
                  {isEdit ? "Editar cliente" : "Nuevo cliente"}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-5 pb-4">
            <div className="h-2 rounded-full bg-tanta-primary/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tanta-primary to-tanta-secondary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              {steps.map((step, index) => {
                const active = activeStep === step.key;
                const completed = index < currentStepIndex;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`rounded-xl px-3 py-2 text-left border transition ${
                      active
                        ? "bg-tanta-primary text-white border-tanta-primary"
                        : completed
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-white/35 dark:bg-white/5 border-tanta-primary/15"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-5 w-5 rounded-full text-[11px] flex items-center justify-center ${
                          active
                            ? "bg-white/20"
                            : completed
                            ? "bg-green-500 text-white"
                            : "bg-tanta-primary/10"
                        }`}
                      >
                        {completed ? <Check size={12} /> : index + 1}
                      </span>

                      <span className="text-xs font-semibold">
                        {step.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <section className="rounded-2xl p-5 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15">
            <div className="mb-5">
              <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                {currentStep.label}
              </p>

              <h4 className="text-lg font-bold">
                {currentStep.description}
              </h4>
            </div>

            {activeStep === "general" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Field label="Nombre / Razón social">
                  <input
                    value={form.customer_name}
                    onChange={(event) =>
                      setField("customer_name", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Ej: María López"
                  />
                </Field>

                <Field label="Nombre comercial">
                  <input
                    value={form.commercial_name}
                    onChange={(event) =>
                      setField("commercial_name", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </Field>

                <Field label="Tipo de documento">
                  <select
                    value={form.document_type}
                    onChange={(event) =>
                      setField("document_type", event.target.value)
                    }
                    className={inputClass}
                  >
                    {documentTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Número de documento">
                  <input
                    value={form.document_number}
                    onChange={(event) =>
                      setField("document_number", event.target.value)
                    }
                    className={inputClass}
                    placeholder="DNI, RUC, CE..."
                  />
                </Field>

                <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="rounded-2xl p-4 border border-tanta-primary/15 bg-white/35 dark:bg-white/5 flex items-start gap-3 cursor-pointer hover:border-tanta-primary/35 transition">
                    <input
                      type="checkbox"
                      checked={form.is_corporate}
                      onChange={(event) =>
                        setField("is_corporate", event.target.checked)
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold">Cliente corporativo</p>
                      <p className="text-xs opacity-65 mt-1">
                        Útil para empresas, colegios, clubes o instituciones.
                      </p>
                    </div>
                  </label>

                  <label className="rounded-2xl p-4 border border-tanta-primary/15 bg-white/35 dark:bg-white/5 flex items-start gap-3 cursor-pointer hover:border-tanta-primary/35 transition">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(event) =>
                        setField("is_active", event.target.checked)
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold">Cliente activo</p>
                      <p className="text-xs opacity-65 mt-1">
                        Permite usarlo en cotizaciones y pedidos.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {activeStep === "contact" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Field label="Celular principal">
                  <input
                    value={form.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    className={inputClass}
                    placeholder="+51 999 999 999"
                  />
                </Field>

                <Field label="Celular secundario">
                  <input
                    value={form.secondary_phone}
                    onChange={(event) =>
                      setField("secondary_phone", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Opcional"
                  />
                </Field>

                <Field label="Correo">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setField("email", event.target.value)}
                    className={inputClass}
                    placeholder="cliente@email.com"
                  />
                </Field>

                <Field label="Fecha de cumpleaños">
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(event) =>
                      setField("birth_date", event.target.value)
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Instagram">
                  <input
                    value={form.instagram}
                    onChange={(event) =>
                      setField("instagram", event.target.value)
                    }
                    className={inputClass}
                    placeholder="@cliente"
                  />
                </Field>

                <Field label="TikTok">
                  <input
                    value={form.tiktok}
                    onChange={(event) => setField("tiktok", event.target.value)}
                    className={inputClass}
                    placeholder="@cliente"
                  />
                </Field>
              </div>
            )}

            {activeStep === "address" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Field label="Departamento">
                  <input
                    value={form.department}
                    onChange={(event) =>
                      setField("department", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Lima"
                  />
                </Field>

                <Field label="Provincia">
                  <input
                    value={form.province}
                    onChange={(event) =>
                      setField("province", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Lima"
                  />
                </Field>

                <Field label="Distrito">
                  <input
                    value={form.district}
                    onChange={(event) =>
                      setField("district", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Comas, Surco, Miraflores..."
                  />
                </Field>

                <Field label="Dirección">
                  <input
                    value={form.address}
                    onChange={(event) => setField("address", event.target.value)}
                    className={inputClass}
                    placeholder="Av., calle, número..."
                  />
                </Field>

                <div className="xl:col-span-2">
                  <Field label="Referencia">
                    <textarea
                      rows="3"
                      value={form.address_reference}
                      onChange={(event) =>
                        setField("address_reference", event.target.value)
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Referencia útil para delivery"
                    />
                  </Field>
                </div>
              </div>
            )}

            {activeStep === "commercial" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Field label="Canal de origen">
                  <select
                    value={form.source_channel_id}
                    onChange={(event) =>
                      setField("source_channel_id", event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Sin canal</option>

                    {sourceChannels.map((item) => (
                      <option
                        key={item.source_channel_id}
                        value={item.source_channel_id}
                      >
                        {item.source_channel_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Referido por">
                  <input
                    value={form.referred_by_name}
                    onChange={(event) =>
                      setField("referred_by_name", event.target.value)
                    }
                    className={inputClass}
                    placeholder="Ej: Juan Pérez, Feria Sauco, administradora..."
                  />
                </Field>

                <div className="xl:col-span-2">
                  <label className="rounded-2xl p-4 border border-tanta-primary/15 bg-white/35 dark:bg-white/5 flex items-start gap-3 cursor-pointer hover:border-tanta-primary/35 transition">
                    <input
                      type="checkbox"
                      checked={form.accepts_promotions}
                      onChange={(event) =>
                        setField("accepts_promotions", event.target.checked)
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-semibold">
                        Acepta recibir promociones
                      </p>

                      <p className="text-xs opacity-65 mt-1">
                        Útil para campañas de WhatsApp, fechas especiales y
                        promociones.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="xl:col-span-2">
                  <Field label="Notas internas">
                    <textarea
                      rows="5"
                      value={form.notes}
                      onChange={(event) => setField("notes", event.target.value)}
                      className={`${inputClass} resize-none`}
                      placeholder="Preferencias, historial, consideraciones importantes..."
                    />
                  </Field>
                </div>
              </div>
            )}
          </section>

          <div className="sticky bottom-0 bg-[#F3EFDC]/90 dark:bg-[#160f1b]/90 backdrop-blur pt-3 pb-1 flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3 flex-1">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStepIndex === 0}
                className="rounded-xl px-4 py-3 text-sm border border-tanta-primary/30 hover:bg-tanta-primary/10 transition disabled:opacity-40 flex items-center gap-2"
              >
                <ChevronLeft size={17} />
                Atrás
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentStepIndex === steps.length - 1}
                className="rounded-xl px-4 py-3 text-sm border border-tanta-primary/30 hover:bg-tanta-primary/10 transition disabled:opacity-40 flex items-center gap-2"
              >
                Siguiente
                <ChevronRight size={17} />
              </button>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="sm:min-w-[210px] bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition disabled:opacity-60"
            >
              <Save size={17} />
              {saving
                ? "Guardando..."
                : isEdit
                ? "Actualizar cliente"
                : "Crear cliente"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default CustomerFormDrawer;
