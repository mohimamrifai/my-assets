"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, TrendingUp, Wallet, ShieldCheck, BarChart3 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Failed to sign in");
      } else {
        toast.success("Signed in successfully");
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side: Branding & Visuals */}
      <div className="hidden lg:flex w-1/2 bg-card relative overflow-hidden flex-col justify-between p-12 border-r border-border">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Abstract glowing orb */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-screen opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl mix-blend-screen opacity-50"></div>

        <div className="relative z-10 flex items-center gap-2 text-primary font-bold text-2xl tracking-tight">
          <div className="bg-primary/10 p-2 rounded-lg ring-1 ring-primary/20">
            <TrendingUp size={24} className="text-primary" />
          </div>
          MyAssets
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground leading-tight">
            Track your net worth with absolute precision.
          </h1>
          <p className="text-muted-foreground text-lg">
            A comprehensive, professional-grade platform to monitor your stocks, crypto, and gold portfolio in one unified dashboard.
          </p>
          
          <div className="grid grid-cols-1 gap-6 pt-8">
            <div className="flex items-start gap-4">
              <div className="bg-background p-2.5 rounded-lg border border-border mt-1">
                <BarChart3 size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Advanced Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">Gain deep insights into your investment performance over time.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-background p-2.5 rounded-lg border border-border mt-1">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Secure & Private</h3>
                <p className="text-sm text-muted-foreground mt-1">Your financial data remains strictly confidential and protected.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-muted-foreground font-medium">
          © {new Date().getFullYear()} MyAssets Platform. All rights reserved.
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        {/* Mobile branding header */}
        <div className="absolute top-8 left-8 flex lg:hidden items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="bg-primary/10 p-1.5 rounded-md ring-1 ring-primary/20">
            <TrendingUp size={20} className="text-primary" />
          </div>
          MyAssets
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">
              Enter your credentials to access your portfolio
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 px-4 bg-background border-border hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 px-4 bg-background border-border hover:border-primary/50 focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-11 text-base font-medium shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-300" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Internal system access only
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
