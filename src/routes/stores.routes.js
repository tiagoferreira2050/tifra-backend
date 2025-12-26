import { Router } from "express";
import { prisma } from "../prisma/client.js";
import { generateSubdomain } from "../utils/generateSubdomain.js";

const router = Router();

/* ===================================================
   POST /stores - CRIAR STORE
=================================================== */
router.post("/", async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || !userId) {
      return res.status(400).json({
        error: "name e userId são obrigatórios",
      });
    }

    const subdomain = generateSubdomain(name);

    const store = await prisma.store.create({
  data: {
    name,
    userId,
    subdomain,

    settings: {
      create: {
        isOpen: true,
        openTime: "13:00",
        closeTime: "22:00",
        deliveryFee: 0,
        minOrderValue: 0,
        estimatedTime: "30-45 min",
        whatsapp: null,
      },
    },
  },
});


    res.json(store);
  } catch (err) {
    console.error("API ERROR (POST /stores):", err);
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================
   GET /stores/me
=================================================== */
router.get("/me", async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const store = await prisma.store.findFirst({
      where: { userId },
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store não encontrada",
      });
    }

    return res.json(store);
  } catch (err) {
    console.error("GET /stores/me error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/* ===================================================
   POST /stores/update-subdomain
=================================================== */
router.post("/update-subdomain", async (req, res) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        error: "subdomain é obrigatório",
      });
    }

    const userId =
      req.user?.id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const store = await prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store não encontrada",
      });
    }

    const exists = await prisma.store.findFirst({
      where: {
        subdomain,
        NOT: { id: store.id },
      },
    });

    if (exists) {
      return res.status(409).json({
        error: "Subdomínio já está em uso",
      });
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { subdomain },
    });

    return res.json({
      success: true,
      message: "Subdomínio atualizado!",
      store: updated,
    });
  } catch (err) {
    console.error("POST /stores/update-subdomain error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

/* ===================================================
   GET /stores/by-user/:userId
=================================================== */
router.get("/by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const store = await prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Store não encontrada para este usuário",
      });
    }

    return res.json(store);
  } catch (err) {
    console.error("GET /stores/by-user/:userId error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});


/* ===================================================
   GET /stores/by-subdomain/:subdomain
   👉 USADO PELO CARDÁPIO PÚBLICO
=================================================== */
router.get("/by-subdomain/:subdomain", async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain) {
      return res.status(400).json({
        error: "Subdomínio é obrigatório",
      });
    }

    const store = await prisma.store.findUnique({
      where: { subdomain },
      include: {
        categories: {
          where: { active: true },
          orderBy: { order: "asc" },
          include: {
            products: {
              where: { active: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    return res.json({
      store: {
        id: store.id,
        name: store.name,
        subdomain: store.subdomain,
        logoUrl: store.logoUrl,
      },
      categories: store.categories,
    });

  } catch (err) {
    console.error("GET /stores/by-subdomain error:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});


/* ===================================================
   PUT /stores/:id
   👉 ATUALIZAR DADOS DA LOJA (MINHA LOJA)
=================================================== */
/* ===================================================
   PUT /stores/:storeId
   👉 Atualiza dados da loja (Minha Loja)
=================================================== */
router.put("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      name,
      description,
      logoUrl,
      coverImage,
      address,
    } = req.body;

    const userId =
      req.user?.id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        userId,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        logoUrl,
        coverImage,
        address,
      },
    });

    return res.json({
      success: true,
      store: updated,
    });
  } catch (err) {
    console.error("PUT /stores/:storeId error:", err);
    return res.status(500).json({
      error: "Erro interno ao atualizar loja",
    });
  }
});


export default router;
