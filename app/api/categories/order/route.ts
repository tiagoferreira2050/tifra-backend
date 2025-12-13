import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const { orders } = await req.json();

    // validação mínima
    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json(
        { error: "Orders inválido ou vazio" },
        { status: 400 }
      );
    }

    // limpa ids duplicados
    const uniqueOrders = Array.from(
      new Map(orders.map((item: any) => [item.id, item])).values()
    );

    // cria operações
    const updates = uniqueOrders
      .filter((item: any) => typeof item?.id === "string" && item.id.trim().length > 0)
      .map((item: any) => {
        // número garantido
        const orderValue =
          typeof item.order === "number" && !isNaN(item.order)
            ? item.order
            : 0;

        return prisma.category.update({
          where: { id: item.id },
          data: { order: orderValue },
        });
      });

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Nenhum item válido enviado" },
        { status: 400 }
      );
    }

    // transação com todas as operações
    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Erro PUT /categories/order:", err);
    return NextResponse.json(
      { error: "Erro ao salvar ordem" },
      { status: 500 }
    );
  }
}
