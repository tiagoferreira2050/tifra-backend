import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storeId, subdomain } = body;

    if (!storeId || !subdomain) {
      return NextResponse.json(
        { error: "storeId e subdomain são obrigatórios" },
        { status: 400 }
      );
    }

    // Verifica se já existe outra loja com esse subdomínio
    const exists = await prisma.store.findFirst({
      where: {
        subdomain,
        NOT: {
          id: storeId,
        },
      },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Subdomínio já está em uso" },
        { status: 409 }
      );
    }

    // Atualiza a loja
    const updated = await prisma.store.update({
      where: { id: storeId },
      data: {
        subdomain,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subdomínio atualizado!",
      store: updated,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
