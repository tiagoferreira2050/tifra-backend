import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// 🔥 PRISMA AJUSTADO PARA PRODUÇÃO (RAILWAY)
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// ROTA TESTE
// ===============================
app.get("/", (req, res) => {
  res.json({ message: "Backend rodando com sucesso 🚀" });
});

// ===============================
// GET ORDERS — apenas para testar conexão com o DB
// ===============================
app.get("/orders", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    console.error("ERRO AO BUSCAR PEDIDOS:", error);
    res.status(500).json({ error: "Erro ao buscar pedidos" });
  }
});

// ===============================
// START SERVER
// ===============================
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`🔥 Servidor rodando na porta ${port}`);
});
