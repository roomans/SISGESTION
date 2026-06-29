import { useState } from "react";
import { BookOpen, Calculator, ChefHat } from "lucide-react";
import RecipeList from "./RecipeList";
import RecipeCurrentCost from "./RecipeCurrentCost";
import RecipeSimulation from "./RecipeSimulation";

const defaultCurrencyFormatter = (value, currency = "PEN") => {
  if (value === null || value === undefined || value === "") return "-";

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(Number(value));
};

function Recipes({
  recipes = [],
  ingredients = [],
  units = [],

  selectedRecipe,
  selectedRecipeDetails,
  loadRecipeDetails,

  recipeForm,
  setRecipeForm,
  editingRecipe,
  handleSaveRecipe,
  resetRecipeForm,
  handleEditRecipe,
  handleDeleteRecipe,

  recipeLineForm,
  setRecipeLineForm,
  editingRecipeLine,
  handleSaveRecipeLine,
  resetRecipeLineForm,
  handleEditRecipeLine,
  handleDeleteRecipeLine,
  getIngredientStockUnitId,

  simulationDate,
  setSimulationDate,
  simulatedRecipeCost,
  currentRecipeCost,
  simulateRecipeCost,
  setSimulatedRecipeCost,

  formatCurrency = defaultCurrencyFormatter,
}) {
  const [recipeTab, setRecipeTab] = useState("recipes");
  const [recipeSearch, setRecipeSearch] = useState("");

  const filteredRecipes = recipes.filter(
    (item) =>
      item.recipe_code?.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      item.recipe_name?.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Producción
        </p>

        <h1 className="text-3xl font-bold">Recetas y costeo automático</h1>

        <p className="opacity-75 mt-2">
          Define recetas, agrega insumos, calcula costos actuales y simula
          escenarios según la variación histórica de precios.
        </p>
      </div>

      <div className="mb-6 inline-flex bg-tanta-bg/60 dark:bg-[#1a111f] p-1 rounded-xl border border-tanta-primary/20">
        <button
          type="button"
          onClick={() => setRecipeTab("recipes")}
          className={`px-4 py-2 text-sm rounded-lg transition flex items-center gap-2 ${
            recipeTab === "recipes"
              ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
              : "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
          }`}
        >
          <BookOpen size={16} />
          Recetas
        </button>

        <button
          type="button"
          onClick={() => setRecipeTab("costing")}
          className={`px-4 py-2 text-sm rounded-lg transition flex items-center gap-2 ${
            recipeTab === "costing"
              ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
              : "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
          }`}
        >
          <Calculator size={16} />
          Costeo actual
        </button>

        <button
          type="button"
          onClick={() => setRecipeTab("simulation")}
          className={`px-4 py-2 text-sm rounded-lg transition flex items-center gap-2 ${
            recipeTab === "simulation"
              ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
              : "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
          }`}
        >
          <ChefHat size={16} />
          Simulación por fecha
        </button>
      </div>

      {recipeTab === "recipes" && (
        <RecipeList
          filteredRecipes={filteredRecipes}
          units={units}
          recipeSearch={recipeSearch}
          setRecipeSearch={setRecipeSearch}
          recipeForm={recipeForm}
          setRecipeForm={setRecipeForm}
          editingRecipe={editingRecipe}
          handleSaveRecipe={handleSaveRecipe}
          resetRecipeForm={resetRecipeForm}
          handleEditRecipe={handleEditRecipe}
          handleDeleteRecipe={handleDeleteRecipe}
          loadRecipeDetails={loadRecipeDetails}
          setRecipeTab={setRecipeTab}
          formatCurrency={formatCurrency}
        />
      )}

      {recipeTab === "costing" && (
        <RecipeCurrentCost
          recipes={recipes}
          ingredients={ingredients}
          units={units}
          selectedRecipe={selectedRecipe}
          selectedRecipeDetails={selectedRecipeDetails}
          loadRecipeDetails={loadRecipeDetails}
          recipeLineForm={recipeLineForm}
          setRecipeLineForm={setRecipeLineForm}
          editingRecipeLine={editingRecipeLine}
          handleSaveRecipeLine={handleSaveRecipeLine}
          resetRecipeLineForm={resetRecipeLineForm}
          handleEditRecipeLine={handleEditRecipeLine}
          handleDeleteRecipeLine={handleDeleteRecipeLine}
          getIngredientStockUnitId={getIngredientStockUnitId}
          formatCurrency={formatCurrency}
        />
      )}

      {recipeTab === "simulation" && (
        <RecipeSimulation
          recipes={recipes}
          selectedRecipe={selectedRecipe}
          loadRecipeDetails={loadRecipeDetails}
          simulationDate={simulationDate}
          setSimulationDate={setSimulationDate}
          simulatedRecipeCost={simulatedRecipeCost}
          currentRecipeCost={currentRecipeCost}
          simulateRecipeCost={simulateRecipeCost}
          setSimulatedRecipeCost={setSimulatedRecipeCost}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

export default Recipes;
