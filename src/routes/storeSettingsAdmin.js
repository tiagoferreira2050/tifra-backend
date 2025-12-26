import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/**
 * PUT /store/:storeId/settings
 * Atualiza ou cria configurações da loja
 */
router.put("/store/:storeId/settings", async (req, res) => {
  try {
    const { storeId } = req.params;
    const {
      isOpen,
      openTime,
      closeTime,
      deliveryFee,
      minOrderValue,
      estimatedTime,
      whatsapp,
    } = req.body;

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    const settings = await prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        isOpen,
        openTime,
        closeTime,
        deliveryFee,
        minOrderValue,
        estimatedTime,
        whatsapp,
      },
      create: {
        storeId,
        isOpen: isOpen ?? true,
        openTime: openTime ?? "13:00",
        closeTime: closeTime ?? "22:00",
        deliveryFee: deliveryFee ?? 0,
        minOrderValue: minOrderValue ?? 0,
        estimatedTime: estimatedTime ?? "30-45 min",
        whatsapp,
      },
    });

    return res.json(settings);
  } catch (error) {
    console.error("Erro ao salvar StoreSettings:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
