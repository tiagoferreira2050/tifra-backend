import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * POST /orders
 * Cria pedido vindo do cardápio público
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
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          complements: item.complements || null,
        },
      });

      // 👉 FUTURO:
      // aqui depois a gente pode salvar complementos normalizados
    }

    return res.status(201).json({
      success: true,
      orderId: order.id,
    });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    return res.status(500).json({
      error: "Erro interno ao criar pedido",
    });
  }
});

export default router;
