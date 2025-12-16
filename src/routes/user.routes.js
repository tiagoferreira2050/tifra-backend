import { Router } from "express";
import { prisma } from "../prisma/client.js";
import jwt from "jsonwebtoken";

const router = Router();

/* ===================================================
   GET /user - DADOS DO USUÁRIO LOGADO
=================================================== */
router.get("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.json({ user });

  } catch (err) {
    console.error("TOKEN ERROR:", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
