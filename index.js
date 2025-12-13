import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import categoriesRoutes from "./src/routes/categories.routes.js";

dotenv.config();

const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

// 🔥 rota antiga — mantida
app.get("/orders", async (req, res) => {
  const orders = await prisma.order.findMany();
  res.json(orders);
});

// 🔥 NOVA rota — categories
app.use("/categories", categoriesRoutes);

const port = process.env.PORT || 3001;

// 🚨 Essencial para Railway funcionar:
app.listen(port, "0.0.0.0", () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
