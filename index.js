import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// Prisma normal, sem adapter (versão 5.x)
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

// ROTA TESTE
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

// ROTA GET ORDERS
app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
