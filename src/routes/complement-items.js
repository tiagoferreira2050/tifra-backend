import { Router } from "express";
import { prisma } from "../prisma/client.js";

const router = Router();

/* ===================================================
   DELETE - EXCLUIR APENAS UM ITEM DO COMPLEMENTO
=================================================== */
router.delete("/", async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "ID do item obrigatório" });
    }

    /**
     * REGRA:
     * - Exclui SOMENTE o item
     * - Mantém o grupo
     * - Mantém outros itens
     * - Mantém produtos
     */

    await prisma.complement.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Erro DELETE /complement-items:", err);
    res.status(500).json({
      error: "Erro ao deletar item",
      details: err.message,
    });
  }
});

export default router;
