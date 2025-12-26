import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

/* ===================================================
   GET /api/store/settings
   👉 Carrega dados da página "Minha Loja"
   👉 Cria StoreSettings se não existir
=================================================== */
router.get("/api/store/settings", async (req, res) => {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    // ===============================
    // BUSCA STORE + SETTINGS
    // ===============================
    const store = await prisma.store.findFirst({
      where: { userId },
      include: {
        settings: true,
      },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    // ===============================
    // CRIA SETTINGS SE NÃO EXISTIR
    // ===============================
    let settings = store.settings;

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
          whatsapp: null,
        },
      });
    }

    return res.json({
      store: {
        id: store.id,
        name: store.name,
        description: store.description,
        logoUrl: store.logoUrl,
        coverImage: store.coverImage,
        address: store.address,
      },
      settings,
    });
  } catch (error) {
    console.error("GET /api/store/settings error:", error);
    return res.status(500).json({
      error: "Erro interno",
    });
  }
});

/* ===================================================
   PUT /api/store/settings
   👉 Salva dados da página "Minha Loja"
=================================================== */
router.put("/api/store/settings", async (req, res) => {
  try {
    const userId = req.user?.id || req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    const {
      name,
      description,
      logoUrl,
      coverImage,
      address,
      isOpen,
      openTime,
      closeTime,
      deliveryFee,
      minOrderValue,
      estimatedTime,
      whatsapp,
    } = req.body;

    // ===============================
    // BUSCA STORE
    // ===============================
    const store = await prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return res.status(404).json({
        error: "Loja não encontrada",
      });
    }

    // ===============================
    // ATUALIZA STORE
    // ===============================
    await prisma.store.update({
      where: { id: store.id },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        logoUrl: logoUrl ?? null,
        coverImage: coverImage ?? null,
        address: address ?? null,
      },
    });

    // ===============================
    // UPSERT SETTINGS
    // ===============================
    const settings = await prisma.storeSettings.upsert({
      where: { storeId: store.id },
      update: {
        ...(isOpen !== undefined && { isOpen }),
        ...(openTime && { openTime }),
        ...(closeTime && { closeTime }),
        ...(deliveryFee !== undefined && { deliveryFee }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(estimatedTime && { estimatedTime }),
        ...(whatsapp !== undefined && {
          whatsapp: whatsapp?.trim() || null,
        }),
      },
      create: {
        storeId: store.id,
        isOpen: isOpen ?? true,
        openTime: openTime ?? "13:00",
        closeTime: closeTime ?? "22:00",
        deliveryFee: deliveryFee ?? 0,
        minOrderValue: minOrderValue ?? 0,
        estimatedTime: estimatedTime ?? "30-45 min",
        whatsapp: whatsapp?.trim() || null,
      },
    });

    return res.json({
      success: true,
      storeId: store.id,
      settings,
    });
  } catch (error) {
    console.error("PUT /api/store/settings error:", error);
    return res.status(500).json({
      error: "Erro interno",
    });
  }
});

export default router;
