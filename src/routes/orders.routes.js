import { Router } from "express";
import { prisma } from "../prisma/client.js";


const router = Router();

/**
 * ======================================================
 * GET /orders
 * ======================================================
 */
router.get("/", async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId é obrigatório" });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: String(storeId) },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    // normalizeOrder é async
    const formatted = await Promise.all(
      orders.map((order) => normalizeOrder(order))
    );

    return res.json(formatted);
  } catch (err) {
    console.error("Erro ao listar pedidos:", err);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
});

/**
 * ======================================================
 * POST /orders
 * ======================================================
 */
router.post("/", async (req, res) => {
  try {
    const {
      storeId,
      customer,
      items,
      paymentMethod,
      deliveryFee = 0,
      total,
    } = req.body;

    if (!storeId) {
      return res.status(400).json({ error: "storeId é obrigatório" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Pedido sem itens" });
    }

    if (!total || Number(total) <= 0) {
      return res.status(400).json({ error: "Total inválido" });
    }

    // ===============================
    // CLIENTE
    // ===============================
    let customerRecord = null;

    if (customer?.phone) {
      customerRecord = await prisma.customer.findFirst({
        where: {
          phone: customer.phone,
          storeId: String(storeId),
        },
      });

      if (!customerRecord) {
        customerRecord = await prisma.customer.create({
          data: {
            storeId: String(storeId),
            name: customer.name || "Cliente",
            phone: customer.phone,
            address: customer.address || null,
          },
        });
      }
    }

    // ===============================
    // CRIA PEDIDO
    // ===============================
    const order = await prisma.order.create({
      data: {
        storeId: String(storeId),
        status: "NEW",
        total: Number(total),
        paymentMethod: paymentMethod || null,
        deliveryFee: Number(deliveryFee || 0),
        customerId: customerRecord?.id || null,
      },
    });

    // ===============================
    // CRIA ITENS DO PEDIDO
    // ===============================
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice),

          // 🔒 salva tudo que veio do frontend (NÃO perde info)
          complements: Array.isArray(item.complements)
            ? item.complements.map((c) => ({
                optionName: c.optionName || c.name || "Complemento",
                groupTitle: c.groupTitle || null,
                qty: Number(c.qty || 1),
                price: Number(c.price || 0),
              }))
            : [],
        },
      });
    }

    // ===============================
    // BUSCA PEDIDO COMPLETO
    // ===============================
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    const normalized = await normalizeOrder(fullOrder);

    return res.status(201).json(normalized);
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    return res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

/**
 * ======================================================
 * PATCH /orders/:id/status
 * ======================================================
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, canceledBy } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const statusMap = {
      analysis: "NEW",
      preparing: "PREPARING",
      delivering: "OUT_FOR_DELIVERY",
      finished: "FINISHED",
      canceled: "CANCELED",
    };

    const dbStatus = statusMap[status];

    if (!dbStatus) {
      return res.status(400).json({ error: "status inválido" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: dbStatus,

        // ✔ FINALIZAÇÃO NORMAL
        finalizedAt: dbStatus === "FINISHED" ? new Date() : null,

        // 🔴 CANCELAMENTO (NOVO)
        canceledAt: dbStatus === "CANCELED" ? new Date() : null,
        cancelReason:
          dbStatus === "CANCELED" ? reason || "Não informado" : null,
        canceledBy:
          dbStatus === "CANCELED" ? canceledBy || "STORE" : null,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    const normalized = await normalizeOrder(updated);

    return res.json(normalized);
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    return res.status(500).json({ error: "Erro ao atualizar status" });
  }
});


/**
 * ======================================================
 * HELPERS
 * ======================================================
 */
function mapStatus(status) {
  switch (status) {
    case "NEW":
      return "analysis";
    case "PREPARING":
      return "preparing";
    case "OUT_FOR_DELIVERY":
      return "delivering";
    case "FINISHED":
      return "finished";
    case "CANCELED":
      return "canceled";
    default:
      return "analysis";
  }
}

/**
 * 🔥 NORMALIZAÇÃO FINAL (BUG ELIMINADO)
 * - usa optionName (novo)
 * - fallback para name (antigo)
 * - não inventa dados
 * - não quebra pedidos antigos
 */
async function normalizeOrder(order) {
  return {
    id: order.id,
    customer: order.customer?.name || "Cliente",
    phone: order.customer?.phone || null,
    address: order.customer?.address || null,
    shortAddress: order.customer?.address
      ? order.customer.address.split("-")[0]
      : null,
    status: mapStatus(order.status),
    total: Number(order.total),
    paymentMethod: order.paymentMethod || null,
    deliveryFee: Number(order.deliveryFee || 0),
    createdAt: order.createdAt,

    items: order.items.map((item) => {
      const complements = Array.isArray(item.complements)
        ? item.complements.map((c) => ({
            name: c.optionName || c.name || "Complemento",
            quantity: Number(c.qty || 1),
            price: Number(c.price || 0),
          }))
        : [];

      const complementsTotal = complements.reduce(
        (acc, c) => acc + c.price * c.quantity,
        0
      );

      const unitPrice = Number(item.unitPrice || 0);

      return {
        quantity: item.quantity,
        unitPrice,
        product: {
          name: item.product?.name || "Produto",
        },
        complements,
        total: (unitPrice + complementsTotal) * item.quantity,
      };
    }),
  };
}

export default router;
