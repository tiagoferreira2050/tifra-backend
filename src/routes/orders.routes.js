import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/**
 * ======================================================
 * GET /orders
 * Lista pedidos da loja (GESTOR / PDV)
 * ======================================================
 */
router.get("/", async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId é obrigatório" });
    }

    const orders = await prisma.order.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        items: true,
      },
    });

    // 🔥 Normalização para o FRONT
    const formatted = orders.map((order) => ({
      id: order.id,
      customer: order.customer?.name || "Cliente",
      phone: order.customer?.phone || null,
      address: order.customer?.address || null,
      shortAddress: order.customer?.address
        ? order.customer.address.split("-")[0]
        : null,
      status: mapStatus(order.status),
      total: order.total,
      paymentMethod: order.paymentMethod,
      deliveryFee: order.deliveryFee,
      createdAt: order.createdAt,
      items: order.items,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Erro ao listar pedidos:", err);
    return res.status(500).json({
      error: "Erro ao listar pedidos",
    });
  }
});

/**
 * ======================================================
 * POST /orders
 * Cria pedido (PDV / Cardápio público)
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

    // ===============================
    // VALIDAÇÕES BÁSICAS
    // ===============================
    if (!storeId) {
      return res.status(400).json({ error: "storeId é obrigatório" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Pedido sem itens" });
    }

    if (!total || total <= 0) {
      return res.status(400).json({ error: "Total inválido" });
    }

    // ===============================
    // CLIENTE (CRIA OU REUTILIZA)
    // ===============================
    let customerRecord = null;

    if (customer?.phone) {
      customerRecord = await prisma.customer.findFirst({
        where: {
          phone: customer.phone,
          storeId,
        },
      });

      if (!customerRecord) {
        customerRecord = await prisma.customer.create({
          data: {
            storeId,
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
        storeId,
        status: "NEW",
        total,
        paymentMethod,
        deliveryFee,
        customerId: customerRecord?.id || null,
      },
    });

    // ===============================
    // ITENS DO PEDIDO
    // ===============================
    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          complements: item.complements || null,
        },
      });
    }

    return res.status(201).json({
      id: order.id,
      success: true,
    });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    return res.status(500).json({
      error: "Erro interno ao criar pedido",
    });
  }
});

/**
 * ======================================================
 * MAP STATUS (BACKEND → FRONT)
 * ======================================================
 */
function mapStatus(status) {
  switch (status) {
    case "NEW":
      return "analysis";
    case "PREPARING":
      return "preparing";
    case "DELIVERING":
      return "delivering";
    case "FINISHED":
      return "finished";
    default:
      return "analysis";
  }
}

export default router;
