import jwt from "jsonwebtoken";

export function verifyAuth(req, res, next) {
  try {
    let token = null;

    // 🔐 1️⃣ Authorization: Bearer xxx
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // 🔐 2️⃣ Cookie httpOnly (PRINCIPAL)
    if (!token && req.cookies?.tifra_token) {
      token = req.cookies.tifra_token;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 mantém compatibilidade com todo o sistema atual
    req.userId = decoded.id;
    req.user = decoded;

    return next();

  } catch (error) {
    console.error("AUTH ERROR:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}
