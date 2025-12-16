import jwt from "jsonwebtoken";

export function verifyAuth(req, res, next) {
  try {
    // 🔐 1️⃣ Tenta pegar do header Authorization: Bearer xxx
    const authHeader = req.headers.authorization;

    // 🔐 2️⃣ Tenta pegar do cookie tifra_token
    const cookieToken = req.cookies?.tifra_token;

    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 mantém exatamente a mesma informação usada no sistema
    req.userId = decoded.id;

    return next();

  } catch (error) {
    console.error("AUTH ERROR:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}
