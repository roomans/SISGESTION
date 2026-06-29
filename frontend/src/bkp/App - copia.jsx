import logo from "./assets/logo.png";
import { useEffect, useState } from "react";
import { api } from "./services/api";
import { Search, PackagePlus } from "lucide-react";

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/ingredients")
      .then((response) => setIngredients(response.data))
      .catch((error) => console.error(error));
  }, []);

  const filteredIngredients = ingredients.filter((item) =>
    item.ingredient_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-tanta-bg p-8">
      <section className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">

  <img
    src={logo}
    alt="Tanta House"
    className="h-16 object-contain"
  />

  <div>
    <h1 className="text-3xl font-bold text-tanta-dark">
      Gestión de insumos
    </h1>

    <p className="text-tanta-dark/70 mt-1">
      Controla tus ingredientes, empaques y costos.
    </p>
  </div>

</div>

        {/* SEARCH + BUTTON */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex gap-4 items-center">
          
          <div className="flex items-center gap-2 bg-tanta-fold rounded-xl px-4 py-3 flex-1">
            <Search size={18} className="text-tanta-dark/60" />
            <input
              className="bg-transparent outline-none w-full text-tanta-dark"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="bg-tanta-primary text-white rounded-xl px-5 py-3 flex items-center gap-2 hover:bg-tanta-secondary transition">
            <PackagePlus size={18} />
            Nuevo insumo
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left">
            
            <thead className="bg-tanta-fold text-tanta-dark">
              <tr>
                <th className="p-4">Código</th>
                <th className="p-4">Insumo</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Unidad</th>
                <th className="p-4">Stock mínimo</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>

            <tbody>
              {filteredIngredients.map((item) => (
                <tr key={item.ingredient_id} className="border-t hover:bg-tanta-bg/40 transition">
                  
                  <td className="p-4 text-tanta-dark">
                    {item.ingredient_code}
                  </td>

                  <td className="p-4 font-medium text-tanta-dark">
                    {item.ingredient_name}
                  </td>

                  <td className="p-4 text-tanta-dark/80">
                    {item.category_name}
                  </td>

                  <td className="p-4 text-tanta-dark/80">
                    {item.unit_code}
                  </td>

                  <td className="p-4 text-tanta-dark/80">
                    {item.minimum_stock}
                  </td>

                  <td className="p-4">
                    <span className="bg-tanta-primary/20 text-tanta-primary px-3 py-1 rounded-full text-sm">
                      Activo
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </section>
    </main>
  );
}

export default App;