import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ======================================================
   GET /orders
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({ error: "storeId é obrigatório" });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: String(storeId) },
      orderBy: { createdAt: "desc" },
      include: { customer: true, items: true },
    });

    return res.json(orders.map(normalizeOrder));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar pedidos" });
  }
});

/* ======================================================
   POST /orders
====================================================== */
router.post("/", async (req, res) => {
  try {
    const { storeId, customer, items, paymentMethod, deliveryFee = 0, total } =
      req.body;

    if (!storeId || !items?.length || !total) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    let customerRecord = null;

    if (customer?.phone) {
      customerRecord = await prisma.customer.findFirst({
        where: { phone: customer.phone, storeId: String(storeId) },
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

    const order = await prisma.order.create({
      data: {
        storeId: String(storeId),
        status: "NEW",
        total: Number(total),
        paymentMethod: paymentMethod || null,
        deliveryFee: Number(deliveryFee),
        customerId: customerRecord?.id || null,
      },
    });

    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity || 1,
          unitPrice: Number(item.unitPrice),
          complements: item.complements || null,
        },
      });
    }

    const full = await prisma.order.findUnique({
      where: { id: order.id },
      include: { customer: true, items: true },
    });

    return res.status(201).json(normalizeOrder(full));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

/* ======================================================
   PATCH /orders/:id/status
====================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "id e status são obrigatórios" });
    }

    // 🔥 MAPA CORRETO FRONT → PRISMA
    const statusMap = {
      analysis: "NEW",
      preparing: "PREPARING",
      delivering: "DELIVERY", // ✅ CORRETO
      finished: "FINISHED",
    };

    const dbStatus = statusMap[status];

    if (!dbStatus) {
      return res.status(400).json({ error: "status inválido" });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: dbStatus },
      include: { customer: true, items: true },
    });

    return res.json(normalizeOrder(updated));
  } catch (err) {
    console.error("PATCH STATUS ERROR:", err);
    return res.status(500).json({ error: "Erro ao atualizar status do pedido" });
  }
});

/* ======================================================
   HELPERS
====================================================== */
function mapStatus(status) {
  switch (status) {
    case "NEW":
      return "analysis";
    case "PREPARING":
      return "preparing";
    case "DELIVERY":
      return "delivering";
    case "FINISHED":
      return "finished";
    default:
      return "analysis";
  }
}

function normalizeOrder(order) {
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
    items: order.items || [],
  };
}

export default router;
