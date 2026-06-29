import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import QuoteFormDrawer from "./QuoteFormDrawer";
import QuoteDetailDrawer from "./QuoteDetailDrawer";
import QuoteStatusBadge from "./QuoteStatusBadge";

export default function Quotes({
  customers = [],
  campaigns = [],
  sourceChannels = [],
  loggedUser,
}) {
  const [quotes, setQuotes] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });

  const loadQuotes = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.search?.trim()) {
        params.search = filters.search.trim();
      }

      if (filters.status) {
        params.status = filters.status;
      }

      const response = await api.get("/quotes", { params });

      setQuotes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudieron cargar las cotizaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      const response = await api.get("/recipes");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.recipes || response.data?.data || [];

      const activeRecipes = data.filter(
		(recipe) => recipe.is_active === true
      );

      setRecipes(activeRecipes);
    } catch (error) {
      console.error("Error cargando recetas para cotizaciones:", error);
      setRecipes([]);
    }
  };

  useEffect(() => {
    loadQuotes();
    loadRecipes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredQuotes = useMemo(() => quotes, [quotes]);

  const handleOpenCreate = () => {
    setSelectedQuote(null);
    setShowForm(true);
  };

  const handleOpenEdit = async (quote) => {
    try {
      const response = await api.get(`/quotes/${quote.quote_id}`);

      setSelectedQuote({
        ...response.data.quote,
        lines: response.data.lines || [],
      });

      setShowForm(true);
    } catch (error) {
      console.error("Error obteniendo cotización:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo obtener el detalle de la cotización"
      );
    }
  };

  const handleOpenDetail = async (quote) => {
    try {
      const response = await api.get(`/quotes/${quote.quote_id}`);

      setSelectedQuote({
        ...response.data.quote,
        lines: response.data.lines || [],
      });

      setShowDetail(true);
    } catch (error) {
      console.error("Error obteniendo detalle:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "No se pudo obtener el detalle de la cotización"
      );
    }
  };

  return (
    <div className="p-5 lg:p-6 space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#26172C] dark:text-[#F3EFDC]">
            Cotizaciones
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Crea propuestas comerciales usando clientes registrados, recetas,
            precios sugeridos, IGV y ajustes manuales.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-2xl bg-gradient-to-r from-[#C97847] to-[#D18B49] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#C97847]/25 transition hover:scale-[1.01]"
        >
          Nueva cotización
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-[#ECC9A9]/40 bg-white/70 p-5 shadow-sm dark:border-[#56599A]/20 dark:bg-[#1B1220]/65 md:grid-cols-3">
        <input
          type="text"
          placeholder="Buscar por número, cliente o contacto..."
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              search: event.target.value,
            }))
          }
          className="rounded-2xl border border-[#ECC9A9]/50 bg-[#F3EFDC]/60 px-4 py-3 text-sm outline-none transition focus:border-[#C97847] dark:border-[#56599A]/20 dark:bg-[#26172C]"
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value,
            }))
          }
          className="rounded-2xl border border-[#ECC9A9]/50 bg-[#F3EFDC]/60 px-4 py-3 text-sm outline-none transition focus:border-[#C97847] dark:border-[#56599A]/20 dark:bg-[#26172C]"
        >
          <option value="">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="SENT">Enviada</option>
          <option value="APPROVED">Aprobada</option>
          <option value="REJECTED">Rechazada</option>
          <option value="CONVERTED">Convertida</option>
        </select>

        <button
          type="button"
          onClick={loadQuotes}
          className="rounded-2xl border border-[#C97847] px-4 py-3 text-sm font-semibold text-[#C97847] transition hover:bg-[#C97847]/10"
        >
          Buscar / Actualizar
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#ECC9A9]/40 bg-white/70 shadow-sm dark:border-[#56599A]/20 dark:bg-[#1B1220]/65">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#F3EFDC] dark:bg-[#26172C]">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                  Número
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                  Cliente
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                  Fecha
                </th>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase">
                  Total
                </th>
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredQuotes.map((quote) => (
                <tr
                  key={quote.quote_id}
                  className="border-t border-[#ECC9A9]/20 transition hover:bg-[#ECC9A9]/15 dark:border-[#56599A]/10"
                >
                  <td className="px-5 py-4 text-sm font-semibold">
                    {quote.quote_number}
                  </td>

                  <td className="px-5 py-4 text-sm">
                    <div>
                      <p className="font-medium">{quote.customer_name || "-"}</p>
                      <p className="text-xs opacity-60">
                        {quote.customer_phone || quote.customer_email || ""}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm">
                    {quote.quote_date || "-"}
                  </td>

                  <td className="px-5 py-4">
                    <QuoteStatusBadge status={quote.quote_status} />
                  </td>

                  <td className="px-5 py-4 text-right text-sm font-semibold">
                    S/ {Number(quote.total_amount || 0).toFixed(2)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(quote)}
                        className="rounded-xl border border-[#ECC9A9]/60 px-3 py-2 text-xs transition hover:bg-[#ECC9A9]/20 dark:border-[#56599A]/30"
                      >
                        Ver
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(quote)}
                        className="rounded-xl bg-[#26172C] px-3 py-2 text-xs text-white transition hover:opacity-90 dark:bg-[#C97847]"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    Cargando cotizaciones...
                  </td>
                </tr>
              )}

              {!loading && filteredQuotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                    No se encontraron cotizaciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <QuoteFormDrawer
        open={showForm}
        onClose={() => setShowForm(false)}
        quote={selectedQuote}
        customers={customers}
        campaigns={campaigns}
        sourceChannels={sourceChannels}
        recipes={recipes}
        loggedUser={loggedUser}
        onSaved={loadQuotes}
      />

      <QuoteDetailDrawer
        open={showDetail}
        onClose={() => setShowDetail(false)}
        quote={selectedQuote}
      />
    </div>
  );
}
