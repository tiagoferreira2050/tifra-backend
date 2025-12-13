import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// ===================================================
// GET — Buscar produto completo (INCLUINDO COMPLEMENTOS)
// ===================================================
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        productComplements: {
          orderBy: { order: "asc" },
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Erro GET /products/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}

// ===================================================
// PATCH — Atualizar produto + complements (groups)
// ===================================================
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const {
      name,
      description,
      priceInCents,
      categoryId,
      pdv,
      imageUrl,
      active,
    } = body;

    // preço seguro
    const price =
      priceInCents !== undefined && priceInCents !== null
        ? priceInCents / 100
        : undefined;

    // Build data only with provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // 🔥 categoria agora é relation correta
    if (categoryId !== undefined) {
      updateData.category = {
        connect: { id: categoryId },
      };
    }

    // 🔥 PDV agora existe no banco
    if (pdv !== undefined) updateData.pdv = pdv;

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (price !== undefined) updateData.price = price;
    if (active !== undefined) updateData.active = active;

    // Atualiza produto (campos enviados)
    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // ---- handling de complements: só mexer se o cliente enviou o campo `complements` ----
    if (Object.prototype.hasOwnProperty.call(body, "complements")) {
      const complements = body.complements;
      const uniqueComplements = Array.isArray(complements)
        ? [...new Set(complements)]
        : [];

      // remove antigos
      await prisma.productComplement.deleteMany({
        where: { productId: id },
      });

      // cria novos apenas se houver
      if (uniqueComplements.length > 0) {
        await prisma.productComplement.createMany({
          data: uniqueComplements.map((groupId: string, order: number) => ({
            productId: id,
            groupId,
            order,
            active: true,
          })),
        });
      }
    }

    // Retorna produto atualizado com complements
    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        productComplements: {
          orderBy: { order: "asc" },
          include: {
            group: {
              include: { items: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro PATCH /products/[id]:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}


// ===================================================
// DELETE — Remover produto
// ===================================================
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1️⃣ Remove complementos ligados ao produto
    await prisma.productComplement.deleteMany({
      where: { productId: id },
    });

    // 2️⃣ Agora pode remover o produto sem erro de FK
    const deleted = await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted });

  } catch (error) {
    console.error("Erro DELETE /products/[id]:", error);

    return NextResponse.json(
      { error: "Erro ao excluir produto", details: error.message },
      { status: 500 }
    );
  }
}

