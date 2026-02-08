import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { 
  Scissors, 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  LogOut, 
  Users,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { data } = useProfile();
  const isAdmin = data?.profile?.role === "admin";

  const links = isAdmin ? [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/appointments", label: "Gestão de Cortes", icon: Calendar },
    { href: "/admin/services", label: "Serviços & Promoções", icon: Scissors },
  ] : [
    { href: "/professional", label: "Registrar Corte", icon: Scissors },
    { href: "/professional/history", label: "Meus Cortes", icon: History },
  ];

  return (
    <div className="h-screen w-64 bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-none">Luxe</h1>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Salon System</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href;
          
          return (
            <Link key={link.href} href={link.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-3 mb-4 px-2">
          {data?.user?.profileImageUrl ? (
            <img src={data.user.profileImageUrl} alt="Profile" className="w-10 h-10 rounded-full border border-border" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <Users className="w-5 h-5" />
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{data?.user?.firstName || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{data?.profile?.role || "Pending"}</p>
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
    </div>
  );
}
