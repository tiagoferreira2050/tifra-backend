import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: "Email já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error("Erro no register:", err);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
}

export default register;
