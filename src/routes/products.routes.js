import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   POST /products — CRIAR PRODUTO
=================================================== */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      priceInCents,
      categoryId,
      storeId,
      imageUrl,
      complements,
    } = req.body;

    if (!name || priceInCents === undefined || !categoryId || !storeId) {
      return res.status(400).json({
        error: "Dados obrigatórios faltando",
      });
    }

    const price = priceInCents / 100;

    const uniqueComplements = Array.isArray(complements)
      ? [...new Set(complements)]
      : [];

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price,
        categoryId,
        storeId,
        imageUrl: imageUrl || null,

        productComplements: {
          create: uniqueComplements.map((groupId, index) => ({
            groupId,
            order: index,
            active: true,
          })),
        },
      },
      include: {
        productComplements: {
          orderBy: { order: "asc" },
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    res.status(201).json(product);

  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({
      error:
        error?.meta?.cause ||
        error.message ||
        "Erro interno ao criar produto",
    });
  }
});

/* ===================================================
   GET /products — LISTAR PRODUTOS ATIVOS
=================================================== */
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      include: {
        category: true,
        productComplements: {
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    const normalized = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price,
      imageUrl: p.imageUrl,
      categoryId: p.categoryId,
      categoryName: p.category?.name || "",
      complements: (p.productComplements || []).map((pc) => ({
        groupId: pc.groupId,
        groupName: pc.group?.name || "",
        required: pc.group?.required || false,
        options: pc.group?.items || [],
      })),
    }));

    res.json(normalized);

  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

/* ===================================================
   GET /products/:id — PRODUTO COMPLETO
=================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productComplements: {
          orderBy: { order: "asc" },
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json(product);

  } catch (error) {
    console.error("Erro GET /products/:id:", error);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

/* ===================================================
   PATCH /products/:id — ATUALIZAR PRODUTO
=================================================== */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const {
      name,
      description,
      priceInCents,
      categoryId,
      pdv,
      imageUrl,
      active,
    } = body;

    const price =
      priceInCents !== undefined && priceInCents !== null
        ? priceInCents / 100
        : undefined;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (active !== undefined) updateData.active = active;
    if (pdv !== undefined) updateData.pdv = pdv;

    if (categoryId !== undefined) {
      updateData.category = {
        connect: { id: categoryId },
      };
    }

    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // complements (somente se enviado)
    if (Object.prototype.hasOwnProperty.call(body, "complements")) {
      const uniqueComplements = Array.isArray(body.complements)
        ? [...new Set(body.complements)]
        : [];

      await prisma.productComplement.deleteMany({
        where: { productId: id },
      });

      if (uniqueComplements.length > 0) {
        await prisma.productComplement.createMany({
          data: uniqueComplements.map((groupId, order) => ({
            productId: id,
            groupId,
            order,
            active: true,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        productComplements: {
          orderBy: { order: "asc" },
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    res.json(updated);

  } catch (error) {
    console.error("Erro PATCH /products/:id:", error);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

/* ===================================================
   DELETE /products/:id — EXCLUIR PRODUTO
=================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.productComplement.deleteMany({
      where: { productId: id },
    });

    const deleted = await prisma.product.delete({
      where: { id },
    });

    res.json({ success: true, deleted });

  } catch (error) {
    console.error("Erro DELETE /products/:id:", error);
    res.status(500).json({
      error: "Erro ao excluir produto",
      details: error.message,
    });
  }
});

/* ===================================================
   POST /products/reorder — REORDENAR
=================================================== */
router.post("/reorder", async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        error: "productIds deve ser um array",
      });
    }

    await prisma.$transaction(
      productIds.map((id, index) =>
        prisma.product.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    res.json({ success: true });

  } catch (error) {
    console.error("Erro ao salvar ordem:", error);
    res.status(500).json({ error: "Erro ao salvar ordem" });
  }
});

export default router;
