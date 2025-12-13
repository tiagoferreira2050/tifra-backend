import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSubdomain } from "@/lib/generateSubdomain";

export async function POST(req: Request) {
  try {
    const { name, userId } = await req.json();

    const subdomain = generateSubdomain(name);

    const store = await prisma.store.create({
      data: {
        name,
        userId,
        subdomain,
      },
    });

    return NextResponse.json(store);

  } catch (err: any) {
    console.error("API ERROR: ", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
