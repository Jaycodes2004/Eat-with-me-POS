import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  LogOut, 
  Bell, 
  Wifi,
  WifiOff,
  Bot,
  ArrowLeft,
  Search
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface DynamicHeaderProps {
  isOnline: boolean;
  isAIAssistantOpen: boolean;
  onToggleAI: () => void;
  onLogout: () => void;
  onNavigate: (screen: string) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  onShowSearch?: () => void;
}

export function DynamicHeader({ 
  isOnline, 
  isAIAssistantOpen, 
  onToggleAI, 
  onLogout, 
  onNavigate,
  showBackButton = false,
  onBack,
  onShowSearch
}: DynamicHeaderProps) {
  const { 
    settings, 
    currentUser, 
    currentModule, 
    selectedTable, 
    notifications,
    appModules,
    getModuleByComponent
  } = useAppContext();

  const currentModuleConfig = appModules.find(m => m.id === currentModule);
  const unreadNotifications = notifications.filter(n => !n.read);
  const onlineOrderNotifications = notifications.filter(n => 
    n.type === 'info' && n.moduleId === 'online-orders' && !n.read
  );

  return (
    <header className="bg-card border-b border-border shadow-sm px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={18} />
          </Button>
        )}
        
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold">🍽️</span>
        </div>
        
        <div>
          <h2 className="font-semibold text-primary">
            {settings.restaurantName}
          </h2>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentModuleConfig?.label || 'Dashboard'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onShowSearch}
          title="Search modules"
        >
          <Search size={18} />
        </Button>

        {/* Notifications Bell */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          onClick={() => onNavigate('online-orders')}
          title={`${unreadNotifications.length} unread notifications`}
        >
          <Bell size={18} />
          {unreadNotifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-destructive animate-pulse">
              {unreadNotifications.length}
            </Badge>
          )}
        </Button>

        {/* AI Assistant Toggle */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onToggleAI}
          className="relative"
          title="AI Assistant"
        >
          <Bot size={18} />
          {isAIAssistantOpen && (
            <Badge className="absolute -top-1 -right-1 w-2 h-2 p-0 bg-green-500 rounded-full"></Badge>
          )}
        </Button>
        
        {/* User Profile */}
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentUser?.name?.charAt(0).toUpperCase() || 'G'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{currentUser?.name || 'Guest'}</p>
            <p className="text-xs text-muted-foreground">
              {selectedTable ? `Table ${selectedTable}` : (currentUser?.shift || currentModuleConfig?.label)}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          title="Logout"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}