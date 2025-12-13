export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===================================================
// GET - LISTAR COMPLEMENTOS
// ===================================================
export async function GET() {
  try {
    const groups = await prisma.complementGroup.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        items: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(groups);
  } catch (err) {
    console.error("Erro GET /complements:", err);
    return NextResponse.json(
      { error: "Erro ao listar complementos" },
      { status: 500 }
    );
  }
}

// ===================================================
// POST - CRIAR GRUPO + ITENS
// ===================================================
export async function POST(req: Request) {
  try {
    const { name, description, required, min, max, type, options } =
      await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "name é obrigatório" },
        { status: 400 }
      );
    }

    const group = await prisma.complementGroup.create({
      data: {
        name,
        description: description ?? "",
        required: required ?? false,
        min: min !== undefined ? Number(min) : 0,
        max: max !== undefined ? Number(max) : 1,
        active: true,
        type: type || "multiple",
      },
    });

    if (Array.isArray(options)) {
      for (const opt of options) {
        await prisma.complement.create({
          data: {
            groupId: group.id,
            name: opt.name,
            price: Number(opt.price ?? 0),
            active: opt.active ?? true,
            imageUrl: opt.imageUrl || null,
            description: opt.description || "",
          },
        });
      }
    }

    const result = await prisma.complementGroup.findUnique({
      where: { id: group.id },
      include: { items: true },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("Erro POST /complements:", err);
    return NextResponse.json(
      { error: "Erro ao criar complemento", details: err.message },
      { status: 500 }
    );
  }
}

// ===================================================
// PATCH - ATUALIZAR GRUPO + ITENS
// ===================================================
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, required, min, max, active, type } = body;
    const options = Array.isArray(body.options) ? body.options : undefined;

    if (!id) {
      return NextResponse.json(
        { error: "ID obrigatório" },
        { status: 400 }
      );
    }

    // 1) Atualizar grupo
    await prisma.complementGroup.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        required: required ?? undefined,
        min: min !== undefined ? Number(min) : undefined,
        max: max !== undefined ? Number(max) : undefined,
        active: active ?? undefined,
        type: type ?? undefined,
      },
    });

    // 2) Atualizar / criar itens
    const savedItemIds: string[] = [];

    for (const opt of options) {
      const isNew =
        !opt.id ||
        typeof opt.id !== "string" ||
        opt.id.startsWith("opt-");

      const payload = {
        name: opt.name,
        price: Number(opt.price ?? 0),
        active: opt.active ?? true,
        imageUrl: opt.imageUrl || opt.image || null,
        description: opt.description || "",
      };

      if (isNew) {
        const created = await prisma.complement.create({
          data: {
            groupId: id,
            ...payload,
          },
        });

        savedItemIds.push(created.id);
      } else {
        await prisma.complement.update({
          where: { id: opt.id },
          data: payload,
        });

        savedItemIds.push(opt.id);
      }
    }

    // 3) Remover itens excluídos
    await prisma.complement.deleteMany({
      where: {
        groupId: id,
        id: { notIn: savedItemIds },
      },
    });

    const updated = await prisma.complementGroup.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Erro PATCH /complements:", err);
    return NextResponse.json(
      { error: "Erro ao atualizar complemento", details: err.message },
      { status: 500 }
    );
  }
}

// ===================================================
// DELETE
// ===================================================
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID obrigatório" },
        { status: 400 }
      );
    }

    await prisma.complement.deleteMany({ where: { groupId: id } });
    await prisma.complementGroup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro DELETE /complements:", err);
    return NextResponse.json(
      { error: "Erro ao deletar complemento", details: err.message },
      { status: 500 }
    );
  }
}
