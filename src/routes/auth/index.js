import express from "express";
import loginRoute from "./login.routes.js";
import registerRoute from "./register.routes.js";

const router = express.Router();

/* ===================================================
   🔥 LIBERA PREFLIGHT (CORS) PARA AUTH
   ⚠️ ESSENCIAL PARA LOGIN FUNCIONAR
=================================================== */
router.options("*", (req, res) => {
  res.sendStatus(200);
});

// 🔐 login
router.post("/login", loginRoute);

// 📝 registro
router.post("/register", registerRoute);

export default router;
