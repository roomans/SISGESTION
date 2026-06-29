import { Search } from "lucide-react";

function InventoryStock({ stock = [], search, setSearch, loading, formatNumber }) {
  return <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card overflow-hidden">
    <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between border-b border-tanta-primary/15">
      <div><h2 className="text-xl font-bold">Stock actual</h2><p className="text-sm opacity-65 mt-1">Stock consolidado por insumo, almacén y ubicación.</p></div>
      <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 w-full md:w-[340px] border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition"><Search size={18} className="text-tanta-primary dark:text-[#f0b36d]" /><input className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50" placeholder="Buscar insumo..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    </div>
    <div className="overflow-x-auto custom-scrollbar"><table className="w-full min-w-[980px] table-fixed text-left"><thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white"><tr><th className="p-4 w-[150px]">Código</th><th className="p-4 w-[260px]">Insumo</th><th className="p-4 w-[180px]">Almacén</th><th className="p-4 w-[180px]">Ubicación</th><th className="p-4 w-[160px]">Stock</th><th className="p-4 w-[120px]">Unidad</th></tr></thead><tbody>{stock.map((item) => <tr key={`${item.ingredient_id}-${item.warehouse_id}-${item.location_id}-${item.unit_id}`} className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"><td className="p-4 font-medium">{item.ingredient_code}</td><td className="p-4"><div className="truncate" title={item.ingredient_name}>{item.ingredient_name}</div></td><td className="p-4 opacity-80">{item.warehouse_name}</td><td className="p-4 opacity-80">{item.location_name}</td><td className="p-4 font-semibold text-tanta-secondary dark:text-[#f0b36d]">{formatNumber(item.stock_quantity)}</td><td className="p-4">{item.unit_code}</td></tr>)}{!loading && stock.length === 0 && <tr><td colSpan="6" className="p-8 text-center opacity-60">No hay stock registrado.</td></tr>}{loading && <tr><td colSpan="6" className="p-8 text-center opacity-60">Cargando stock...</td></tr>}</tbody></table></div>
  </div>;
}

export default InventoryStock;
