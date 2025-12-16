import express from "express";
import loginRoute from "./login.routes.js";
import registerRoute from "./register.routes.js"; // Importa a rota de registro

const router = express.Router();

// 🔐 login
router.post("/login", loginRoute);

// 📝 registro
router.post("/register", registerRoute); // Adiciona a rota de registro

export default router;
