import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Calendar, 
  DollarSign, 
  Award, 
  MessageCircle,
  Edit,
  Star,
  Gift,
  TrendingUp,
  Send,
  Filter,
  UserCheck,
  RefreshCw,
  Info,
  Trash2
} from 'lucide-react';

// Using ExtendedCustomer interface from AppContext

export function CustomerManagement() {
  const { 
    customers, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    settings,
    extendedCustomers,
    addExtendedCustomer,
    updateExtendedCustomer,
    deleteExtendedCustomer,
    getCustomerOrderHistory,
    updateCustomerStats,
    syncAllCustomers,
    reservations,
    orders,
    tables,
    addNotification
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMarketingDialog, setShowMarketingDialog] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  // Form state for adding new customer
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    preferredCuisine: '',
    whatsappOptIn: false
  });

  // Form state for editing customer
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    preferredCuisine: '',
    tags: [] as string[],
    status: 'active' as 'active' | 'inactive'
  });
  
  // Marketing filters
  const [marketingFilters, setMarketingFilters] = useState({
    minOrders: '',
    minSpent: '',
    tier: 'all',
    lastVisitDays: '',
    whatsappOptIn: true,
    hasBirthday: false,
    hasAnniversary: false
  });

  const [marketingMessage, setMarketingMessage] = useState('');
  const [selectedCustomersForMarketing, setSelectedCustomersForMarketing] = useState<string[]>([]);

  const filteredCustomers = extendedCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 20000) return { tier: 'Diamond', color: 'bg-purple-500' };
    if (totalSpent >= 10000) return { tier: 'Gold', color: 'bg-yellow-500' };
    if (totalSpent >= 5000) return { tier: 'Silver', color: 'bg-gray-400' };
    return { tier: 'Bronze', color: 'bg-orange-600' };
  };

  const getFilteredCustomersForMarketing = () => {
    return extendedCustomers.filter(customer => {
      const tier = getCustomerTier(customer.totalSpent);
      const daysSinceLastVisit = Math.floor((new Date().getTime() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24));
      
      if (marketingFilters.minOrders && customer.visitCount < parseInt(marketingFilters.minOrders)) return false;
      if (marketingFilters.minSpent && customer.totalSpent < parseInt(marketingFilters.minSpent)) return false;
      if (marketingFilters.tier && marketingFilters.tier !== 'all' && tier.tier !== marketingFilters.tier) return false;
      if (marketingFilters.lastVisitDays && daysSinceLastVisit < parseInt(marketingFilters.lastVisitDays)) return false;
      if (marketingFilters.whatsappOptIn && !customer.whatsappOptIn) return false;
      if (marketingFilters.hasBirthday && !customer.birthDate) return false;
      if (marketingFilters.hasAnniversary && !customer.anniversary) return false;
      
      return true;
    });
  };

  const handleSendMarketingMessage = () => {
    const selectedCustomers = selectedCustomersForMarketing.length > 0 
      ? extendedCustomers.filter(c => selectedCustomersForMarketing.includes(c.id))
      : getFilteredCustomersForMarketing();
    
    if (selectedCustomers.length === 0) {
      alert('No customers selected or match the filters.');
      return;
    }

    selectedCustomers.forEach(customer => {
      const extendedCustomer = extendedCustomers.find(ec => ec.id === customer.id);
      if (extendedCustomer?.whatsappOptIn) {
        const personalizedMessage = marketingMessage.replace('{name}', customer.name).replace('{points}', (extendedCustomer.loyaltyPoints || 0).toString());
        const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;
        window.open(whatsappUrl, '_blank');
      }
    });

    alert(`Marketing message sent to ${selectedCustomers.filter(c => extendedCustomers.find(ec => ec.id === c.id)?.whatsappOptIn).length} customers via WhatsApp!`);
    setShowMarketingDialog(false);
    setMarketingMessage('');
    setSelectedCustomersForMarketing([]);
  };

  const stats = {
    totalCustomers: extendedCustomers.length,
    basicCustomers: customers.length,
    loyalCustomers: extendedCustomers.filter(c => c.visitCount >= 10).length,
    totalLoyaltyPoints: extendedCustomers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
    whatsappOptIns: extendedCustomers.filter(c => c.whatsappOptIn).length
  };

  const handleAddCustomer = () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      addNotification({
        title: 'Missing Information',
        message: 'Please fill in required fields (Name and Phone)',
        type: 'error'
      });
      return;
    }

    const newCustomer = {
      id: `cust_${Date.now()}`,
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email,
      address: newCustomerForm.address,
      dateOfBirth: newCustomerForm.dateOfBirth,
      gender: newCustomerForm.gender,
      totalOrders: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      loyaltyTier: 'bronze' as const,
      lastVisit: new Date().toISOString().split('T')[0],
      averageRating: 0,
      preferredCuisine: newCustomerForm.preferredCuisine,
      tags: ['New Customer'],
      status: 'active' as const,
      referralCount: 0,
      referralCode: `${newCustomerForm.name.substring(0, 5).toUpperCase()}${Math.floor(Math.random() * 1000)}`,
      joinDate: new Date().toISOString().split('T')[0]
    };

    addCustomer(newCustomer);
    
    // Reset form
    setNewCustomerForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      dateOfBirth: '',
      gender: 'male',
      preferredCuisine: '',
      whatsappOptIn: false
    });
    
    setShowAddDialog(false);
    addNotification({
      title: 'Customer Added',
      message: `${newCustomer.name} has been added successfully`,
      type: 'success'
    });
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setEditCustomerForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      dateOfBirth: customer.birthDate || customer.dateOfBirth || '',
      gender: customer.gender || 'male',
      preferredCuisine: customer.preferredCuisine || customer.preferences?.[0] || '',
      tags: customer.tags || [],
      status: customer.status || 'active'
    });
    setShowEditDialog(true);
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer || !editCustomerForm.name || !editCustomerForm.phone) {
      addNotification({
        title: 'Missing Information',
        message: 'Please fill in required fields (Name and Phone)',
        type: 'error'
      });
      return;
    }

    const updates = {
      name: editCustomerForm.name,
      phone: editCustomerForm.phone,
      email: editCustomerForm.email,
      address: editCustomerForm.address,
      dateOfBirth: editCustomerForm.dateOfBirth,
      gender: editCustomerForm.gender,
      preferredCuisine: editCustomerForm.preferredCuisine,
      tags: editCustomerForm.tags,
      status: editCustomerForm.status
    };

    updateCustomer(selectedCustomer.id, updates);
    setShowEditDialog(false);
    setSelectedCustomer(null);
    addNotification({
      title: 'Customer Updated',
      message: `${editCustomerForm.name}'s information has been updated`,
      type: 'success'
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      const customerName = selectedCustomer?.name;
      deleteCustomer(customerId);
      setShowEditDialog(false);
      setSelectedCustomer(null);
      addNotification({
        title: 'Customer Deleted',
        message: `${customerName} has been removed from the system`,
        type: 'success'
      });
    }
  };

  const handleSyncCustomers = async () => {
    setSyncInProgress(true);
    try {
      syncAllCustomers();
      setLastSyncTime(new Date().toLocaleString());
      alert(`Synchronized customers from ${reservations.length} reservations, ${orders.length} orders, and ${tables.filter(t => t.status === 'occupied' || t.status === 'reserved').length} tables with customer data.`);
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Synchronization failed. Please try again.');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Debug information
  const debugInfo = {
    reservationsWithCustomers: reservations.filter(r => r.customerName && r.customerPhone).length,
    ordersWithCustomers: orders.filter(o => o.customerName && o.customerPhone).length,
    tablesWithCustomers: tables.filter(t => 
      (t.status === 'occupied' && t.customer) || 
      (t.status === 'reserved' && t.reservationName && t.reservationPhone)
    ).length,
    totalCustomers: extendedCustomers.length,
    basicCustomers: customers.length,
    lastSync: lastSyncTime
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Customer Management</h1>
            <p className="text-muted-foreground">Manage customers, loyalty program, and marketing</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="whitespace-nowrap"
            >
              <Info className="w-4 h-4 mr-2" />
              Debug Info
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncCustomers}
              disabled={syncInProgress}
              className="whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
              {syncInProgress ? 'Syncing...' : 'Manual Sync'}
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your database with their contact information and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter customer name"
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 XXXXX XXXXX"
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="customer@email.com"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="birth">Date of Birth (Optional)</Label>
                  <Input 
                    id="birth" 
                    type="date"
                    value={newCustomerForm.dateOfBirth}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={newCustomerForm.gender} 
                    onValueChange={(value: 'male' | 'female' | 'other') => setNewCustomerForm({...newCustomerForm, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cuisine">Preferred Cuisine</Label>
                  <Input 
                    id="cuisine" 
                    placeholder="e.g., North Indian, Chinese"
                    value={newCustomerForm.preferredCuisine}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, preferredCuisine: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Textarea 
                    id="address" 
                    placeholder="Enter customer address"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="whatsapp"
                  checked={newCustomerForm.whatsappOptIn}
                  onCheckedChange={(checked) => setNewCustomerForm({...newCustomerForm, whatsappOptIn: checked})}
                />
                <Label htmlFor="whatsapp">WhatsApp Marketing Opt-in</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleAddCustomer}>Save Customer</Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>

        {/* Debug Information */}
        {showDebugInfo && (
          <Card className="p-4 bg-muted/20 border-dashed">
            <CardHeader className="px-0 pt-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Info className="w-4 h-4" />
                Customer Synchronization Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reservations with customers:</span>
                  <span className="font-medium">{debugInfo.reservationsWithCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orders with customers:</span>
                  <span className="font-medium">{debugInfo.ordersWithCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tables with customers:</span>
                  <span className="font-medium">{debugInfo.tablesWithCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Extended customers:</span>
                  <span className="font-medium text-primary">{debugInfo.totalCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic customers:</span>
                  <span className="font-medium">{debugInfo.basicCustomers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last manual sync:</span>
                  <span className="font-medium text-xs">{debugInfo.lastSync || 'Never'}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed text-xs text-muted-foreground">
                <p>• Extended customers include synchronized data from reservations, orders, and tables</p>
                <p>• Basic customers are from the core customer database</p>
                <p>• Auto-sync runs when reservations, orders, or table data changes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <UserCheck size={16} />
            Customers
          </TabsTrigger>
          <TabsTrigger value="marketing" className="flex items-center gap-2">
            <MessageCircle size={16} />
            Marketing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalCustomers}</div>
              <div className="text-sm text-muted-foreground">Total Customers</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.loyalCustomers}</div>
              <div className="text-sm text-muted-foreground">Loyal Customers</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.totalLoyaltyPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.whatsappOptIns}</div>
              <div className="text-sm text-muted-foreground">WhatsApp Opt-ins</div>
            </Card>
          </div>

          {/* Customer List */}
          <div className="space-y-4">
            {filteredCustomers.map((customer) => {
              const tier = getCustomerTier(customer.totalSpent);
              return (
                <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {customer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{customer.name}</h3>
                            <Badge className={`${tier.color} text-white`}>
                              {tier.tier}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Last visit: {customer.lastVisit}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-primary">{customer.visitCount}</div>
                            <div className="text-xs text-muted-foreground">Visits</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">₹{customer.totalSpent.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Spent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-yellow-600">{customer.loyaltyPoints || 0}</div>
                            <div className="text-xs text-muted-foreground">Points</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {customer.whatsappOptIn && (
                            <Badge variant="outline" className="text-green-600">
                              <MessageCircle className="w-3 h-3 mr-1" />
                              WhatsApp
                            </Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCustomer(customer)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">WhatsApp Marketing</h3>
              <p className="text-muted-foreground">Send promotional messages to customers who have opted in</p>
            </div>
            <Button onClick={() => setShowMarketingDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              Send Campaign
            </Button>
          </div>

          {/* Marketing Filters */}
          <Card className="p-4">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Customer Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="minOrders">Min Orders</Label>
                  <Input
                    id="minOrders"
                    type="number"
                    placeholder="e.g., 5"
                    value={marketingFilters.minOrders}
                    onChange={(e) => setMarketingFilters(prev => ({ ...prev, minOrders: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="minSpent">Min Amount Spent</Label>
                  <Input
                    id="minSpent"
                    type="number"
                    placeholder="e.g., 5000"
                    value={marketingFilters.minSpent}
                    onChange={(e) => setMarketingFilters(prev => ({ ...prev, minSpent: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tier">Customer Tier</Label>
                  <Select 
                    value={marketingFilters.tier}
                    onValueChange={(value) => setMarketingFilters(prev => ({ ...prev, tier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="Bronze">Bronze</SelectItem>
                      <SelectItem value="Silver">Silver</SelectItem>
                      <SelectItem value="Gold">Gold</SelectItem>
                      <SelectItem value="Diamond">Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lastVisitDays">Days since last visit</Label>
                  <Input
                    id="lastVisitDays"
                    type="number"
                    placeholder="e.g., 30"
                    value={marketingFilters.lastVisitDays}
                    onChange={(e) => setMarketingFilters(prev => ({ ...prev, lastVisitDays: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="whatsappOptIn" 
                    checked={marketingFilters.whatsappOptIn}
                    onCheckedChange={(checked) => setMarketingFilters(prev => ({ ...prev, whatsappOptIn: !!checked }))}
                  />
                  <Label htmlFor="whatsappOptIn">WhatsApp Opt-in only</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasBirthday" 
                    checked={marketingFilters.hasBirthday}
                    onCheckedChange={(checked) => setMarketingFilters(prev => ({ ...prev, hasBirthday: !!checked }))}
                  />
                  <Label htmlFor="hasBirthday">Has birthday info</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasAnniversary" 
                    checked={marketingFilters.hasAnniversary}
                    onCheckedChange={(checked) => setMarketingFilters(prev => ({ ...prev, hasAnniversary: !!checked }))}
                  />
                  <Label htmlFor="hasAnniversary">Has anniversary info</Label>
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">{getFilteredCustomersForMarketing().length}</span> customers match the current filters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Filtered Customers Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Filtered Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getFilteredCustomersForMarketing().map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedCustomersForMarketing.includes(customer.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCustomersForMarketing(prev => [...prev, customer.id]);
                          } else {
                            setSelectedCustomersForMarketing(prev => prev.filter(id => id !== customer.id));
                          }
                        }}
                      />
                      <span className="font-medium">{customer.name}</span>
                      <Badge className={`${getCustomerTier(customer.totalSpent).color} text-white text-xs`}>
                        {getCustomerTier(customer.totalSpent).tier}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {customer.totalOrders} orders • ₹{customer.totalSpent.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Marketing Message Dialog */}
          <Dialog open={showMarketingDialog} onOpenChange={setShowMarketingDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Marketing Campaign</DialogTitle>
                <DialogDescription>
                  Create and send WhatsApp marketing messages to selected customers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="message">Message Template</Label>
                  <Textarea
                    id="message"
                    placeholder="Hi {name}! We miss you at RestaurantPOS. Use code WELCOME10 for 10% off your next order. You have {points} loyalty points to use!"
                    value={marketingMessage}
                    onChange={(e) => setMarketingMessage(e.target.value)}
                    className="min-h-20"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{name}'} for customer name and {'{points}'} for loyalty points
                  </p>
                </div>

                <div className="bg-muted/50 p-3 rounded">
                  <p className="text-sm">
                    Will send to: <span className="font-medium">
                      {selectedCustomersForMarketing.length > 0 
                        ? `${selectedCustomersForMarketing.length} selected customers`
                        : `${getFilteredCustomersForMarketing().filter(c => c.whatsappOptIn).length} customers (filtered + WhatsApp opt-in)`
                      }
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleSendMarketingMessage}
                    disabled={!marketingMessage.trim()}
                    className="flex-1"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Messages
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMarketingDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>
              Update customer information and manage their account
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Stats Summary */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{selectedCustomer.visitCount || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Visits</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">₹{selectedCustomer.totalSpent?.toLocaleString() || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{selectedCustomer.loyaltyPoints || 0}</div>
                  <div className="text-xs text-muted-foreground">Points</div>
                </div>
                <div className="text-center">
                  <Badge className={`${getCustomerTier(selectedCustomer.totalSpent || 0).color} text-white text-sm px-3 py-1`}>
                    {getCustomerTier(selectedCustomer.totalSpent || 0).tier}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">Tier</div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editName">Name *</Label>
                  <Input 
                    id="editName" 
                    value={editCustomerForm.name}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editPhone">Phone *</Label>
                  <Input 
                    id="editPhone" 
                    value={editCustomerForm.phone}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input 
                    id="editEmail" 
                    type="email"
                    value={editCustomerForm.email}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editBirth">Date of Birth</Label>
                  <Input 
                    id="editBirth" 
                    type="date"
                    value={editCustomerForm.dateOfBirth}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, dateOfBirth: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editGender">Gender</Label>
                  <Select 
                    value={editCustomerForm.gender} 
                    onValueChange={(value: 'male' | 'female' | 'other') => setEditCustomerForm({...editCustomerForm, gender: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editCuisine">Preferred Cuisine</Label>
                  <Input 
                    id="editCuisine" 
                    value={editCustomerForm.preferredCuisine}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, preferredCuisine: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editStatus">Status</Label>
                  <Select 
                    value={editCustomerForm.status} 
                    onValueChange={(value: 'active' | 'inactive') => setEditCustomerForm({...editCustomerForm, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Referral Code</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={selectedCustomer.referralCode || 'N/A'}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="outline">{selectedCustomer.referralCount || 0} referrals</Badge>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="editAddress">Address</Label>
                  <Textarea 
                    id="editAddress" 
                    value={editCustomerForm.address}
                    onChange={(e) => setEditCustomerForm({...editCustomerForm, address: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>

              {/* Order History */}
              {selectedCustomer.orderHistory && selectedCustomer.orderHistory.length > 0 && (
                <div>
                  <Label className="text-base">Recent Orders</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {selectedCustomer.orderHistory.slice(0, 5).map((order: any) => (
                      <Card key={order.id} className="p-3">
                        <div className="flex justify-between items-start text-sm">
                          <div>
                            <div className="font-medium">{order.id}</div>
                            <div className="text-muted-foreground text-xs">{order.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">₹{order.amount}</div>
                            <div className="text-xs text-muted-foreground">{order.items?.join(', ')}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleUpdateCustomer} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Update Customer
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}