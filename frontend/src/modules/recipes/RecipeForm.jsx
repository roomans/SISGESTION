import { ChefHat, Pencil, Save } from "lucide-react";

function RecipeForm({
  units = [],
  recipeForm,
  setRecipeForm,
  editingRecipe,
  handleSaveRecipe,
  resetRecipeForm,
  isDrawer = false,
}) {
  const laborType = recipeForm.labor_cost_type || "PERCENTAGE";

  const fieldClass =
    "w-full rounded-xl px-4 py-2.5 text-sm bg-tanta-bg/80 dark:bg-[#2a1b30] border border-tanta-primary/20 dark:border-tanta-primary/25 outline-none focus:border-tanta-primary/60 transition";

  const labelClass = "text-xs font-medium opacity-75";

  const sectionClass =
    "rounded-2xl p-4 bg-[#F3EFDC]/65 dark:bg-[#1b1120]/65 border border-tanta-primary/15 dark:border-tanta-primary/20";

  const sectionTitleClass =
    "text-sm font-semibold text-tanta-secondary dark:text-[#f0b36d]";

  const sectionSubtitleClass = "text-xs opacity-55 mt-1 leading-relaxed";

  const Field = ({ label, children }) => (
    <div className="space-y-1.5 min-w-0">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );

  return (
    <form
      onSubmit={handleSaveRecipe}
      className={`${
        isDrawer
          ? "rounded-2xl p-0 bg-transparent border-0 shadow-none"
          : "rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
      }`}
    >
      {!isDrawer && (
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center shrink-0">
            {editingRecipe ? <Pencil size={18} /> : <ChefHat size={18} />}
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">
              {editingRecipe ? "Editar receta" : "Nueva receta"}
            </h2>

            <p className="text-xs opacity-60 mt-1 leading-relaxed">
              Configura rendimiento, costos y utilidad.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <section className={sectionClass}>
          <div className="mb-4">
            <h3 className={sectionTitleClass}>Datos generales</h3>
            <p className={sectionSubtitleClass}>
              Identificación principal de la receta.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Field label="Código">
              <input
                value={recipeForm.recipe_code}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    recipe_code: event.target.value,
                  })
                }
                className={fieldClass}
                placeholder="Ej: REC-ALF-001"
              />
            </Field>

            <Field label="Nombre">
              <input
                value={recipeForm.recipe_name}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    recipe_name: event.target.value,
                  })
                }
                className={fieldClass}
                placeholder="Ej: Alfajores clásicos"
              />
            </Field>

            <div className="xl:col-span-2">
              <Field label="Descripción">
                <textarea
                  value={recipeForm.description}
                  onChange={(event) =>
                    setRecipeForm({
                      ...recipeForm,
                      description: event.target.value,
                    })
                  }
                  rows="2"
                  className={`${fieldClass} resize-none`}
                  placeholder="Opcional"
                />
              </Field>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-4">
            <h3 className={sectionTitleClass}>Rendimiento</h3>
            <p className={sectionSubtitleClass}>
              Base para calcular el precio unitario.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Field label="Cantidad producida">
              <input
                type="number"
                step="0.0001"
                value={recipeForm.yield_quantity}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    yield_quantity: event.target.value,
                  })
                }
                className={fieldClass}
                placeholder="Ej: 24"
              />
            </Field>

            <Field label="Unidad de rendimiento">
              <select
                value={recipeForm.yield_unit_id || ""}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    yield_unit_id: event.target.value,
                  })
                }
                required
                className={fieldClass}
              >
                <option value="" disabled>
                  Selecciona una unidad
                </option>

                {units.map((item) => (
                  <option key={item.unit_id} value={item.unit_id}>
                    {item.unit_code} - {item.unit_name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-4">
            <h3 className={sectionTitleClass}>Costeo de producción</h3>
            <p className={sectionSubtitleClass}>
              Materia prima + mano de obra + indirectos.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-tanta-primary dark:text-[#f0b36d] mb-3">
                Mano de obra
              </p>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <Field label="Tipo de cálculo">
                  <select
                    value={laborType}
                    onChange={(event) =>
                      setRecipeForm({
                        ...recipeForm,
                        labor_cost_type: event.target.value,
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="PERCENTAGE">% sobre insumos</option>
                    <option value="FIXED">Monto fijo</option>
                    <option value="TIME_BASED" disabled>
                      Por tiempo (próximamente)
                    </option>
                  </select>
                </Field>

                {laborType === "PERCENTAGE" ? (
                  <Field label="Mano de obra %">
                    <input
                      type="number"
                      step="0.01"
                      value={recipeForm.labor_percentage}
                      onChange={(event) =>
                        setRecipeForm({
                          ...recipeForm,
                          labor_percentage: event.target.value,
                        })
                      }
                      className={fieldClass}
                      placeholder="Ej: 30"
                    />
                  </Field>
                ) : (
                  <Field label="Monto fijo mano de obra">
                    <input
                      type="number"
                      step="0.01"
                      value={recipeForm.labor_fixed_amount}
                      onChange={(event) =>
                        setRecipeForm({
                          ...recipeForm,
                          labor_fixed_amount: event.target.value,
                        })
                      }
                      className={fieldClass}
                      placeholder="Ej: 25"
                    />
                  </Field>
                )}

                <div className="xl:col-span-2">
                  <Field label="Tiempo estimado de producción (min)">
                    <input
                      type="number"
                      step="1"
                      value={recipeForm.estimated_production_minutes}
                      onChange={(event) =>
                        setRecipeForm({
                          ...recipeForm,
                          estimated_production_minutes: event.target.value,
                        })
                      }
                      className={fieldClass}
                      placeholder="Opcional"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="border-t border-tanta-primary/15 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-tanta-primary dark:text-[#f0b36d] mb-3">
                Costos indirectos
              </p>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <Field label="Indirectos producción %">
                  <input
                    type="number"
                    step="0.01"
                    value={recipeForm.production_overhead_percentage}
                    onChange={(event) =>
                      setRecipeForm({
                        ...recipeForm,
                        production_overhead_percentage: event.target.value,
                      })
                    }
                    className={fieldClass}
                    placeholder="Ej: 10"
                  />
                </Field>

                <Field label="Indirectos monto fijo">
                  <input
                    type="number"
                    step="0.01"
                    value={recipeForm.production_overhead_fixed_amount}
                    onChange={(event) =>
                      setRecipeForm({
                        ...recipeForm,
                        production_overhead_fixed_amount: event.target.value,
                      })
                    }
                    className={fieldClass}
                    placeholder="Ej: 5"
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-4">
            <h3 className={sectionTitleClass}>Utilidad y precio</h3>
            <p className={sectionSubtitleClass}>
              Aplica utilidad para sugerir precio final.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <Field label="Tipo de utilidad">
              <select
                value={recipeForm.profit_calculation_type || "MARKUP"}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    profit_calculation_type: event.target.value,
                  })
                }
                className={fieldClass}
              >
                <option value="MARKUP">% sobre costo producción</option>
                <option value="MARGIN">Margen real sobre precio</option>
              </select>
            </Field>

            <Field label="Utilidad %">
              <input
                type="number"
                step="0.01"
                value={recipeForm.profit_percentage}
                onChange={(event) =>
                  setRecipeForm({
                    ...recipeForm,
                    profit_percentage: event.target.value,
                  })
                }
                className={fieldClass}
                placeholder="Ej: 35"
              />
            </Field>
          </div>

          <div className="mt-4 rounded-xl px-4 py-3 bg-tanta-primary/10 border border-tanta-primary/15 text-xs opacity-70 leading-relaxed">
            <span className="font-semibold">Fórmula:</span> materia prima +
            mano de obra + indirectos = costo producción. Luego se aplica la
            utilidad para calcular el precio sugerido.
          </div>
        </section>

        <section className={sectionClass}>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={recipeForm.is_active}
              onChange={(event) =>
                setRecipeForm({
                  ...recipeForm,
                  is_active: event.target.checked,
                })
              }
            />
            <span>Receta activa</span>
          </label>
        </section>

        <div className="sticky bottom-0 bg-[#F3EFDC]/90 dark:bg-[#160f1b]/90 backdrop-blur pt-3 pb-1 flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
          >
            <Save size={17} />
            Guardar
          </button>

          {editingRecipe && (
            <button
              type="button"
              onClick={resetRecipeForm}
              className="rounded-xl px-5 py-3 text-sm border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
