import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { AIService } from '../utils/aiService';
import { useAppContext } from '../contexts/AppContext';
import { 
  Bot, 
  Package, 
  AlertTriangle, 
  Calendar, 
  ShoppingCart,
  TrendingDown,
  RefreshCw,
  Clock
} from 'lucide-react';

export function InventoryAI() {
  const { inventoryItems, orders, menuItems } = useAppContext();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, [inventoryItems, orders, menuItems]);

  const loadPredictions = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate dynamic predictions based on real data
    const newPredictions = AIService.getInventoryPredictions(inventoryItems, orders, menuItems);
    setPredictions(newPredictions);
    setIsLoading(false);
  };

  const getUrgencyColor = (daysLeft: string) => {
    const days = parseInt(daysLeft);
    if (days <= 1) return 'text-red-600';
    if (days <= 2) return 'text-orange-600';
    if (days <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUrgencyBadge = (daysLeft: string) => {
    const days = parseInt(daysLeft);
    if (days <= 1) return { variant: 'destructive' as const, label: 'Critical' };
    if (days <= 2) return { variant: 'secondary' as const, label: 'Urgent' };
    if (days <= 3) return { variant: 'outline' as const, label: 'Soon' };
    return { variant: 'secondary' as const, label: 'Normal' };
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
            <h3 className="font-semibold text-primary">AI Inventory Predictions</h3>
            <p className="text-sm text-muted-foreground">Smart reorder recommendations based on consumption patterns</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadPredictions}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-600">
                {isLoading ? '...' : predictions.filter(p => {
                  const days = parseInt(p.predictedOutOfStock.split(' ')[0]);
                  return !isNaN(days) && days <= 2;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Critical Items</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-orange-600">
                {isLoading ? '...' : predictions.filter(p => {
                  const days = parseInt(p.predictedOutOfStock.split(' ')[0]);
                  return !isNaN(days) && days <= 4;
                }).length}
              </p>
              <p className="text-xs text-muted-foreground">Need Reorder</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-blue-600">
                {isLoading ? '...' : `₹${predictions.reduce((sum, p) => {
                  return sum + (p.recommendedReorder * (p.costPerUnit || 50));
                }, 0).toLocaleString()}`}
              </p>
              <p className="text-xs text-muted-foreground">Est. Reorder Cost</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Predictions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-lg border">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {predictions.map((prediction, index) => {
                  const urgencyBadge = getUrgencyBadge(prediction.predictedOutOfStock.split(' ')[0]);
                  
                  return (
                    <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-primary">{prediction.item}</h4>
                            <Badge variant={urgencyBadge.variant}>{urgencyBadge.label}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Current Stock</p>
                              <p className="font-medium">{prediction.currentStock} units</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Stock Out In</p>
                              <p className={`font-medium ${getUrgencyColor(prediction.predictedOutOfStock.split(' ')[0])}`}>
                                {prediction.predictedOutOfStock}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Recommended Order</p>
                              <p className="font-medium">{prediction.recommendedReorder} units</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Confidence</p>
                              <p className={`font-medium ${getConfidenceColor(prediction.confidence)}`}>
                                {Math.round(prediction.confidence * 100)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Stock Level</span>
                              <span className="text-xs text-muted-foreground">
                                {Math.round((prediction.currentStock / (prediction.currentStock + prediction.recommendedReorder)) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={(prediction.currentStock / (prediction.currentStock + prediction.recommendedReorder)) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          Create Order
                        </Button>
                        <Button size="sm" variant="outline" className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Schedule Order
                        </Button>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Bulk Order Opportunity</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Consider ordering Rice, Chicken, and Onions together from the same supplier to save 15% on delivery costs.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">Seasonal Adjustment</p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Winter season shows 25% higher consumption of hot spices. Consider increasing minimum stock levels.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200">
              <div className="flex items-start gap-2">
                <Bot className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Menu Correlation</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Paneer dishes are trending up 40%. Increase paneer stock levels to avoid shortages during peak hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}