import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Moon, Sun, Settings, HelpCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  const menuItems = [
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
    { icon: HelpCircle, label: 'Suporte', path: '/suporte' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Profile Header */}
      <Card className="border-border/50 bg-card">
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-lg font-semibold text-foreground">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Conta pessoal</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-border/50 bg-card">
        <CardContent className="p-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-4 border-b border-border/50 p-4 text-left transition-colors hover:bg-secondary/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Tema {theme === 'dark' ? 'Escuro' : 'Claro'}</p>
              <p className="text-sm text-muted-foreground">Toque para alternar</p>
            </div>
          </button>

          {/* Menu Items */}
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex w-full items-center gap-4 border-b border-border/50 p-4 text-left transition-colors hover:bg-secondary/50 last:border-b-0"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.label}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="destructive" onClick={signOut} className="w-full">
        <LogOut className="mr-2 h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
