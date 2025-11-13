import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { 
  Home, 
  ShoppingCart, 
  Menu as MenuIcon, 
  BarChart3, 
  Settings,
  User,
  Users,
  ChefHat,
  MessageCircle,
  Package,
  UserCheck,
  Gift,
  Coffee,
  Utensils,
  LayoutGrid,
  Calendar,
  TrendingUp,
  Boxes,
  DollarSign,
  QrCode,
  FolderKanban
} from 'lucide-react';

interface BottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartItemsCount?: number;
  userRole: 'manager' | 'waiter' | 'chef' | 'cashier';
  bottomNavItems: string[];
  allModules?: any[];
  hasModuleAccess?: (moduleId: string) => boolean;
}

export function BottomNavigation({ 
  activeScreen, 
  onNavigate, 
  cartItemsCount = 0, 
  userRole, 
  bottomNavItems,
  allModules = [],
  hasModuleAccess = () => true
}: BottomNavigationProps) {
  const allNavItems = {
    dashboard: { id: 'dashboard', icon: Home, label: 'Home' },
    pos: { id: 'pos', icon: ShoppingCart, label: 'POS', badge: cartItemsCount > 0 ? cartItemsCount : undefined },
    tables: { id: 'tables', icon: Users, label: 'Tables' },
    marketing: { id: 'marketing', icon: MessageCircle, label: 'Marketing' },
    reports: { id: 'reports', icon: BarChart3, label: 'Reports' },
    kitchen: { id: 'kitchen', icon: ChefHat, label: 'Kitchen' },
    menu: { id: 'menu', icon: MenuIcon, label: 'Menu' },
    inventory: { id: 'inventory', icon: Package, label: 'Inventory' },
    customers: { id: 'customers', icon: UserCheck, label: 'Customers' },
    loyalty: { id: 'loyalty', icon: Gift, label: 'Loyalty' },
    'online-orders': { id: 'online-orders', icon: Coffee, label: 'Online' },
    settings: { id: 'settings', icon: Settings, label: 'Settings' }
  };

  const navItems = bottomNavItems.map(item => allNavItems[item as keyof typeof allNavItems]).filter(Boolean);

  // Get icon for module
  const getModuleIcon = (moduleId: string) => {
    const icons: Record<string, any> = {
      dashboard: Home,
      pos: ShoppingCart,
      tables: Users,
      kitchen: ChefHat,
      menu: MenuIcon,
      'online-orders': Coffee,
      customers: UserCheck,
      reservations: Calendar,
      inventory: Package,
      staff: User,
      reports: BarChart3,
      marketing: MessageCircle,
      'qr-ordering': QrCode,
      loyalty: Gift,
      suppliers: Boxes,
      expenses: DollarSign,
      categories: FolderKanban,
      settings: Settings
    };
    return icons[moduleId] || MenuIcon;
  };

  // Group modules by category
  const groupedModules = allModules.reduce((acc: Record<string, any[]>, module) => {
    const category = module.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {});

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-16 min-w-0 flex-1 relative ${
                isActive 
                  ? 'text-primary bg-primary/10 hover:text-primary hover:bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="relative">
                <item.icon 
                  size={20} 
                  className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`} 
                />
                {item.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs leading-none ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full"></div>
              )}
            </Button>
          );
        })}
        
        {/* All Tabs Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex-col gap-1 h-16 min-w-0 flex-1 relative text-muted-foreground hover:text-primary"
            >
              <LayoutGrid size={20} />
              <span className="text-xs leading-none">All Tabs</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-center">All Modules</SheetTitle>
            </SheetHeader>
            
            <div className="space-y-6 pb-20">
              {Object.entries(groupedModules).map(([category, modules]) => (
                <div key={category}>
                  <h3 className="mb-3 px-2 text-muted-foreground">{category}</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {modules.map((module: any) => {
                      const Icon = getModuleIcon(module.id);
                      const isActive = activeScreen === module.id;
                      const hasAccess = hasModuleAccess(module.id);
                      
                      return (
                        <Button
                          key={module.id}
                          variant="outline"
                          className={`flex flex-col items-center gap-2 h-24 p-3 ${
                            isActive 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : hasAccess 
                                ? 'hover:border-primary hover:bg-primary/5' 
                                : 'opacity-50 cursor-not-allowed'
                          }`}
                          onClick={() => {
                            if (hasAccess) {
                              onNavigate(module.id);
                            }
                          }}
                          disabled={!hasAccess}
                        >
                          <Icon size={24} />
                          <span className="text-xs text-center leading-tight">
                            {module.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}