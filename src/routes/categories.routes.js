import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { verifyAuth } from "./auth/_middlewares/auth.middleware.js";

const router = Router();

/* ===================================================
   🔐 PROTEGE TODAS AS ROTAS
=================================================== */
router.use(verifyAuth);

/* ===================================================
   GET — LISTAR CATEGORIAS
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

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ cria categoria
      const category = await tx.category.create({
        data: {
          name,
          storeId,
          active: true,
        },
      });

      // 2️⃣ duplica produtos (se existirem)
      for (const p of products) {
        // produto original completo
        const original = await tx.product.findUnique({
          where: { id: p.id },
          include: {
            productComplements: true,
          },
        });

        if (!original) continue;

        // cria novo produto
        const newProduct = await tx.product.create({
          data: {
            name: original.name,
            price: original.price,
            description: original.description,
            imageUrl: original.imageUrl,
            active: original.active,
            order: original.order,
            storeId,
            categoryId: category.id,
          },
        });

        // duplica vínculos de complementos
        if (original.productComplements.length > 0) {
          await tx.productComplement.createMany({
            data: original.productComplements.map((pc) => ({
              productId: newProduct.id,
              groupId: pc.groupId,
              order: pc.order,
              active: pc.active,
            })),
          });
        }
      }

      return category;
    });

    // 3️⃣ retorna categoria completa
    const fullCategory = await prisma.category.findUnique({
      where: { id: result.id },
      include: {
        products: {
          include: {
            productComplements: {
              include: {
                group: { include: { items: true } },
              },
            },
          },
        },
      },
    });

    res.status(201).json(fullCategory);
  } catch (err) {
    console.error("Erro POST /categories (duplicate):", err);
    res.status(500).json({
      error: "Erro ao duplicar categoria",
      details: err.message,
    });
  }
});


/* ===================================================
   PATCH — ATUALIZAR CATEGORIA
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
   DELETE — EXCLUIR CATEGORIA (COM REGRAS)
=================================================== */
/* ===================================================
   DELETE — DELETAR CATEGORIA
   REGRA:
   - Se NÃO tiver produtos → apaga categoria
   - Se tiver produtos:
       - verifica pedidos
       - se tiver pedido → BLOQUEIA
       - se NÃO tiver pedido → apaga produtos + categoria
   - NÃO apaga complementos
   - NÃO apaga clientes
=================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID obrigatório" });
    }

    // 1️⃣ Buscar produtos da categoria
    const products = await prisma.product.findMany({
      where: { categoryId: id, storeId },
      select: { id: true },
    });

    const productIds = products.map(p => p.id);

    // 2️⃣ Se tiver produtos, verificar pedidos
    if (productIds.length > 0) {
      const hasOrder = await prisma.orderItem.findFirst({
        where: {
          productId: { in: productIds },
        },
      });

      if (hasOrder) {
        return res.status(409).json({
          error:
            "Não foi possível excluir a categoria. Existem pedidos vinculados a produtos desta categoria.",
        });
      }

      // 3️⃣ Apagar vínculos de complementos dos produtos
      await prisma.productComplement.deleteMany({
        where: {
          productId: { in: productIds },
        },
      });

      // 4️⃣ Apagar produtos
      await prisma.product.deleteMany({
        where: {
          id: { in: productIds },
        },
      });
    }

    // 5️⃣ Apagar categoria
    await prisma.category.delete({
  where: { id, storeId },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /categories/:id:", err);
    res.status(500).json({
      error: "Erro ao excluir categoria",
      details: err.message,
    });
  }
});


export default router;
