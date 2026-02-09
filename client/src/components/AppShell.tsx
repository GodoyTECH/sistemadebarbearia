import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import {
  Scissors,
  LayoutDashboard,
  Calendar,
  LogOut,
  Users,
  History,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { data } = useProfile();
  const isAdmin = data?.profile?.role === "manager";
  const storeName = data?.store?.storeName || "Loja";
  const storeNumber = data?.store?.storeNumber || "--";

  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/appointments", label: "Gestão de Cortes", icon: Calendar },
        { href: "/admin/services", label: "Serviços & Promoções", icon: Scissors },
      ]
    : [
        { href: "/professional", label: "Registrar Corte", icon: Scissors },
        { href: "/professional/history", label: "Meus Cortes", icon: History },
      ];

  const navContent = (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const footerContent = (
    <div className="p-4 border-t border-border/50 bg-muted/20">
      <div className="flex items-center gap-3 mb-4 px-2">
        {data?.user?.profileImageUrl ? (
          <img
            src={data.user.profileImageUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full border border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Users className="w-5 h-5" />
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate">{data?.user?.firstName || "Usuário"}</p>
          <p className="text-xs text-muted-foreground truncate capitalize">
            {data?.profile?.role || "Pending"}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
        onClick={() => logout()}
      >
        <LogOut className="h-4 w-4" />
        Sair do Sistema
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex h-screen w-64 bg-card border-r border-border flex-col fixed left-0 top-0 z-20">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 logo-pulse">
              <Scissors className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none premium-outline">Luxe</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Salon System</span>
            </div>
          </div>
        </div>
        {navContent}
        {footerContent}
      </aside>

      <div className="flex-1 md:ml-64 w-full">
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/50 bg-card/80 backdrop-blur sticky top-0 z-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sistema Luxe</p>
            <p className="text-lg font-display font-semibold premium-outline">{storeName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Número da Loja</p>
            <p className="text-sm font-semibold text-primary">{storeNumber}</p>
          </div>
        </header>
        <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-border/50 bg-card/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 logo-pulse">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display font-bold text-lg leading-none">Luxe</p>
              <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{storeName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Loja</p>
              <p className="text-xs font-semibold text-primary">{storeNumber}</p>
            </div>
            <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 logo-pulse">
                    <Scissors className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-xl leading-none premium-outline">Luxe</h1>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Salon System</span>
                  </div>
                </div>
              </div>
              {navContent}
              {footerContent}
            </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1200px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
