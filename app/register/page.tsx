"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Zap } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string; color: string }[] = [
  { value: "BUSINESS", label: "商务", desc: "负责对接客户、提交广告需求", color: "blue" },
  { value: "OPTIMIZER", label: "优化师", desc: "负责评估需求、执行投放", color: "green" },
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

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (!result || result.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      setLoading(false);
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[hsl(var(--background))]">
      <div className="w-full max-w-md space-y-5">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40">
              <Zap size={26} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Synapse</h1>
            <p className="text-sm text-slate-500 dark:text-[hsl(var(--muted-foreground))] mt-1">
              创建你的账号
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">注册账号</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-white">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="你的名字"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-900 dark:text-[hsl(var(--foreground))] placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[hsl(var(--primary)/0.1)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-white">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-900 dark:text-[hsl(var(--foreground))] placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[hsl(var(--primary)/0.1)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-white">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置密码（演示模式任意填写）"
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-900 dark:text-[hsl(var(--foreground))] placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[hsl(var(--primary)/0.1)]"
              />
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-white">选择角色</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`rounded-xl p-3 text-left transition-all border ${
                      role === opt.value
                        ? opt.color === "blue"
                          ? "border-indigo-500 bg-indigo-50 dark:border-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)/0.1)]"
                          : "border-indigo-500 bg-indigo-50 dark:border-[hsl(var(--primary))] dark:bg-[hsl(var(--primary)/0.1)]"
                        : "border-slate-200 dark:border-[hsl(var(--border))] bg-slate-50 dark:bg-[hsl(var(--secondary))] hover:border-slate-300 dark:hover:border-[hsl(var(--muted-foreground)/0.3)]"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{opt.label}</div>
                    <div className="text-[11px] mt-0.5 text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-3 py-2.5 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] dark:hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "注册中…" : "注册并登录"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
            已有账号？{" "}
            <Link href="/login" className="text-indigo-600 dark:text-blue-400 hover:underline font-medium">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
