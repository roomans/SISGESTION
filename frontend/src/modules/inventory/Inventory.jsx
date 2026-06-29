import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Boxes, ClipboardList, PackagePlus, RotateCcw } from "lucide-react";
import { api } from "../../services/api";
import InventoryStock from "./InventoryStock";
import InventoryLots from "./InventoryLots";
import InventoryMovements from "./InventoryMovements";
import InventoryExpirationAlerts from "./InventoryExpirationAlerts";
import InventoryReceiptDrawer from "./InventoryReceiptDrawer";
import InventoryWasteDrawer from "./InventoryWasteDrawer";

const defaultFormatCurrency = (value, currency = "PEN") => {
  if (value === null || value === undefined || value === "") return "-";
  return new Intl.NumberFormat("es-PE", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(Number(value));
};

const defaultFormatNumber = (value, decimals = 4) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("es-PE", { maximumFractionDigits: decimals });
};

function Inventory({ ingredients = [], suppliers = [], units = [], presentations = [], loggedUser, formatCurrency = defaultFormatCurrency, formatNumber = defaultFormatNumber }) {
  const [inventoryTab, setInventoryTab] = useState("stock");
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stock, setStock] = useState([]);
  const [stockByLot, setStockByLot] = useState([]);
  const [lots, setLots] = useState([]);
  const [movements, setMovements] = useState([]);
  const [expirationAlerts, setExpirationAlerts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceiptDrawer, setShowReceiptDrawer] = useState(false);
  const [showWasteDrawer, setShowWasteDrawer] = useState(false);

  const defaultWarehouse = useMemo(() => warehouses.find((item) => item.is_default) || warehouses[0], [warehouses]);
  const defaultLocation = useMemo(() => locations.find((item) => item.is_default && (!defaultWarehouse || item.warehouse_id === defaultWarehouse.warehouse_id)) || locations[0], [locations, defaultWarehouse]);

  const loadInventoryCatalogs = async () => {
    const [warehousesResponse, locationsResponse] = await Promise.all([
      api.get("/inventory/warehouses"),
      api.get("/inventory/locations"),
    ]);
    setWarehouses(warehousesResponse.data || []);
    setLocations(locationsResponse.data || []);
  };

  const loadStock = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/stock", { params: { search: search || undefined, only_positive: false } });
      setStock(response.data || []);
    } catch (error) {
      console.error("Error cargando stock:", error);
      alert(error.response?.data?.message || "Error cargando stock");
    } finally { setLoading(false); }
  };

  const loadStockByLot = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/stock-by-lot", { params: { search: search || undefined, only_positive: false } });
      setStockByLot(response.data || []);
    } catch (error) {
      console.error("Error cargando stock por lote:", error);
      alert(error.response?.data?.message || "Error cargando stock por lote");
    } finally { setLoading(false); }
  };

  const loadLots = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/lots", { params: { search: search || undefined } });
      setLots(response.data || []);
    } catch (error) {
      console.error("Error cargando lotes:", error);
      alert(error.response?.data?.message || "Error cargando lotes");
    } finally { setLoading(false); }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/movements", { params: { limit: 100 } });
      setMovements(response.data || []);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      alert(error.response?.data?.message || "Error cargando movimientos");
    } finally { setLoading(false); }
  };

  const loadExpirationAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/expiration-alerts", { params: { days: 30 } });
      setExpirationAlerts(response.data || []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      alert(error.response?.data?.message || "Error cargando alertas");
    } finally { setLoading(false); }
  };

  const refreshAll = async () => Promise.all([loadStock(), loadStockByLot(), loadLots(), loadMovements(), loadExpirationAlerts()]);

  const refreshCurrentTab = async () => {
    if (inventoryTab === "stock") return loadStock();
    if (inventoryTab === "lots") return Promise.all([loadLots(), loadStockByLot()]);
    if (inventoryTab === "movements") return loadMovements();
    if (inventoryTab === "alerts") return loadExpirationAlerts();
  };

  useEffect(() => {
    loadInventoryCatalogs().catch((error) => console.error("Error cargando catálogos inventario:", error));
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => refreshCurrentTab(), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, inventoryTab]);

  const tabs = [
    { key: "stock", label: "Stock actual", icon: Boxes },
    { key: "lots", label: "Lotes", icon: Archive },
    { key: "movements", label: "Movimientos", icon: ClipboardList },
    { key: "alerts", label: "Vencimientos", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">Tanta House · Inventario</p>
        <h1 className="text-3xl font-bold">Inventario y Kardex</h1>
        <p className="opacity-75 mt-2">Controla stock actual, lotes, movimientos, ingresos por compra, mermas y vencimientos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Kpi label="Insumos con stock" value={stock.length} />
        <Kpi label="Lotes registrados" value={lots.length} />
        <Kpi label="Movimientos" value={movements.length} />
        <Kpi label="Alertas vencimiento" value={expirationAlerts.length} danger />
      </div>

      <div className="mb-6 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <div className="inline-flex bg-tanta-bg/60 dark:bg-[#1a111f] p-1 rounded-xl border border-tanta-primary/20 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = inventoryTab === tab.key;
            return (
              <button key={tab.key} type="button" onClick={() => setInventoryTab(tab.key)} className={`px-4 py-2 text-sm rounded-lg transition flex items-center gap-2 whitespace-nowrap ${active ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm" : "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"}`}>
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button type="button" onClick={() => setShowReceiptDrawer(true)} className="bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition whitespace-nowrap"><PackagePlus size={18} />Ingreso por compra</button>
          <button type="button" onClick={() => setShowWasteDrawer(true)} className="rounded-xl px-5 py-3 bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 hover:bg-red-500/20 transition flex items-center justify-center gap-2 whitespace-nowrap"><RotateCcw size={18} />Registrar merma</button>
        </div>
      </div>

      {inventoryTab === "stock" && <InventoryStock stock={stock} search={search} setSearch={setSearch} loading={loading} formatNumber={formatNumber} />}
      {inventoryTab === "lots" && <InventoryLots lots={lots} search={search} setSearch={setSearch} loading={loading} formatNumber={formatNumber} formatCurrency={formatCurrency} />}
      {inventoryTab === "movements" && <InventoryMovements movements={movements} loading={loading} formatCurrency={formatCurrency} />}
      {inventoryTab === "alerts" && <InventoryExpirationAlerts alerts={expirationAlerts} loading={loading} formatNumber={formatNumber} />}

      {showReceiptDrawer && <InventoryReceiptDrawer ingredients={ingredients} suppliers={suppliers} units={units} presentations={presentations} warehouses={warehouses} locations={locations} defaultWarehouse={defaultWarehouse} defaultLocation={defaultLocation} loggedUser={loggedUser} onClose={() => setShowReceiptDrawer(false)} onSaved={async () => { setShowReceiptDrawer(false); await refreshAll(); }} />}
      {showWasteDrawer && <InventoryWasteDrawer stockByLot={stockByLot} loggedUser={loggedUser} onClose={() => setShowWasteDrawer(false)} onSaved={async () => { setShowWasteDrawer(false); await refreshAll(); }} />}
    </div>
  );
}

function Kpi({ label, value, danger }) {
  return <div className="rounded-2xl p-4 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 shadow-card"><p className="text-xs opacity-65">{label}</p><h2 className={`text-2xl font-bold mt-1 ${danger ? "text-red-600 dark:text-red-300" : ""}`}>{value}</h2></div>;
}

export default Inventory;
