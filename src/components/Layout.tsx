import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ListTodo, Calendar, MessageSquare, RotateCcw, Shield, LogOut, FolderKanban, KeyRound, Activity, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import logoGhas from '@/assets/logo-ghas.png';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

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
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Dados AVA', href: '/dados-ava', icon: Activity },
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
    icon: FolderKanban,
    items: [
      { name: 'Projetos', href: '/projetos', icon: FolderKanban },
      { name: 'Roadmap Geral', href: '/roadmap', icon: Target },
      { name: 'Produtos', href: '/roadmap/produtos', icon: Target },
      { name: 'Projetos GHAS', href: '/roadmap/ghas', icon: Target },
      { name: 'Projetos Inovemed', href: '/roadmap/inovemed', icon: Target },
    ],
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
      { name: 'Sprint Planning', href: '/sprint-planning', icon: Calendar },
      { name: 'Administração', href: '/administracao', icon: Shield },
    ],
  },
];

// Função para detectar o grupo ativo com base na rota
const getActiveGroup = (pathname: string): string => {
  if (pathname === '/' || pathname === '/dados-ava') return 'Dashboard';
  if (pathname.startsWith('/backlog') || pathname.startsWith('/daily') || pathname.startsWith('/retrospectiva')) return 'SCRUM';
  if (pathname.startsWith('/projetos') || pathname.startsWith('/roadmap')) return 'Projetos';
  if (pathname.startsWith('/registros-acessos')) return 'Cadastros Gerais';
  if (pathname.startsWith('/administracao') || pathname.startsWith('/sprint-planning')) return 'Administração';
  return '';
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const [activeGroup, setActiveGroup] = useState<string>('');

  // Detecta o grupo ativo baseado na URL
  useEffect(() => {
    const group = getActiveGroup(location.pathname);
    setActiveGroup(group);
  }, [location.pathname]);

  // Função para lidar com clique no menu principal
  const handleMainMenuClick = (menu: MenuGroup) => {
    if (!menu.items || menu.items.length === 0) return;

    const visibleItems = menu.items.filter(
      (item) => !item.adminOnly || userRole === 'administrador'
    );

    // Verifica se já está em uma rota do grupo
    const currentGroupActive = getActiveGroup(location.pathname) === menu.name;
    
    if (!currentGroupActive) {
      // Se não está no grupo, redireciona para o último usado ou primeiro
      const lastUsed = localStorage.getItem(`lastSubTab:${menu.name}`);
      const targetItem = lastUsed 
        ? visibleItems.find(item => item.href === lastUsed) || visibleItems[0]
        : visibleItems[0];
      
      navigate(targetItem.href);
    }
  };

  // Salva o último submenu usado
  useEffect(() => {
    if (activeGroup) {
      localStorage.setItem(`lastSubTab:${activeGroup}`, location.pathname);
    }
  }, [location.pathname, activeGroup]);

  // Obtém os itens de submenu do grupo ativo
  const getActiveSubMenuItems = () => {
    const activeMenu = menuStructure.find(m => m.name === activeGroup);
    if (!activeMenu?.items) return [];
    
    return activeMenu.items.filter(
      (item) => !item.adminOnly || userRole === 'administrador'
    );
  };

  const subMenuItems = getActiveSubMenuItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Header principal */}
      <nav className="sticky top-0 z-50 border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <img src={logoGhas} alt="GHAS Logo" className="h-14 w-auto" />
              <div className="flex items-center gap-2">
                {menuStructure.map((menu) => {
                  // Verifica permissão de administrador
                  if (menu.adminOnly && userRole !== 'administrador') {
                    return null;
                  }

                  const Icon = menu.icon;
                  const isActive = activeGroup === menu.name;

                  return (
                    <button
                      key={menu.name}
                      onClick={() => handleMainMenuClick(menu)}
                      className={cn(
                        "flex items-center gap-2 h-10 px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {menu.name}
                    </button>
                  );
                })}
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

      {/* Barra de submenu horizontal */}
      {subMenuItems.length > 0 && (
        <div className="sticky top-16 z-40 border-b bg-muted/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs value={location.pathname} className="w-full">
              <TabsList 
                className="h-12 w-full justify-start rounded-none bg-transparent p-0"
                role="tablist"
                onKeyDown={(e) => {
                  const currentIndex = subMenuItems.findIndex(item => item.href === location.pathname);
                  if (e.key === 'ArrowRight' && currentIndex < subMenuItems.length - 1) {
                    navigate(subMenuItems[currentIndex + 1].href);
                  } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                    navigate(subMenuItems[currentIndex - 1].href);
                  }
                }}
              >
                {subMenuItems.map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = location.pathname === item.href || 
                    (item.href === '/daily' && location.pathname.startsWith('/daily')) ||
                    (item.href === '/roadmap' && location.pathname.startsWith('/roadmap'));
                  
                  return (
                    <TabsTrigger
                      key={item.href}
                      value={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium transition-none",
                        "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                        isActive && "border-primary"
                      )}
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                    >
                      <ItemIcon className="h-4 w-4 mr-2" />
                      {item.name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
