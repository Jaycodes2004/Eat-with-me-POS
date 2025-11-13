import { useState, useEffect, useMemo } from 'react';
import { AppProvider, useAppContext, type User } from './contexts/AppContext';
import { normalizePermissionList } from './utils/appConfig';
import { LoginScreen, type LoginResponsePayload } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { POSBilling } from './components/POSBilling';
import { MenuManagement } from './components/MenuManagement';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { TableManagement } from './components/TableManagement';
import { KitchenDisplay } from './components/KitchenDisplay';
import { CustomerManagement } from './components/CustomerManagement';
import { Marketing } from './components/Marketing';
import { InventoryManagement } from './components/InventoryManagement';
import { StaffManagement } from './components/StaffManagement';
import { QROrdering } from './components/QROrdering';
import { CategoriesManagement } from './components/CategoriesManagement';
import { SupplierManagement } from './components/SupplierManagement';
import { ExpenseManagement } from './components/ExpenseManagement';
import { ReservationManagement } from './components/ReservationManagement';
import { LoyaltyProgram } from './components/LoyaltyProgram';
import { OnlineOrdersManagement } from './components/OnlineOrdersManagement';
import { DynamicBottomNavigation } from './components/DynamicBottomNavigation';
import { DynamicHeader } from './components/DynamicHeader';
import { AIAssistant } from './components/AIAssistant';
import { AllModules } from './components/AllModules';
import { Button } from './components/ui/button';
import { 
  Plus,
  ShoppingCart,
  Users,
  ChefHat,
  Menu as MenuIcon,
  X,
  Zap,
  Search,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

function AppContent() {
  const { 
    settings, 
    currentUser, 
    userRole,
    currentModule,
    selectedTable,
    currentOrder,
    notifications,
    bottomNavigation,
    quickActions,
    availableModules,
    appModules,
    setCurrentUser,
    setCurrentModule,
    setSelectedTable,
    setCurrentOrder,
    hasModuleAccess,
    addNotification,
    getModuleByComponent
  } = useAppContext();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isAIAssistantMinimized, setIsAIAssistantMinimized] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // Dynamic online orders count from actual data
  const pendingOnlineOrders = useMemo(() => {
    return notifications.filter(n => 
      n.type === 'info' && n.moduleId === 'online-orders' && !n.read
    ).length;
  }, [notifications]);

  const buildFallbackEmail = () => {
    const sanitizedName = settings.restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return `manager@${sanitizedName || 'eatwithme'}.com`;
  };

  const buildDefaultModules = () => appModules.slice(0, 5).map(m => m.id);

  const handleLogin = (payload?: LoginResponsePayload) => {
    setIsLoggedIn(true);

    const apiUser = payload?.user as (LoginResponsePayload['user'] & Partial<User>) | undefined;

    const normalizedUser: User = apiUser
      ? {
          id: apiUser.id,
          name: apiUser.name || `${settings.restaurantName} Manager`,
          role: apiUser.role || 'manager',
          permissions: normalizePermissionList(
            Array.isArray(apiUser.permissions) && apiUser.permissions.length > 0
              ? apiUser.permissions
              : ['all_access']
          ),
          dashboardModules: Array.isArray(apiUser.dashboardModules) && apiUser.dashboardModules.length > 0
            ? apiUser.dashboardModules
            : buildDefaultModules(),
          avatar: apiUser.avatar,
          shift: apiUser.shift ?? 'Current Shift',
          email: apiUser.email || buildFallbackEmail(),
          phone: apiUser.phone,
        }
      : {
          id: '1',
          name: `${settings.restaurantName} Manager`,
          role: 'manager',
          permissions: normalizePermissionList(['all_access']),
          dashboardModules: buildDefaultModules(),
          shift: 'Current Shift',
          email: buildFallbackEmail(),
        };

  const isFirstLogin = (apiUser as any)?.isFirstLogin ?? !localStorage.getItem('hasSeenOnboarding');

  setCurrentUser(normalizedUser);
    setCurrentModule('dashboard');
    
    // Show onboarding for first-time users
    if (isFirstLogin) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
    
    // Welcome notification
    addNotification({
      type: 'success',
      title: `Welcome to ${settings.restaurantName}!`,
  message: `Logged in as ${normalizedUser.name}`,
      moduleId: 'dashboard'
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentModule('dashboard');
    setCurrentOrder(null);
    setSelectedTable(null);
  };

  const handleNavigate = (screen: string) => {
    // Special screens that don't require access check
    const specialScreens = ['all-modules', 'dashboard'];
    
    // Check if user has access to this module
    if (currentUser && (specialScreens.includes(screen) || hasModuleAccess(screen))) {
      setCurrentModule(screen);
      
      // Track recently used modules (but not special screens)
      if (!specialScreens.includes(screen)) {
        setRecentlyUsed(prev => {
          const updated = [screen, ...prev.filter(s => s !== screen)].slice(0, 4);
          localStorage.setItem('recentlyUsed', JSON.stringify(updated));
          return updated;
        });
      }

      // Mark quick actions as used
      if (!localStorage.getItem('quickActionsUsed')) {
        localStorage.setItem('quickActionsUsed', 'true');
      }
    } else {
      const module = appModules.find(m => m.id === screen);
      addNotification({
        type: 'error',
        title: 'Access Denied',
        message: `You need ${module?.requiredRole || 'higher'} permissions to access ${module?.name || 'this module'}`
      });
    }
  };

  // Dynamic component rendering
  const getComponentByModuleId = (moduleId: string) => {
    const module = getModuleByComponent('Dashboard'); // This is just to access the method
    
    switch (moduleId) {
      case 'dashboard': return Dashboard;
      case 'pos': return POSBilling;
      case 'tables': return TableManagement;
      case 'menu': return MenuManagement;
      case 'kitchen': return KitchenDisplay;
      case 'online-orders': return OnlineOrdersManagement;
      case 'customers': return CustomerManagement;
      case 'reservations': return ReservationManagement;
      case 'inventory': return InventoryManagement;
      case 'staff': return StaffManagement;
      case 'reports': return Reports;
      case 'marketing': return Marketing;
      case 'qr-ordering': return QROrdering;
      case 'loyalty': return LoyaltyProgram;
      case 'suppliers': return SupplierManagement;
      case 'expenses': return ExpenseManagement;
      case 'categories': return CategoriesManagement;
      case 'all-modules': return AllModules;
      case 'settings': return Settings;
      default: return Dashboard;
    }
  };

  // Load recently used modules on component mount
  useEffect(() => {
    const saved = localStorage.getItem('recentlyUsed');
    if (saved) {
      try {
        setRecentlyUsed(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recently used modules');
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        setShowSearchModal(false);
        setSearchQuery('');
        setShowQuickActions(false);
        setShowOnboarding(false);
      }
      
      // Number keys for quick navigation
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        const bottomNavItems = bottomNavigation.filter(item => 
          currentUser && hasModuleAccess(item.id)
        );
        if (bottomNavItems[index]) {
          handleNavigate(bottomNavItems[index].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [currentUser, bottomNavigation, hasModuleAccess]);

  // Get breadcrumb path for current module
  const getBreadcrumbPath = () => {
    // Special handling for all-modules screen
    if (currentModule === 'all-modules') {
      return [
        { name: 'Dashboard', id: 'dashboard' },
        { name: 'All Modules', id: 'all-modules' }
      ];
    }
    
    const module = appModules.find(m => m.id === currentModule);
    if (!module) {
      return [{ name: 'Dashboard', id: 'dashboard' }];
    }
    
    const paths = [{ name: 'Dashboard', id: 'dashboard' }];
    if (currentModule !== 'dashboard') {
      paths.push({ name: module.name, id: module.id });
    }
    return paths;
  };

  // Get contextual help for current module
  const getContextualHelp = () => {
    const helpTexts: Record<string, string> = {
      'dashboard': 'Overview of your restaurant operations. Quick access to key metrics and modules.',
      'pos': 'Process orders, manage tables, and handle payments. Your main billing interface.',
      'tables': 'Manage table status, assignments, and layout. Track occupied and available tables.',
      'menu': 'Add, edit, and organize your menu items. Manage categories, prices, and availability.',
      'kitchen': 'Kitchen display for order management. Track cooking status and timing.',
      'inventory': 'Track stock levels, manage suppliers, and monitor ingredient usage.',
      'staff': 'Manage employee schedules, roles, and performance tracking.',
      'customers': 'Customer database, loyalty programs, and order history.',
      'reports': 'Analytics and insights about sales, performance, and trends.',
      'settings': 'Configure restaurant settings, taxes, currencies, and integrations.',
      'all-modules': 'Browse all available modules organized by category. Click any module to navigate.'
    };
    
    return helpTexts[currentModule] || 'Navigate through your restaurant management system.';
  };

  // Search through modules with current query
  const searchModules = (query: string) => {
    if (!query.trim()) return [];
    return appModules.filter(module => 
      module.name.toLowerCase().includes(query.toLowerCase()) ||
      module.description?.toLowerCase().includes(query.toLowerCase())
    ).filter(module => hasModuleAccess(module.id));
  };

  // Get filtered search results
  const searchResults = searchQuery.trim() ? searchModules(searchQuery) : [];

  const contextProps = {
    onNavigate: handleNavigate,
    activeScreen: currentModule,
    userRole: currentUser?.role || 'guest',
    currentOrder,
    setCurrentOrder,
    selectedTable,
    setSelectedTable
  };

  const renderScreen = () => {
    const ComponentToRender = getComponentByModuleId(currentModule);
    return <ComponentToRender {...contextProps} />;
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Dynamic Header */}
      <DynamicHeader 
        isOnline={isOnline}
        isAIAssistantOpen={isAIAssistantOpen}
        onToggleAI={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        onShowSearch={() => {
          setShowSearchModal(true);
          setSearchQuery('');
        }}
      />

      {/* Enhanced Breadcrumb Navigation with Context */}
      {currentModule !== 'dashboard' && (
        <div className="bg-secondary/50 px-4 py-2 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {getBreadcrumbPath().map((item, index) => (
                <div key={item.id} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  <button
                    onClick={() => handleNavigate(item.id)}
                    className={`${index === getBreadcrumbPath().length - 1
                      ? 'text-foreground font-medium'
                      : 'hover:text-foreground'
                    }`}
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </div>
            <div className="hidden md:block text-xs text-muted-foreground max-w-md">
              {getContextualHelp()}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        {renderScreen()}
      </main>

      {/* Quick Actions - Improved with better labels and layout */}
      {showQuickActions && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55]" onClick={() => setShowQuickActions(false)}>
          <div className="absolute bottom-36 right-4 space-y-2 animate-slide-up md:bottom-24">
            {/* Recently Used Section */}
            {recentlyUsed.length > 0 && (
              <>
                <div className="text-xs text-white text-center mb-3 font-medium">Recently Used</div>
                <div className="flex flex-col space-y-2">
                  {recentlyUsed.slice(0, 3).map((moduleId) => {
                    const module = appModules.find(m => m.id === moduleId);
                    if (!module) return null;
                    return (
                      <div key={moduleId} className="flex items-center space-x-3">
                        <Button 
                          className="w-12 h-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative group flex-shrink-0"
                          onClick={() => {
                            setShowQuickActions(false);
                            handleNavigate(moduleId);
                          }}
                        >
                          <span className="text-base">{module.icon}</span>
                        </Button>
                        <div className="text-white text-sm font-medium bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm min-w-0">
                          {module.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full h-px bg-white/30 my-4"></div>
              </>
            )}
            
            {/* Quick Actions */}
            <div className="text-xs text-white text-center mb-3 font-medium">Quick Actions</div>
            <div className="flex flex-col space-y-2">
              {quickActions.map((action, index) => (
                <div key={action.id} className="flex items-center space-x-3">
                  <Button 
                    className="w-12 h-12 rounded-full shadow-lg relative group flex-shrink-0 hover:scale-105 transition-transform"
                    style={{ backgroundColor: action.color }}
                    onClick={() => {
                      setShowQuickActions(false);
                      handleNavigate(action.moduleId);
                    }}
                  >
                    {action.icon === 'Plus' && <Plus className="w-5 h-5" />}
                    {action.icon === 'Users' && <Users className="w-5 h-5" />}
                    {action.icon === 'ChefHat' && <ChefHat className="w-5 h-5" />}
                    {action.icon === 'Menu' && <MenuIcon className="w-5 h-5" />}
                    {action.icon === 'TrendingUp' && <Zap className="w-5 h-5" />}
                    {action.icon === 'Smartphone' && <ShoppingCart className="w-5 h-5" />}
                  </Button>
                  <div className="text-white text-sm font-medium bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm min-w-0">
                    {action.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Improved Floating Action Button with hint */}
      <div className="fixed bottom-20 right-4 z-[60] md:bottom-6">
        <Button
          className="w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl relative group bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          onClick={() => setShowQuickActions(!showQuickActions)}
        >
          {showQuickActions ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Plus className="w-5 h-5 md:w-6 md:h-6" />}
          
          {/* Hint tooltip for new users - only show for 5 seconds */}
          {!showQuickActions && !localStorage.getItem('quickActionsUsed') && 
           !localStorage.getItem('hasSeenOnboarding') && (
            <div 
              className="absolute -top-12 -left-2 right-0 bg-primary text-white px-3 py-1 rounded-lg text-xs animate-bounce whitespace-nowrap"
              style={{ 
                animation: 'slide-up 0.3s ease-out, fadeOut 0.5s ease-out 4.5s forwards' 
              }}
            >
              Quick Actions
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary"></div>
            </div>
          )}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <DynamicBottomNavigation 
        activeScreen={currentModule} 
        onNavigate={handleNavigate}
        cartItemsCount={currentOrder ? 1 : 0}
      />

      {/* Enhanced Search Modal with Real-time Search */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg animate-slide-up border">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search modules, features... (Ctrl+K)"
                  className="w-full pl-10 pr-4 py-3 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {/* Search Results */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-secondary/50">
                    Search Results ({searchResults.length})
                  </div>
                  <div className="p-2">
                    {searchResults.map((module) => (
                      <button
                        key={module.id}
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchQuery('');
                          handleNavigate(module.id);
                        }}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <span className="text-lg">{module.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{module.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{module.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* No Results */}
              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-muted-foreground text-sm">
                    No modules found for "{searchQuery}"
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Try searching for: dashboard, pos, menu, kitchen, reports
                  </div>
                </div>
              )}

              {/* Default View - Recently Used + All Modules */}
              {!searchQuery.trim() && (
                <>
                  {/* Recently Used First */}
                  {recentlyUsed.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-secondary/50">
                        Recently Used
                      </div>
                      <div className="p-2">
                        {recentlyUsed.slice(0, 4).map((moduleId) => {
                          const module = appModules.find(m => m.id === moduleId);
                          if (!module || !hasModuleAccess(module.id)) return null;
                          return (
                            <button
                              key={moduleId}
                              onClick={() => {
                                setShowSearchModal(false);
                                setSearchQuery('');
                                handleNavigate(moduleId);
                              }}
                              className="w-full flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg transition-colors"
                            >
                              <span className="text-lg">{module.icon}</span>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{module.name}</div>
                                <div className="text-xs text-muted-foreground">Recently used</div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {/* All Modules */}
                  <div className="px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-secondary/50">
                    All Modules
                  </div>
                  <div className="p-2">
                    {appModules.filter(m => hasModuleAccess(m.id) && !recentlyUsed.includes(m.id)).map((module) => (
                      <button
                        key={module.id}
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchQuery('');
                          handleNavigate(module.id);
                        }}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <span className="text-lg">{module.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium">{module.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{module.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="p-4 border-t space-y-3 bg-secondary/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>💡 Tip: Use Alt+1-9 for quick navigation</span>
                <span>ESC to close</span>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-lg animate-slide-up">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Welcome to {settings.restaurantName}!</h2>
                  <p className="text-muted-foreground">Let's get you started</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Navigate with Bottom Tabs</h4>
                    <p className="text-sm text-muted-foreground">Use the bottom navigation to access main features</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Quick Actions</h4>
                    <p className="text-sm text-muted-foreground">Tap the + button for quick access to common tasks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">AI Assistant</h4>
                    <p className="text-sm text-muted-foreground">Get help anytime with the AI assistant in the header</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowOnboarding(false);
                  }}
                >
                  Skip Tour
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowOnboarding(false);
                    localStorage.setItem('hasSeenOnboarding', 'true');
                    // Start with POS or most common task
                    handleNavigate('pos');
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        isMinimized={isAIAssistantMinimized}
        onToggleMinimize={() => setIsAIAssistantMinimized(!isAIAssistantMinimized)}
      />

      {/* Background Pattern for Indian Design Touch */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='7' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3Ccircle cx='7' cy='53' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}