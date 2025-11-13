import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AIService } from '../utils/aiService';
import { useAppContext } from '../contexts/AppContext';
import { 
  Bot, 
  TrendingUp, 
  DollarSign, 
  Lightbulb, 
  Star,
  ChefHat,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw
} from 'lucide-react';

export function MenuAI() {
  const { menuItems, orders, customers } = useAppContext();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [pricingSuggestions, setPricingSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAIData();
  }, [menuItems, orders, customers]);

  const loadAIData = async () => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate dynamic recommendations based on real data
    const newRecommendations = AIService.getMenuRecommendations(menuItems, orders, customers);
    const newPricingSuggestions = AIService.getPricingSuggestions();
    
    setRecommendations(newRecommendations);
    setPricingSuggestions(newPricingSuggestions);
    setIsLoading(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getPriceChangeIcon = (currentPrice: number, suggestedPrice: number) => {
    if (suggestedPrice > currentPrice) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (suggestedPrice < currentPrice) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPriceChangeColor = (currentPrice: number, suggestedPrice: number) => {
    if (suggestedPrice > currentPrice) return 'text-green-600';
    if (suggestedPrice < currentPrice) return 'text-red-600';
    return 'text-gray-600';
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
            <h3 className="font-semibold text-primary">AI Menu Insights</h3>
            <p className="text-sm text-muted-foreground">Smart recommendations to boost your menu performance</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadAIData}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            New Items
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Recommended Menu Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
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
                    {recommendations.map((rec, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-primary mb-1">{rec.itemName}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {rec.expectedIncrease}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className={`font-medium ${getConfidenceColor(rec.confidence)}`}>
                                  {Math.round(rec.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Progress value={rec.confidence * 100} className="w-16 h-2" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Add to Menu
                          </Button>
                          <Button size="sm" variant="outline">
                            Learn More
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Smart Pricing Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
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
                    {pricingSuggestions.map((suggestion, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-primary">{suggestion.item}</h4>
                              {getPriceChangeIcon(suggestion.currentPrice, suggestion.suggestedPrice)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Current Price</p>
                                <p className="font-medium">₹{suggestion.currentPrice}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Suggested Price</p>
                                <p className={`font-medium ${getPriceChangeColor(suggestion.currentPrice, suggestion.suggestedPrice)}`}>
                                  ₹{suggestion.suggestedPrice}
                                </p>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className={`font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                  {Math.round(suggestion.confidence * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Progress value={suggestion.confidence * 100} className="w-16 h-2" />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Apply Price
                          </Button>
                          <Button size="sm" variant="outline">
                            View Analysis
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}