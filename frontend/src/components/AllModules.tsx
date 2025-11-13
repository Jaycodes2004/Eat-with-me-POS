import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
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
  TrendingUp,
  Boxes,
  DollarSign,
  FolderKanban,
  User,
  Search,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface AllModulesProps {
  onNavigate: (screen: string) => void;
  activeScreen: string;
}

const iconMap: Record<string, any> = {
  'dashboard': Home,
  'pos': ShoppingCart,
  'tables': Grid3X3,
  'kitchen': ChefHat,
  'menu': MenuIcon,
  'online-orders': Coffee,
  'customers': UserCheck,
  'reservations': Calendar,
  'inventory': Package,
  'staff': User,
  'reports': BarChart3,
  'marketing': MessageCircle,
  'qr-ordering': QrCode,
  'loyalty': Gift,
  'suppliers': Truck,
  'expenses': Receipt,
  'categories': Tags,
  'settings': Settings
};

export function AllModules({ onNavigate, activeScreen }: AllModulesProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get modules from the data attribute or use default list
  const allModules = [
    { id: 'dashboard', name: 'Dashboard', category: 'Core', description: 'Overview & Insights', requiredRole: 'cashier' },
    { id: 'pos', name: 'POS Billing', category: 'Core', description: 'Point of Sale', requiredRole: 'cashier' },
    { id: 'tables', name: 'Tables', category: 'Core', description: 'Table Management', requiredRole: 'cashier' },
    { id: 'kitchen', name: 'Kitchen Display', category: 'Operations', description: 'KDS System', requiredRole: 'kitchen' },
    { id: 'menu', name: 'Menu', category: 'Management', description: 'Menu Management', requiredRole: 'manager' },
    { id: 'online-orders', name: 'Online Orders', category: 'Operations', description: 'Third-party Orders', requiredRole: 'cashier' },
    { id: 'customers', name: 'Customers', category: 'CRM', description: 'Customer Database', requiredRole: 'cashier' },
    { id: 'reservations', name: 'Reservations', category: 'Operations', description: 'Table Booking', requiredRole: 'cashier' },
    { id: 'inventory', name: 'Inventory', category: 'Management', description: 'Stock Management', requiredRole: 'manager' },
    { id: 'staff', name: 'Staff', category: 'Management', description: 'Employee Management', requiredRole: 'manager' },
    { id: 'reports', name: 'Reports', category: 'Analytics', description: 'Sales & Analytics', requiredRole: 'manager' },
    { id: 'marketing', name: 'Marketing', category: 'CRM', description: 'Campaigns & Messages', requiredRole: 'manager' },
    { id: 'qr-ordering', name: 'QR Ordering', category: 'Operations', description: 'Self-service Orders', requiredRole: 'manager' },
    { id: 'loyalty', name: 'Loyalty', category: 'CRM', description: 'Rewards & Referrals', requiredRole: 'manager' },
    { id: 'suppliers', name: 'Suppliers', category: 'Management', description: 'Vendor Management', requiredRole: 'manager' },
    { id: 'expenses', name: 'Expenses', category: 'Finance', description: 'Expense Tracking', requiredRole: 'manager' },
    { id: 'categories', name: 'Categories', category: 'Management', description: 'Menu Categories', requiredRole: 'manager' },
    { id: 'settings', name: 'Settings', category: 'System', description: 'App Configuration', requiredRole: 'admin' }
  ];

  // Filter modules based on search
  const filteredModules = searchQuery.trim() 
    ? allModules.filter(module => 
        module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        module.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allModules;

  // Group by category
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, typeof allModules>);

  const categoryOrder = ['Core', 'Operations', 'Management', 'CRM', 'Finance', 'Analytics', 'System'];
  const sortedCategories = Object.keys(modulesByCategory).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const getModuleIcon = (moduleId: string) => {
    return iconMap[moduleId] || MenuIcon;
  };

  const handleModuleClick = (moduleId: string) => {
    console.log('Module clicked:', moduleId);
    onNavigate(moduleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-24">
      {/* Header with gradient */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleModuleClick('dashboard')}
              className="text-white hover:bg-white/20 shrink-0"
            >
              <ArrowLeft size={24} />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-yellow-300" size={24} />
                <h1 className="text-2xl text-white font-bold">All Modules</h1>
              </div>
              <p className="text-blue-100 text-sm mt-0.5">
                Access all features of Eat With Me POS
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200" size={20} />
            <Input
              type="text"
              placeholder="Search modules by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-blue-100 focus-visible:ring-white/50 h-12"
            />
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {sortedCategories.map((category) => (
          <div key={category}>
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-lg uppercase tracking-wide text-blue-700">
                  {category}
                </h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {modulesByCategory[category].length}
              </Badge>
            </div>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {modulesByCategory[category].map((module) => {
                const Icon = getModuleIcon(module.id);
                const isActive = activeScreen === module.id;

                return (
                  <Card
                    key={module.id}
                    className={`relative cursor-pointer transition-all duration-300 hover:scale-105 group ${
                      isActive 
                        ? 'border-2 border-blue-600 shadow-lg shadow-blue-200 bg-gradient-to-br from-blue-50 to-blue-100' 
                        : 'hover:border-blue-400 hover:shadow-md hover:bg-blue-50/50'
                    }`}
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse ring-4 ring-white"></div>
                      )}

                      {/* Icon */}
                      <div className={`relative p-4 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-blue-600 shadow-lg' 
                          : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <Icon 
                          size={32} 
                          className={isActive ? 'text-white' : 'text-blue-600'} 
                        />
                      </div>

                      {/* Module Name */}
                      <div className="space-y-1 w-full">
                        <h3 className={`font-semibold text-sm ${
                          isActive ? 'text-blue-700' : 'text-slate-700'
                        }`}>
                          {module.name}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                          {module.description}
                        </p>
                      </div>

                      {/* Hover Effect */}
                      <div className={`absolute inset-0 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                        !isActive ? 'bg-gradient-to-t from-blue-600/5 to-transparent' : ''
                      }`}></div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {/* No Results */}
        {sortedCategories.length === 0 && (
          <div className="text-center py-20">
            <Search className="mx-auto mb-4 text-slate-300" size={64} />
            <h3 className="text-xl text-slate-600 mb-2">No modules found</h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search query
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>


    </div>
  );
}
