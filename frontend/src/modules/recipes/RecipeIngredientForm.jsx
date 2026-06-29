import { PackagePlus, Pencil, Save } from "lucide-react";

function RecipeIngredientForm({
  ingredients = [],
  units = [],
  recipeLineForm,
  setRecipeLineForm,
  editingRecipeLine,
  handleSaveRecipeLine,
  resetRecipeLineForm,
  getIngredientStockUnitId,
}) {
  return (
    <form
      onSubmit={handleSaveRecipeLine}
      className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
          {editingRecipeLine ? <Pencil size={20} /> : <PackagePlus size={20} />}
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {editingRecipeLine ? "Editar insumo" : "Agregar insumo"}
          </h2>
          <p className="text-sm opacity-65">
            Usa la unidad de receta. El sistema convertirá a la unidad de stock.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm opacity-80">Insumo</label>
          <select
            value={recipeLineForm.ingredient_id}
            onChange={(event) =>
              setRecipeLineForm({
                ...recipeLineForm,
                ingredient_id: event.target.value,
                unit_id: getIngredientStockUnitId
                  ? getIngredientStockUnitId(event.target.value)
                  : recipeLineForm.unit_id,
              })
            }
            className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
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

        <div>
          <label className="text-sm opacity-80">Cantidad</label>
          <input
            type="number"
            step="0.000001"
            value={recipeLineForm.quantity}
            onChange={(event) =>
              setRecipeLineForm({
                ...recipeLineForm,
                quantity: event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
            placeholder="Ej: 0.500"
          />
        </div>

        <div>
          <label className="text-sm opacity-80">Unidad</label>
          <select
            value={recipeLineForm.unit_id}
            onChange={(event) =>
              setRecipeLineForm({
                ...recipeLineForm,
                unit_id: event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
          >
            <option value="">Seleccionar unidad</option>
            {units.map((item) => (
              <option key={item.unit_id} value={item.unit_id}>
                {item.unit_code} - {item.unit_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm opacity-80">Notas</label>
          <textarea
            rows="2"
            value={recipeLineForm.notes}
            onChange={(event) =>
              setRecipeLineForm({
                ...recipeLineForm,
                notes: event.target.value,
              })
            }
            className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60 resize-none"
            placeholder="Opcional"
          />
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
          >
            <Save size={18} />
            Guardar
          </button>

          {editingRecipeLine && (
            <button
              type="button"
              onClick={resetRecipeLineForm}
              className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default RecipeIngredientForm;
