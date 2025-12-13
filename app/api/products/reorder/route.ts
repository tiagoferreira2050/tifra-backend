import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { productIds } = await req.json();

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "productIds deve ser um array" },
        { status: 400 }
      );
    }

    // 🔥 Salva ordem via transação
    await prisma.$transaction(
      productIds.map((id, index) =>
        prisma.product.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro ao salvar ordem:", error);
    return NextResponse.json(
      { error: "Erro ao salvar ordem" },
      { status: 500 }
    );
  }
}
