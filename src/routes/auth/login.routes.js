import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export default async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("JWT sendo usado:", process.env.JWT_SECRET);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ COOKIE 100% COMPATÍVEL COM app.tifra.com.br
    res.cookie("tifra_token", token, {
      httpOnly: true,
      secure: true,          // 🔥 obrigatório em HTTPS
      sameSite: "none",      // 🔥 obrigatório cross-domain
      domain: ".tifra.com.br", // 🔥 ESSENCIAL (esse era o bug)
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    });

    return res.json({
      message: "Login successful",
    });

  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
