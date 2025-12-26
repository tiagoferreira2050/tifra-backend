import express from "express";
import loginRoute from "./login.routes.js";
import registerRoute from "./register.routes.js";

const router = express.Router();

/* ===================================================
   🔥 PREFLIGHT CORS — COMPATÍVEL COM EXPRESS 5 / NODE 20
=================================================== */
router.options("/", (req, res) => {
  res.sendStatus(200);
});

router.options("/login", (req, res) => {
  res.sendStatus(200);
});

router.options("/register", (req, res) => {
  res.sendStatus(200);
});

// 🔐 login
router.post("/login", loginRoute);

// 📝 registro
router.post("/register", registerRoute);

export default router;
