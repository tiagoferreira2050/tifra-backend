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
import storeSettingsPublic from "./src/routes/storeSettingsPublic.js";
import storeSettingsAdmin from "./src/routes/storeSettingsAdmin.js";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

/* ===================================================
   🔥 CORS GLOBAL — COMPATÍVEL COM NODE 20 / EXPRESS ATUAL
=================================================== */
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes("tifra.com.br") ||
      origin.includes("localhost") ||
      origin.includes("railway.app")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
};

app.use(cors(corsOptions));

/* ===================================================
   🔥 PREFLIGHT GLOBAL (SEM USAR "*")
=================================================== */
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* ===================================================
   🔥 MIDDLEWARES
=================================================== */

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ===================================================
   HEALTH CHECK
=================================================== */
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

/* ===================================================
   ROTAS (SEM PREFIXO /api)
=================================================== */

app.use("/auth", authRoutes);
app.use("/categories", categoriesRoutes);
app.use("/complements", complementsRoutes);
app.use("/complement-items", complementItemsRoutes);
app.use("/orders", ordersRoutes);
app.use("/stores", storesRoutes);
app.use("/user", userRoutes);
app.use("/products", productsRoutes);
app.use("/upload", uploadRoutes);

/* ===================================================
   ROTAS COM PREFIXO /api (ALIAS)
=================================================== */

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/complements", complementsRoutes);
app.use("/api/complement-items", complementItemsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/store", storesRoutes);
app.use("/api/user", userRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/upload", uploadRoutes);

/* ===================================================
   STORE SETTINGS
=================================================== */

app.use(storeSettingsPublic);
app.use(storeSettingsAdmin);

/* ===================================================
   START SERVER
=================================================== */

const port = process.env.PORT || 3001;

app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
