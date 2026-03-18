"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Eye, EyeOff, Zap } from "lucide-react";
import Link from "next/link";

function LoginForm() {
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

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      setLoading(false);

      if (!result || result.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else if (result.error === "Configuration") {
        setError("服务配置异常，请联系管理员（AUTH_SECRET 未设置）");
      } else if (result.error === "CredentialsSignin") {
        setError("邮箱或密码不正确，请重试");
      } else {
        setError("登录失败，请检查邮箱是否正确");
      }
    } catch {
      setLoading(false);
      setError("登录请求失败，请稍后重试");
    }
  }

  const DEMO_ACCOUNTS = [
    { label: "商务小谢", email: "wang@synapse.demo", role: "商务", color: "blue" as const },
    { label: "优化师小郑", email: "li@synapse.demo", role: "优化师", color: "green" as const },
  ];

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
              广告代投协作平台
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-8 shadow-sm space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">登录账号</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="任意密码（演示模式）"
                  className="w-full rounded-xl px-3 py-2.5 pr-10 text-sm outline-none transition-all border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--secondary))] text-slate-900 dark:text-[hsl(var(--foreground))] placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-indigo-500 dark:focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-[hsl(var(--primary)/0.1)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-[hsl(var(--muted-foreground))] dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-3 py-2.5 text-sm bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all bg-indigo-600 hover:bg-indigo-700 dark:bg-[hsl(var(--primary))] dark:hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "登录中…" : "登录"}
            </button>
          </form>

          <div className="text-center text-sm text-slate-500 dark:text-[hsl(var(--muted-foreground))]">
            没有账号？{" "}
            <Link href="/register" className="text-indigo-600 dark:text-blue-400 hover:underline font-medium">
              立即注册
            </Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="rounded-2xl border border-slate-200 dark:border-[hsl(var(--border))] bg-white dark:bg-[hsl(var(--card))] p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            演示账号（密码随意）
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => setEmail(acc.email)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-100 dark:border-[hsl(var(--border))]"
              >
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{acc.label}</div>
                  <div className="text-xs text-slate-400 dark:text-[hsl(var(--muted-foreground))]">
                    {acc.email}
                  </div>
                </div>
                <span
                  className={
                    acc.color === "blue"
                      ? "text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                      : "text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400"
                  }
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
