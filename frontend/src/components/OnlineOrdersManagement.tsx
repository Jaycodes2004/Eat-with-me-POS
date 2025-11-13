import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAppContext } from '../contexts/AppContext';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MapPin,
  Zap,
  Smartphone,
  ShoppingBag,
  Utensils,
  Timer,
  DollarSign,
  AlertTriangle,
  Truck,
  User,
  Bell,
  RefreshCw,
  Eye,
  Check,
  X,
  MoreVertical
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface OnlineOrder {
  id: string;
  platform: 'zomato' | 'swiggy' | 'own-app' | 'website';
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  totalAmount: number;
  platformFee: number;
  netAmount: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled';
  orderTime: string;
  estimatedDeliveryTime: string;
  deliveryType: 'delivery' | 'pickup';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface OnlineOrdersProps {
  onNavigate?: (screen: string) => void;
  userRole?: string;
}

export function OnlineOrdersManagement({ onNavigate, userRole }: OnlineOrdersProps) {
  const { settings, orders: contextOrders, updateOrder } = useAppContext();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Filter context orders for online platforms (not dine-in)
  const onlineOrders = contextOrders.filter(order => 
    ['zomato', 'swiggy', 'own-app', 'website'].includes(order.orderSource)
  ).map(order => ({
    id: order.id,
    platform: order.orderSource as 'zomato' | 'swiggy' | 'own-app' | 'website',
    orderNumber: order.orderNumber || `${order.orderSource.toUpperCase()}-${order.id}`,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress || 'Address not provided',
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      specialInstructions: item.specialInstructions
    })),
    totalAmount: order.totalAmount,
    platformFee: order.platformFee || 0,
    netAmount: order.totalAmount - (order.platformFee || 0),
    status: order.status as OnlineOrder['status'],
    orderTime: order.orderTime,
    estimatedDeliveryTime: order.estimatedDeliveryTime || 'Not specified',
    deliveryType: order.orderType === 'takeaway' ? 'pickup' as const : 'delivery' as const,
    paymentStatus: order.paymentStatus as 'pending' | 'paid' | 'failed'
  }));

  // Update order status through context
  const updateOrderStatus = (orderId: string, newStatus: OnlineOrder['status']) => {
    updateOrder(orderId, { status: newStatus });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zomato': return <Zap className="w-4 h-4 text-red-600" />;
      case 'swiggy': return <Smartphone className="w-4 h-4 text-orange-600" />;
      case 'own-app': return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case 'website': return <Package className="w-4 h-4 text-green-600" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'zomato': return 'bg-red-100 text-red-800';
      case 'swiggy': return 'bg-orange-100 text-orange-800';
      case 'own-app': return 'bg-blue-100 text-blue-800';
      case 'website': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'preparing': return <Utensils className="w-4 h-4 text-blue-600" />;
      case 'ready': return <Bell className="w-4 h-4 text-purple-600" />;
      case 'dispatched': return <Truck className="w-4 h-4 text-indigo-600" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-700" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'dispatched': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const acceptOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'accepted');
  };

  const rejectOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelled');
  };

  const markReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending': return onlineOrders.filter(o => o.status === 'pending');
      case 'active': return onlineOrders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status));
      case 'completed': return onlineOrders.filter(o => ['delivered', 'cancelled'].includes(o.status));
      default: return onlineOrders;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const calculateDeliveryTime = (orderTime: string) => {
    const now = new Date();
    const order = new Date(orderTime);
    const diffMinutes = Math.floor((now.getTime() - order.getTime()) / (1000 * 60));
    return diffMinutes;
  };

  return (
    <div className="flex-1 bg-background p-4 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-primary">Online Orders</h1>
          <p className="text-muted-foreground">Manage orders from Zomato, Swiggy, and your own app</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2" size={16} />
            Refresh
          </Button>
          <Badge variant="secondary" className="animate-pulse">
            {onlineOrders.filter(o => o.status === 'pending').length} New Orders
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-primary">
                  {onlineOrders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Utensils size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-xl font-bold text-primary">
                  {onlineOrders.filter(o => ['accepted', 'preparing'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Bell size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-xl font-bold text-primary">
                  {onlineOrders.filter(o => o.status === 'ready').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-xl font-bold text-primary">
                  {settings?.currencySymbol || '$'}{onlineOrders.reduce((sum, o) => sum + o.netAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="pending">
            Pending ({onlineOrders.filter(o => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({onlineOrders.filter(o => ['accepted', 'preparing', 'ready'].includes(o.status)).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({onlineOrders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredOrders().map((order) => (
            <Card key={order.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Order Header */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${getPlatformColor(order.platform)} flex items-center gap-1`}>
                        {getPlatformIcon(order.platform)}
                        {order.platform.charAt(0).toUpperCase() + order.platform.slice(1)}
                      </Badge>
                      <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-primary">{order.orderNumber}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <User size={14} />
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone size={14} />
                          <span>{order.customerPhone}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock size={14} />
                          <span>Ordered: {formatTime(order.orderTime)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer size={14} />
                          <span>
                            {calculateDeliveryTime(order.orderTime)} min ago
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Truck size={14} />
                          <span>ETA: {formatTime(order.estimatedDeliveryTime)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium">
                          Total: {settings?.currencySymbol || '$'}{order.totalAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Platform Fee: -{settings?.currencySymbol || '$'}{order.platformFee}
                        </div>
                        <div className="text-sm font-semibold text-green-600">
                          Net: {settings?.currencySymbol || '$'}{order.netAmount}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin size={14} />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Package size={14} className="mt-0.5" />
                        <div>
                          {order.items.map((item, index) => (
                            <span key={index}>
                              {item.quantity}x {item.name}
                              {item.specialInstructions && (
                                <span className="text-orange-600 ml-1">({item.specialInstructions})</span>
                              )}
                              {index < order.items.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[120px]">
                    {order.status === 'pending' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => acceptOrder(order.id)}
                          className="flex-1 lg:flex-none bg-green-600 hover:bg-green-700"
                        >
                          <Check className="mr-1" size={14} />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => rejectOrder(order.id)}
                          className="flex-1 lg:flex-none"
                        >
                          <X className="mr-1" size={14} />
                          Reject
                        </Button>
                      </>
                    )}

                    {['accepted', 'preparing'].includes(order.status) && (
                      <Button 
                        size="sm" 
                        onClick={() => markReady(order.id)}
                        className="flex-1 lg:flex-none bg-purple-600 hover:bg-purple-700"
                      >
                        <Bell className="mr-1" size={14} />
                        Mark Ready
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderDetails(true);
                      }}
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="mr-1" size={14} />
                      Details
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Print KOT</DropdownMenuItem>
                        <DropdownMenuItem>Call Customer</DropdownMenuItem>
                        <DropdownMenuItem>Update ETA</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Cancel Order</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {getFilteredOrders().length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No {activeTab} orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'New orders will appear here when customers place them'
                    : `No ${activeTab} orders at the moment`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</p>
                    <p><span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Platform:</span> {selectedOrder.platform}</p>
                    <p><span className="font-medium">Order Time:</span> {formatTime(selectedOrder.orderTime)}</p>
                    <p><span className="font-medium">Delivery Type:</span> {selectedOrder.deliveryType}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <span className="font-medium">{item.quantity}x {item.name}</span>
                        {item.specialInstructions && (
                          <p className="text-sm text-orange-600">Note: {item.specialInstructions}</p>
                        )}
                      </div>
                      <span className="font-medium">{settings?.currencySymbol || '$'}{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{settings?.currencySymbol || '$'}{selectedOrder.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform Fee:</span>
                    <span>-{settings?.currencySymbol || '$'}{selectedOrder.platformFee}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-green-600 border-t pt-2">
                    <span>Net Amount:</span>
                    <span>{settings?.currencySymbol || '$'}{selectedOrder.netAmount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}