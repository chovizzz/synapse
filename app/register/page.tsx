"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: "BUSINESS", label: "商务", desc: "负责对接客户、提交广告需求" },
  { value: "OPTIMIZER", label: "优化师", desc: "负责评估需求、执行投放" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("BUSINESS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError("");

    // Save new user to localStorage registry
    const key = "synapse_registered_users";
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const duplicate = existing.find((u: { email: string }) => u.email === email.trim());
    if (duplicate) {
      setError("该邮箱已注册");
      setLoading(false);
      return;
    }

    const newUser = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
    };
    localStorage.setItem(key, JSON.stringify([...existing, newUser]));

    // Auto sign in after register
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      // Registered but can't sign in yet — redirect to login
      router.push("/login");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              <div className="w-5 h-5 rounded-full bg-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Synapse</h1>
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            创建你的账号
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 space-y-5"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
          }}
        >
          <h2 className="text-lg font-semibold text-white">注册账号</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码（演示模式任意填写）"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  backgroundColor: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">角色</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className="rounded-lg p-3 text-left transition-all"
                    style={{
                      border: `1px solid ${role === opt.value ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                      backgroundColor: role === opt.value ? "hsl(var(--primary) / 0.1)" : "hsl(var(--secondary))",
                    }}
                  >
                    <div className="text-sm font-medium text-white">{opt.label}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "注册中…" : "注册并登录"}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            已有账号？{" "}
            <Link href="/login" className="text-blue-400 hover:underline">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
