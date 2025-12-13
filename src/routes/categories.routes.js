import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   GET - LISTAR (ordenado por `order`)
=================================================== */
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        products: {
          orderBy: [
            { order: "asc" },
            { createdAt: "asc" },
          ],
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
   POST - CRIAR (COM PRODUTOS ANINHADOS)
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { name, storeId, products = [] } = req.body;

    if (!name || !storeId) {
      return res.status(400).json({
        error: "Nome e storeId obrigatórios",
      });
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
                storeId: storeId,
              })),
            }
          : undefined,
      },
      include: {
        products: true,
      },
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
   PUT - UPDATE ORDER ( /categories/order )
=================================================== */
router.put("/order", async (req, res) => {
  try {
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        error: "Orders inválido ou vazio",
      });
    }

    const uniqueOrders = Array.from(
      new Map(orders.map((item) => [item.id, item])).values()
    );

    const updates = uniqueOrders
      .filter(
        (item) =>
          typeof item?.id === "string" && item.id.trim().length > 0
      )
      .map((item) => {
        const orderValue =
          typeof item.order === "number" && !isNaN(item.order)
            ? item.order
            : 0;

        return prisma.category.update({
          where: { id: item.id },
          data: { order: orderValue },
        });
      });

    if (updates.length === 0) {
      return res.status(400).json({
        error: "Nenhum item válido enviado",
      });
    }

    await prisma.$transaction(updates);

    res.json({ success: true });
  } catch (err) {
    console.error("Erro PUT /categories/order:", err);
    res.status(500).json({ error: "Erro ao salvar ordem" });
  }
});

/* ===================================================
   PATCH - UPDATE PARCIAL ( /categories/:id )
=================================================== */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { name, active, order } = req.body ?? {};

    if (
      name === undefined &&
      active === undefined &&
      order === undefined
    ) {
      return res.status(400).json({
        error: "Nenhum campo enviado",
      });
    }

    const updated = await prisma.category.update({
      where: { id },
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
   PUT - UPDATE NAME / ACTIVE ( /categories/:id )
=================================================== */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { name, active } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: { name, active },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro PUT /categories/:id:", err);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

/* ===================================================
   DELETE ( /categories/:id )
=================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.json({ success: true });
    }

    try {
      await prisma.category.delete({
        where: { id },
      });
    } catch (err) {
      console.error("Erro ao excluir no Prisma:", err);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /categories/:id:", err);
    res.status(500).json({ error: "Erro ao excluir categoria" });
  }
});

export default router;
