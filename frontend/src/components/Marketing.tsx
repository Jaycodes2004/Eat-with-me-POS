import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { useAppContext } from '../contexts/AppContext';
import { 
  MessageCircle, 
  Users, 
  Filter, 
  Send, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastOrderDate: string;
  orderType: 'inhouse' | 'takeaway' | 'delivery';
  totalOrders: number;
  totalSpent: number;
  location?: string;
}

export function Marketing() {
  const { settings, customers: contextCustomers, orders } = useAppContext();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrderType, setFilterOrderType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('all');
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingMessages, setSendingMessages] = useState(false);

  // Enhanced customer data with order insights from AppContext
  const customers: Customer[] = useMemo(() => {
    return contextCustomers.map(customer => {
      // Get customer's order history
      const customerOrders = orders.filter(order => 
        order.customerPhone === customer.phone || 
        order.customerName === customer.name
      );
      
      // Determine primary order type
      const orderTypes = customerOrders.map(order => order.orderSource);
      const orderTypeCount = orderTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const primaryOrderType = Object.keys(orderTypeCount).reduce((a, b) => 
        orderTypeCount[a] > orderTypeCount[b] ? a : b, 'dine-in'
      );

      // Map order source to marketing format
      const getOrderTypeForMarketing = (source: string) => {
        switch (source) {
          case 'dine-in': return 'inhouse';
          case 'takeaway': return 'takeaway';
          case 'zomato':
          case 'swiggy':
          case 'website':
          case 'own-app': return 'delivery';
          default: return 'inhouse';
        }
      };

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        lastOrderDate: customer.lastVisit,
        orderType: getOrderTypeForMarketing(primaryOrderType),
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
        location: customer.address || 'Unknown'
      };
    });
  }, [contextCustomers, orders]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           customer.phone.includes(searchQuery) ||
                           customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesOrderType = filterOrderType === 'all' || customer.orderType === filterOrderType;
      
      let matchesDateRange = true;
      if (filterDateRange !== 'all') {
        const orderDate = new Date(customer.lastOrderDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filterDateRange) {
          case 'today':
            matchesDateRange = daysDiff === 0;
            break;
          case 'week':
            matchesDateRange = daysDiff <= 7;
            break;
          case 'month':
            matchesDateRange = daysDiff <= 30;
            break;
          case 'quarter':
            matchesDateRange = daysDiff <= 90;
            break;
        }
      }
      
      return matchesSearch && matchesOrderType && matchesDateRange;
    });
  }, [searchQuery, filterOrderType, filterDateRange]);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedCustomers([]);
      setSelectAll(false);
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id));
      setSelectAll(true);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!settings.whatsappApiKey || !settings.whatsappPhoneNumber) {
      alert('Please configure WhatsApp API in Settings Integrations first');
      return;
    }

    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    if (!whatsappMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setSendingMessages(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would integrate with actual WhatsApp Business API
    console.log('Sending WhatsApp messages to:', selectedCustomers);
    console.log('Message:', whatsappMessage);
    
    setSendingMessages(false);
    setShowWhatsAppDialog(false);
    setWhatsappMessage('');
    setSelectedCustomers([]);
    setSelectAll(false);
    
    alert(`Message sent successfully to ${selectedCustomers.length} customers!`);
  };

  const getOrderTypeColor = (orderType: string) => {
    switch (orderType) {
      case 'inhouse': return 'bg-blue-100 text-blue-800';
      case 'takeaway': return 'bg-green-100 text-green-800';
      case 'delivery': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex-1 bg-background p-4 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-primary">Marketing</h1>
          <p className="text-muted-foreground">Manage customer communications and campaigns</p>
        </div>
        <Dialog open={showWhatsAppDialog} onOpenChange={setShowWhatsAppDialog}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={selectedCustomers.length === 0}
            >
              <MessageCircle className="mr-2" size={18} />
              Send WhatsApp ({selectedCustomers.length})
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send WhatsApp Message</DialogTitle>
              <DialogDescription>
                Send a bulk message to {selectedCustomers.length} selected customers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  placeholder="Enter your message here..."
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Personalize with customer names and keep it engaging
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowWhatsAppDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSendWhatsApp}
                  disabled={sendingMessages}
                >
                  {sendingMessages ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={16} />
                      Send Messages
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* WhatsApp API Status */}
      {!settings.whatsappApiKey || !settings.whatsappPhoneNumber ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-yellow-600" size={20} />
              <div>
                <h4 className="font-medium text-yellow-800">WhatsApp API Not Configured</h4>
                <p className="text-sm text-yellow-700">
                  Configure WhatsApp API in Settings Integrations to enable bulk messaging
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={20} />
              <div>
                <h4 className="font-medium text-green-800">WhatsApp API Connected</h4>
                <p className="text-sm text-green-700">
                  Ready to send bulk messages to customers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Filter size={20} />
            Customer Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Customers</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Type</label>
              <Select value={filterOrderType} onValueChange={setFilterOrderType}>
                <SelectTrigger>
                  <SelectValue placeholder="All order types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Order Types</SelectItem>
                  <SelectItem value="inhouse">In-House</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Order</label>
              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSelectAll}
                  className="flex-1"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-primary">
            <div className="flex items-center gap-2">
              <Users size={20} />
              Customers ({filteredCustomers.length})
            </div>
            <Badge variant="secondary">
              {selectedCustomers.length} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto text-muted-foreground mb-4" size={64} />
                <h3 className="font-medium text-muted-foreground mb-2">No customers in system</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start taking orders to build your customer database
                </p>
                <Button variant="outline" onClick={() => window.location.href = '#pos'}>
                  <MessageCircle className="mr-2" size={16} />
                  Take First Order
                </Button>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="mx-auto text-muted-foreground mb-2" size={48} />
                <h3 className="font-medium text-muted-foreground">No customers match your filters</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterOrderType('all');
                    setFilterDateRange('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className={`p-4 rounded-lg border transition-colors ${
                    selectedCustomers.includes(customer.id) 
                      ? 'bg-primary/5 border-primary' 
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => handleSelectCustomer(customer.id)}
                      />
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium">{customer.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Phone size={12} />
                            {customer.phone}
                          </div>
                          {customer.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={12} />
                              {customer.email}
                            </div>
                          )}
                          {customer.location && customer.location !== 'Unknown' && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              {customer.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {settings.currencySymbol}{customer.totalSpent.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.totalOrders} orders
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={`text-xs ${getOrderTypeColor(customer.orderType)}`}>
                          {customer.orderType.charAt(0).toUpperCase() + customer.orderType.slice(1)}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last: {new Date(customer.lastOrderDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}