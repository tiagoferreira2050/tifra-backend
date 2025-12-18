import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   GET - LISTAR COMPLEMENTOS
=================================================== */
router.get("/", async (req, res) => {
  try {
    const groups = await prisma.complementGroup.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    res.json(groups);
  } catch (err) {
    console.error("Erro GET /complements:", err);
    res.status(500).json({ error: "Erro ao listar complementos" });
  }
});

/* ===================================================
   POST - CRIAR GRUPO + ITENS
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { name, description, required, min, max, type, options } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name é obrigatório" });
    }

    const group = await prisma.complementGroup.create({
      data: {
        name,
        description: description ?? "",
        required: required ?? false,
        min: min !== undefined ? Number(min) : 0,
        max: max !== undefined ? Number(max) : 1,
        active: true,
        type: type || "multiple",
      },
    });

    if (Array.isArray(options)) {
      for (const opt of options) {
        await prisma.complement.create({
          data: {
            groupId: group.id,
            name: opt.name,
            price: Number(opt.price ?? 0),
            active: opt.active ?? true,
            imageUrl: opt.imageUrl || null,
            description: opt.description || "",
          },
        });
      }
    }

    const result = await prisma.complementGroup.findUnique({
      where: { id: group.id },
      include: { items: true },
    });

    res.status(201).json(result);
  } catch (err) {
    console.error("Erro POST /complements:", err);
    res.status(500).json({
      error: "Erro ao criar complemento",
      details: err.message,
    });
  }
});

/* ===================================================
   PATCH - ATUALIZAR GRUPO + ITENS
=================================================== */
router.patch("/", async (req, res) => {
  try {
    const {
  id,
  title,
  description,
  required,
  minChoose,
  maxChoose,
  active,
  type,
  options,
} = req.body;


    if (!id) {
      return res.status(400).json({ error: "ID obrigatório" });
    }

    // 1️⃣ Atualizar grupo
    await prisma.complementGroup.update({
      where: { id },
      data: {
  name: title ?? undefined,
  description: description ?? undefined,
  required: required ?? undefined,
  min: minChoose !== undefined ? Number(minChoose) : undefined,
  max: maxChoose !== undefined ? Number(maxChoose) : undefined,
  active: active ?? undefined,
  type: type ?? undefined,
},
    });

    // 2️⃣ Atualizar / criar itens
    const savedItemIds = [];

    if (Array.isArray(options)) {
      for (const opt of options) {
        const isNew =
          !opt.id ||
          typeof opt.id !== "string" ||
          opt.id.startsWith("opt-");

        const payload = {
          name: opt.name,
          price: Number(opt.price ?? 0),
          active: opt.active ?? true,
          imageUrl: opt.imageUrl || opt.image || null,
          description: opt.description || "",
        };

        if (isNew) {
          const created = await prisma.complement.create({
            data: {
              groupId: id,
              ...payload,
            },
          });
          savedItemIds.push(created.id);
        } else {
          await prisma.complement.update({
            where: { id: opt.id },
            data: payload,
          });
          savedItemIds.push(opt.id);
        }
      }
    }

    // 3️⃣ Remover itens excluídos
    if (Array.isArray(options)) {
  await prisma.complement.deleteMany({
    where: {
      groupId: id,
      id: { notIn: savedItemIds },
      },
    });
  }

    const updated = await prisma.complementGroup.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    res.json(updated);
  } catch (err) {
    console.error("Erro PATCH /complements:", err);
    res.status(500).json({
      error: "Erro ao atualizar complemento",
      details: err.message,
    });
  }
});

/* ===================================================
   DELETE - GRUPO + ITENS + VÍNCULOS (CORRETO)
=================================================== */
router.delete("/", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID obrigatório" });
    }

    /**
     * ORDEM CORRETA BASEADA NO BANCO REAL:
     * 1. Remove vínculos com produtos (ProductComplement.groupId)
     * 2. Remove itens do grupo (Complement.groupId)
     * 3. Remove o grupo (ComplementGroup.id)
     */

    // 1️⃣ Remove vínculo com produtos
    await prisma.productComplement.deleteMany({
      where: {
        groupId: id,
      },
    });

    // 2️⃣ Remove itens
    await prisma.complement.deleteMany({
      where: {
        groupId: id,
      },
    });

    // 3️⃣ Remove grupo
    await prisma.complementGroup.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /complements:", err);
    res.status(500).json({
      error: "Erro ao deletar complemento",
      details: err.message,
    });
  }
});


export default router;
