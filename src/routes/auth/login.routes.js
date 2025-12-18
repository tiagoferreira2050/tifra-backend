import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function login(req, res) {
  try {
    const { email, password } = req.body;

    // ===================================================
    // VALIDAÇÃO
    // ===================================================
    if (!email || !password) {
      return res.status(400).json({
        error: "Email e senha obrigatórios",
      });
    }

    // ===================================================
    // BUSCAR USUÁRIO
    // ===================================================
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // ===================================================
    // VALIDAR SENHA
    // ===================================================
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // ===================================================
    // BUSCAR STORE DO USUÁRIO
    // ===================================================
    const store = await prisma.store.findFirst({
      where: { userId: user.id },
    });

    if (!store) {
      return res.status(400).json({
        error: "Usuário sem loja vinculada",
      });
    }

    // ===================================================
    // GERAR TOKEN JWT
    // ===================================================
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        error: "JWT_SECRET não configurado",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        storeId: store.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ===================================================
    // RESPONSE FINAL
    // ===================================================
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        storeId: store.id,
      },
    });

  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({
      error: "Erro interno no servidor",
    });
  }
}
