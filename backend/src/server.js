const express = require("express");
const cors = require("cors");
require("dotenv").config();

const ingredientRoutes = require("./routes/ingredients.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const supplierRoutes = require("./routes/suppliers.routes");
const ubigeoRoutes = require("./routes/ubigeo.routes");
const catalogRoutes = require("./routes/catalogs.routes");
const ingredientPriceRoutes = require("./routes/ingredientPrices.routes");
const recipeRoutes = require("./routes/recipes.routes");
const historyRoutes = require("./routes/history.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const recipeCostingRoutes = require("./routes/recipeCosting.routes");
const customerRoutes = require("./routes/customers.routes");
const listaValorRoutes = require("./routes/lista_valor.routes");
const salesCatalogRoutes = require("./routes/salesCatalogs.routes");
const quoteRoutes = require("./routes/quotes.routes");
const orderRoutes = require("./routes/orders.routes");
const commercialRoutes = require("./routes/commercial.routes");
const xmlInvoiceRoutes = require("./routes/xmlInvoice.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ingredients", ingredientRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/ubigeo", ubigeoRoutes);
app.use("/api/lista-valores", listaValorRoutes);
app.use("/api/catalogs", catalogRoutes);
app.use("/api/ingredient-prices", ingredientPriceRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/recipes", recipeCostingRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/sales-catalogs", salesCatalogRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/commercial", commercialRoutes);
app.use(  "/api/xml-invoices",xmlInvoiceRoutes);

app.get("/", (req, res) => {
  res.send("API Tanta House funcionando correctamente");
});

app.listen(process.env.PORT || 3001,"0.0.0.0", () => {
  console.log("Servidor activo en puerto", process.env.PORT || 3001);
});
