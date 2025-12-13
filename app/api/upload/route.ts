import { NextResponse } from "next/server";

// Obrigatório para uploads funcionarem no Vercel
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Variáveis do .env (NÃO use NEXT_PUBLIC aqui)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      return NextResponse.json(
        { error: "Cloudinary não configurado" },
        { status: 500 }
      );
    }

    // URL correta do Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    // Enviar arquivo para Cloudinary
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", preset);

    const upload = await fetch(uploadUrl, {
      method: "POST",
      body: data,
    });

    const json = await upload.json();

    if (!upload.ok) {
      console.error("Cloudinary error:", json);
      return NextResponse.json(
        { error: "Falha no upload", details: json },
        { status: 500 }
      );
    }

    // Retorna a URL final da imagem
    return NextResponse.json({ url: json.secure_url });
  } catch (err) {
    console.error("Erro no /api/upload:", err);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
