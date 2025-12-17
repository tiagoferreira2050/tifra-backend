import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { verifyAuth } from "./auth/_middlewares/auth.middleware.js";

const router = Router();

/* ===================================================
   🔐 PROTEGE TODAS AS ROTAS
=================================================== */
router.use(verifyAuth);

/* ===================================================
   GET — LISTAR CATEGORIAS (PADRÃO COMPLEMENTS)
=================================================== */
router.get("/", async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const categories = await prisma.category.findMany({
      where: { storeId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: {
        products: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          include: {
            productComplements: {
              include: {
                group: {
                  include: { items: true },
                },
              },
            },
          },
        },
      },
    });

    res.json(categories);
  } catch (err) {
    console.error("Erro GET /categories:", err);
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

/* ===================================================
   POST — CRIAR CATEGORIA
=================================================== */
router.post("/", async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { name, products = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name é obrigatório" });
    }

    const created = await prisma.category.create({
      data: {
        name,
        storeId,
        active: true,
        products: Array.isArray(products) && products.length
          ? {
              create: products.map((p, index) => ({
                name: p.name ?? "",
                price: p.price ?? 0,
                description: p.description ?? null,
                imageUrl: p.imageUrl ?? null,
                active: p.active ?? true,
                order: p.order ?? index,
                storeId,
              })),
            }
          : undefined,
      },
      include: { products: true },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error("Erro POST /categories:", err);
    res.status(500).json({
      error: "Erro ao criar categoria",
      details: err.message,
    });
  }
});

/* ===================================================
   PATCH — ATUALIZAR CATEGORIA (PADRÃO COMPLEMENTS)
=================================================== */
router.patch("/", async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { id, name, active, order } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID obrigatório" });
    }

    await prisma.category.updateMany({
      where: { id, storeId },
      data: {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
        ...(order !== undefined && { order: Number(order) }),
      },
    });

    const updated = await prisma.category.findFirst({
      where: { id, storeId },
      include: {
        products: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro PATCH /categories:", err);
    res.status(500).json({
      error: "Erro ao atualizar categoria",
      details: err.message,
    });
  }
});

/* ===================================================
   POST — REORDENAR CATEGORIAS
=================================================== */
router.post("/order", async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { orders } = req.body;

    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: "orders deve ser um array" });
    }

    await prisma.$transaction(
      orders.map((item, index) =>
        prisma.category.updateMany({
          where: { id: item.id, storeId },
          data: { order: Number(item.order ?? index) },
        })
      )
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Erro POST /categories/order:", err);
    res.status(500).json({ error: "Erro ao salvar ordem" });
  }
});

/* ===================================================
   DELETE — DELETAR CATEGORIA + PRODUTOS
=================================================== */
router.delete("/", async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID obrigatório" });
    }

    await prisma.product.deleteMany({
      where: { categoryId: id, storeId },
    });

    await prisma.category.deleteMany({
      where: { id, storeId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /categories:", err);
    res.status(500).json({
      error: "Erro ao excluir categoria",
      details: err.message,
    });
  }
});

export default router;
