import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
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

/* ===================================================
   🔥 CORS GLOBAL (CORRETO – NODE 22 SAFE)
=================================================== */
const corsOptions = {
  origin: [
    "https://app.tifra.com.br",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

/* 🔥 PRE-FLIGHT GLOBAL (NUNCA USAR "*") */
app.options("/*", cors(corsOptions));

/* ===================================================
   MIDDLEWARES
=================================================== */
app.use(cookieParser());
app.use(express.json());

/* ===================================================
   HEALTH CHECK
=================================================== */
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

/* ===================================================
   ROTAS
=================================================== */

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

// 👤 user
app.use("/user", userRoutes);

// 🛒 products
app.use("/products", productsRoutes);

// 📤 upload
app.use("/upload", uploadRoutes);

/* ===================================================
   START SERVER (Railway)
=================================================== */
const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});

