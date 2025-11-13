import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Home, 
  ShoppingCart, 
  Menu as MenuIcon, 
  BarChart3, 
  Settings,
  Users,
  ChefHat,
  MessageCircle,
  Package,
  UserCheck,
  Gift,
  Coffee,
  Calendar,
  Smartphone,
  Grid3X3,
  Truck,
  Receipt,
  Tags,
  QrCode,
  LayoutGrid,
  TrendingUp,
  Boxes,
  DollarSign,
  FolderKanban,
  User
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface DynamicBottomNavigationProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartItemsCount?: number;
}

const iconMap = {
  Home,
  ShoppingCart,
  MenuIcon,
  BarChart3,
  Settings,
  Users,
  ChefHat,
  MessageCircle,
  Package,
  UserCheck,
  Gift,
  Coffee,
  Calendar,
  Smartphone,
  Grid3X3,
  Truck,
  Receipt,
  Tags,
  QrCode,
  LayoutGrid,
  TrendingUp,
  Boxes,
  DollarSign,
  FolderKanban,
  User,
  Calculator: ShoppingCart,
  Megaphone: MessageCircle
};

export function DynamicBottomNavigation({ activeScreen, onNavigate, cartItemsCount = 0 }: DynamicBottomNavigationProps) {
  const { bottomNavigation, currentUser, notifications } = useAppContext();

  if (!currentUser || bottomNavigation.length === 0) {
    return null;
  }

  const getIcon = (iconName: string) => {
    return iconMap[iconName as keyof typeof iconMap] || Home;
  };

  const getBadgeCount = (moduleId: string) => {
    if (moduleId === 'pos') {
      return cartItemsCount > 0 ? cartItemsCount : undefined;
    }
    
    if (moduleId === 'online-orders') {
      const unreadOrderNotifications = notifications.filter(n => 
        n.moduleId === 'online-orders' && !n.read
      );
      return unreadOrderNotifications.length > 0 ? unreadOrderNotifications.length : undefined;
    }

    // Add more badge logic for other modules as needed
    return undefined;
  };



  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {bottomNavigation.map((navItem) => {
          const isActive = activeScreen === navItem.moduleId;
          const IconComponent = getIcon(navItem.icon);
          const badgeCount = getBadgeCount(navItem.moduleId);

          return (
            <Button
              key={navItem.id}
              variant="ghost"
              size="sm"
              className={`flex-col gap-1 h-16 min-w-0 flex-1 relative ${
                isActive 
                  ? 'text-primary bg-primary/10 hover:text-primary hover:bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
              onClick={() => onNavigate(navItem.moduleId)}
            >
              <div className="relative">
                {/* Check if icon is emoji or Lucide icon */}
                {IconComponent ? (
                  <IconComponent 
                    size={20} 
                    className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`} 
                  />
                ) : (
                  <span 
                    className={`text-xl transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                    style={{ display: 'inline-block', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
                  >
                    {navItem.icon}
                  </span>
                )}
                {badgeCount && (
                  <Badge 
                    className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground animate-pulse"
                  >
                    {badgeCount}
                  </Badge>
                )}
              </div>
              <span className={`text-xs leading-none truncate ${isActive ? 'font-medium' : ''}`}>
                {navItem.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full"></div>
              )}
            </Button>
          );
        })}
        
        {/* All Tabs Button */}
        <Button
          variant="ghost"
          size="sm"
          className={`flex-col gap-1 h-16 min-w-0 flex-1 relative ${
            activeScreen === 'all-modules'
              ? 'text-primary bg-primary/10 hover:text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:text-primary'
          }`}
          onClick={() => onNavigate('all-modules')}
        >
          <LayoutGrid 
            size={20} 
            className={`transition-all duration-200 ${activeScreen === 'all-modules' ? 'scale-110' : ''}`}
          />
          <span className={`text-xs leading-none ${activeScreen === 'all-modules' ? 'font-medium' : ''}`}>
            All Tabs
          </span>
          {activeScreen === 'all-modules' && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary rounded-full"></div>
          )}
        </Button>
      </div>
    </div>
  );
}