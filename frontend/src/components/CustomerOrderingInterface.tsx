import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAppContext, type MenuItem as ContextMenuItem } from '../contexts/AppContext';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  MessageCircle,
  IndianRupee,
  ArrowLeft,
  Star,
  Clock,
  Users,
  Utensils,
  Coffee,
  Check,
  X,
  Heart
} from 'lucide-react';

// Use the MenuItem type from context
type MenuItem = ContextMenuItem;

interface CartItem extends MenuItem {
  quantity: number;
}

interface CustomerOrderingInterfaceProps {
  tableNumber: string;
  onBack: () => void;
  onOrderPlace: (order: any) => void;
}

export function CustomerOrderingInterface({ 
  tableNumber, 
  onBack, 
  onOrderPlace 
}: CustomerOrderingInterfaceProps) {
  const { settings, menuItems } = useAppContext();
  const [activeStep, setActiveStep] = useState<'menu' | 'cart' | 'checkout'>('menu');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // Get unique categories from menu items
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const isAvailable = item.available; // Only show available items to customers
    return matchesCategory && matchesSearch && isAvailable;
  });

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(prev => prev.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (itemId: string, increment: boolean) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedTime = cart.length > 0 ? Math.max(...cart.map(item => item.cookingTime * item.quantity)) : 0;

  const placeOrder = () => {
    const order = {
      tableNumber,
      items: cart,
      total: cartTotal,
      note: orderNote,
      estimatedTime,
      timestamp: new Date().toISOString()
    };
    
    onOrderPlace(order);
    setCart([]);
    setOrderNote('');
    setActiveStep('menu');
  };

  const getSpiceIcon = (level?: string) => {
    switch (level) {
      case 'mild': return '🌶️';
      case 'medium': return '🌶️🌶️';
      case 'hot': return '🌶️🌶️🌶️';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="p-2"
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground">🍽️</span>
                  </div>
                  <div>
                    <h1 className="font-bold">{settings.restaurantName}</h1>
                    <p className="text-xs text-muted-foreground">Table {tableNumber}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {activeStep !== 'cart' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveStep('cart')}
                className="relative"
                disabled={cart.length === 0}
              >
                <ShoppingCart size={16} />
                {cartItemsCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-xs">
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-20">
        {activeStep === 'menu' && (
          <div className="py-4 space-y-4">
            {/* Search */}
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            {/* Categories */}
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category === 'all' ? 'All Items' : category}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Menu Items */}
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const inCart = cart.find(cartItem => cartItem.id === item.id);
                const isFavorite = favorites.includes(item.id);
                
                return (
                  <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <div className="flex items-center gap-1">
                              {item.isVeg ? (
                                <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                                </div>
                              )}
                              {item.isPopular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {item.rating && (
                              <div className="flex items-center gap-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                <span>{item.rating}</span>
                              </div>
                            )}
                            {item.cookingTime && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span>{item.cookingTime} min</span>
                              </div>
                            )}
                            {item.spiceLevel && (
                              <span>{getSpiceIcon(item.spiceLevel)}</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 font-semibold text-primary">
                            <IndianRupee size={14} />
                            <span>₹{item.price}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(item.id)}
                            className="p-1 h-auto"
                          >
                            <Heart 
                              size={16} 
                              className={isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"} 
                            />
                          </Button>
                          
                          {!inCart ? (
                            <Button 
                              size="sm"
                              onClick={() => addToCart(item)}
                              className="h-8 px-3"
                            >
                              <Plus size={14} className="mr-1" />
                              Add
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                onClick={() => updateCartQuantity(item.id, false)}
                              >
                                <Minus size={12} />
                              </Button>
                              <span className="w-8 text-center font-semibold">
                                {inCart.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                onClick={() => updateCartQuantity(item.id, true)}
                              >
                                <Plus size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Utensils size={48} className="mx-auto mb-4 opacity-50" />
                <p>No items found</p>
                <p className="text-sm">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        )}

        {activeStep === 'cart' && (
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Your Order</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveStep('menu')}
              >
                Add More Items
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
                <p className="text-sm">Add some delicious items from our menu</p>
                <Button 
                  className="mt-4"
                  onClick={() => setActiveStep('menu')}
                >
                  Browse Menu
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <Card key={item.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{item.name}</h4>
                              {item.isVeg ? (
                                <div className="w-3 h-3 border border-green-600 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-3 h-3 border border-red-600 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <IndianRupee size={12} />
                              <span>₹{item.price} × {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-primary">
                              <IndianRupee size={14} />
                              <span>₹{item.price * item.quantity}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-8 h-8 p-0"
                              onClick={() => updateCartQuantity(item.id, false)}
                            >
                              <Minus size={12} />
                            </Button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-8 h-8 p-0"
                              onClick={() => updateCartQuantity(item.id, true)}
                            >
                              <Plus size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {/* Order Summary */}
                <Card className="p-4 bg-primary/5">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span>₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>Estimated Time</span>
                      <span>{estimatedTime} minutes</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span>₹{cartTotal}</span>
                    </div>
                  </div>
                </Card>

                {/* Special Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Special Instructions (Optional)</label>
                  <Input
                    placeholder="Any special requests or dietary requirements..."
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                  />
                </div>

                {/* Place Order Button */}
                <Button 
                  onClick={placeOrder}
                  className="w-full h-12"
                  size="lg"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Place Order - ₹{cartTotal}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {activeStep === 'menu' && cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <Button 
            onClick={() => setActiveStep('cart')}
            size="lg"
            className="h-12 px-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart ({cartItemsCount}) - ₹{cartTotal}
          </Button>
        </div>
      )}
    </div>
  );
}