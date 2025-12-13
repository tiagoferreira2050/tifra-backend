import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔥 Ajuste para aceitar o payload do NovoPedidoDrawer
    const customerName = body.customerName ?? body.customer;
    const customerPhone = body.customerPhone ?? body.phone ?? "";
    const customerAddress = body.customerAddress ?? body.address ?? "";
    const paymentMethod = body.paymentMethod;
    const deliveryFee = body.deliveryFee || 0;

    // 🔥 Converter items do formato do Drawer para o formato da sua API
    const items =
      body.items?.map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity ?? it.qty ?? 1,
        unitPrice: it.unitPrice ?? it.price ?? 0,
        complements: it.complements ?? it.selectedComplements ?? [],
      })) ?? [];

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item no pedido" },
        { status: 400 }
      );
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
      (acc: number, item: any) => acc + item.unitPrice * item.quantity,
      0
    );

    const total = totalItems + (deliveryFee || 0);

    // 3️⃣ Criar pedido
    const order = await prisma.order.create({
      data: {
        status: "analysis",
        total,
        paymentMethod: paymentMethod || null,
        deliveryFee: deliveryFee || 0,
        customerId: customer?.id || null,
      },
    });

    // 4️⃣ Criar itens no banco
    await prisma.$transaction(
      items.map((item: any) =>
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
      id: fullOrder!.id,
      status: fullOrder!.status,
      total: fullOrder!.total,
      paymentMethod: fullOrder!.paymentMethod,
      createdAt: fullOrder!.createdAt,

      customer: fullOrder!.customer?.name || "",
      phone: fullOrder!.customer?.phone || "",
      address: fullOrder!.customer?.address || "",
      shortAddress: fullOrder!.customer?.address?.split(",")[0] || "",

      items: fullOrder!.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        productName: i.product?.name,
        productPrice: i.product?.price,
        complements: i.complements || [],
      })),
    };

    return NextResponse.json(normalized, { status: 201 });
  } catch (err) {
    console.error("POST /orders error", err);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}


export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
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

      // Dados do cliente
      customer: o.customer?.name || "",
      phone: o.customer?.phone || "",
      address: o.customer?.address || "",
      shortAddress: o.customer?.address?.split(",")[0] || "",

      // Itens
      items: o.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        productName: i.product?.name,
        productPrice: i.product?.price,
        complements: i.complements || [],
      })),
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    console.error("GET /orders error", err);
    return NextResponse.error();
  }
}


