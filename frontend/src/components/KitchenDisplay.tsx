import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  MessageSquare,
  Timer,
  Bell,
  Search,
  Calendar,
  Eye,
  Archive,
  Filter,
  RotateCcw,
  FileText,
  TrendingUp,
  History
} from 'lucide-react';

export function KitchenDisplay() {
  const { orders, updateOrder, getOrdersByStatus, settings } = useAppContext();
  
  // Filter orders for kitchen display (only active orders)
  const activeOrders = orders.filter(order => 
    ['new', 'preparing', 'ready'].includes(order.status)
  );
  
  // Get completed orders for history tab
  const completedOrders = getOrdersByStatus('completed');
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('today');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('live');

  const updateOrderStatus = (orderId: string, newStatus: any) => {
    if (newStatus === 'served') {
      // Update order status to completed when served
      updateOrder(orderId, {
        status: 'completed',
        completedAt: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        actualCookingTime: Math.floor(Math.random() * 10) + 15 // Simulated actual time
      });
    } else {
      updateOrder(orderId, {
        status: newStatus,
        preparedBy: newStatus === 'preparing' ? 'Chef Kumar' : undefined
      });
    }
  };

  // Search and filter functions
  const getFilteredOrders = (orderList: any[]) => {
    return orderList.filter(order => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.tableNumber?.toString().includes(searchTerm) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const matchesDate = 
        selectedDate === 'all' ||
        (selectedDate === 'today' && order.orderDate === today) ||
        (selectedDate === 'yesterday' && order.orderDate === yesterday) ||
        (selectedDate === 'week' && order.orderDate >= weekAgo && order.orderDate <= today);

      const matchesStatus = 
        selectedStatus === 'all' || order.status === selectedStatus;

      const matchesSource = 
        selectedSource === 'all' || order.orderSource === selectedSource;

      return matchesSearch && matchesDate && matchesStatus && matchesSource;
    });
  };

  const handleViewOrderDetails = (order: KitchenOrder) => {
    setSelectedOrderForDetails(order);
    setShowOrderDetails(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeColor = (orderTime: string, estimatedTime: number) => {
    // This would calculate actual time difference in a real app
    return 'text-orange-600'; // Placeholder
  };

  const filterOrdersByStatus = (status: string) => {
    return activeOrders.filter(order => order.status === status);
  };

  const getOrderSourceIcon = (source: string) => {
    switch (source) {
      case 'zomato': return '🍅'; // Zomato red tomato
      case 'swiggy': return '🛵'; // Swiggy delivery
      case 'own-app': return '📱'; // Own app
      case 'website': return '🌐'; // Website
      case 'takeaway': return '🥡'; // Takeaway
      default: return '🍽️'; // Dine-in
    }
  };

  const getOrderSourceColor = (source: string) => {
    switch (source) {
      case 'zomato': return 'bg-red-100 text-red-800';
      case 'swiggy': return 'bg-orange-100 text-orange-800';
      case 'own-app': return 'bg-blue-100 text-blue-800';
      case 'website': return 'bg-green-100 text-green-800';
      case 'takeaway': return 'bg-teal-100 text-teal-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const OrderCard = ({ order }: { order: any }) => (
    <Card className={`border-l-4 ${getPriorityColor(order.priority)} border-l-solid hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
              {order.orderSource === 'dine-in' ? order.tableNumber : getOrderSourceIcon(order.orderSource)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {order.orderSource === 'dine-in' 
                  ? `Table ${order.tableNumber}` 
                  : `${order.orderNumber}`
                }
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${getOrderSourceColor(order.orderSource)} text-xs`}>
                  {order.orderSource === 'dine-in' ? 'Dine-in' : order.orderSource.charAt(0).toUpperCase() + order.orderSource.slice(1)}
                </Badge>
                {order.deliveryType && order.deliveryType !== 'dine-in' && (
                  <Badge variant="outline" className="text-xs">
                    {order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {order.orderSource === 'dine-in' ? order.waiter : order.customerName}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={getStatusColor(order.status)}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <div className="text-sm text-muted-foreground mt-1">
              {order.orderTime}
            </div>
            <div className="text-xs text-muted-foreground">
              ETA: {order.estimatedTime} min
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-accent/50 p-3 rounded-lg">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.category}</div>
                {item.notes && (
                  <div className="text-xs text-orange-600 mt-1">
                    <MessageSquare className="w-3 h-3 inline mr-1" />
                    {item.notes}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {item.quantity}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Special Instructions</div>
                <div className="text-sm text-yellow-700">{order.specialInstructions}</div>
              </div>
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center justify-between bg-accent/30 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Estimated: {order.estimatedTime} min</span>
          </div>
          <div className="text-sm font-medium text-orange-600">
            Running: 15 min
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => handleViewOrderDetails(order)}
            className="px-3"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 flex gap-2">
            {order.status === 'new' && (
              <Button 
                className="flex-1"
                onClick={() => updateOrderStatus(order.id, 'preparing')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Start Cooking
              </Button>
            )}
            
            {order.status === 'preparing' && (
              <Button 
                className="flex-1"
                onClick={() => updateOrderStatus(order.id, 'ready')}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
            )}
            
            {order.status === 'ready' && (
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => updateOrderStatus(order.id, 'served')}
              >
                <Users className="w-4 h-4 mr-2" />
                Mark Served
              </Button>
            )}

            {order.status === 'completed' && (
              <Badge variant="outline" className="flex-1 justify-center py-2 bg-green-50 text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed at {order.completedAt}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Kitchen Display</h1>
          <p className="text-muted-foreground">Live orders and order history management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Live
          </Badge>
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Alerts
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Live Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Order History ({completedOrders.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Live Orders Tab */}
        <TabsContent value="live" className="space-y-6">
          {/* Live Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{filterOrdersByStatus('new').length}</div>
              <div className="text-sm text-muted-foreground">New Orders</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{filterOrdersByStatus('preparing').length}</div>
              <div className="text-sm text-muted-foreground">Preparing</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filterOrdersByStatus('ready').length}</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{orders.length}</div>
              <div className="text-sm text-muted-foreground">Total Active</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">18</div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </Card>
          </div>

          {/* Live Orders Status Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="new">New ({filterOrdersByStatus('new').length})</TabsTrigger>
              <TabsTrigger value="preparing">Preparing ({filterOrdersByStatus('preparing').length})</TabsTrigger>
              <TabsTrigger value="ready">Ready ({filterOrdersByStatus('ready').length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="new" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus('new').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="preparing" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus('preparing').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="ready" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filterOrdersByStatus('ready').map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Search and Filter Controls */}
          <Card className="p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="search">Search Orders</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Order ID, customer, table..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="source-filter">Order Source</Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="dine-in">🍽️ Dine-in</SelectItem>
                    <SelectItem value="zomato">🍅 Zomato</SelectItem>
                    <SelectItem value="swiggy">🛵 Swiggy</SelectItem>
                    <SelectItem value="own-app">📱 Own App</SelectItem>
                    <SelectItem value="takeaway">🥡 Takeaway</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">✅ Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Historical Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{getFilteredOrders(completedOrders).length}</div>
              <div className="text-sm text-muted-foreground">Completed Orders</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                ₹{getFilteredOrders(completedOrders).reduce((sum, order) => sum + (order.totalAmount || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Revenue</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getFilteredOrders(completedOrders).length > 0 
                  ? Math.round(getFilteredOrders(completedOrders).reduce((sum, order) => sum + (order.actualCookingTime || 0), 0) / getFilteredOrders(completedOrders).length)
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground">Avg Cook Time</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {getFilteredOrders(completedOrders).filter(order => order.rating && order.rating >= 4).length}
              </div>
              <div className="text-sm text-muted-foreground">High Rated</div>
            </Card>
          </div>

          {/* Historical Orders */}
          <div className="space-y-4">
            {getFilteredOrders(completedOrders).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getFilteredOrders(completedOrders).map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3>No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedDate !== 'all' || selectedSource !== 'all' 
                    ? 'Try adjusting your search filters'
                    : 'No completed orders yet'
                  }
                </p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Order Details - {selectedOrderForDetails?.orderSource === 'dine-in' 
                ? `Table ${selectedOrderForDetails?.tableNumber}` 
                : selectedOrderForDetails?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Complete order information and cooking details
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderForDetails && (
            <div className="space-y-6">
              {/* Order Header Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-accent/50 rounded-lg">
                <div>
                  <Label>Order ID</Label>
                  <div className="font-mono text-sm">{selectedOrderForDetails.id}</div>
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <div className="text-sm">{selectedOrderForDetails.orderDate} at {selectedOrderForDetails.orderTime}</div>
                </div>
                <div>
                  <Label>Source</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={getOrderSourceColor(selectedOrderForDetails.orderSource)}>
                      {getOrderSourceIcon(selectedOrderForDetails.orderSource)} {selectedOrderForDetails.orderSource}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedOrderForDetails.status)}>
                    {selectedOrderForDetails.status.charAt(0).toUpperCase() + selectedOrderForDetails.status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <Label>Customer/Waiter</Label>
                  <div className="text-sm">
                    {selectedOrderForDetails.orderSource === 'dine-in' 
                      ? selectedOrderForDetails.waiter 
                      : selectedOrderForDetails.customerName}
                  </div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="font-bold text-primary">₹{selectedOrderForDetails.totalAmount}</div>
                </div>
              </div>

              {/* Cooking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estimated Time</Label>
                  <div className="text-sm">{selectedOrderForDetails.estimatedTime} minutes</div>
                </div>
                <div>
                  <Label>Actual Cooking Time</Label>
                  <div className="text-sm">
                    {selectedOrderForDetails.actualCookingTime 
                      ? `${selectedOrderForDetails.actualCookingTime} minutes`
                      : 'In progress...'}
                  </div>
                </div>
                <div>
                  <Label>Prepared By</Label>
                  <div className="text-sm">{selectedOrderForDetails.preparedBy || 'Not assigned'}</div>
                </div>
                <div>
                  <Label>Completed At</Label>
                  <div className="text-sm">{selectedOrderForDetails.completedAt || 'Not completed'}</div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <Label className="text-base">Order Items</Label>
                <div className="space-y-3 mt-2">
                  {selectedOrderForDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                        {item.notes && (
                          <div className="text-xs text-orange-600 mt-1">
                            📝 {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrderForDetails.specialInstructions && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-base">Special Instructions</Label>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-700">{selectedOrderForDetails.specialInstructions}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Customer Feedback (if available) */}
              {selectedOrderForDetails.feedback && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-base">Customer Feedback</Label>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm text-blue-700">{selectedOrderForDetails.feedback}</div>
                          {selectedOrderForDetails.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs text-blue-600">Rating:</span>
                              <span className="text-yellow-500">
                                {'★'.repeat(selectedOrderForDetails.rating)}{'☆'.repeat(5 - selectedOrderForDetails.rating)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}