import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/store/:subdomain/settings", async (req, res) => {
  try {
    const { subdomain } = req.params;

    const store = await prisma.store.findUnique({
      where: { subdomain },
      include: { settings: true },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    if (!store.settings) {
      const settings = await prisma.storeSettings.create({
        data: {
          storeId: store.id,
          openTime: "13:00",
          closeTime: "22:00",
        },
      });

      return res.json({
        store: {
          id: store.id,
          name: store.name,
          logoUrl: store.logoUrl,
        },
        settings,
      });
    }

    return res.json({
      store: {
        id: store.id,
        name: store.name,
        logoUrl: store.logoUrl,
      },
      settings: store.settings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
