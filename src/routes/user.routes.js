import { Router } from "express";
import { prisma } from "../prisma/client.js";

// ✅ CAMINHO CORRETO DO MIDDLEWARE
import { verifyAuth } from "./auth/_middlewares/auth.middleware.js";

const router = Router();

/* ===================================================
   GET /user - DADOS DO USUÁRIO LOGADO
=================================================== */
router.get("/", verifyAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json({ user });

  } catch (err) {
    console.error("USER ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
