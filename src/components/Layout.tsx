import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Calendar, MessageSquare, RotateCcw, Shield, LogOut, FolderKanban, KeyRound, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './ui/navigation-menu';
import logoGhas from '@/assets/logo-ghas.png';
import { LucideIcon } from 'lucide-react';

type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

type MenuGroup = {
  name: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  href?: string;
  items?: MenuItem[];
};

const menuStructure: MenuGroup[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard Atual', href: '/', icon: LayoutDashboard },
      { name: 'Dados AVA', href: '/dados-ava', icon: Activity, adminOnly: true },
    ],
  },
  {
    name: 'SCRUM',
    icon: ListTodo,
    items: [
      { name: 'Sprint', href: '/backlog', icon: ListTodo },
      { name: 'Daily', href: '/daily', icon: MessageSquare },
      { name: 'Retrospectiva', href: '/retrospectiva', icon: RotateCcw },
    ],
  },
  {
    name: 'Projetos',
    href: '/projetos',
    icon: FolderKanban,
  },
  {
    name: 'Cadastros Gerais',
    icon: KeyRound,
    items: [
      { name: 'Registros de Acessos', href: '/registros-acessos', icon: KeyRound },
    ],
  },
  {
    name: 'Administração',
    icon: Shield,
    adminOnly: true,
    items: [
      { name: 'Administração', href: '/administracao', icon: Shield },
      { name: 'Sprint Planning', href: '/sprint-planning', icon: Calendar },
    ],
  },
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
              <NavigationMenu>
                <NavigationMenuList>
                  {menuStructure.map((menu) => {
                    // Verifica permissão de administrador
                    if (menu.adminOnly && userRole !== 'administrador') {
                      return null;
                    }

                    const Icon = menu.icon;
                    
                    // Menu com submenu
                    if (menu.items) {
                      // Filtra itens do submenu por permissão
                      const visibleItems = menu.items.filter(
                        (item) => !item.adminOnly || userRole === 'administrador'
                      );
                      
                      if (visibleItems.length === 0) return null;

                      const isActive = visibleItems.some((item) => location.pathname === item.href);

                      return (
                        <NavigationMenuItem key={menu.name}>
                          <NavigationMenuTrigger
                            className={cn(
                              "h-10 px-4 py-2 text-sm font-medium",
                              isActive && "bg-primary/10 text-primary"
                            )}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {menu.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <ul className="grid w-[200px] gap-1 p-2">
                              {visibleItems.map((item) => {
                                const ItemIcon = item.icon;
                                const itemActive = location.pathname === item.href;
                                return (
                                  <li key={item.name}>
                                    <NavigationMenuLink asChild>
                                      <Link
                                        to={item.href}
                                        className={cn(
                                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary",
                                          itemActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                      >
                                        <ItemIcon className="h-4 w-4" />
                                        {item.name}
                                      </Link>
                                    </NavigationMenuLink>
                                  </li>
                                );
                              })}
                            </ul>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    // Menu simples sem submenu
                    const isActive = location.pathname === menu.href;
                    return (
                      <NavigationMenuItem key={menu.name}>
                        <Link
                          to={menu.href!}
                          className={cn(
                            "flex items-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary",
                            isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {menu.name}
                        </Link>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
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
