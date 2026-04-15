import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  // 读取所有 cookies
  const cookies = req.cookies.getAll();
  
  // 尝试读取 token
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // 返回调试信息
  return NextResponse.json({
    cookies: cookies.map((c) => ({ name: c.name, value: c.value.substring(0, 20) + "..." })),
    token: token ? { id: token.id, email: token.email, role: token.role } : null,
    hasAuthSecret: !!process.env.AUTH_SECRET,
  });
}
