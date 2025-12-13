import jwt from "jsonwebtoken";

export function verifyAuth(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return { error: "No token provided", status: 401 };
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    return { userId: (decoded as any).id };
  } catch (error) {
    return { error: "Invalid token", status: 401 };
  }
}