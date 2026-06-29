import { useState } from "react";
import { Calculator, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import RecipeForm from "./RecipeForm";

function RecipeList({
  filteredRecipes = [],
  units = [],
  recipeSearch,
  setRecipeSearch,
  recipeForm,
  setRecipeForm,
  editingRecipe,
  handleSaveRecipe,
  resetRecipeForm,
  handleEditRecipe,
  handleDeleteRecipe,
  loadRecipeDetails,
  setRecipeTab,
  formatCurrency,
}) {
  const [showRecipeForm, setShowRecipeForm] = useState(false);

  const openNewRecipeDrawer = () => {
    resetRecipeForm?.();
    setShowRecipeForm(true);
  };

  const openEditRecipeDrawer = (recipe) => {
    handleEditRecipe(recipe);
    setShowRecipeForm(true);
  };

  const closeRecipeDrawer = () => {
    resetRecipeForm?.();
    setShowRecipeForm(false);
  };

  const handleSubmitRecipe = async (event) => {
    await handleSaveRecipe(event);
    setShowRecipeForm(false);
  };

  return (
    <div className="relative">
      <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
        <div className="p-5 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between border-b border-tanta-primary/15 dark:border-tanta-primary/20">
          <div>
            <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
              Gestión de recetas
            </p>

            <h2 className="text-2xl font-bold">Recetas registradas</h2>

            <p className="text-sm opacity-65 mt-1">
              Consulta, edita y costea tus recetas sin perder visibilidad del listado.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 w-full md:w-[340px] border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
              <Search
                size={18}
                className="text-tanta-primary dark:text-[#f0b36d]"
              />

              <input
                className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
                placeholder="Buscar receta..."
                value={recipeSearch}
                onChange={(event) => setRecipeSearch(event.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={openNewRecipeDrawer}
              className="bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition whitespace-nowrap"
            >
              <Plus size={18} />
              Nueva receta
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1380px] table-fixed text-left">
            <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
              <tr>
                <th className="p-4 w-[140px]">Código</th>
                <th className="p-4 w-[260px]">Receta</th>
                <th className="p-4 w-[160px]">Rendimiento</th>
                <th className="p-4 w-[160px]">Materia prima</th>
                <th className="p-4 w-[170px]">Costo producción</th>
                <th className="p-4 w-[150px]">Utilidad</th>
                <th className="p-4 w-[180px]">Precio sugerido</th>
                <th className="p-4 w-[160px]">Precio unitario</th>
                <th className="p-4 w-[120px]">Estado</th>
                <th className="p-4 w-[260px]">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecipes.map((item) => (
                <tr
                  key={item.recipe_id}
                  className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                >
                  <td className="p-4 font-medium">
                    <div className="truncate" title={item.recipe_code}>
                      {item.recipe_code}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="truncate" title={item.recipe_name}>
                      {item.recipe_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    {item.yield_quantity} {item.yield_unit_code}
                  </td>

                  <td className="p-4">
                    {formatCurrency(item.raw_material_cost, "PEN")}
                  </td>

                  <td className="p-4">
                    {formatCurrency(item.production_cost, "PEN")}
                  </td>

                  <td className="p-4 text-green-600 dark:text-green-300 font-medium">
                    {formatCurrency(item.profit_amount, "PEN")}
                  </td>

                  <td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
                    {formatCurrency(item.suggested_price, "PEN")}
                  </td>

                  <td className="p-4 font-medium">
                    {formatCurrency(item.suggested_unit_price ?? item.unit_cost, "PEN")}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
                        item.is_active
                          ? "bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] border-tanta-primary/25"
                          : "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20"
                      }`}
                    >
                      {item.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          loadRecipeDetails(item.recipe_id);
                          setRecipeTab("costing");
                        }}
                        className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Calculator size={16} />
                        Costear
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditRecipeDrawer(item)}
                        className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(item)}
                        className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecipes.length === 0 && (
                <tr>
                  <td colSpan="10" className="p-8 text-center opacity-60">
                    No se encontraron recetas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRecipeForm && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeRecipeDrawer}
          />

          <aside className="absolute right-0 top-0 h-full w-full sm:w-[520px] xl:w-[620px] bg-[#F3EFDC] dark:bg-[#160f1b] border-l border-tanta-primary/25 shadow-2xl overflow-y-auto custom-scrollbar animate-[slideIn_.25s_ease-out]">
            <div className="sticky top-0 z-10 bg-[#F3EFDC]/95 dark:bg-[#160f1b]/95 backdrop-blur border-b border-tanta-primary/20 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
                  {editingRecipe ? "Edición" : "Nuevo registro"}
                </p>

                <h3 className="text-xl font-bold">
                  {editingRecipe ? "Editar receta" : "Nueva receta"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeRecipeDrawer}
                className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-tanta-primary/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              <RecipeForm
                units={units}
                recipeForm={recipeForm}
                setRecipeForm={setRecipeForm}
                editingRecipe={editingRecipe}
                handleSaveRecipe={handleSubmitRecipe}
                resetRecipeForm={closeRecipeDrawer}
                isDrawer
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default RecipeList;
