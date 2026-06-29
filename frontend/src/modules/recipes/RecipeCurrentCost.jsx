import { Pencil, Trash2 } from "lucide-react";
import RecipeIngredientForm from "./RecipeIngredientForm";
import RecipeCostingModes from "./RecipeCostingModes";

function RecipeCurrentCost({
  recipes = [],
  ingredients = [],
  units = [],
  selectedRecipe,
  selectedRecipeDetails,
  loadRecipeDetails,
  recipeLineForm,
  setRecipeLineForm,
  editingRecipeLine,
  handleSaveRecipeLine,
  resetRecipeLineForm,
  handleEditRecipeLine,
  handleDeleteRecipeLine,
  getIngredientStockUnitId,
  formatCurrency,
}) {
  const cost = selectedRecipeDetails?.cost;

  const cards = [
    {
      label: "Materia prima",
      value: cost?.raw_material_cost,
    },
    {
      label: "Mano de obra",
      value: cost?.labor_cost,
    },
    {
      label: "Indirectos",
      value: cost?.production_overhead_cost,
    },
    {
      label: "Costo producción",
      value: cost?.production_cost,
    },
    {
      label: "Utilidad",
      value: cost?.profit_amount,
      positive: true,
    },
    {
      label: "Precio sugerido",
      value: cost?.suggested_price,
      highlight: true,
    },
    {
      label: "Precio unitario",
      value: cost?.unit_cost,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 space-y-6">
        <div className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]">
          <h2 className="text-2xl font-bold mb-4">Seleccionar receta</h2>

          <select
            value={selectedRecipe?.recipe_id || ""}
            onChange={(event) => loadRecipeDetails(event.target.value)}
            className="w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
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

        <RecipeIngredientForm
          ingredients={ingredients}
          units={units}
          recipeLineForm={recipeLineForm}
          setRecipeLineForm={setRecipeLineForm}
          editingRecipeLine={editingRecipeLine}
          handleSaveRecipeLine={handleSaveRecipeLine}
          resetRecipeLineForm={resetRecipeLineForm}
          getIngredientStockUnitId={getIngredientStockUnitId}
        />
      </div>

      <div className="xl:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-4 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card"
            >
              <p className="text-sm opacity-70">{item.label}</p>

              <h2
                className={`text-xl font-bold mt-2 ${
                  item.highlight
                    ? "text-tanta-secondary dark:text-[#f0b36d]"
                    : item.positive
                    ? "text-green-600 dark:text-green-300"
                    : ""
                }`}
              >
                {formatCurrency(item.value, "PEN")}
              </h2>
            </div>
          ))}
        </div>

        {selectedRecipe?.recipe_id && (
          <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card">
            <div className="mb-5">
              <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
                Modos de costeo
              </p>

              <h2 className="text-2xl font-bold">Comparación de costeo</h2>

              <p className="text-sm opacity-70 mt-1">
                Puedes revisar el costo usando el precio del proveedor, el costo
                promedio de inventario o comparar ambos modelos.
              </p>
            </div>

            <RecipeCostingModes recipeId={selectedRecipe.recipe_id} />
          </div>
        )}

        <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card overflow-hidden">
          <div className="p-5 border-b border-tanta-primary/15 dark:border-tanta-primary/20">
            <h2 className="text-2xl font-bold">
              {selectedRecipe?.recipe_name || "Detalle de receta"}
            </h2>

            <p className="text-sm opacity-70 mt-1">
              {selectedRecipe
                ? `Rendimiento: ${selectedRecipe.yield_quantity} ${selectedRecipe.yield_unit_code}`
                : "Selecciona una receta para ver su costeo."}
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1180px] table-fixed text-left">
              <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
                <tr>
                  <th className="p-4 w-[260px]">Insumo</th>
                  <th className="p-4 w-[160px]">Cantidad receta</th>
                  <th className="p-4 w-[180px]">Cantidad convertida</th>
                  <th className="p-4 w-[220px]">Proveedor costo</th>
                  <th className="p-4 w-[160px]">Costo unit.</th>
                  <th className="p-4 w-[160px]">Costo línea</th>
                  <th className="p-4 w-[180px]">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {(selectedRecipeDetails?.ingredients || []).map((line) => (
                  <tr
                    key={line.recipe_ingredient_id}
                    className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                  >
                    <td className="p-4 font-medium">
                      <div className="truncate" title={line.ingredient_name}>
                        {line.ingredient_name}
                      </div>
                    </td>

                    <td className="p-4">
                      {line.quantity} {line.unit_code}
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

                    <td className="p-4">
                      {formatCurrency(
                        line.unit_cost,
                        line.currency_code || "PEN"
                      )}
                    </td>

                    <td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
                      {formatCurrency(
                        line.line_cost,
                        line.currency_code || "PEN"
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditRecipeLine(line)}
                          className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRecipeLine(line)}
                          className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {(selectedRecipeDetails?.ingredients || []).length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center opacity-60">
                      Aún no hay insumos agregados a esta receta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!selectedRecipe?.recipe_id && (
          <div className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card text-center opacity-70">
            Selecciona una receta para visualizar sus modos de costeo.
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeCurrentCost;
