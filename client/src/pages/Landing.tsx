import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Scissors, Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data } = useProfile();

  if (!isLoading && isAuthenticated) {
    if (!data?.profile) return <Redirect to="/onboarding" />;
    return <Redirect to={data.profile.role === 'manager' ? '/admin' : '/professional'} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 logo-pulse">
            <Scissors className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-2xl text-foreground premium-outline">Luxe</span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = "/login"}
          className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:text-primary"
        >
          Login Profissional
        </Button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium border border-accent/30">
            <Star className="w-4 h-4 text-accent" />
            <span>Sistema de Gestão Premium</span>
          </div>
          
          <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight text-primary leading-[1.1] premium-outline">
            Elevando a Gestão <br className="hidden md:block"/> do seu Salão
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Organize agendamentos, controle comissões e gerencie sua equipe com uma plataforma feita para a excelência.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-1"
              onClick={() => window.location.href = "/login"}
            >
              Acessar Plataforma
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-10 rounded-full text-lg border-primary/30 hover:bg-primary/10"
              onClick={() => window.location.href = "/register"}
            >
              Criar Conta
            </Button>
            <Button 
              variant="ghost" 
              size="lg" 
              className="h-14 px-10 rounded-full text-lg hover:bg-primary/5"
            >
              Saiba Mais
            </Button>
          </div>

          <div className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              { title: "Controle Financeiro", desc: "Gestão automática de comissões e repasses." },
              { title: "Agendamento Inteligente", desc: "Histórico completo de serviços e clientes." },
              { title: "Segurança de Dados", desc: "Backups diários e proteção total das informações." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 shadow-sm"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Hero Image / Vibe */}
      <div className="w-full h-64 md:h-96 mt-12 relative overflow-hidden">
        {/* Abstract salon vibes with Unsplash image */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        {/* Salon Interior */}
        <img 
          src="https://pixabay.com/get/g84424e304869d5c9a9977e35e4487dea8bc26f4a4bf6abb357256d9cc9792749785f15360725846babc823cf69907192c864994facf6fd549cfe5ee5576a8383_1280.jpg" 
          alt="Salon Interior" 
          className="w-full h-full object-cover opacity-60"
        />
      </div>
    </div>
  );
}
