import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Mic2, House, BarChart2, UserCircle, LogOut, FileAudio, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const learnerItems = [
    { href: "/", label: "Home", icon: House },
    { href: "/record", label: "Record New", icon: Mic2 },
    { href: "/learner-portal", label: "My Progress", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  const reviewerItems = [
    { href: "/", label: "Home", icon: House },
    { href: "/reviewer-hub", label: "Reviewer Hub", icon: FileAudio },
    { href: "/profile", label: "Profile", icon: UserCircle },
  ];

  const navItems = user?.role === "reviewer" ? reviewerItems : learnerItems;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-foreground">
      {/* Mobile Header */}
      <header className="md:hidden border-b border-border p-4 flex justify-between items-center bg-card sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-lg">
            M
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Marlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar Navigation (Desktop) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-red-700 flex items-center justify-center text-primary-foreground font-bold font-display text-2xl shadow-lg shadow-primary/20">
              M
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-foreground">Marlow</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 pl-1">Master Chinese Tones</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive(item.href) 
                    ? "bg-primary/10 text-primary font-medium shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/10">
          <Link href="/profile">
            <div className="flex items-center gap-3 mb-4 px-2 cursor-pointer rounded-lg hover:bg-muted/50 transition-colors py-2 -my-1" data-testid="sidebar-profile-link">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {user?.firstName?.[0] || (user as any)?.username?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.firstName || (user as any)?.username || "Learner"}</p>
                <p className="text-xs text-muted-foreground truncate">Free Plan</p>
              </div>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen bg-background">
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
