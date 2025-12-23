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
   👉 USADO PELO FRONT (/api/store/me)
=================================================== */
router.get("/me", async (req, res) => {
  try {
    /**
     * 🔴 IMPORTANTE
     * Aqui estou assumindo que você já injeta o userId
     * (via token, middleware, header, etc).
     * 
     * Se hoje você passa userId via header, funciona.
     * Se depois colocar auth middleware, continua funcionando.
     */
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
   👉 MANTIDA (NÃO QUEBRA NADA)
=================================================== */
router.post("/update-subdomain", async (req, res) => {
  try {
    const { storeId, subdomain } = req.body;

    if (!storeId || !subdomain) {
      return res.status(400).json({
        error: "storeId e subdomain são obrigatórios",
      });
    }

    const exists = await prisma.store.findFirst({
      where: {
        subdomain,
        NOT: { id: storeId },
      },
    });

    if (exists) {
      return res.status(409).json({
        error: "Subdomínio já está em uso",
      });
    }

    const updated = await prisma.store.update({
      where: { id: storeId },
      data: { subdomain },
    });

    res.json({
      success: true,
      message: "Subdomínio atualizado!",
      store: updated,
    });

  } catch (err) {
    console.error("POST /stores/update-subdomain error:", err);
    res.status(500).json({ error: "Erro interno" });
  }
});

/* ===================================================
   GET /stores/by-user/:userId
   👉 MANTIDA (NÃO QUEBRA NADA)
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

export default router;
