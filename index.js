import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./src/routes/auth/index.js";
import categoriesRoutes from "./src/routes/categories.routes.js";
import complementsRoutes from "./src/routes/complements.routes.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import storesRoutes from "./src/routes/stores.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import productsRoutes from "./src/routes/products.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

// 🔥 middlewares globais
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// 🔥 health check
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

// 🔐 auth
app.use("/auth", authRoutes);

// 📂 categories
app.use("/categories", categoriesRoutes);

// 🧩 complements
app.use("/complements", complementsRoutes);

// 🧾 orders
app.use("/orders", ordersRoutes);

// 🏪 stores
app.use("/stores", storesRoutes);

// 👤 user (painel)
app.use("/user", userRoutes);

// 🛒 products
app.use("/products", productsRoutes);

// 📤 upload
app.use("/upload", uploadRoutes);

const port = process.env.PORT || 3001;

// 🚨 essencial p Railway
app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
