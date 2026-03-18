"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱不存在，请检查后重试");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  const DEMO_ACCOUNTS = [
    { label: "商务小王", email: "wang@synapse.demo", role: "商务" },
    { label: "优化师小李", email: "li@synapse.demo", role: "优化师" },
  ];

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
            广告代投协作平台
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
          <h2 className="text-lg font-semibold text-white">登录账号</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary))";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--border))";
                }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="任意密码（演示模式）"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "hsl(var(--secondary))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--primary))";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "hsl(var(--border))";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg px-3 py-2 text-sm bg-red-500/10 text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: "hsl(var(--primary))" }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "登录中…" : "登录"}
            </button>
          </form>

          <div className="text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            没有账号？{" "}
            <Link href="/register" className="text-blue-400 hover:underline">
              立即注册
            </Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{
            borderColor: "hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            演示账号（密码随意）
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => setEmail(acc.email)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{ border: "1px solid hsl(var(--border))" }}
              >
                <div>
                  <div className="text-sm font-medium text-white">{acc.label}</div>
                  <div className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {acc.email}
                  </div>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: acc.role === "商务" ? "rgba(59,130,246,0.15)" : "rgba(34,197,94,0.15)",
                    color: acc.role === "商务" ? "rgb(96,165,250)" : "rgb(74,222,128)",
                  }}
                >
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
