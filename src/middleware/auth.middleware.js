import { UnauthorizedError } from "../core/error.response.js";
import { verifyToken } from "../utils/jwt.helper.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Bạn chưa đăng nhập! Vui lòng cung cấp token hợp lệ.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token của bạn đã hết hạn, vui lòng đăng nhập lại!");
    }
    throw new UnauthorizedError("Token không hợp lệ hoặc đã bị chỉnh sửa trái phép!");
  }
};