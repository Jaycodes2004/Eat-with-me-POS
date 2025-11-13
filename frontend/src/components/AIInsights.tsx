import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  ChevronRight,
  Clock,
  Star,
  DollarSign,
  Users,
  Package,
  ChefHat,
  Sparkles,
  RefreshCw,
  CalendarDays
} from 'lucide-react';
import { AIService, AIInsight, AIStats } from '../utils/aiService';
import { useAppContext } from '../contexts/AppContext';

interface AIInsightsProps {
  onNavigate?: (screen: string) => void;
  dateFilter?: 'today' | 'yesterday' | 'week' | 'month' | 'all';
  onDateFilterChange?: (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all') => void;
}

export function AIInsights({ onNavigate, dateFilter = 'today', onDateFilterChange }: AIInsightsProps) {
  const { 
    menuItems, 
    orders, 
    inventoryItems, 
    customers, 
    staff, 
    tables,
    getOrdersByDateFilter,
    getOrderStatsByDateFilter
  } = useAppContext();
  
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadInsights();
  }, [menuItems, orders, inventoryItems, customers, staff, tables, dateFilter]);

  const loadInsights = async () => {
    setIsLoading(true);
    
    // Get filtered orders based on date filter
    const filteredOrders = getOrdersByDateFilter(dateFilter);
    const orderStats = getOrderStatsByDateFilter(dateFilter);
    
    // Simulate API call delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate dynamic insights based on filtered data
    const newInsights = AIService.generateInsights(
      menuItems,
      filteredOrders, // Use filtered orders instead of all orders
      inventoryItems,
      customers,
      staff,
      tables
    );
    
    // Calculate dynamic AI stats using filtered data
    const stats = AIService.calculateAIStats(
      menuItems,
      filteredOrders, // Use filtered orders instead of all orders
      inventoryItems,
      customers
    );
    
    setInsights(newInsights);
    setAiStats(stats);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return TrendingUp;
      case 'prediction': return Clock;
      case 'optimization': return Target;
      case 'alert': return AlertTriangle;
      case 'trend': return Sparkles;
      default: return Lightbulb;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">AI Insights</h2>
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadInsights}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Dynamic Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {isLoading ? '...' : aiStats ? aiStats.customerRating.toFixed(1) : '4.3'}
              </p>
              <p className="text-xs text-muted-foreground">Customer Rating</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {isLoading ? '...' : aiStats ? 
                  `${aiStats.revenueGrowth > 0 ? '+' : ''}${aiStats.revenueGrowth}%` : 
                  '+15%'
                }
              </p>
              <p className="text-xs text-muted-foreground">Revenue Growth</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {isLoading ? '...' : aiStats ? aiStats.lowStockItems : '3'}
              </p>
              <p className="text-xs text-muted-foreground">Low Stock Items</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {isLoading ? '...' : aiStats ? `${aiStats.kitchenEfficiency}%` : '92%'}
              </p>
              <p className="text-xs text-muted-foreground">Kitchen Efficiency</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Dynamic Stats */}
      {aiStats && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">₹{aiStats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">7-Day Revenue</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-semibold">{aiStats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-lg font-semibold">{aiStats.topSellingItem}</p>
                <p className="text-xs text-muted-foreground">Top Selling Item</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 bg-muted rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {insights.map((insight) => {
                  const IconComponent = getTypeIcon(insight.type);
                  return (
                    <div
                      key={insight.id}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{insight.title}</h4>
                            <Badge variant={getPriorityColor(insight.priority)} className="text-xs">
                              {insight.priority}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className={`font-medium ${getConfidenceColor(insight.confidence)}`}>
                                  {Math.round(insight.confidence * 100)}%
                                </span>
                              </div>
                              
                              <Progress 
                                value={insight.confidence * 100} 
                                className="w-16 h-2"
                              />
                            </div>
                            
                            {insight.actionable && (
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate?.('menu')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">View Menu Recommendations</h4>
              <p className="text-sm text-muted-foreground">AI-suggested items to boost sales</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => onNavigate?.('inventory')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">Check Inventory Predictions</h4>
              <p className="text-sm text-muted-foreground">Smart reorder recommendations</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>
      </div>
    </div>
  );
}