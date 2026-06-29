import { useEffect, useMemo, useState } from "react";
import { BarChart3, Boxes, Store } from "lucide-react";
import { api } from "../../services/api";

const COSTING_MODES = [
  {
    key: "supplier",
    label: "Proveedor",
    icon: Store,
    description: "Usa precios activos por proveedor y presentación.",
  },
  {
    key: "inventory",
    label: "Inventario",
    icon: Boxes,
    description: "Usa costo promedio valorizado de almacén.",
  },
  {
    key: "comparison",
    label: "Comparativo",
    icon: BarChart3,
    description: "Compara proveedor vs inventario.",
  },
];

function RecipeCostingModes({ recipeId }) {
  const [mode, setMode] = useState("supplier");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const endpoint = useMemo(() => {
    switch (mode) {
      case "inventory":
        return `/recipes/${recipeId}/costing/inventory`;

      case "comparison":
        return `/recipes/${recipeId}/costing/comparison`;

      default:
        return `/recipes/${recipeId}/costing/supplier`;
    }
  }, [mode, recipeId]);

  useEffect(() => {
    loadData();
  }, [endpoint]);

  const loadData = async () => {
    try {
      setLoading(true);

      const response = await api.get(endpoint);

      setRows(response.data || []);
    } catch (error) {
      console.error("Error cargando costeo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {COSTING_MODES.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => setMode(item.key)}
              className={`rounded-2xl border p-4 text-left transition ${
                mode === item.key
                  ? "border-tanta-primary bg-tanta-primary/10"
                  : "border-tanta-primary/15 hover:border-tanta-primary/35"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} />
                <span className="font-semibold">{item.label}</span>
              </div>

              <p className="text-xs opacity-75">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-tanta-primary/15 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-tanta-primary/10">
              <tr>
                <th className="text-left p-3">Insumo</th>
                <th className="text-right p-3">Cantidad</th>

                {mode === "supplier" && (
                  <>
                    <th className="text-right p-3">Costo Unitario</th>
                    <th className="text-right p-3">Costo Total</th>
                  </>
                )}

                {mode === "inventory" && (
                  <>
                    <th className="text-right p-3">Costo Promedio</th>
                    <th className="text-right p-3">Costo Total</th>
                  </>
                )}

                {mode === "comparison" && (
                  <>
                    <th className="text-right p-3">Proveedor</th>
                    <th className="text-right p-3">Inventario</th>
                    <th className="text-right p-3">Dif.</th>
                    <th className="text-right p-3">% Var.</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-6 text-center">
                    No hay información
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-t border-tanta-primary/10"
                  >
                    <td className="p-3">
                      {row.ingredient_name}
                    </td>

                    <td className="p-3 text-right">
                      {row.quantity} {row.unit_code}
                    </td>

                    {mode === "supplier" && (
                      <>
                        <td className="p-3 text-right">
                          S/ {Number(row.unit_cost || 0).toFixed(2)}
                        </td>

                        <td className="p-3 text-right font-semibold">
                          S/ {Number(row.total_cost || 0).toFixed(2)}
                        </td>
                      </>
                    )}

                    {mode === "inventory" && (
                      <>
                        <td className="p-3 text-right">
                          S/ {Number(row.inventory_unit_cost || 0).toFixed(2)}
                        </td>

                        <td className="p-3 text-right font-semibold">
                          S/ {Number(row.inventory_total_cost || 0).toFixed(2)}
                        </td>
                      </>
                    )}

                    {mode === "comparison" && (
                      <>
                        <td className="p-3 text-right">
                          S/ {Number(row.supplier_total_cost || 0).toFixed(2)}
                        </td>

                        <td className="p-3 text-right">
                          S/ {Number(row.inventory_total_cost || 0).toFixed(2)}
                        </td>

                        <td className="p-3 text-right">
                          S/ {Number(row.difference_amount || 0).toFixed(2)}
                        </td>

                        <td
                          className={`p-3 text-right font-semibold ${
                            Number(row.difference_percentage || 0) > 0
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          {Number(row.difference_percentage || 0).toFixed(2)}%
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RecipeCostingModes;
