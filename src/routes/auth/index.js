import express from "express";
import loginRoute from "./login.routes.js";
import registerRoute from "./register.routes.js";

const router = express.Router();

// 🔐 login
router.post("/login", loginRoute);

// 📝 registro
router.post("/register", registerRoute);

export default router;
