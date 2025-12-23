import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./src/routes/auth/index.js";
import categoriesRoutes from "./src/routes/categories.routes.js";
import complementsRoutes from "./src/routes/complements.routes.js";
import complementItemsRoutes from "./src/routes/complement-items.js";
import ordersRoutes from "./src/routes/orders.routes.js";
import storesRoutes from "./src/routes/stores.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import productsRoutes from "./src/routes/products.routes.js";
import uploadRoutes from "./src/routes/upload.routes.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

/* ===================================================
   🔥 CORS GLOBAL — ESTÁVEL (Railway + Front)
=================================================== */
const corsOptions = {
  origin: [
    "https://app.tifra.com.br",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-user-id", // ✅ FIX DEFINITIVO
  ],
};

app.use(cors(corsOptions));

/* 🔥🔥🔥 FIX DEFINITIVO DO CORS (PATCH / OPTIONS) 🔥🔥🔥 */
app.options(/.*/, cors(corsOptions));

/* ===================================================
   🔥 MIDDLEWARES (ORDEM IMPORTA)
=================================================== */

// cookies
app.use(cookieParser());

// 🔥 JSON — OBRIGATÓRIO ANTES DAS ROTAS
app.use(express.json({ limit: "10mb" }));

// 🔥 URLENCODED — PATCH SAFE
app.use(express.urlencoded({ extended: true }));

/* ===================================================
   HEALTH CHECK
=================================================== */
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

/* ===================================================
   ROTAS (SEM PREFIXO /api — MANTIDAS)
=================================================== */

// 🔐 auth
app.use("/auth", authRoutes);

// 📂 categories
app.use("/categories", categoriesRoutes);

// 🧩 complements (GRUPOS)
app.use("/complements", complementsRoutes);

// 🧩 complement items (ITENS)
app.use("/complement-items", complementItemsRoutes);

// 🧾 orders
app.use("/orders", ordersRoutes);

// 🏪 stores
app.use("/stores", storesRoutes);

// 👤 user
app.use("/user", userRoutes);

// 🛒 products
app.use("/products", productsRoutes);

// 📤 upload
app.use("/upload", uploadRoutes);

/* ===================================================
   🔥 ROTAS COM PREFIXO /api (ALIAS — NÃO QUEBRA NADA)
=================================================== */

// 🔐 auth
app.use("/api/auth", authRoutes);

// 📂 categories
app.use("/api/categories", categoriesRoutes);

// 🧩 complements
app.use("/api/complements", complementsRoutes);

// 🧩 complement items
app.use("/api/complement-items", complementItemsRoutes);

// 🧾 orders
app.use("/api/orders", ordersRoutes);

// 🏪 stores
app.use("/api/store", storesRoutes);

// 👤 user
app.use("/api/user", userRoutes);

// 🛒 products
app.use("/api/products", productsRoutes);

// 📤 upload
app.use("/api/upload", uploadRoutes);

/* ===================================================
   START SERVER (Railway)
=================================================== */
const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
