import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Calendar, MessageSquare, RotateCcw, Shield, LogOut, FolderKanban, KeyRound, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
import logoGhas from '@/assets/logo-ghas.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Sprint', href: '/backlog', icon: ListTodo },
  { name: 'Sprint Planning', href: '/sprint-planning', icon: Calendar },
  { name: 'Daily', href: '/daily', icon: MessageSquare },
  { name: 'Retrospectiva', href: '/retrospectiva', icon: RotateCcw },
  { name: 'Projetos', href: '/projetos', icon: FolderKanban },
  { name: 'Registros de Acessos', href: '/registros-acessos', icon: KeyRound },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user, userRole, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <img src={logoGhas} alt="GHAS Logo" className="h-14 w-auto" />
              <div className="flex gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                {userRole === "administrador" && (
                  <>
                    <Link
                      to="/dados-ava"
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        location.pathname === "/dados-ava"
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Activity className="h-4 w-4" />
                      Dados AVA
                    </Link>
                    <Link
                      to="/administracao"
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                        location.pathname === "/administracao"
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Administração
                    </Link>
                  </>
                )}
              </div>
            </div>
            {user && (
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
