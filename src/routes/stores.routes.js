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
   POST /stores/update-subdomain
=================================================== */
router.post("/update-subdomain", async (req, res) => {
  try {
    const { storeId, subdomain } = req.body;

    if (!storeId || !subdomain) {
      return res.status(400).json({
        error: "storeId e subdomain são obrigatórios",
      });
    }

    // verifica se outro store já usa o subdomínio
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

export default router;
