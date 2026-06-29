import { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tags,
  UsersRound,
  FileText,
} from "lucide-react";
import { api } from "../../services/api";

import Customers from "./Customers";
import CustomerFormDrawer from "./CustomerFormDrawer";
import CustomerDetailDrawer from "./CustomerDetailDrawer";
import Campaigns from "./Campaigns";
import SourceChannels from "./SourceChannels";
import Quotes from "./Quotes";

const tabs = [
  {
    key: "customers",
    label: "Clientes",
    icon: UsersRound,
    description: "Base CRM de clientes y contactos comerciales.",
  },
  {
    key: "quotes",
    label: "Cotizaciones",
    icon: FileText,
    description: "Propuestas comerciales, IGV, productos y PDF.",
  },
  {
    key: "campaigns",
    label: "Campañas",
    icon: Megaphone,
    description: "Fechas comerciales, temporadas y acciones especiales.",
  },
  {
    key: "channels",
    label: "Canales",
    icon: Tags,
    description: "Origen comercial: WhatsApp, Instagram, TikTok, feria, referido.",
  },
];

function Sales({ loggedUser }) {
  const [activeTab, setActiveTab] = useState("customers");

  const [customers, setCustomers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [sourceChannels, setSourceChannels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const currentTab = tabs.find((item) => item.key === activeTab) || tabs[0];

  const stats = useMemo(() => {
    const activeCustomers = customers.filter((item) => item.is_active).length;
    const promoCustomers = customers.filter((item) => item.accepts_promotions).length;
    const corporateCustomers = customers.filter((item) => item.is_corporate).length;
    const activeCampaigns = campaigns.filter((item) => item.is_active).length;

    return {
      activeCustomers,
      promoCustomers,
      corporateCustomers,
      activeCampaigns,
    };
  }, [customers, campaigns]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [customersResponse, campaignsResponse, channelsResponse] =
        await Promise.all([
          api.get("/customers"),
          api.get("/sales-catalogs/campaigns"),
          api.get("/sales-catalogs/source-channels"),
        ]);

      setCustomers(customersResponse.data || []);
      setCampaigns(campaignsResponse.data || []);
      setSourceChannels(channelsResponse.data || []);
    } catch (error) {
      console.error("Error cargando módulo comercial:", error);
      alert(
        error.response?.data?.message ||
          "No se pudo cargar la información del módulo comercial"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  const handleSavedCustomer = async () => {
    setShowCustomerForm(false);
    setEditingCustomer(null);
    await loadInitialData();
  };

  const handleViewCustomer = async (customer) => {
    try {
      const response = await api.get(`/customers/${customer.customer_id}`);
      setSelectedCustomer(response.data);
    } catch (error) {
      console.error("Error consultando cliente:", error);
      setSelectedCustomer(customer);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;

    const term = search.trim().toLowerCase();

    return customers.filter((item) => {
      return (
        item.customer_code?.toLowerCase().includes(term) ||
        item.customer_name?.toLowerCase().includes(term) ||
        item.commercial_name?.toLowerCase().includes(term) ||
        item.document_number?.toLowerCase().includes(term) ||
        item.phone?.toLowerCase().includes(term) ||
        item.secondary_phone?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term) ||
        item.instagram?.toLowerCase().includes(term) ||
        item.tiktok?.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <section className="relative overflow-hidden rounded-3xl border border-tanta-primary/20 dark:border-tanta-primary/30 bg-gradient-to-br from-[#F3EFDC] via-[#F6E7D2] to-[#ECC9A9] dark:from-[#201426] dark:via-[#26172C] dark:to-[#372342] shadow-card">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-tanta-primary/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-[#56599A]/20 blur-3xl" />

        <div className="relative p-6 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/40 dark:bg-white/10 border border-white/40 text-xs font-semibold text-tanta-dark dark:text-[#f6d8bb] mb-4">
                <Sparkles size={14} />
                Módulo Comercial / CRM
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-tanta-dark dark:text-white">
                Clientes, cotizaciones y oportunidades comerciales
              </h1>

              <p className="mt-2 max-w-3xl text-sm lg:text-base opacity-75">
                Gestiona clientes, campañas, canales y propuestas comerciales para
                ordenar el crecimiento de Tanta House.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadInitialData}
                className="rounded-2xl px-4 py-3 border border-tanta-primary/25 bg-white/35 dark:bg-white/10 hover:bg-white/55 dark:hover:bg-white/15 transition flex items-center gap-2 text-sm"
              >
                <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
                Actualizar
              </button>

              {activeTab === "customers" && (
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="rounded-2xl px-5 py-3 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-lg shadow-tanta-primary/25 hover:scale-[1.01] transition flex items-center gap-2 text-sm"
                >
                  <Plus size={18} />
                  Nuevo cliente
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-7">
            <div className="rounded-2xl p-4 bg-white/45 dark:bg-white/10 border border-white/45">
              <p className="text-xs opacity-70">Clientes activos</p>
              <h2 className="text-2xl font-bold mt-1">{stats.activeCustomers}</h2>
            </div>

            <div className="rounded-2xl p-4 bg-white/45 dark:bg-white/10 border border-white/45">
              <p className="text-xs opacity-70">Aceptan promociones</p>
              <h2 className="text-2xl font-bold mt-1">{stats.promoCustomers}</h2>
            </div>

            <div className="rounded-2xl p-4 bg-white/45 dark:bg-white/10 border border-white/45">
              <p className="text-xs opacity-70">Corporativos</p>
              <h2 className="text-2xl font-bold mt-1">{stats.corporateCustomers}</h2>
            </div>

            <div className="rounded-2xl p-4 bg-white/45 dark:bg-white/10 border border-white/45">
              <p className="text-xs opacity-70">Campañas activas</p>
              <h2 className="text-2xl font-bold mt-1">{stats.activeCampaigns}</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl p-3 bg-[#F3EFDC]/80 dark:bg-[#1e1422]/90 border border-tanta-primary/20 dark:border-tanta-primary/30 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`rounded-2xl p-4 text-left border transition ${
                  active
                    ? "bg-tanta-primary text-white border-tanta-primary shadow-lg shadow-tanta-primary/25"
                    : "bg-white/35 dark:bg-white/5 border-tanta-primary/15 hover:border-tanta-primary/35 hover:bg-white/55 dark:hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      active ? "bg-white/20" : "bg-tanta-primary/10"
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div>
                    <h3 className="font-bold">{item.label}</h3>
                    <p className={`text-xs mt-1 ${active ? "text-white/80" : "opacity-65"}`}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/20 dark:border-tanta-primary/30 shadow-card overflow-hidden">
        <div className="p-5 border-b border-tanta-primary/15 dark:border-tanta-primary/20 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-tanta-primary dark:text-[#f0b36d]">
              {currentTab.label}
            </p>
            <h2 className="text-2xl font-bold">{currentTab.description}</h2>
          </div>

          {activeTab === "customers" && (
            <div className="relative w-full xl:w-[420px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-55"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, documento, teléfono, correo..."
                className="w-full rounded-2xl pl-11 pr-4 py-3 bg-white/60 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60 transition text-sm"
              />
            </div>
          )}
        </div>

        {activeTab === "customers" && (
          <Customers
            customers={filteredCustomers}
            loading={loading}
            sourceChannels={sourceChannels}
            onCreate={handleCreateCustomer}
            onEdit={handleEditCustomer}
            onView={handleViewCustomer}
            onRefresh={loadInitialData}
          />
        )}

        {activeTab === "quotes" && (
          <Quotes
            customers={customers}
            campaigns={campaigns}
            sourceChannels={sourceChannels}
            loggedUser={loggedUser}
          />
        )}

        {activeTab === "campaigns" && (
          <Campaigns
            campaigns={campaigns}
            loading={loading}
            loggedUser={loggedUser}
            onRefresh={loadInitialData}
          />
        )}

        {activeTab === "channels" && (
          <SourceChannels
            sourceChannels={sourceChannels}
            customers={customers}
          />
        )}
      </section>

      {showCustomerForm && (
        <CustomerFormDrawer
          customer={editingCustomer}
          sourceChannels={sourceChannels}
          loggedUser={loggedUser}
          onClose={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
          onSaved={handleSavedCustomer}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailDrawer
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(customer) => {
            setSelectedCustomer(null);
            handleEditCustomer(customer);
          }}
        />
      )}
    </div>
  );
}

export default Sales;
