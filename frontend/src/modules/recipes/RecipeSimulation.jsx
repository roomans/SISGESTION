const calculateVariationPercent = (simulated, current) => {
  const simulatedValue = Number(simulated || 0);
  const currentValue = Number(current || 0);

  if (!currentValue) return null;

  return ((simulatedValue - currentValue) / currentValue) * 100;
};

function RecipeSimulation({
  recipes = [],
  selectedRecipe,
  loadRecipeDetails,
  simulationDate,
  setSimulationDate,
  simulatedRecipeCost,
  currentRecipeCost,
  simulateRecipeCost,
  setSimulatedRecipeCost,
  formatCurrency,
}) {
  const today = new Date().toISOString().substring(0, 10);

  const kpis = [
    {
      label: "Materia prima",
      simulated: simulatedRecipeCost?.summary?.raw_material_cost,
      current: currentRecipeCost?.summary?.raw_material_cost,
    },
    {
      label: "Mano de obra",
      simulated: simulatedRecipeCost?.summary?.labor_cost,
      current: currentRecipeCost?.summary?.labor_cost,
    },
    {
      label: "Indirectos",
      simulated: simulatedRecipeCost?.summary?.production_overhead_cost,
      current: currentRecipeCost?.summary?.production_overhead_cost,
    },
    {
      label: "Costo producción",
      simulated: simulatedRecipeCost?.summary?.production_cost,
      current: currentRecipeCost?.summary?.production_cost,
    },
    {
      label: "Utilidad",
      simulated: simulatedRecipeCost?.summary?.profit_amount,
      current: currentRecipeCost?.summary?.profit_amount,
      highlight: true,
      positiveIsGood: true,
    },
    {
      label: "Precio sugerido",
      simulated: simulatedRecipeCost?.summary?.suggested_price,
      current: currentRecipeCost?.summary?.suggested_price,
      highlight: true,
    },
    {
      label: "Precio unitario",
      simulated: simulatedRecipeCost?.summary?.unit_cost,
      current: currentRecipeCost?.summary?.unit_cost,
      highlight: true,
      badge: "por unidad",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 shadow-card">
          <h2 className="text-xl font-semibold mb-2">Simulación por fecha</h2>

          <p className="text-sm opacity-70 mb-5">
            Calcula el costo de una receta según los precios vigentes en una fecha
            específica.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-80">Receta</label>
              <select
                value={selectedRecipe?.recipe_id || ""}
                onChange={(event) => {
                  loadRecipeDetails(event.target.value);
                  setSimulatedRecipeCost?.(null);
                }}
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              >
                <option value="">Seleccionar receta</option>

                {recipes
                  .filter((item) => item.is_active)
                  .map((item) => (
                    <option key={item.recipe_id} value={item.recipe_id}>
                      {item.recipe_code} - {item.recipe_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm opacity-80">Fecha</label>
              <input
                type="date"
                value={simulationDate}
                onChange={(event) => {
                  setSimulationDate(event.target.value);
                  setSimulatedRecipeCost?.(null);
                }}
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              />
            </div>

            <button
              type="button"
              onClick={simulateRecipeCost}
              className="w-full bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
            >
              Simular
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.map((item) => {
            const variation =
              simulatedRecipeCost && currentRecipeCost
                ? Number(item.simulated || 0) - Number(item.current || 0)
                : null;

            const variationPercent =
              simulatedRecipeCost && currentRecipeCost
                ? calculateVariationPercent(item.simulated, item.current)
                : null;

            const positiveClass = item.positiveIsGood
              ? "text-green-600 dark:text-green-300"
              : "text-red-600 dark:text-red-300";

            const negativeClass = item.positiveIsGood
              ? "text-red-600 dark:text-red-300"
              : "text-green-600 dark:text-green-300";

            const variationColorClass =
              variation > 0
                ? positiveClass
                : variation < 0
                ? negativeClass
                : "text-tanta-secondary dark:text-[#f0b36d]";

            const variationPercentColorClass =
              variationPercent > 0
                ? positiveClass
                : variationPercent < 0
                ? negativeClass
                : "opacity-60";

            return (
              <div
                key={item.label}
                className="rounded-2xl p-4 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_24px_rgba(209,139,73,0.12)] min-w-0"
              >
                <p className="text-sm opacity-70 flex items-center gap-2">
                  {item.label}

                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d]">
                      {item.badge}
                    </span>
                  )}

                  {item.positiveIsGood && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-300 border border-green-500/20">
                      mejora si sube
                    </span>
                  )}
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl p-3 bg-tanta-primary/10 border border-tanta-primary/20">
                    <p className="text-xs opacity-60">Fecha simulada</p>
                    <h3
                      className={`text-base font-bold mt-1 break-words ${
                        item.highlight
                          ? "text-tanta-secondary dark:text-[#f0b36d]"
                          : ""
                      }`}
                    >
                      {simulatedRecipeCost
                        ? formatCurrency(item.simulated, "PEN")
                        : "-"}
                    </h3>
                  </div>

                  <div className="rounded-xl p-3 bg-tanta-primary/5 border border-tanta-primary/15">
                    <p className="text-xs opacity-60">Fecha actual</p>
                    <h3 className="text-base font-bold mt-1 break-words">
                      {currentRecipeCost
                        ? formatCurrency(item.current, "PEN")
                        : "-"}
                    </h3>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl px-3 py-2 bg-tanta-bg/60 dark:bg-tanta-primary/10 border border-tanta-primary/15">
                  <span className="text-xs opacity-70">Diferencia</span>

                  <div className="text-right">
                    <span className={`text-sm font-semibold ${variationColorClass}`}>
                      {variation !== null ? formatCurrency(variation, "PEN") : "-"}
                    </span>

                    <p className={`text-[11px] font-semibold ${variationPercentColorClass}`}>
                      {variationPercent !== null
                        ? `${variationPercent > 0 ? "▲" : variationPercent < 0 ? "▼" : "●"} ${Math.abs(
                            variationPercent
                          ).toFixed(2)}%`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="md:col-span-2 rounded-2xl px-5 py-4 bg-tanta-primary/10 border border-tanta-primary/20">
            <p className="text-sm opacity-75">
              Comparativo entre la fecha simulada{" "}
              <span className="font-semibold">
                {simulatedRecipeCost?.cost_date || "-"}
              </span>{" "}
              y la fecha actual <span className="font-semibold">{today}</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 shadow-card overflow-hidden">
        <div className="p-5 border-b border-tanta-primary/15">
          <h2 className="text-xl font-semibold">Detalle de insumos simulados</h2>

          <p className="text-sm opacity-70 mt-1">
            {simulatedRecipeCost
              ? `Costeo calculado al ${simulatedRecipeCost.cost_date}`
              : "Selecciona receta y fecha para visualizar el detalle."}
          </p>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1280px] table-fixed text-left">
            <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
              <tr>
                <th className="p-4 w-[230px]">Insumo</th>
                <th className="p-4 w-[160px]">Cantidad</th>
                <th className="p-4 w-[180px]">Convertido</th>
                <th className="p-4 w-[220px]">Proveedor</th>
                <th className="p-4 w-[200px]">Presentación</th>
                <th className="p-4 w-[150px]">Precio</th>
                <th className="p-4 w-[150px]">Costo unit.</th>
                <th className="p-4 w-[150px]">Costo línea</th>
              </tr>
            </thead>

            <tbody>
              {(simulatedRecipeCost?.ingredients || []).map((line) => (
                <tr
                  key={line.recipe_ingredient_id}
                  className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                >
                  <td className="p-4 font-medium">
                    <div className="truncate" title={line.ingredient_name}>
                      {line.ingredient_code} - {line.ingredient_name}
                    </div>
                  </td>

                  <td className="p-4">
                    {line.quantity} {line.recipe_unit_code}
                  </td>

                  <td className="p-4">
                    {line.converted_quantity
                      ? `${Number(line.converted_quantity).toFixed(4)} ${
                          line.stock_unit_code || ""
                        }`
                      : "-"}
                  </td>

                  <td className="p-4 opacity-80">
                    <div className="truncate" title={line.supplier_name || "-"}>
                      {line.supplier_name || "-"}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    <div
                      className="truncate"
                      title={line.presentation_name || "-"}
                    >
                      {line.presentation_name || "-"}
                    </div>
                  </td>

                  <td className="p-4">
                    {formatCurrency(line.current_price, line.currency_code || "PEN")}
                  </td>

                  <td className="p-4">
                    {formatCurrency(line.unit_cost, line.currency_code || "PEN")}
                  </td>

                  <td className="p-4 font-semibold text-tanta-secondary dark:text-[#f0b36d]">
                    {formatCurrency(line.line_cost, line.currency_code || "PEN")}
                  </td>
                </tr>
              ))}

              {(simulatedRecipeCost?.ingredients || []).length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center opacity-60">
                    No hay detalle de simulación para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RecipeSimulation;
