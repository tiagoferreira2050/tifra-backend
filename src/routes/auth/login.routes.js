import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
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

    // DEBUG → Ver secret carregado
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

    // seta cookie igual ao frontend
    res.cookie("tifra_token", token, {
      httpOnly: true,
      secure: false, // depois em produção vira true
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res.json({
      message: "Login successful",
      token: token,
    });

  } catch (error) {
    console.error("ERRO NO LOGIN:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
