import { Link, useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [, navigate] = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brasao-prefeitura.png" alt="Brasão de Sorocaba" className="h-9 w-auto object-contain" />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-tight">Secretaria de Mobilidade</h1>
              <span className="text-[10px] uppercase tracking-wider text-primary-foreground/80 font-semibold">
                Sorocaba - SP
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-accent transition-colors">
              Agentes
            </Link>
            <Link href="/novo" className="text-sm font-medium hover:text-accent transition-colors">
              Novo Cadastro
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-accent transition-colors opacity-70 hover:opacity-100"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
