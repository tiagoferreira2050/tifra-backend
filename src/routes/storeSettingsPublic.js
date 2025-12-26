import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * GET /store/:subdomain/settings
 * 👉 Rota pública usada pelo cardápio
 */
router.get("/store/:subdomain/settings", async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain) {
      return res.status(400).json({ error: "Subdomínio é obrigatório" });
    }

    // ===============================
    // BUSCA STORE
    // ===============================
    const store = await prisma.store.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        coverImage: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    // ===============================
    // BUSCA SETTINGS
    // ===============================
    let settings = await prisma.storeSettings.findUnique({
      where: { storeId: store.id },
      select: {
        isOpen: true,
        openTime: true,
        closeTime: true,
        deliveryFee: true,
        minOrderValue: true,
        estimatedTime: true,
        whatsapp: true,
      },
    });

    // ===============================
    // CRIA SETTINGS PADRÃO (SE NÃO EXISTIR)
    // ===============================
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: {
          storeId: store.id,
          isOpen: true,
          openTime: "13:00",
          closeTime: "22:00",
          deliveryFee: 0,
          minOrderValue: 0,
          estimatedTime: "30-45 min",
        },
        select: {
          isOpen: true,
          openTime: true,
          closeTime: true,
          deliveryFee: true,
          minOrderValue: true,
          estimatedTime: true,
          whatsapp: true,
        },
      });
    }

    // ===============================
    // RESPONSE FINAL (FORMATO PADRÃO)
    // ===============================
    return res.json({
      store,
      settings,
    });
  } catch (error) {
    console.error("Erro GET /store/:subdomain/settings:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
