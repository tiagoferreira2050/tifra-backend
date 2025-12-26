import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   GET /store/:subdomain/settings
   👉 USADO NO LOAD DA TELA "MINHA LOJA"
=================================================== */
router.get("/store/:subdomain/settings", async (req, res) => {
  try {
    const { subdomain } = req.params;

    if (!subdomain) {
      return res.status(400).json({
        error: "Subdomain é obrigatório",
      });
    }

    const store = await prisma.store.findUnique({
      where: { subdomain },
      include: {
        settings: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    // 🔥 GARANTIA: se não existir settings, cria automaticamente
    if (!store.settings) {
      const settings = await prisma.storeSettings.create({
        data: {
          storeId: store.id,
          isOpen: true,
          openTime: "13:00",
          closeTime: "22:00",
          deliveryFee: 0,
          minOrderValue: 0,
          estimatedTime: "30-45 min",
          whatsapp: null,
        },
      });

      return res.json({
        store,
        settings,
      });
    }

    return res.json({
      store,
      settings: store.settings,
    });
  } catch (err) {
    console.error("GET /store/:subdomain/settings error:", err);
    return res.status(500).json({
      error: "Erro interno ao buscar configurações da loja",
    });
  }
});

/* ===================================================
   PUT /store/:storeId/settings
   👉 SALVAR CONFIGURAÇÕES (MINHA LOJA)
=================================================== */
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

    if (!storeId) {
      return res.status(400).json({
        error: "storeId é obrigatório",
      });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    // 🔥 UPSERT: atualiza se existir, cria se não existir
    const settings = await prisma.storeSettings.upsert({
      where: {
        storeId,
      },
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
        whatsapp: whatsapp ?? null,
      },
    });

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("PUT /store/:storeId/settings error:", err);
    return res.status(500).json({
      error: "Erro ao salvar configurações da loja",
    });
  }
});

export default router;
