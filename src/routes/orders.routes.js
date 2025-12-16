import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   POST /orders - CRIAR PEDIDO
=================================================== */
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // 🔥 Compatível com NovoPedidoDrawer
    const customerName = body.customerName ?? body.customer;
    const customerPhone = body.customerPhone ?? body.phone ?? "";
    const customerAddress = body.customerAddress ?? body.address ?? "";
    const paymentMethod = body.paymentMethod;
    const deliveryFee = body.deliveryFee || 0;

    // 🔥 Normalizar itens
    const items =
      body.items?.map((it) => ({
        productId: it.productId,
        quantity: it.quantity ?? it.qty ?? 1,
        unitPrice: it.unitPrice ?? it.price ?? 0,
        complements: it.complements ?? it.selectedComplements ?? [],
      })) ?? [];

    if (!items.length) {
      return res.status(400).json({ error: "Nenhum item no pedido" });
    }

    // 1️⃣ Criar ou reaproveitar cliente
    let customer = null;

    if (customerName) {
      customer = await prisma.customer.findFirst({
        where: { phone: customerPhone || "" },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            phone: customerPhone || "",
            address: customerAddress || "",
          },
        });
      }
    }

    // 2️⃣ Calcular total
    const totalItems = items.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0
    );

    const total = totalItems + deliveryFee;

    // 3️⃣ Criar pedido
    const order = await prisma.order.create({
      data: {
        status: "analysis",
        total,
        paymentMethod: paymentMethod || null,
        deliveryFee,
        customerId: customer?.id || null,
      },
    });

    // 4️⃣ Criar itens
    await prisma.$transaction(
      items.map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            complements: item.complements || [],
          },
        })
      )
    );

    // 5️⃣ Buscar pedido completo
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    // 6️⃣ Normalizar para o painel
    const normalized = {
      id: fullOrder.id,
      status: fullOrder.status,
      total: fullOrder.total,
      paymentMethod: fullOrder.paymentMethod,
      createdAt: fullOrder.createdAt,

      customer: fullOrder.customer?.name || "",
      phone: fullOrder.customer?.phone || "",
      address: fullOrder.customer?.address || "",
      shortAddress: fullOrder.customer?.address?.split(",")[0] || "",

      items: fullOrder.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        productName: i.product?.name,
        productPrice: i.product?.price,
        complements: i.complements || [],
      })),
    };

    res.status(201).json(normalized);

  } catch (err) {
    console.error("POST /orders error:", err);
    res.status(500).json({ error: "Erro ao criar pedido" });
  }
});

/* ===================================================
   GET /orders - LISTAR PEDIDOS
=================================================== */
router.get("/", async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
      },
    });

    const normalized = orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,

      customer: o.customer?.name || "",
      phone: o.customer?.phone || "",
      address: o.customer?.address || "",
      shortAddress: o.customer?.address?.split(",")[0] || "",

      items: o.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        productName: i.product?.name,
        productPrice: i.product?.price,
        complements: i.complements || [],
      })),
    }));

    res.json(normalized);

  } catch (err) {
    console.error("GET /orders error:", err);
    res.status(500).json({ error: "Erro ao listar pedidos" });
  }
});

export default router;
