import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

function readUsers(): Array<{ id: string; name: string; email: string; role: string }> {
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeUsers(users: Array<{ id: string; name: string; email: string; role: string }>) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function GET() {
  const users = readUsers();
  return NextResponse.json({ success: true, data: users });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, role } = body;

  if (!name || !email || !role) {
    return NextResponse.json({ success: false, error: "缺少必要字段" }, { status: 400 });
  }

  const users = readUsers();
  const duplicate = users.find((u) => u.email === email);
  if (duplicate) {
    return NextResponse.json({ success: false, error: "该邮箱已注册" }, { status: 409 });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    role,
  };

  writeUsers([...users, newUser]);
  return NextResponse.json({ success: true, data: newUser });
}
