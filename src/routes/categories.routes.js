import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { verifyAuth } from "./auth/_middlewares/auth.middleware.js";

const router = Router();

/* ===================================================
   🔐 PROTEGE TODAS AS ROTAS
=================================================== */
router.use(verifyAuth);

/* ===================================================
   GET - LISTAR (ordenado por `order`)
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
   POST - CRIAR
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { name, products = [] } = req.body;
    const storeId = req.user.storeId;

    if (!name) {
      return res.status(400).json({ error: "Nome obrigatório" });
    }

    const category = await prisma.category.create({
      data: {
        name,
        storeId,
        products: products.length
          ? {
              create: products.map((p) => ({
                name: p.name ?? "",
                price: p.price ?? 0,
                description: p.description ?? null,
                imageUrl: p.imageUrl ?? null,
                active: p.active ?? true,
                storeId,
              })),
            }
          : undefined,
      },
      include: { products: true },
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Erro POST /categories:", err);
    res.status(500).json({
      error: "Erro ao criar categoria",
      details: err.message,
    });
  }
});

/* ===================================================
   PUT - UPDATE ORDER
=================================================== */
router.put("/order", async (req, res) => {
  try {
    const { orders } = req.body;
    const storeId = req.user.storeId;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ error: "Orders inválido ou vazio" });
    }

    const uniqueOrders = Array.from(
      new Map(orders.map((item) => [item.id, item])).values()
    );

    const updates = uniqueOrders.map((item) =>
      prisma.category.updateMany({
        where: { id: item.id, storeId },
        data: { order: Number(item.order) || 0 },
      })
    );

    await prisma.$transaction(updates);

    res.json({ success: true });
  } catch (err) {
    console.error("Erro PUT /categories/order:", err);
    res.status(500).json({ error: "Erro ao salvar ordem" });
  }
});

/* ===================================================
   PATCH - UPDATE PARCIAL
=================================================== */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;
    const { name, active, order } = req.body ?? {};

    const updated = await prisma.category.updateMany({
      where: { id, storeId },
      data: {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
        ...(order !== undefined && { order }),
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro PATCH /categories/:id:", err);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

/* ===================================================
   PUT - UPDATE NAME / ACTIVE
=================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;
    const { name, active } = req.body;

    const updated = await prisma.category.updateMany({
      where: { id, storeId },
      data: { name, active },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro PUT /categories/:id:", err);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

/* ===================================================
   DELETE
=================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    await prisma.category.deleteMany({
      where: { id, storeId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /categories/:id:", err);
    res.status(500).json({ error: "Erro ao excluir categoria" });
  }
});

export default router;
