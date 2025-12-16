import jwt from "jsonwebtoken";

export function verifyAuth(req, res, next) {
  try {
    // 🔐 Authorization: Bearer xxx
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 mantém exatamente a mesma informação que você usava
    req.userId = decoded.id;

    return next();

  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
