import { useMemo, useState } from "react";
import { CalendarDays, Megaphone, Plus, Save, X } from "lucide-react";
import { api } from "../../services/api";

function Campaigns({
  campaigns = [],
  loading = false,
  loggedUser,
  onRefresh,
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    campaign_code: "",
    campaign_name: "",
    campaign_type: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const activeCampaigns = useMemo(
    () => campaigns.filter((item) => item.is_active),
    [campaigns]
  );

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const resetForm = () => {
    setForm({
      campaign_code: "",
      campaign_name: "",
      campaign_type: "",
      start_date: "",
      end_date: "",
      description: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.campaign_code.trim() || !form.campaign_name.trim()) {
      alert("Código y nombre de campaña son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/sales-catalogs/campaigns", {
        ...form,
        created_by: loggedUser?.user_id || 1,
      });

      resetForm();
      setShowForm(false);
      await onRefresh?.();
    } catch (error) {
      console.error("Error creando campaña:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo crear la campaña"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="rounded-2xl border border-tanta-primary/15 bg-white/35 dark:bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-tanta-primary/15 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                Campañas comerciales
              </p>
              <h3 className="text-xl font-bold">
                {activeCampaigns.length} campañas activas
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-xl px-4 py-2.5 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white text-sm flex items-center gap-2"
            >
              <Plus size={17} />
              Nueva
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center opacity-70">
              Cargando campañas...
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-tanta-dark text-white">
                  <tr>
                    <th className="p-4 text-left">Campaña</th>
                    <th className="p-4 text-left">Tipo</th>
                    <th className="p-4 text-left">Inicio</th>
                    <th className="p-4 text-left">Fin</th>
                    <th className="p-4 text-left">Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.campaign_id}
                      className="border-t border-tanta-primary/15 hover:bg-tanta-primary/10 transition"
                    >
                      <td className="p-4">
                        <p className="font-semibold">{campaign.campaign_name}</p>
                        <p className="text-xs opacity-65">{campaign.campaign_code}</p>
                      </td>

                      <td className="p-4">
                        {campaign.campaign_type || "-"}
                      </td>

                      <td className="p-4">
                        {formatDate(campaign.start_date)}
                      </td>

                      <td className="p-4">
                        {formatDate(campaign.end_date)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            campaign.is_active
                              ? "bg-green-500/10 text-green-700 dark:text-green-300"
                              : "bg-red-500/10 text-red-700 dark:text-red-300"
                          }`}
                        >
                          {campaign.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center opacity-70">
                        No hay campañas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 border border-tanta-primary/15 bg-gradient-to-br from-tanta-primary/10 to-[#56599A]/10">
          <div className="h-12 w-12 rounded-2xl bg-tanta-primary/15 flex items-center justify-center mb-4">
            <Megaphone size={24} />
          </div>

          <h3 className="text-xl font-bold">Uso recomendado</h3>
          <p className="text-sm opacity-75 mt-2 leading-relaxed">
            Usa campañas como ventanas comerciales, no solo como el día exacto.
            Por ejemplo, Día de la Madre puede iniciar semanas antes del día
            central para medir cotizaciones y pedidos de toda la temporada.
          </p>

          <div className="mt-5 rounded-2xl p-4 bg-white/40 dark:bg-white/5 border border-white/30">
            <p className="text-xs font-semibold opacity-70">Ejemplos</p>
            <ul className="mt-2 text-sm space-y-1 opacity-80">
              <li>• Día de la Madre</li>
              <li>• Día del Padre</li>
              <li>• Fiestas Patrias</li>
              <li>• Navidad</li>
              <li>• San Valentín</li>
            </ul>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={() => setShowForm(false)} />

          <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-[#F3EFDC] dark:bg-[#160f1b] border-l border-tanta-primary/25 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-[#F3EFDC]/95 dark:bg-[#160f1b]/95 backdrop-blur border-b border-tanta-primary/20 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                  Campañas
                </p>
                <h3 className="text-xl font-bold">Nueva campaña</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">Código</label>
                <input
                  value={form.campaign_code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      campaign_code: event.target.value.toUpperCase().replaceAll(" ", "_"),
                    }))
                  }
                  className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none"
                  placeholder="DIA_MADRE_2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">Nombre</label>
                <input
                  value={form.campaign_name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      campaign_name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none"
                  placeholder="Día de la Madre 2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">Tipo</label>
                <input
                  value={form.campaign_type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      campaign_type: event.target.value.toUpperCase().replaceAll(" ", "_"),
                    }))
                  }
                  className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none"
                  placeholder="DIA_MADRE"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium opacity-75">Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        start_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium opacity-75">Fin</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        end_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium opacity-75">Descripción</label>
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl px-4 py-2.5 bg-[#F3EFDC]/75 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Guardando..." : "Crear campaña"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Campaigns;
