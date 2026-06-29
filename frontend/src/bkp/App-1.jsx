import { useEffect, useState } from "react";
import { api } from "./services/api";
import {
  Search,
  PackagePlus,
  LayoutDashboard,
  Boxes,
  Truck,
  History,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Lock,
  Users,
  Save,
  Pencil,
  UserPlus,
  Trash2,
  PlusCircle,
  DollarSign,
  Tags,
  ChefHat,
  Calculator,
  BookOpen,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import logoLight from "./assets/logo.png";
import logoDark from "./assets/logo-dark.png";

import postre1 from "./assets/home/postre-1.jpg";
import postre2 from "./assets/home/postre-2.jpg";
import postre3 from "./assets/home/postre-3.jpg";

function App() {
  const [ingredients, setIngredients] = useState([]);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [ingredientPrices, setIngredientPrices] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRecipeDetails, setSelectedRecipeDetails] = useState(null);

  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [priceSearch, setPriceSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("Inicio");
  const [ingredientTab, setIngredientTab] = useState("catalog");
  const [recipeTab, setRecipeTab] = useState("recipes");
  const [darkMode, setDarkMode] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [historyTab, setHistoryTab] = useState("ingredient-prices");
  const [ingredientPriceHistory, setIngredientPriceHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  const [loggedUser, setLoggedUser] = useState(null);
  
  const [selectedHistoryIngredientId, setSelectedHistoryIngredientId] =useState("");
  const [ingredientPriceChart, setIngredientPriceChart] = useState([]);
  
  const [simulationDate, setSimulationDate] = useState("");
  const [simulatedRecipeCost, setSimulatedRecipeCost] = useState(null);
  const [currentRecipeCost, setCurrentRecipeCost] = useState(null);

  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    is_active: true,
  });

  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    supplier_name: "",
    document_type: "",
    document_number: "",
    phone: "",
    email: "",
    address: "",
    is_active: true,
  });

  const [editingIngredient, setEditingIngredient] = useState(null);
  const [ingredientForm, setIngredientForm] = useState({
    ingredient_code: "",
    ingredient_name: "",
    category_id: "",
    stock_unit_id: "",
    minimum_stock: 0,
    is_perishable: false,
    shelf_life_days: "",
    is_active: true,
  });

  const [editingPrice, setEditingPrice] = useState(null);
  const [priceForm, setPriceForm] = useState({
    ingredient_id: "",
    supplier_id: "",
    presentation_id: "",
    currency_code: "PEN",
    current_price: "",
    effective_from: "",
    last_purchase_date: "",
    is_active: true,
  });

  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    recipe_code: "",
    recipe_name: "",
    description: "",
    yield_quantity: 1,
    yield_unit_id: "",
    overhead_percentage: 0,
    profit_margin_percentage: 0,
    is_active: true,
  });

  const [editingRecipeLine, setEditingRecipeLine] = useState(null);
  const [recipeLineForm, setRecipeLineForm] = useState({
    ingredient_id: "",
    quantity: "",
    unit_id: "",
    notes: "",
  });

  const [presentationForm, setPresentationForm] = useState({
    ingredient_id: "",
    presentation_name: "",
    purchase_unit_id: "",
    stock_unit_id: "",
    conversion_factor: "",
    is_default: false,
  });

  const heroImages = [
    {
      image: postre1,
      title: "Control dulce, orden real",
      subtitle:
        "Gestiona tus insumos, empaques y costos con una experiencia pensada para Tanta House.",
    },
    {
      image: postre2,
      title: "Cada receta empieza con buen inventario",
      subtitle:
        "Mantén visibilidad sobre tus ingredientes clave y evita quedarte sin stock.",
    },
    {
      image: postre3,
      title: "La vida hay que saber hornearla",
      subtitle:
        "Una herramienta cálida, práctica y visual para acompañar el crecimiento de tu pastelería.",
    },
  ];

  const publicMenuItems = [{ label: "Inicio", icon: <Sparkles size={18} /> }];

  const privateMenuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Usuarios", icon: <Users size={18} /> },
    { label: "Insumos", icon: <Boxes size={18} /> },
    { label: "Recetas", icon: <ChefHat size={18} /> },
    { label: "Proveedores", icon: <Truck size={18} /> },
    { label: "Historial", icon: <History size={18} /> },
  ];

  const menuItems = loggedUser
    ? [...publicMenuItems, ...privateMenuItems]
    : publicMenuItems;

  const privateScreens = [
    "Dashboard",
    "Usuarios",
    "Insumos",
    "Recetas",
    "Proveedores",
    "Historial",
  ];
  
  const loadIngredientPriceChart = async (ingredientId) => {
	if (!ingredientId) {
		setIngredientPriceChart([]);
		return;
	}
	
	try {
		const response = await api.get(
		`/history/ingredient-prices/${ingredientId}/chart`
		);
	
		setIngredientPriceChart(
		response.data.map((item) => ({
			...item,
			price: Number(item.current_price),
			date: item.effective_from?.substring(0, 10),
		}))
		);
	} catch (error) {
		console.error("Error cargando gráfico de precios:", error);
	}
  };
  
const simulateRecipeCost = async () => {
  if (!selectedRecipe?.recipe_id || !simulationDate) {
    alert("Selecciona una receta y una fecha de simulación");
    return;
  }

  try {
    const today = new Date().toISOString().substring(0, 10);

    const [simulationResponse, currentResponse] = await Promise.all([
      api.get(`/recipes/${selectedRecipe.recipe_id}/cost-simulation`, {
        params: {
          cost_date: simulationDate,
        },
      }),
      api.get(`/recipes/${selectedRecipe.recipe_id}/cost-simulation`, {
        params: {
          cost_date: today,
        },
      }),
    ]);

    setSimulatedRecipeCost(simulationResponse.data);
    setCurrentRecipeCost(currentResponse.data);
  } catch (error) {
    alert(error.response?.data?.message || "Error simulando costo");
  }
};
  
  const loadIngredientPriceHistory = async () => {
	  try {
		  const response = await api.get("/history/ingredient-prices");
		  setIngredientPriceHistory(response.data);
		  } catch (error) {
	  console.error("Error cargando historial de precios:", error);
	  }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedUser = localStorage.getItem("tanta_user");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    if (savedUser) {
      setLoggedUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!loggedUser && privateScreens.includes(activeMenu)) {
      setActiveMenu("Login");
    }
  }, [loggedUser, activeMenu]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (!loggedUser) return;

    loadIngredients();
    loadUsers();
    loadSuppliers();
    loadCatalogs();
    loadPresentations();
    loadIngredientPrices();
    loadRecipes();
  }, [loggedUser]);

	useEffect(() => {
	if (activeMenu === "Usuarios" && loggedUser) {
		loadUsers();
	}
	
	if (activeMenu === "Proveedores" && loggedUser) {
		loadSuppliers();
	}
	
	if (activeMenu === "Insumos" && loggedUser) {
		loadIngredients();
		loadPresentations();
		loadIngredientPrices();
		loadCatalogs();
		loadSuppliers();
	}
	
	if (activeMenu === "Recetas" && loggedUser) {
		loadRecipes();
		loadIngredients();
		loadCatalogs();
	}
	
	if (activeMenu === "Historial" && loggedUser) {
		loadIngredientPriceHistory();
	}
	}, [activeMenu, loggedUser]);

  const loadIngredients = async () => {
    try {
      const response = await api.get("/ingredients");
      setIngredients(response.data);
    } catch (error) {
      console.error("Error cargando insumos:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [categoriesResponse, unitsResponse] = await Promise.all([
        api.get("/catalogs/categories"),
        api.get("/catalogs/units"),
      ]);

      setCategories(categoriesResponse.data);
      setUnits(unitsResponse.data);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  const loadPresentations = async () => {
    try {
      const response = await api.get("/ingredient-prices/presentations");
      setPresentations(response.data);
    } catch (error) {
      console.error("Error cargando presentaciones:", error);
    }
  };

  const loadIngredientPrices = async () => {
    try {
      const response = await api.get("/ingredient-prices");
      setIngredientPrices(response.data);
    } catch (error) {
      console.error("Error cargando precios por proveedor:", error);
    }
  };

  const loadRecipes = async () => {
    try {
      const response = await api.get("/recipes");
      setRecipes(response.data);
    } catch (error) {
      console.error("Error cargando recetas:", error);
    }
  };

  const loadRecipeDetails = async (recipeId) => {
    if (!recipeId) return;

    try {
      const response = await api.get(`/recipes/${recipeId}/details`);
      setSelectedRecipe(response.data.recipe);
      setSelectedRecipeDetails(response.data);
    } catch (error) {
      console.error("Error cargando detalle de receta:", error);
    }
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }

    setDarkMode(!darkMode);
  };

  const handleMenuClick = (label) => {
    if (privateScreens.includes(label) && !loggedUser) {
      setActiveMenu("Login");
      return;
    }

    setActiveMenu(label);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await api.post("/auth/login", loginForm);

      setLoggedUser(response.data.user);
      localStorage.setItem("tanta_user", JSON.stringify(response.data.user));
      setActiveMenu("Dashboard");
      setLoginForm({ username: "", password: "" });
    } catch (error) {
      setLoginError(
        error.response?.data?.message || "No se pudo iniciar sesión"
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setIngredients([]);
    setUsers([]);
    setSuppliers([]);
    setIngredientPrices([]);
    setPresentations([]);
    setRecipes([]);
    setSelectedRecipe(null);
    setSelectedRecipeDetails(null);
    localStorage.removeItem("tanta_user");
    setActiveMenu("Inicio");
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      username: "",
      full_name: "",
      email: "",
      password: "",
      is_active: true,
    });
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierForm({
      supplier_name: "",
      document_type: "",
      document_number: "",
      phone: "",
      email: "",
      address: "",
      is_active: true,
    });
  };

  const resetIngredientForm = () => {
    setEditingIngredient(null);
    setIngredientForm({
      ingredient_code: "",
      ingredient_name: "",
      category_id: "",
      stock_unit_id: "",
      minimum_stock: 0,
      is_perishable: false,
      shelf_life_days: "",
      is_active: true,
    });
  };

  const resetPriceForm = () => {
    setEditingPrice(null);
    setPriceForm({
      ingredient_id: "",
      supplier_id: "",
      presentation_id: "",
      currency_code: "PEN",
      current_price: "",
      effective_from: "",
      last_purchase_date: "",
      is_active: true,
    });
  };

  const resetPresentationForm = () => {
    setPresentationForm({
      ingredient_id: "",
      presentation_name: "",
      purchase_unit_id: "",
      stock_unit_id: "",
      conversion_factor: "",
      is_default: false,
    });
  };

  const resetRecipeForm = () => {
    setEditingRecipe(null);
    setRecipeForm({
      recipe_code: "",
      recipe_name: "",
      description: "",
      yield_quantity: 1,
      yield_unit_id: "",
      overhead_percentage: 0,
      profit_margin_percentage: 0,
      is_active: true,
    });
  };

  const resetRecipeLineForm = () => {
    setEditingRecipeLine(null);
    setRecipeLineForm({
      ingredient_id: "",
      quantity: "",
      unit_id: "",
      notes: "",
    });
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...userForm,
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      if (editingUser) {
        await api.put(`/users/${editingUser.user_id}`, payload);
      } else {
        await api.post("/users", payload);
      }

      resetUserForm();
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando usuario");
    }
  };

  const handleSaveSupplier = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...supplierForm,
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.supplier_id}`, payload);
      } else {
        await api.post("/suppliers", payload);
      }

      resetSupplierForm();
      loadSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando proveedor");
    }
  };

  const handleSaveIngredient = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...ingredientForm,
        category_id: Number(ingredientForm.category_id),
        stock_unit_id: Number(ingredientForm.stock_unit_id),
        minimum_stock: Number(ingredientForm.minimum_stock || 0),
        shelf_life_days: ingredientForm.shelf_life_days
          ? Number(ingredientForm.shelf_life_days)
          : null,
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      if (editingIngredient) {
        await api.put(
          `/ingredients/${editingIngredient.ingredient_id}`,
          payload
        );
      } else {
        await api.post("/ingredients", payload);
      }

      resetIngredientForm();
      loadIngredients();
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando insumo");
    }
  };

  const handleSavePresentation = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...presentationForm,
        ingredient_id: Number(presentationForm.ingredient_id),
        purchase_unit_id: Number(presentationForm.purchase_unit_id),
        stock_unit_id: Number(presentationForm.stock_unit_id),
        conversion_factor: Number(presentationForm.conversion_factor),
        created_by: loggedUser?.user_id || 1,
      };

      await api.post("/ingredient-prices/presentations", payload);
      resetPresentationForm();
      loadPresentations();
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando presentación");
    }
  };

  const handleSavePrice = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...priceForm,
        ingredient_id: Number(priceForm.ingredient_id),
        supplier_id: Number(priceForm.supplier_id),
        presentation_id: Number(priceForm.presentation_id),
        current_price: Number(priceForm.current_price),
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      if (editingPrice) {
        await api.put(
          `/ingredient-prices/${editingPrice.ingredient_supplier_price_id}`,
          payload
        );
      } else {
        await api.post("/ingredient-prices", payload);
      }

      resetPriceForm();
      loadIngredientPrices();
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando precio");
    }
  };

  const handleSaveRecipe = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...recipeForm,
        yield_quantity: Number(recipeForm.yield_quantity || 1),
        yield_unit_id: Number(recipeForm.yield_unit_id),
        overhead_percentage: Number(recipeForm.overhead_percentage || 0),
        profit_margin_percentage: Number(recipeForm.profit_margin_percentage || 0),
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      let response;

      if (editingRecipe) {
        response = await api.put(`/recipes/${editingRecipe.recipe_id}`, payload);
      } else {
        response = await api.post("/recipes", payload);
      }

      resetRecipeForm();
      loadRecipes();

      const recipeId = response.data.recipe_id || editingRecipe?.recipe_id;
      if (recipeId) {
        loadRecipeDetails(recipeId);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando receta");
    }
  };

  const handleSaveRecipeLine = async (event) => {
    event.preventDefault();

    if (!selectedRecipe?.recipe_id) {
      alert("Primero selecciona una receta");
      return;
    }

    try {
      const payload = {
        ...recipeLineForm,
        ingredient_id: Number(recipeLineForm.ingredient_id),
        quantity: Number(recipeLineForm.quantity),
        unit_id: Number(recipeLineForm.unit_id),
        created_by: loggedUser?.user_id || 1,
        updated_by: loggedUser?.user_id || 1,
      };

      if (editingRecipeLine) {
        await api.put(
          `/recipes/${selectedRecipe.recipe_id}/ingredients/${editingRecipeLine.recipe_ingredient_id}`,
          payload
        );
      } else {
        await api.post(`/recipes/${selectedRecipe.recipe_id}/ingredients`, payload);
      }

      resetRecipeLineForm();
      loadRecipes();
      loadRecipeDetails(selectedRecipe.recipe_id);
    } catch (error) {
      alert(error.response?.data?.message || "Error guardando insumo en receta");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username || "",
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      is_active: user.is_active,
    });
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      supplier_name: supplier.supplier_name || "",
      document_type: supplier.document_type || "",
      document_number: supplier.document_number || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      is_active: supplier.is_active,
    });
  };

  const handleEditIngredient = (ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientForm({
      ingredient_code: ingredient.ingredient_code || "",
      ingredient_name: ingredient.ingredient_name || "",
      category_id: ingredient.category_id || "",
      stock_unit_id: ingredient.stock_unit_id || "",
      minimum_stock: ingredient.minimum_stock || 0,
      is_perishable: ingredient.is_perishable || false,
      shelf_life_days: ingredient.shelf_life_days || "",
      is_active: ingredient.is_active,
    });
    setIngredientTab("catalog");
  };

  const handleEditPrice = (price) => {
    setEditingPrice(price);
    setPriceForm({
      ingredient_id: price.ingredient_id || "",
      supplier_id: price.supplier_id || "",
      presentation_id: price.presentation_id || "",
      currency_code: price.currency_code || "PEN",
      current_price: price.current_price || "",
      effective_from: price.effective_from?.substring(0, 10) || "",
      last_purchase_date: price.last_purchase_date?.substring(0, 10) || "",
      is_active: price.is_active,
    });
    setIngredientTab("prices");
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setRecipeForm({
      recipe_code: recipe.recipe_code || "",
      recipe_name: recipe.recipe_name || "",
      description: recipe.description || "",
      yield_quantity: recipe.yield_quantity || 1,
      yield_unit_id: recipe.yield_unit_id || "",
      overhead_percentage: recipe.overhead_percentage || 0,
      profit_margin_percentage: recipe.profit_margin_percentage || 0,
      is_active: recipe.is_active,
    });
    setRecipeTab("recipes");
    loadRecipeDetails(recipe.recipe_id);
  };

  const handleEditRecipeLine = (line) => {
    setEditingRecipeLine(line);
    setRecipeLineForm({
      ingredient_id: line.ingredient_id || "",
      quantity: line.quantity || "",
      unit_id: line.unit_id || "",
      notes: line.notes || "",
    });
  };

  const handleDeleteSupplier = async (supplier) => {
    const confirmDelete = window.confirm(
      `¿Deseas eliminar/desactivar al proveedor "${supplier.supplier_name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/suppliers/${supplier.supplier_id}`, {
        data: {
          updated_by: loggedUser?.user_id || 1,
        },
      });

      if (editingSupplier?.supplier_id === supplier.supplier_id) {
        resetSupplierForm();
      }

      loadSuppliers();
    } catch (error) {
      alert(error.response?.data?.message || "Error eliminando proveedor");
    }
  };

  const handleDeleteIngredient = async (ingredient) => {
    const confirmDelete = window.confirm(
      `¿Deseas eliminar/desactivar el insumo "${ingredient.ingredient_name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/ingredients/${ingredient.ingredient_id}`, {
        data: {
          updated_by: loggedUser?.user_id || 1,
        },
      });

      if (editingIngredient?.ingredient_id === ingredient.ingredient_id) {
        resetIngredientForm();
      }

      loadIngredients();
    } catch (error) {
      alert(error.response?.data?.message || "Error eliminando insumo");
    }
  };

  const handleDeletePrice = async (price) => {
    const confirmDelete = window.confirm(
      `¿Deseas desactivar el precio de "${price.ingredient_name}" para "${price.supplier_name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/ingredient-prices/${price.ingredient_supplier_price_id}`,
        {
          data: {
            updated_by: loggedUser?.user_id || 1,
          },
        }
      );

      if (
        editingPrice?.ingredient_supplier_price_id ===
        price.ingredient_supplier_price_id
      ) {
        resetPriceForm();
      }

      loadIngredientPrices();
    } catch (error) {
      alert(error.response?.data?.message || "Error eliminando precio");
    }
  };

  const handleDeleteRecipe = async (recipe) => {
    const confirmDelete = window.confirm(
      `¿Deseas eliminar/desactivar la receta "${recipe.recipe_name}"?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/recipes/${recipe.recipe_id}`, {
        data: {
          updated_by: loggedUser?.user_id || 1,
        },
      });

      if (selectedRecipe?.recipe_id === recipe.recipe_id) {
        setSelectedRecipe(null);
        setSelectedRecipeDetails(null);
      }

      if (editingRecipe?.recipe_id === recipe.recipe_id) {
        resetRecipeForm();
      }

      loadRecipes();
    } catch (error) {
      alert(error.response?.data?.message || "Error eliminando receta");
    }
  };

  const handleDeleteRecipeLine = async (line) => {
    if (!selectedRecipe?.recipe_id) return;

    const confirmDelete = window.confirm(
      `¿Deseas retirar "${line.ingredient_name}" de la receta?`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(
        `/recipes/${selectedRecipe.recipe_id}/ingredients/${line.recipe_ingredient_id}`,
        {
          data: {
            updated_by: loggedUser?.user_id || 1,
          },
        }
      );

      if (editingRecipeLine?.recipe_ingredient_id === line.recipe_ingredient_id) {
        resetRecipeLineForm();
      }

      loadRecipes();
      loadRecipeDetails(selectedRecipe.recipe_id);
    } catch (error) {
      alert(error.response?.data?.message || "Error eliminando insumo de receta");
    }
  };

  const filteredIngredients = ingredients.filter((item) =>
    item.ingredient_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.ingredient_code?.toLowerCase().includes(search.toLowerCase()) ||
    item.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(
    (item) =>
      item.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      item.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      item.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (item) =>
      item.supplier_name
        ?.toLowerCase()
        .includes(supplierSearch.toLowerCase()) ||
      item.document_number
        ?.toLowerCase()
        .includes(supplierSearch.toLowerCase()) ||
      item.phone?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      item.email?.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const filteredPrices = ingredientPrices.filter(
    (item) =>
      item.ingredient_name?.toLowerCase().includes(priceSearch.toLowerCase()) ||
      item.ingredient_code?.toLowerCase().includes(priceSearch.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(priceSearch.toLowerCase()) ||
      item.presentation_name?.toLowerCase().includes(priceSearch.toLowerCase())
  );

  const filteredRecipes = recipes.filter(
    (item) =>
      item.recipe_code?.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      item.recipe_name?.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(recipeSearch.toLowerCase())
  );
  
  const filteredIngredientPriceHistory = ingredientPriceHistory.filter(
	(item) =>
		item.ingredient_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
		item.ingredient_code?.toLowerCase().includes(historySearch.toLowerCase()) ||
		item.supplier_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
		item.presentation_name?.toLowerCase().includes(historySearch.toLowerCase())
	);

  const getPresentationsByIngredient = (ingredientId) => {
    if (!ingredientId) return presentations;

    return presentations.filter(
      (item) => Number(item.ingredient_id) === Number(ingredientId)
    );
  };

  const getIngredientStockUnitId = (ingredientId) => {
    return (
      ingredients.find(
        (item) => Number(item.ingredient_id) === Number(ingredientId)
      )?.stock_unit_id || ""
    );
  };


  const selectedPricePresentation = presentations.find(
    (item) => Number(item.presentation_id) === Number(priceForm.presentation_id)
  );

  const calculatedUnitCost =
    selectedPricePresentation?.conversion_factor &&
    Number(selectedPricePresentation.conversion_factor) > 0 &&
    Number(priceForm.current_price) > 0
      ? Number(priceForm.current_price) /
        Number(selectedPricePresentation.conversion_factor)
      : null;

  const formatCurrency = (value, currency = "PEN") => {
    if (value === null || value === undefined || value === "") return "-";

    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(Number(value));
  };

  const renderLogin = () => (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-[2rem] overflow-hidden bg-[#F3EFDC]/90 dark:bg-[#1e1422]/95 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_40px_rgba(209,139,73,0.16)]">
        <div className="relative hidden lg:block">
          <img
            src={postre1}
            alt="Tanta House login"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#26172C]/85 via-[#26172C]/45 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-[#F3EFDC]">
            <p className="text-sm text-[#f0b36d] font-semibold mb-2">
              Tanta House
            </p>
            <h1 className="text-5xl font-bold leading-tight">
              Bienvenido a tu sistema
            </h1>
            <p className="mt-4 opacity-90">
              Gestiona tus insumos, costos y operación con una experiencia
              pensada para tu pastelería.
            </p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-8 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
              Acceso privado
            </p>
            <h1 className="text-4xl font-bold">Iniciar sesión</h1>
            <p className="opacity-75 mt-3">
              Ingresa con tu usuario para acceder al sistema.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium opacity-80">Usuario</label>
              <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
                <User size={18} className="text-tanta-primary" />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  placeholder="Ej: admin"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium opacity-80">
                Contraseña
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
                <Lock size={18} className="text-tanta-primary" />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  placeholder="Ingresa tu contraseña"
                  className="bg-transparent outline-none w-full"
                />
              </div>
            </div>

            {loginError && (
              <div className="rounded-xl px-4 py-3 bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20 text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn size={18} />
              {loginLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderHome = () => {
    const currentHero = heroImages[heroIndex];

    return (
      <div className="max-w-7xl mx-auto">
        <section className="relative overflow-hidden rounded-[2rem] min-h-[430px] bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_38px_rgba(209,139,73,0.16)]">
          <img
            src={currentHero.image}
            alt={currentHero.title}
            className="absolute inset-0 h-full w-full object-cover opacity-80 dark:opacity-45 transition-all duration-700"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#26172C]/85 via-[#26172C]/50 to-transparent dark:from-[#26172C]/95 dark:via-[#26172C]/70 dark:to-[#26172C]/20" />

          <div className="relative z-10 p-8 md:p-12 max-w-3xl text-[#F3EFDC]">
            <p className="text-sm font-semibold text-[#f0b36d] mb-3">
              Tanta House · Sistema de gestión
            </p>

            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              {currentHero.title}
            </h1>

            <p className="mt-5 text-lg opacity-90 max-w-2xl">
              {currentHero.subtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {loggedUser ? (
                <>
                  <button
                    onClick={() => setActiveMenu("Insumos")}
                    className="bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-tanta-primary/30 transition"
                  >
                    <Boxes size={18} />
                    Ver insumos
                  </button>

                  <button
                    onClick={() => setActiveMenu("Dashboard")}
                    className="bg-[#F3EFDC]/15 border border-[#F3EFDC]/30 text-[#F3EFDC] rounded-xl px-5 py-3 flex items-center gap-2 hover:bg-[#F3EFDC]/25 transition"
                  >
                    <LayoutDashboard size={18} />
                    Ir al dashboard
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveMenu("Login")}
                  className="bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-tanta-primary/30 transition"
                >
                  <LogIn size={18} />
                  Iniciar sesión
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Dashboard
        </p>
        <h1 className="text-3xl font-bold">Resumen general</h1>
        <p className="opacity-75 mt-2">
          Vista rápida de indicadores principales del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-5">
        <button
          onClick={() => {
            setActiveMenu("Insumos");
            setIngredientTab("catalog");
          }}
          className="text-left rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)] hover:scale-[1.01] transition"
        >
          <p className="text-sm opacity-70">Insumos activos</p>
          <h2 className="text-3xl font-bold mt-2">
            {ingredients.filter((item) => item.is_active).length}
          </h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-tanta-primary to-tanta-secondary" />
        </button>

        <button
          onClick={() => {
            setActiveMenu("Insumos");
            setIngredientTab("prices");
          }}
          className="text-left rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)] hover:scale-[1.01] transition"
        >
          <p className="text-sm opacity-70">Precios activos</p>
          <h2 className="text-3xl font-bold mt-2">
            {ingredientPrices.filter((item) => item.is_active).length}
          </h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-tanta-primary to-[#56599A]" />
        </button>

        <button
          onClick={() => setActiveMenu("Recetas")}
          className="text-left rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)] hover:scale-[1.01] transition"
        >
          <p className="text-sm opacity-70">Recetas activas</p>
          <h2 className="text-3xl font-bold mt-2">
            {recipes.filter((item) => item.is_active).length}
          </h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#56599A] to-tanta-secondary" />
        </button>

        <button
          onClick={() => setActiveMenu("Usuarios")}
          className="text-left rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)] hover:scale-[1.01] transition"
        >
          <p className="text-sm opacity-70">Usuarios registrados</p>
          <h2 className="text-3xl font-bold mt-2">{users.length}</h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[#56599A] to-tanta-primary" />
        </button>

        <button
          onClick={() => setActiveMenu("Proveedores")}
          className="text-left rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)] hover:scale-[1.01] transition"
        >
          <p className="text-sm opacity-70">Proveedores activos</p>
          <h2 className="text-3xl font-bold mt-2">
            {suppliers.filter((item) => item.is_active).length}
          </h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-tanta-secondary to-[#56599A]" />
        </button>

        <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_28px_rgba(209,139,73,0.12)]">
          <p className="text-sm opacity-70">Estado del sistema</p>
          <h2 className="text-3xl font-bold mt-2">Activo</h2>
          <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-tanta-secondary to-[#F3EFDC]" />
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Seguridad
        </p>
        <h1 className="text-3xl font-bold">Gestión de usuarios</h1>
        <p className="opacity-75 mt-2">
          Registra, consulta y actualiza los usuarios que tendrán acceso al
          sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSaveUser}
          className="xl:col-span-1 rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
              {editingUser ? <Pencil size={20} /> : <UserPlus size={20} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {editingUser ? "Editar usuario" : "Nuevo usuario"}
              </h2>
              <p className="text-sm opacity-65">
                {editingUser
                  ? "Actualiza los datos del usuario."
                  : "Crea un nuevo acceso al sistema."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-80">Usuario</label>
              <input
                value={userForm.username}
                onChange={(e) =>
                  setUserForm({ ...userForm, username: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: admin"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Nombre completo</label>
              <input
                value={userForm.full_name}
                onChange={(e) =>
                  setUserForm({ ...userForm, full_name: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: Administrador Tanta House"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Email</label>
              <input
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="correo@tantahouse.com"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">
                Contraseña {editingUser && "(opcional)"}
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm({ ...userForm, password: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder={
                  editingUser
                    ? "Déjalo vacío para conservarla"
                    : "Contraseña inicial"
                }
              />
            </div>

            <label className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={userForm.is_active}
                onChange={(e) =>
                  setUserForm({ ...userForm, is_active: e.target.checked })
                }
              />
              <span>Usuario activo</span>
            </label>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
              >
                <Save size={18} />
                Guardar
              </button>

              {editingUser && (
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="xl:col-span-2 rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
          <div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
            <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
              <Search
                size={18}
                className="text-tanta-primary dark:text-[#f0b36d]"
              />
              <input
                className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[900px] table-fixed text-left">
              <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
                <tr>
                  <th className="p-4 w-[160px]">Usuario</th>
                  <th className="p-4 w-[260px]">Nombre</th>
                  <th className="p-4 w-[300px]">Email</th>
                  <th className="p-4 w-[120px]">Estado</th>
                  <th className="p-4 w-[140px]">Acción</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((item) => (
                  <tr
                    key={item.user_id}
                    className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                  >
                    <td className="p-4 font-medium">
                      <div className="truncate" title={item.username}>
                        {item.username}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div className="truncate" title={item.full_name}>
                        {item.full_name}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div className="truncate" title={item.email || "-"}>
                        {item.email || "-"}
                      </div>
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
                      <button
                        onClick={() => handleEditUser(item)}
                        className="rounded-xl px-4 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center opacity-60">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Compras
        </p>
        <h1 className="text-3xl font-bold">Gestión de proveedores</h1>
        <p className="opacity-75 mt-2">
          Registra, consulta, actualiza y desactiva proveedores del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSaveSupplier}
          className="xl:col-span-1 rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
              {editingSupplier ? (
                <Pencil size={20} />
              ) : (
                <PlusCircle size={20} />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {editingSupplier ? "Editar proveedor" : "Nuevo proveedor"}
              </h2>
              <p className="text-sm opacity-65">
                {editingSupplier
                  ? "Actualiza los datos del proveedor."
                  : "Crea un nuevo proveedor para compras."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-80">Nombre del proveedor</label>
              <input
                value={supplierForm.supplier_name}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    supplier_name: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: Mercado Central"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm opacity-80">Tipo doc.</label>
                <input
                  value={supplierForm.document_type}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      document_type: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  placeholder="RUC / DNI"
                />
              </div>

              <div>
                <label className="text-sm opacity-80">Nro. documento</label>
                <input
                  value={supplierForm.document_number}
                  onChange={(e) =>
                    setSupplierForm({
                      ...supplierForm,
                      document_number: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  placeholder="Ej: 20123456789"
                />
              </div>
            </div>

            <div>
              <label className="text-sm opacity-80">Teléfono</label>
              <input
                value={supplierForm.phone}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, phone: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: 999999999"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Email</label>
              <input
                value={supplierForm.email}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, email: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="proveedor@correo.com"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Dirección</label>
              <textarea
                value={supplierForm.address}
                onChange={(e) =>
                  setSupplierForm({ ...supplierForm, address: e.target.value })
                }
                rows="3"
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60 resize-none"
                placeholder="Dirección o referencia"
              />
            </div>

            <label className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={supplierForm.is_active}
                onChange={(e) =>
                  setSupplierForm({
                    ...supplierForm,
                    is_active: e.target.checked,
                  })
                }
              />
              <span>Proveedor activo</span>
            </label>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
              >
                <Save size={18} />
                Guardar
              </button>

              {editingSupplier && (
                <button
                  type="button"
                  onClick={resetSupplierForm}
                  className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="xl:col-span-2 rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
          <div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
            <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
              <Search
                size={18}
                className="text-tanta-primary dark:text-[#f0b36d]"
              />
              <input
                className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
                placeholder="Buscar proveedor..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[1120px] table-fixed text-left">
              <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
                <tr>
                  <th className="p-4 w-[240px]">Proveedor</th>
                  <th className="p-4 w-[120px]">Tipo doc.</th>
                  <th className="p-4 w-[170px]">Documento</th>
                  <th className="p-4 w-[150px]">Teléfono</th>
                  <th className="p-4 w-[240px]">Email</th>
                  <th className="p-4 w-[120px]">Estado</th>
                  <th className="p-4 w-[180px]">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((item) => (
                  <tr
                    key={item.supplier_id}
                    className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                  >
                    <td className="p-4 font-medium">
                      <div className="truncate" title={item.supplier_name}>
                        {item.supplier_name}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div className="truncate" title={item.document_type || "-"}>
                        {item.document_type || "-"}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div
                        className="truncate"
                        title={item.document_number || "-"}
                      >
                        {item.document_number || "-"}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div className="truncate" title={item.phone || "-"}>
                        {item.phone || "-"}
                      </div>
                    </td>

                    <td className="p-4 opacity-80">
                      <div className="truncate" title={item.email || "-"}>
                        {item.email || "-"}
                      </div>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSupplier(item)}
                          className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                        >
                          <Pencil size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => handleDeleteSupplier(item)}
                          className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                        >
                          <Trash2 size={16} />
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center opacity-60">
                      No se encontraron proveedores.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIngredientCatalog = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <form
        onSubmit={handleSaveIngredient}
        className="xl:col-span-1 rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
            {editingIngredient ? <Pencil size={20} /> : <PackagePlus size={20} />}
          </div>

          <div>
            <h2 className="text-2xl font-bold">
              {editingIngredient ? "Editar insumo" : "Nuevo insumo"}
            </h2>
            <p className="text-sm opacity-65">
              {editingIngredient
                ? "Actualiza los datos del insumo."
                : "Crea un nuevo insumo para tu inventario."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm opacity-80">Código</label>
            <input
              value={ingredientForm.ingredient_code}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  ingredient_code: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              placeholder="Ej: INS-0001"
            />
          </div>

          <div>
            <label className="text-sm opacity-80">Nombre del insumo</label>
            <input
              value={ingredientForm.ingredient_name}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  ingredient_name: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              placeholder="Ej: Harina pastelera"
            />
          </div>

          <div>
            <label className="text-sm opacity-80">Categoría</label>
            <select
              value={ingredientForm.category_id}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  category_id: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((item) => (
                <option key={item.category_id} value={item.category_id}>
                  {item.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm opacity-80">Unidad de stock</label>
            <select
              value={ingredientForm.stock_unit_id}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  stock_unit_id: e.target.value,
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
            <label className="text-sm opacity-80">Stock mínimo</label>
            <input
              type="number"
              step="0.0001"
              value={ingredientForm.minimum_stock}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  minimum_stock: e.target.value,
                })
              }
              className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              placeholder="Ej: 5"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ingredientForm.is_perishable}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  is_perishable: e.target.checked,
                })
              }
            />
            <span>Es perecible</span>
          </label>

          {ingredientForm.is_perishable && (
            <div>
              <label className="text-sm opacity-80">Vida útil en días</label>
              <input
                type="number"
                value={ingredientForm.shelf_life_days}
                onChange={(e) =>
                  setIngredientForm({
                    ...ingredientForm,
                    shelf_life_days: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: 7"
              />
            </div>
          )}

          <label className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              checked={ingredientForm.is_active}
              onChange={(e) =>
                setIngredientForm({
                  ...ingredientForm,
                  is_active: e.target.checked,
                })
              }
            />
            <span>Insumo activo</span>
          </label>

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
            >
              <Save size={18} />
              Guardar
            </button>

            {editingIngredient && (
              <button
                type="button"
                onClick={resetIngredientForm}
                className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="xl:col-span-2 rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
        <div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
          <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
            <Search
              size={18}
              className="text-tanta-primary dark:text-[#f0b36d]"
            />
            <input
              className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1080px] table-fixed text-left">
            <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
              <tr>
                <th className="p-4 w-[140px]">Código</th>
                <th className="p-4 w-[240px]">Insumo</th>
                <th className="p-4 w-[200px]">Categoría</th>
                <th className="p-4 w-[140px]">Unidad</th>
                <th className="p-4 w-[150px]">Stock mín.</th>
                <th className="p-4 w-[130px]">Estado</th>
                <th className="p-4 w-[180px]">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredIngredients.map((item) => (
                <tr
                  key={item.ingredient_id}
                  className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 dark:hover:bg-tanta-primary/10 transition"
                >
                  <td className="p-4 font-medium">
                    <div className="truncate" title={item.ingredient_code}>
                      {item.ingredient_code}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="truncate" title={item.ingredient_name}>
                      {item.ingredient_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    <div className="truncate" title={item.category_name}>
                      {item.category_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    <div className="truncate" title={item.unit_code}>
                      {item.unit_code}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">{item.minimum_stock}</td>

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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditIngredient(item)}
                        className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeleteIngredient(item)}
                        className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 size={16} />
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredIngredients.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center opacity-60">
                    No se encontraron insumos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderIngredientPrices = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form
          onSubmit={handleSavePresentation}
          className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
              <Tags size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Presentación</h2>
              <p className="text-sm opacity-65">
                Ejemplo: saco 25 KG, caja, bolsa o paquete.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm opacity-80">Insumo</label>
              <select
                value={presentationForm.ingredient_id}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    ingredient_id: e.target.value,
                    stock_unit_id:
                      ingredients.find(
                        (item) =>
                          Number(item.ingredient_id) === Number(e.target.value)
                      )?.stock_unit_id || "",
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
              <label className="text-sm opacity-80">Nombre presentación</label>
              <input
                value={presentationForm.presentation_name}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    presentation_name: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: Saco 25 KG"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Unidad compra</label>
              <select
                value={presentationForm.purchase_unit_id}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    purchase_unit_id: e.target.value,
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
              <label className="text-sm opacity-80">Unidad stock</label>
              <select
                value={presentationForm.stock_unit_id}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    stock_unit_id: e.target.value,
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
              <label className="text-sm opacity-80">Factor conversión</label>
              <input
                type="number"
                step="0.000001"
                value={presentationForm.conversion_factor}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    conversion_factor: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: 25"
              />
            </div>

            <label className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                checked={presentationForm.is_default}
                onChange={(e) =>
                  setPresentationForm({
                    ...presentationForm,
                    is_default: e.target.checked,
                  })
                }
              />
              <span>Presentación principal</span>
            </label>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
            >
              <Save size={18} />
              Guardar presentación
            </button>
          </div>
        </form>

        <form
          onSubmit={handleSavePrice}
          className="xl:col-span-2 rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
              {editingPrice ? <Pencil size={20} /> : <DollarSign size={20} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {editingPrice ? "Editar precio" : "Nuevo precio por proveedor"}
              </h2>
              <p className="text-sm opacity-65">
                Registra el precio vigente del insumo según proveedor y presentación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm opacity-80">Insumo</label>
              <select
                value={priceForm.ingredient_id}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    ingredient_id: e.target.value,
                    presentation_id: "",
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
              <label className="text-sm opacity-80">Proveedor</label>
              <select
                value={priceForm.supplier_id}
                onChange={(e) =>
                  setPriceForm({ ...priceForm, supplier_id: e.target.value })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              >
                <option value="">Seleccionar proveedor</option>
                {suppliers
                  .filter((item) => item.is_active)
                  .map((item) => (
                    <option key={item.supplier_id} value={item.supplier_id}>
                      {item.supplier_name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-sm opacity-80">Presentación</label>
              <select
                value={priceForm.presentation_id}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    presentation_id: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              >
                <option value="">Seleccionar presentación</option>
                {getPresentationsByIngredient(priceForm.ingredient_id).map(
                  (item) => (
                    <option
                      key={item.presentation_id}
                      value={item.presentation_id}
                    >
                      {item.presentation_name} · {item.conversion_factor}{" "}
                      {item.stock_unit_code}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-sm opacity-80">Moneda</label>
              <select
                value={priceForm.currency_code}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    currency_code: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              >
                <option value="PEN">PEN - Soles</option>
                <option value="USD">USD - Dólares</option>
              </select>
            </div>

            <div>
              <label className="text-sm opacity-80">Precio actual</label>
              <input
                type="number"
                step="0.0001"
                value={priceForm.current_price}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    current_price: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                placeholder="Ej: 118.00"
              />
            </div>

            <div className="rounded-xl px-4 py-3 bg-tanta-primary/10 dark:bg-tanta-primary/15 border border-tanta-primary/20">
              <p className="text-sm opacity-70">Costo unitario calculado</p>
              <p className="mt-1 text-xl font-bold text-tanta-secondary dark:text-[#f0b36d]">
                {calculatedUnitCost
                  ? `${formatCurrency(
                      calculatedUnitCost,
                      priceForm.currency_code
                    )} / ${selectedPricePresentation?.stock_unit_code || "unidad"}`
                  : "Selecciona presentación y precio"}
              </p>
              <p className="mt-1 text-xs opacity-60">
                Fórmula: precio actual / factor de conversión.
              </p>
            </div>

            <div>
              <label className="text-sm opacity-80">Vigente desde</label>
              <input
                type="date"
                value={priceForm.effective_from}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    effective_from: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              />
            </div>

            <div>
              <label className="text-sm opacity-80">Última compra</label>
              <input
                type="date"
                value={priceForm.last_purchase_date}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    last_purchase_date: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
              />
            </div>

            <label className="flex items-center gap-3 pt-8">
              <input
                type="checkbox"
                checked={priceForm.is_active}
                onChange={(e) =>
                  setPriceForm({
                    ...priceForm,
                    is_active: e.target.checked,
                  })
                }
              />
              <span>Precio activo</span>
            </label>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
            >
              <Save size={18} />
              Guardar precio
            </button>

            {editingPrice && (
              <button
                type="button"
                onClick={resetPriceForm}
                className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
        <div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
          <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
            <Search
              size={18}
              className="text-tanta-primary dark:text-[#f0b36d]"
            />
            <input
              className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
              placeholder="Buscar precio por insumo, proveedor o presentación..."
              value={priceSearch}
              onChange={(e) => setPriceSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1380px] table-fixed text-left">
            <thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
              <tr>
                <th className="p-4 w-[140px]">Código</th>
                <th className="p-4 w-[220px]">Insumo</th>
                <th className="p-4 w-[220px]">Proveedor</th>
                <th className="p-4 w-[220px]">Presentación</th>
                <th className="p-4 w-[120px]">Moneda</th>
                <th className="p-4 w-[130px]">Precio</th>
                <th className="p-4 w-[150px]">Costo unit.</th>
                <th className="p-4 w-[150px]">Vigente desde</th>
                <th className="p-4 w-[120px]">Estado</th>
                <th className="p-4 w-[180px]">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filteredPrices.map((item) => (
                <tr
                  key={item.ingredient_supplier_price_id}
                  className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
                >
                  <td className="p-4 font-medium">
                    <div className="truncate" title={item.ingredient_code}>
                      {item.ingredient_code}
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="truncate" title={item.ingredient_name}>
                      {item.ingredient_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    <div className="truncate" title={item.supplier_name}>
                      {item.supplier_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">
                    <div className="truncate" title={item.presentation_name}>
                      {item.presentation_name}
                    </div>
                  </td>

                  <td className="p-4 opacity-80">{item.currency_code}</td>

                  <td className="p-4 font-medium">
                    {formatCurrency(item.current_price, item.currency_code)}
                  </td>

                  <td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
                    {item.unit_cost
                      ? `${formatCurrency(item.unit_cost, item.currency_code)} / ${
                          item.stock_unit_code || "unidad"
                        }`
                      : "-"}
                  </td>

                  <td className="p-4 opacity-80">
                    {item.effective_from?.substring(0, 10) || "-"}
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPrice(item)}
                        className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        onClick={() => handleDeletePrice(item)}
                        className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                      >
                        <Trash2 size={16} />
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPrices.length === 0 && (
                <tr>
                  <td colSpan="10" className="p-8 text-center opacity-60">
                    No se encontraron precios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderIngredients = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Inventario
        </p>

        <h1 className="text-3xl font-bold">Gestión de insumos</h1>

        <p className="opacity-75 mt-2">
          Administra el catálogo de insumos y sus precios por proveedor dentro de
          una misma sección.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setIngredientTab("catalog")}
          className={`rounded-xl px-5 py-3 flex items-center gap-2 transition ${
            ingredientTab === "catalog"
              ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-lg shadow-tanta-primary/30"
              : "bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 hover:bg-tanta-primary/10"
          }`}
        >
          <Boxes size={18} />
          Catálogo de insumos
        </button>

        <button
          onClick={() => setIngredientTab("prices")}
          className={`rounded-xl px-5 py-3 flex items-center gap-2 transition ${
            ingredientTab === "prices"
              ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-lg shadow-tanta-primary/30"
              : "bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 hover:bg-tanta-primary/10"
          }`}
        >
          <DollarSign size={18} />
          Precios por proveedor
        </button>
      </div>

      {ingredientTab === "catalog" && renderIngredientCatalog()}
      {ingredientTab === "prices" && renderIngredientPrices()}
    </div>
  );

const calculateVariationPercent = (simulated, current) => {
  const simulatedValue = Number(simulated || 0);
  const currentValue = Number(current || 0);

  if (!currentValue) return null;

  return ((simulatedValue - currentValue) / currentValue) * 100;
};

  const renderRecipes = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House · Producción
        </p>
        <h1 className="text-3xl font-bold">Recetas y costeo automático</h1>
        <p className="opacity-75 mt-2">
          Define recetas, agrega insumos y calcula automáticamente costo total,
          costo unitario y precio sugerido.
        </p>
      </div>

		<div className="mb-6 inline-flex bg-tanta-bg/60 dark:bg-[#1a111f] p-1 rounded-xl border border-tanta-primary/20">
		<button
			onClick={() => setRecipeTab("recipes")}
			className={`px-4 py-2 text-sm rounded-lg transition ${
			recipeTab === "recipes"
				? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
				: "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
			}`}
		>
			Recetas
		</button>
		
		<button
			onClick={() => setRecipeTab("costing")}
			className={`px-4 py-2 text-sm rounded-lg transition ${
			recipeTab === "costing"
				? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
				: "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
			}`}
		>
			Costeo actual
		</button>
		
		<button
			onClick={() => setRecipeTab("simulation")}
			className={`px-4 py-2 text-sm rounded-lg transition ${
			recipeTab === "simulation"
				? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
				: "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/10"
			}`}
		>
			Simulación por fecha
		</button>
		</div>

      {recipeTab === "recipes" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <form
            onSubmit={handleSaveRecipe}
            className="xl:col-span-1 rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-xl bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] flex items-center justify-center">
                {editingRecipe ? <Pencil size={20} /> : <ChefHat size={20} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {editingRecipe ? "Editar receta" : "Nueva receta"}
                </h2>
                <p className="text-sm opacity-65">
                  Crea recetas base para productos de Tanta House.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm opacity-80">Código</label>
                <input
                  value={recipeForm.recipe_code}
                  onChange={(e) =>
                    setRecipeForm({ ...recipeForm, recipe_code: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  placeholder="Ej: REC-ALF-001"
                />
              </div>

              <div>
                <label className="text-sm opacity-80">Nombre de receta</label>
                <input
                  value={recipeForm.recipe_name}
                  onChange={(e) =>
                    setRecipeForm({ ...recipeForm, recipe_name: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  placeholder="Ej: Alfajores clásicos"
                />
              </div>

              <div>
                <label className="text-sm opacity-80">Descripción</label>
                <textarea
                  value={recipeForm.description}
                  onChange={(e) =>
                    setRecipeForm({ ...recipeForm, description: e.target.value })
                  }
                  rows="3"
                  className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60 resize-none"
                  placeholder="Breve descripción de la receta"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm opacity-80">Rendimiento</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={recipeForm.yield_quantity}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        yield_quantity: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                    placeholder="Ej: 24"
                  />
                </div>

                <div>
                  <label className="text-sm opacity-80">Unidad</label>
                  <select
					value={recipeForm.yield_unit_id}
					onChange={(e) =>
						setRecipeForm({
						...recipeForm,
						yield_unit_id: e.target.value,
						})
					}
					className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
					>
				<option value="" disabled></option>
				{units.map((item) => (
					<option key={item.unit_id} value={item.unit_id}>
					{item.unit_code} - {item.unit_name}
					</option>
				))}
				</select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm opacity-80">Gastos indirectos %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recipeForm.overhead_percentage}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        overhead_percentage: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  />
                </div>

                <div>
                  <label className="text-sm opacity-80">Margen sugerido %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={recipeForm.profit_margin_percentage}
                    onChange={(e) =>
                      setRecipeForm({
                        ...recipeForm,
                        profit_margin_percentage: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={recipeForm.is_active}
                  onChange={(e) =>
                    setRecipeForm({ ...recipeForm, is_active: e.target.checked })
                  }
                />
                <span>Receta activa</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
                >
                  <Save size={18} />
                  Guardar
                </button>

                {editingRecipe && (
                  <button
                    type="button"
                    onClick={resetRecipeForm}
                    className="rounded-xl px-5 py-3 border border-tanta-primary/30 hover:bg-tanta-primary/10 transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="xl:col-span-2 rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
            <div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
              <div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
                <Search size={18} className="text-tanta-primary dark:text-[#f0b36d]" />
                <input
                  className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
                  placeholder="Buscar receta..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[1080px] table-fixed text-left">
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

                      <td className="p-4 font-medium">
                        {formatCurrency(item.total_cost, "PEN")}
                      </td>

                      <td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
                        {formatCurrency(item.suggested_price, "PEN")}
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
                        <div className="flex gap-2">
                          <button
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
                            onClick={() => handleEditRecipe(item)}
                            className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                          >
                            <Pencil size={16} />
                            Editar
                          </button>

                          <button
                            onClick={() => handleDeleteRecipe(item)}
                            className="rounded-xl px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/20 transition flex items-center gap-2 whitespace-nowrap"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRecipes.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center opacity-60">
                        No se encontraron recetas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {recipeTab === "costing" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <div className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_30px_rgba(209,139,73,0.14)]">
              <h2 className="text-2xl font-bold mb-4">Seleccionar receta</h2>

              <select
                value={selectedRecipe?.recipe_id || ""}
                onChange={(e) => loadRecipeDetails(e.target.value)}
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
                    Usa la unidad de stock del insumo para un costeo correcto.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm opacity-80">Insumo</label>
                  <select
                    value={recipeLineForm.ingredient_id}
                    onChange={(e) =>
                      setRecipeLineForm({
                        ...recipeLineForm,
                        ingredient_id: e.target.value,
                        unit_id: getIngredientStockUnitId(e.target.value),
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
                    onChange={(e) =>
                      setRecipeLineForm({
                        ...recipeLineForm,
                        quantity: e.target.value,
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
                    onChange={(e) =>
                      setRecipeLineForm({
                        ...recipeLineForm,
                        unit_id: e.target.value,
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
                    onChange={(e) =>
                      setRecipeLineForm({
                        ...recipeLineForm,
                        notes: e.target.value,
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
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card">
                <p className="text-sm opacity-70">Costo insumos</p>
                <h2 className="text-2xl font-bold mt-2">
                  {formatCurrency(selectedRecipeDetails?.cost?.raw_material_cost, "PEN")}
                </h2>
              </div>

              <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card">
                <p className="text-sm opacity-70">Costo total</p>
                <h2 className="text-2xl font-bold mt-2">
                  {formatCurrency(selectedRecipeDetails?.cost?.total_cost, "PEN")}
                </h2>
              </div>

              <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card">
                <p className="text-sm opacity-70">Precio sugerido</p>
                <h2 className="text-2xl font-bold mt-2 text-tanta-secondary dark:text-[#f0b36d]">
                  {formatCurrency(selectedRecipeDetails?.cost?.suggested_price, "PEN")}
                </h2>
              </div>

              <div className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card">
                <p className="text-sm opacity-70">Precio unitario</p>
                <h2 className="text-2xl font-bold mt-2 text-tanta-secondary dark:text-[#f0b36d]">
                  {formatCurrency(selectedRecipeDetails?.cost?.unit_cost, "PEN")}
                </h2>
              </div>
            </div>

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
                      <th className="p-4 w-[140px]">Cantidad</th>
                      <th className="p-4 w-[140px]">Unidad</th>
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
							? `${Number(line.converted_quantity).toFixed(4)} ${line.stock_unit_code}`
							: "-"}
						</td>
												<td className="p-4 opacity-80">
                          <div className="truncate" title={line.supplier_name || "-"}>
                            {line.supplier_name || "-"}
                          </div>
                        </td>
                        <td className="p-4">
                          {formatCurrency(line.unit_cost, line.currency_code || "PEN")}
                        </td>
                        <td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
                          {formatCurrency(line.line_cost, line.currency_code || "PEN")}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRecipeLine(line)}
                              className="rounded-xl px-3 py-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 transition flex items-center gap-2 whitespace-nowrap"
                            >
                              <Pencil size={16} />
                              Editar
                            </button>

                            <button
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
          </div>
        </div>
      )}
	  
	  {recipeTab === "simulation" && (
  <div className="space-y-6">

    {/* 🔹 1. FILA SUPERIOR: INPUT + RESULTADOS */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* 🧁 PANEL IZQUIERDO: selector */}
      <div className="rounded-2xl p-6 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 shadow-card">
        <h2 className="text-xl font-semibold mb-2">
          Simulación por fecha
        </h2>

        <p className="text-sm opacity-70 mb-5">
          Calcula el costo de una receta según los precios vigentes en una fecha específica.
        </p>

        <div className="space-y-4">

          <div>
            <label className="text-sm opacity-80">Receta</label>
            <select
              value={selectedRecipe?.recipe_id || ""}
              onChange={(e) => {
                loadRecipeDetails(e.target.value);
                setSimulatedRecipeCost(null);
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
              onChange={(e) => {
                setSimulationDate(e.target.value);
                setSimulatedRecipeCost(null);
              }}
              className="mt-2 w-full rounded-xl px-4 py-3 bg-tanta-bg/70 dark:bg-tanta-primary/12 border border-tanta-primary/20 outline-none focus:border-tanta-primary/60"
            />
          </div>

          <button
            onClick={simulateRecipeCost}
            className="w-full bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white rounded-xl px-5 py-3 hover:scale-[1.01] shadow-lg shadow-tanta-primary/30 transition"
          >
            Simular
          </button>
        </div>
      </div>

      {/* 🔥 PANEL DERECHO: RESULTADOS */}
<div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
  {[
  {
    label: "Costo insumos",
    simulated: simulatedRecipeCost?.summary?.raw_material_cost,
    current: currentRecipeCost?.summary?.raw_material_cost,
  },
  {
    label: "Costo total",
    simulated: simulatedRecipeCost?.summary?.total_cost,
    current: currentRecipeCost?.summary?.total_cost,
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
  },
  {
    label: "Ganancia",
    simulated:
      Number(simulatedRecipeCost?.summary?.suggested_price || 0) -
      Number(simulatedRecipeCost?.summary?.total_cost || 0),
    current:
      Number(currentRecipeCost?.summary?.suggested_price || 0) -
      Number(currentRecipeCost?.summary?.total_cost || 0),
    highlight: true,
  },
].map((item) => {
    const variation =
      simulatedRecipeCost && currentRecipeCost
        ? Number(item.simulated || 0) - Number(item.current || 0)
        : null;
	const variationPercent =
  simulatedRecipeCost && currentRecipeCost
    ? calculateVariationPercent(item.simulated, item.current)
    : null;

    return (
      <div
        key={item.label}
        className="rounded-2xl p-5 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_24px_rgba(209,139,73,0.12)]"
      >
        <p className="text-sm opacity-70 flex items-center gap-2">
  {item.label}

  {item.label === "Precio unitario" && (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d]">
      por unidad
    </span>
  )}
</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 bg-tanta-primary/10 border border-tanta-primary/20">
            <p className="text-xs opacity-60">Fecha simulada</p>
            <h3
              className={`text-lg font-bold mt-1 ${
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
            <h3 className="text-lg font-bold mt-1">
              {currentRecipeCost ? formatCurrency(item.current, "PEN") : "-"}
            </h3>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl px-3 py-2 bg-tanta-bg/60 dark:bg-tanta-primary/10 border border-tanta-primary/15">
  <span className="text-xs opacity-70">Diferencia</span>

  <div className="text-right">
    <span
      className={`text-sm font-semibold ${
        variation > 0
          ? "text-red-600 dark:text-red-300"
          : variation < 0
          ? "text-green-600 dark:text-green-300"
          : "text-tanta-secondary dark:text-[#f0b36d]"
      }`}
    >
      {variation !== null ? formatCurrency(variation, "PEN") : "-"}
    </span>

    <p
      className={`text-[11px] font-semibold ${
        variationPercent > 0
          ? "text-red-600 dark:text-red-300"
          : variationPercent < 0
          ? "text-green-600 dark:text-green-300"
          : "opacity-60"
      }`}
    >
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

  <div className="md:col-span-3 rounded-2xl px-5 py-4 bg-tanta-primary/10 border border-tanta-primary/20">
    <p className="text-sm opacity-75">
      Comparativo entre la fecha simulada{" "}
      <span className="font-semibold">
        {simulatedRecipeCost?.cost_date || "-"}
      </span>{" "}
      y la fecha actual{" "}
      <span className="font-semibold">
        {new Date().toISOString().substring(0, 10)}
      </span>
      .
    </p>
  </div>
</div>
    </div>

    {/* 🔹 2. TABLA ABAJO (PROTAGONISTA) */}
    <div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 shadow-card overflow-hidden">

      <div className="p-5 border-b border-tanta-primary/15">
        <h2 className="text-xl font-semibold">
          Detalle de insumos simulados
        </h2>

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
              <th className="p-4">Insumo</th>
              <th className="p-4">Cantidad</th>
              <th className="p-4">Convertido</th>
              <th className="p-4">Proveedor</th>
              <th className="p-4">Presentación</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Costo unit.</th>
              <th className="p-4">Costo línea</th>
            </tr>
          </thead>

          <tbody>
            {(simulatedRecipeCost?.ingredients || []).map((line) => (
              <tr key={line.recipe_ingredient_id} className="border-t hover:bg-tanta-primary/10">

                <td className="p-4">
                  {line.ingredient_code} - {line.ingredient_name}
                </td>

                <td className="p-4">
                  {line.quantity} {line.recipe_unit_code}
                </td>

                <td className="p-4">
                  {line.converted_quantity
                    ? `${Number(line.converted_quantity).toFixed(4)} ${line.stock_unit_code}`
                    : "-"}
                </td>

                <td className="p-4">{line.supplier_name || "-"}</td>
                <td className="p-4">{line.presentation_name || "-"}</td>

                <td className="p-4">
                  {formatCurrency(line.current_price, "PEN")}
                </td>

                <td className="p-4">
                  {formatCurrency(line.unit_cost, "PEN")}
                </td>

                <td className="p-4 font-semibold text-tanta-secondary">
                  {formatCurrency(line.line_cost, "PEN")}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

  </div>
)}
	  
	  
    </div>
  );

	const renderHistory = () => (
	<div className="max-w-7xl mx-auto">
		<div className="mb-8">
		<p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
			Tanta House · Historial
		</p>
	
		<h1 className="text-3xl font-bold">Historial del sistema</h1>
	
		<p className="opacity-75 mt-2">
			Consulta la evolución de precios de insumos y, próximamente, el historial
			de costos de recetas.
		</p>
		</div>
	
		<div className="mb-6 flex flex-wrap gap-3">
		<button
			onClick={() => setHistoryTab("ingredient-prices")}
			className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
			historyTab === "ingredient-prices"
				? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
				: "bg-[#F3EFDC]/70 dark:bg-[#1e1422]/80 border border-tanta-primary/20 hover:bg-tanta-primary/10"
			}`}
		>
			Historial de precios
		</button>
	
		<button
			onClick={() => setHistoryTab("recipe-costs")}
			className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition ${
			historyTab === "recipe-costs"
				? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-sm"
				: "bg-[#F3EFDC]/70 dark:bg-[#1e1422]/80 border border-tanta-primary/20 hover:bg-tanta-primary/10"
			}`}
		>
			Costos de recetas
		</button>
  </div>
		
		<div className="mb-4 rounded-xl p-4 bg-[#F3EFDC]/70 dark:bg-[#1e1422]/80 border border-tanta-primary/20 dark:border-tanta-primary/30 shadow-sm">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
    <div>
      <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
        Dashboard de precios
      </p>
    <h2 className="text-lg font-semibold">
		Fluctuación del precio
	</h2>
	<p className="text-xs opacity-70 mt-1">
		Evolución histórica del insumo seleccionado
	</p>
    </div>

    <select
      value={selectedHistoryIngredientId}
      onChange={(e) => {
        setSelectedHistoryIngredientId(e.target.value);
        loadIngredientPriceChart(e.target.value);
      }}
      className="rounded-lg px-3 py-2 text-sm bg-tanta-bg/70 dark:bg-[#2a1b30] border border-tanta-primary/20 outline-none focus:border-tanta-primary/60 min-w-[220px]"
    >
      <option value="">Seleccionar insumo</option>

      {ingredients.map((item) => (
        <option key={item.ingredient_id} value={item.ingredient_id}>
          {item.ingredient_code} - {item.ingredient_name}
        </option>
      ))}
    </select>
  </div>

  <div className="h-[180px]">
    {ingredientPriceChart.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={ingredientPriceChart}>
          <CartesianGrid strokeDasharray="2 2" opacity={0.15} />
		  <XAxis 
			dataKey="date"
			tick={{ fontSize: 10 }}
		  />
		  <YAxis
			tick={{ fontSize: 10 }}
		  />

		<Tooltip
		contentStyle={{
			borderRadius: "10px",
			border: "none",
			boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
		}}
		formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, "Precio"]}
		labelFormatter={(label) => `Fecha: ${label}`}
		/>
		
		<Line
		type="monotone"
		dataKey="price"
		strokeWidth={2}
		dot={false}
		activeDot={{ r: 5 }}
		/>
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-tanta-primary/30 opacity-70">
        Selecciona un insumo para ver su fluctuación de precio.
      </div>
    )}
  </div>

		
		</div>
	
		{historyTab === "ingredient-prices" && (
		<div className="rounded-2xl bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)] overflow-hidden">
			<div className="p-5 flex gap-4 items-center border-b border-tanta-primary/15 dark:border-tanta-primary/20">
			<div className="flex items-center gap-2 bg-tanta-bg/70 dark:bg-tanta-primary/12 rounded-xl px-4 py-3 flex-1 border border-transparent dark:border-tanta-primary/20 focus-within:border-tanta-primary/60 transition">
				<Search
				size={18}
				className="text-tanta-primary dark:text-[#f0b36d]"
				/>
				<input
				className="bg-transparent outline-none w-full placeholder:text-tanta-dark/50 dark:placeholder:text-tanta-darkText/50"
				placeholder="Buscar por insumo, proveedor o presentación..."
				value={historySearch}
				onChange={(e) => setHistorySearch(e.target.value)}
				/>
			</div>
			</div>
	
			<div className="overflow-x-auto custom-scrollbar">
			<table className="w-full min-w-[1380px] table-fixed text-left">
				<thead className="bg-tanta-dark dark:bg-gradient-to-r dark:from-tanta-primary dark:to-[#56599A] text-white">
				<tr>
					<th className="p-4 w-[140px]">Código</th>
					<th className="p-4 w-[220px]">Insumo</th>
					<th className="p-4 w-[220px]">Proveedor</th>
					<th className="p-4 w-[220px]">Presentación</th>
					<th className="p-4 w-[120px]">Moneda</th>
					<th className="p-4 w-[160px]">Precio anterior</th>
					<th className="p-4 w-[160px]">Precio nuevo</th>
					<th className="p-4 w-[150px]">Vigente desde</th>
					<th className="p-4 w-[150px]">Vigente hasta</th>
					<th className="p-4 w-[180px]">Fecha registro</th>
					<th className="p-4 w-[160px]">Variación</th>
				</tr>
				</thead>
	
				<tbody>
				{filteredIngredientPriceHistory.map((item) => (
					<tr
					key={item.price_history_id}
					className="border-t border-tanta-primary/15 dark:border-tanta-primary/20 hover:bg-tanta-primary/10 transition"
					>
					<td className="p-4 font-medium">
						<div className="truncate" title={item.ingredient_code}>
						{item.ingredient_code}
						</div>
					</td>
	
					<td className="p-4">
						<div className="truncate" title={item.ingredient_name}>
						{item.ingredient_name}
						</div>
					</td>
	
					<td className="p-4 opacity-80">
						<div className="truncate" title={item.supplier_name}>
						{item.supplier_name}
						</div>
					</td>
	
					<td className="p-4 opacity-80">
						<div className="truncate" title={item.presentation_name}>
						{item.presentation_name}
						</div>
					</td>
	
					<td className="p-4">{item.currency_code}</td>
	
					<td className="p-4 opacity-80">
						{item.previous_price
						? formatCurrency(item.previous_price, item.currency_code)
						: "-"}
					</td>
	
					<td className="p-4 font-medium text-tanta-secondary dark:text-[#f0b36d]">
						{formatCurrency(item.new_price, item.currency_code)}
					</td>
	
					<td className="p-4 opacity-80">
						{item.effective_from?.substring(0, 10) || "-"}
					</td>
	
					<td className="p-4 opacity-80">
						{item.effective_to?.substring(0, 10) || "Vigente"}
					</td>
	
					<td className="p-4 opacity-80">
						{item.changed_at?.substring(0, 10) || "-"}
						</td>
						
						<td className="p-4">
						{item.previous_price ? (
							<span
							className={`px-3 py-1 rounded-full text-sm border whitespace-nowrap ${
								Number(item.new_price) > Number(item.previous_price)
								? "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20"
								: Number(item.new_price) < Number(item.previous_price)
								? "bg-green-500/10 text-green-600 dark:text-green-300 border-green-500/20"
								: "bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] border-tanta-primary/25"
							}`}
							>
							{Number(item.new_price) > Number(item.previous_price)
								? "Subió"
								: Number(item.new_price) < Number(item.previous_price)
								? "Bajó"
								: "Sin cambio"}
							</span>
						) : (
							<span className="px-3 py-1 rounded-full text-sm border bg-tanta-primary/20 text-tanta-secondary dark:text-[#f0b36d] border-tanta-primary/25 whitespace-nowrap">
							Precio inicial
							</span>
						)}
					</td>
					</tr>
				))}
	
				{filteredIngredientPriceHistory.length === 0 && (
					<tr>
					<td colSpan="11" className="p-8 text-center opacity-60">
						No se encontraron registros históricos de precios.
					</td>
					</tr>
				)}
				</tbody>
			</table>
			</div>
		</div>
		)}
	
		{historyTab === "recipe-costs" && (
		<div className="rounded-[2rem] p-8 md:p-10 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)]">
			<p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
			Próximamente
			</p>
	
			<h1 className="text-4xl font-bold">Historial de costos de recetas</h1>
	
			<p className="opacity-75 mt-3 max-w-2xl">
			Aquí mostraremos la variación histórica del costo de cada receta,
			precio sugerido y margen. El layout ya queda preparado para conectar
			la tabla histórica de recetas.
			</p>
		</div>
		)}
	</div>
	);

  const renderPlaceholder = (title, description) => (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-[2rem] p-8 md:p-10 bg-[#F3EFDC]/85 dark:bg-[#1e1422]/90 border border-tanta-primary/25 dark:border-tanta-primary/35 shadow-card dark:shadow-[0_0_34px_rgba(209,139,73,0.14)]">
        <p className="text-sm font-semibold text-tanta-primary dark:text-[#f0b36d] mb-1">
          Tanta House
        </p>
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="opacity-75 mt-3 max-w-2xl">{description}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (activeMenu === "Login") return renderLogin();
    if (activeMenu === "Inicio") return renderHome();

    if (!loggedUser) return renderLogin();

    if (activeMenu === "Dashboard") return renderDashboard();
    if (activeMenu === "Usuarios") return renderUsers();
    if (activeMenu === "Insumos") return renderIngredients();
    if (activeMenu === "Recetas") return renderRecipes();
    if (activeMenu === "Proveedores") return renderSuppliers();
	if (activeMenu === "Historial") return renderHistory();

    return renderHome();
  };

  return (
    <main className="min-h-screen text-tanta-dark dark:text-tanta-darkText bg-gradient-to-br from-tanta-bg via-[#f1d4b8] to-[#f7e4cf] dark:from-tanta-darkBg dark:via-[#33203a] dark:to-[#1b1020] transition-colors duration-500">
      <aside
        className={`fixed top-0 left-0 h-screen px-4 py-6 z-50 transition-all duration-500 bg-[#F3EFDC]/90 dark:bg-[#1e1422]/95 backdrop-blur border-r border-tanta-primary/25 dark:border-tanta-primary/40 shadow-[4px_0_24px_rgba(209,139,73,0.14)] dark:shadow-[6px_0_30px_rgba(209,139,73,0.18)] ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-tanta-primary/15 dark:hover:bg-tanta-primary/15 transition"
            aria-label="Abrir o cerrar menú"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.label;

            return (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item.label)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white shadow-lg shadow-tanta-primary/30 dark:shadow-tanta-primary/40"
                    : "text-tanta-dark dark:text-tanta-darkText hover:bg-tanta-primary/15 dark:hover:bg-tanta-primary/15 hover:translate-x-1"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>

                {sidebarOpen && <span>{item.label}</span>}

                {!sidebarOpen && (
                  <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-tanta-dark dark:bg-[#F3EFDC] px-3 py-2 text-sm font-medium text-[#F3EFDC] dark:text-tanta-dark opacity-0 shadow-lg shadow-tanta-primary/20 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 z-50">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={toggleDarkMode}
            className="group relative w-full p-3 rounded-xl bg-tanta-bg/70 dark:bg-tanta-primary/20 text-tanta-dark dark:text-tanta-darkText hover:scale-[1.02] hover:shadow-md hover:shadow-tanta-primary/30 transition flex items-center justify-center gap-3"
            aria-label="Cambiar modo claro u oscuro"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}

            {sidebarOpen && (
              <span>{darkMode ? "Modo claro" : "Modo oscuro"}</span>
            )}

            {!sidebarOpen && (
              <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl bg-tanta-dark dark:bg-[#F3EFDC] px-3 py-2 text-sm font-medium text-[#F3EFDC] dark:text-tanta-dark opacity-0 shadow-lg shadow-tanta-primary/20 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-1 z-50">
                {darkMode ? "Modo claro" : "Modo oscuro"}
              </span>
            )}
          </button>
        </div>
      </aside>

      <header
        className={`fixed top-0 z-40 h-20 flex items-center justify-between px-6 bg-[#F3EFDC]/90 dark:bg-[#1e1422]/90 backdrop-blur border-b border-tanta-primary/25 dark:border-tanta-primary/40 shadow-sm dark:shadow-[0_4px_24px_rgba(209,139,73,0.12)] transition-all duration-500 ${
          sidebarOpen
            ? "left-64 w-[calc(100%-256px)]"
            : "left-20 w-[calc(100%-80px)]"
        }`}
      >
        <img
          src={darkMode ? logoDark : logoLight}
          alt="Tanta House"
          className="h-12 object-contain"
        />

        {loggedUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right max-w-[260px]">
              <p className="text-sm font-semibold truncate">
                {loggedUser.full_name}
              </p>
              <p className="text-xs opacity-60 truncate">
                {loggedUser.username}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl px-4 py-3 flex items-center gap-2 bg-tanta-primary/15 hover:bg-tanta-primary/25 dark:bg-tanta-primary/20 transition"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveMenu("Login")}
            className="rounded-xl px-5 py-3 flex items-center gap-2 bg-gradient-to-r from-tanta-primary to-tanta-secondary text-white hover:scale-[1.02] shadow-lg shadow-tanta-primary/25 transition"
          >
            <LogIn size={18} />
            Iniciar sesión
          </button>
        )}
      </header>

      <section
        className={`px-8 pt-24 pb-8 transition-all duration-500 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {renderContent()}
      </section>
    </main>
  );
}

export default App;
