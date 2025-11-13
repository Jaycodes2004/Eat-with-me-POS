import { useMemo, useState } from 'react';
import { useAppContext, Supplier, PurchaseOrder } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Phone,
  Mail,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  FileText,
  Star,
  Users
} from 'lucide-react';

// Using Supplier and PurchaseOrder interfaces from AppContext

type SupplierFormState = {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  creditDays: number;
};

type EditSupplierFormState = SupplierFormState & {
  status: Supplier['status'];
};

type PurchaseOrderItemDraft = {
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
};

type PurchaseOrderDraft = {
  supplierId: string;
  supplierName: string;
  expectedDate: string;
  notes: string;
  items: PurchaseOrderItemDraft[];
};

const createEmptySupplierForm = (): SupplierFormState => ({
  name: '',
  category: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  gstNumber: '',
  creditDays: 0,
});

const createEmptyEditSupplierForm = (): EditSupplierFormState => ({
  ...createEmptySupplierForm(),
  status: 'active',
});

const createEmptyPurchaseOrderDraft = (): PurchaseOrderDraft => ({
  supplierId: '',
  supplierName: '',
  expectedDate: '',
  notes: '',
  items: [],
});

const createEmptyPurchaseOrderItem = (): PurchaseOrderItemDraft => ({
  itemName: '',
  quantity: 0,
  unit: 'kg',
  rate: 0,
  amount: 0,
});

export function SupplierManagement() {
  const { 
    suppliers, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier, 
    getCategoriesByType,
    purchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrdersBySupplier,
    addNotification
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('suppliers');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddOrderDialogOpen, setIsAddOrderDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState<SupplierFormState>(createEmptySupplierForm());

  const [editSupplier, setEditSupplier] = useState<EditSupplierFormState>(createEmptyEditSupplierForm());

  const [newOrder, setNewOrder] = useState<PurchaseOrderDraft>(createEmptyPurchaseOrderDraft());

  const [currentOrderItem, setCurrentOrderItem] = useState<PurchaseOrderItemDraft>(createEmptyPurchaseOrderItem());

  const supplierCategories = getCategoriesByType('supplier');

  const supplierCategoryOptions = useMemo<string[]>(() => {
    const contextCategories = supplierCategories
      .map(category => category.name)
      .filter((name): name is string => Boolean(name && name.trim()))
      .map(name => name.trim());

    const derivedCategories = suppliers
      .map(supplier => supplier.category)
      .filter((name): name is string => Boolean(name && name.trim()))
      .map(name => name.trim());

    return Array.from(new Set([...contextCategories, ...derivedCategories])).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [supplierCategories, suppliers]);

  const hasSupplierCategoryOptions = supplierCategoryOptions.length > 0;
  const newSupplierCategorySelectValue = hasSupplierCategoryOptions && supplierCategoryOptions.includes(newSupplier.category.trim())
    ? newSupplier.category.trim()
    : '';
  const editSupplierCategorySelectValue = hasSupplierCategoryOptions && supplierCategoryOptions.includes(editSupplier.category.trim())
    ? editSupplier.category.trim()
    : '';

  // Purchase orders now come from AppContext

  // Using categories from context now

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const normalizedSelectedCategory = selectedCategory.trim().toLowerCase();

  const filteredSuppliers = suppliers.filter(supplier => {
    const supplierName = supplier.name?.toLowerCase() ?? '';
    const supplierContact = supplier.contactPerson?.toLowerCase() ?? '';
    const matchesSearch =
      normalizedSearch.length === 0 ||
      supplierName.includes(normalizedSearch) ||
      supplierContact.includes(normalizedSearch);
    const supplierCategory = supplier.category?.trim().toLowerCase() ?? '';
    const matchesCategory =
      normalizedSelectedCategory === 'all' ||
      supplierCategory === normalizedSelectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddSupplier = () => {
    const name = newSupplier.name.trim();
    const category = newSupplier.category.trim();
    const contactPerson = newSupplier.contactPerson.trim();
    const phone = newSupplier.phone.trim();

    if (!name || !category || !contactPerson || !phone) {
      addNotification({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }
    
    const supplier = {
      id: Date.now().toString(),
      ...newSupplier,
      name,
      category,
      contactPerson,
      phone,
      email: newSupplier.email.trim(),
      address: newSupplier.address.trim(),
      gstNumber: newSupplier.gstNumber.trim(),
      rating: 0,
      status: 'active' as const,
      totalOrders: 0,
      totalAmount: 0,
      lastOrderDate: new Date().toISOString().split('T')[0]
    };
    addSupplier(supplier);
    setNewSupplier(createEmptySupplierForm());
    setIsAddDialogOpen(false);
    addNotification({
      title: 'Supplier Added',
      message: `${supplier.name} has been added successfully`,
      type: 'success'
    });
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditSupplier({
      ...createEmptyEditSupplierForm(),
      name: supplier.name ?? '',
      category: supplier.category ?? '',
      contactPerson: supplier.contactPerson ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      gstNumber: supplier.gstNumber ?? '',
      creditDays: supplier.creditDays ?? 0,
      status: supplier.status
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSupplier = () => {
    if (!editingSupplier) return;
    
    const name = editSupplier.name.trim();
    const category = editSupplier.category.trim();
    const contactPerson = editSupplier.contactPerson.trim();
    const phone = editSupplier.phone.trim();

    if (!name || !category || !contactPerson || !phone) {
      addNotification({
        title: 'Missing Information',
        message: 'Please fill in all required fields',
        type: 'error'
      });
      return;
    }
    
    updateSupplier(editingSupplier.id, {
      ...editSupplier,
      name,
      category,
      contactPerson,
      phone,
      email: editSupplier.email.trim(),
      address: editSupplier.address.trim(),
      gstNumber: editSupplier.gstNumber.trim()
    });
    setIsEditDialogOpen(false);
    setEditingSupplier(null);
    addNotification({
      title: 'Supplier Updated',
      message: `${editSupplier.name} has been updated successfully`,
      type: 'success'
    });
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (confirm(`Are you sure you want to delete ${supplier?.name}?`)) {
      deleteSupplier(supplierId);
      addNotification({
        title: 'Supplier Deleted',
        message: `${supplier?.name} has been removed`,
        type: 'success'
      });
    }
  };

  const handleAddOrderItem = () => {
    if (!currentOrderItem.itemName || currentOrderItem.quantity <= 0 || currentOrderItem.rate <= 0) {
      addNotification({
        title: 'Invalid Item',
        message: 'Please fill in all item details with valid values',
        type: 'error'
      });
      return;
    }

    const amount = currentOrderItem.quantity * currentOrderItem.rate;
    const item: PurchaseOrderItemDraft = { ...currentOrderItem, amount };
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setCurrentOrderItem(createEmptyPurchaseOrderItem());

    addNotification({
      title: 'Item Added',
      message: `${currentOrderItem.itemName} added to order`,
      type: 'success'
    });
  };

  const handleRemoveOrderItem = (index: number) => {
    const item = newOrder.items[index];
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    addNotification({
      title: 'Item Removed',
      message: `${item.itemName} removed from order`,
      type: 'info'
    });
  };

  const handleCreateOrder = () => {
    if (!newOrder.supplierId || !newOrder.expectedDate || newOrder.items.length === 0) {
      addNotification({
        title: 'Incomplete Order',
        message: 'Please select supplier, expected date, and add at least one item',
        type: 'error'
      });
      return;
    }

    const totalAmount = newOrder.items.reduce((sum, item) => sum + item.amount, 0);
    
    const order: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      supplierId: newOrder.supplierId,
      supplierName: newOrder.supplierName,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: newOrder.expectedDate,
      status: 'pending',
      items: newOrder.items,
      totalAmount,
      notes: newOrder.notes,
      deliveredDate: undefined
    };

    addPurchaseOrder(order);
    
    // Reset form
    setNewOrder(createEmptyPurchaseOrderDraft());
    
    setIsAddOrderDialogOpen(false);
    addNotification({
      title: 'Purchase Order Created',
      message: `Order ${order.id} for ${order.supplierName} created successfully`,
      type: 'success'
    });
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setNewOrder(prev => ({
        ...prev,
        supplierId,
        supplierName: supplier.name
      }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Truck className="text-primary" size={24} />
            Supplier Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage suppliers and purchase orders</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter size={18} />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {supplierCategoryOptions.length === 0 ? (
                    <SelectItem value="__no_supplier_categories" disabled>
                      No supplier categories available
                    </SelectItem>
                  ) : (
                    supplierCategoryOptions.map(name => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={18} />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Supplier</DialogTitle>
                  <DialogDescription>
                    Add a new supplier to your vendor network
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, name: event.target.value }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label id="add-supplier-category-label" htmlFor="add-supplier-category-input">Category *</Label>
                    {hasSupplierCategoryOptions && (
                      <Select
                        value={newSupplierCategorySelectValue}
                        onValueChange={(value: string) =>
                          setNewSupplier(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger aria-labelledby="add-supplier-category-label">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierCategoryOptions.map(name => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {!hasSupplierCategoryOptions && (
                      <p className="text-xs text-muted-foreground">
                        No supplier categories found. Type a new category below to get started.
                      </p>
                    )}
                    {hasSupplierCategoryOptions && (
                      <p className="text-xs text-muted-foreground">
                        Select an existing category or type a new one below.
                      </p>
                    )}
                    <Input
                      id="add-supplier-category-input"
                      value={newSupplier.category}
                      onChange={(event) =>
                        setNewSupplier(prev => ({ ...prev, category: event.target.value }))
                      }
                      placeholder={hasSupplierCategoryOptions ? 'Or type a new category' : 'Enter category name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={newSupplier.contactPerson}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, contactPerson: event.target.value }))}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, phone: event.target.value }))}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, email: event.target.value }))}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditDays">Credit Days</Label>
                    <Input
                      id="creditDays"
                      type="number"
                      value={newSupplier.creditDays}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, creditDays: Number.parseInt(event.target.value, 10) || 0 }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newSupplier.address}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, address: event.target.value }))}
                      placeholder="Enter complete address"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      value={newSupplier.gstNumber}
                      onChange={(event) => setNewSupplier(prev => ({ ...prev, gstNumber: event.target.value }))}
                      placeholder="GST Number (optional)"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSupplier}>
                    Add Supplier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{supplier.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.category}</p>
                    </div>
                    <Badge className={getStatusColor(supplier.status)} variant="secondary">
                      {supplier.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users size={16} className="text-muted-foreground" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-muted-foreground" />
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star size={16} className="text-yellow-500" />
                    <span>{supplier.rating}/5.0</span>
                    <span className="text-muted-foreground">
                      ({supplier.totalOrders} orders)
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm">
                      <div className="font-medium">₹{supplier.totalAmount.toLocaleString()}</div>
                      <div className="text-muted-foreground">Total Business</div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>Purchase Orders</h2>
            <Button onClick={() => setIsAddOrderDialogOpen(true)}>
              <Plus size={18} />
              Create Order
            </Button>
          </div>

          <div className="space-y-4">
            {purchaseOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">{order.supplierName}</p>
                    </div>
                    <Badge className={getStatusColor(order.status)} variant="secondary">
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-muted-foreground" />
                      <span>Order: {new Date(order.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-muted-foreground" />
                      <span>Expected: {new Date(order.expectedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={16} className="text-muted-foreground" />
                      <span>{order.items.length} items</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee size={16} className="text-muted-foreground" />
                      <span className="font-medium">₹{order.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Item</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Rate</th>
                          <th className="text-right p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{item.itemName}</td>
                            <td className="text-right p-2">{item.quantity} {item.unit}</td>
                            <td className="text-right p-2">₹{item.rate}</td>
                            <td className="text-right p-2 font-medium">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Suppliers</p>
                    <p className="font-semibold">{suppliers.length}</p>
                  </div>
                  <Truck className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="font-semibold">{purchaseOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}</p>
                  </div>
                  <Package className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Spend</p>
                    <p className="font-semibold">₹2,45,000</p>
                  </div>
                  <IndianRupee className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Rated</p>
                    <p className="font-semibold">4.5/5.0</p>
                  </div>
                  <Star className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>
              Update supplier information
            </DialogDescription>
          </DialogHeader>
          {editingSupplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Company Name *</Label>
                <Input
                  id="editName"
                  value={editSupplier.name}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label id="edit-supplier-category-label" htmlFor="edit-supplier-category-input">Category *</Label>
                {hasSupplierCategoryOptions && (
                  <Select
                    value={editSupplierCategorySelectValue}
                    onValueChange={(value: string) =>
                      setEditSupplier(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger aria-labelledby="edit-supplier-category-label">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierCategoryOptions.map(name => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!hasSupplierCategoryOptions && (
                  <p className="text-xs text-muted-foreground">
                    No supplier categories found. Type a new category below to get started.
                  </p>
                )}
                {hasSupplierCategoryOptions && (
                  <p className="text-xs text-muted-foreground">
                    Select an existing category or type a new one below.
                  </p>
                )}
                <Input
                  id="edit-supplier-category-input"
                  value={editSupplier.category}
                  onChange={(event) =>
                    setEditSupplier(prev => ({ ...prev, category: event.target.value }))
                  }
                  placeholder={hasSupplierCategoryOptions ? 'Or type a new category' : 'Enter category name'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContactPerson">Contact Person *</Label>
                <Input
                  id="editContactPerson"
                  value={editSupplier.contactPerson}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, contactPerson: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number *</Label>
                <Input
                  id="editPhone"
                  value={editSupplier.phone}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editSupplier.email}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCreditDays">Credit Days</Label>
                <Input
                  id="editCreditDays"
                  type="number"
                  value={editSupplier.creditDays}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, creditDays: Number.parseInt(event.target.value, 10) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editSupplier.status} onValueChange={(value: 'active' | 'inactive') => setEditSupplier(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGstNumber">GST Number</Label>
                <Input
                  id="editGstNumber"
                  value={editSupplier.gstNumber}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, gstNumber: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="editAddress">Address</Label>
                <Textarea
                  id="editAddress"
                  value={editSupplier.address}
                  onChange={(event) => setEditSupplier(prev => ({ ...prev, address: event.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier}>
              Update Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Purchase Order Dialog */}
      <Dialog open={isAddOrderDialogOpen} onOpenChange={setIsAddOrderDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order for supplier
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderSupplier">Supplier *</Label>
                <Select 
                  value={newOrder.supplierId} 
                  onValueChange={handleSupplierSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.status === 'active').map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orderExpectedDate">Expected Delivery Date *</Label>
                <Input
                  id="orderExpectedDate"
                  type="date"
                  value={newOrder.expectedDate}
                  onChange={(event) => setNewOrder(prev => ({ ...prev, expectedDate: event.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="orderNotes">Notes</Label>
                <Textarea
                  id="orderNotes"
                  value={newOrder.notes}
                  onChange={(event) => setNewOrder(prev => ({ ...prev, notes: event.target.value }))}
                  placeholder="Add any special instructions..."
                  rows={2}
                />
              </div>
            </div>

            {/* Add Items Section */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <h3 className="font-medium">Add Items</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={currentOrderItem.itemName}
                    onChange={(event) => setCurrentOrderItem(prev => ({ ...prev, itemName: event.target.value }))}
                    placeholder="e.g., Tomatoes"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemQuantity">Quantity</Label>
                  <Input
                    id="itemQuantity"
                    type="number"
                    value={currentOrderItem.quantity || ''}
                    onChange={(event) => setCurrentOrderItem(prev => ({ ...prev, quantity: Number.parseFloat(event.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemUnit">Unit</Label>
                  <Select 
                    value={currentOrderItem.unit} 
                    onValueChange={(value: string) => setCurrentOrderItem(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kg</SelectItem>
                      <SelectItem value="gm">Grams</SelectItem>
                      <SelectItem value="ltr">Liters</SelectItem>
                      <SelectItem value="ml">ML</SelectItem>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="packet">Packet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemRate">Rate (₹)</Label>
                  <Input
                    id="itemRate"
                    type="number"
                    value={currentOrderItem.rate || ''}
                    onChange={(event) => setCurrentOrderItem(prev => ({ ...prev, rate: Number.parseFloat(event.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium">
                    ₹{(currentOrderItem.quantity * currentOrderItem.rate).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleAddOrderItem} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Item to Order
              </Button>
            </div>

            {/* Items List */}
            {newOrder.items.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Item</th>
                      <th className="text-right p-3">Quantity</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-right p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newOrder.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.itemName}</td>
                        <td className="text-right p-3">{item.quantity} {item.unit}</td>
                        <td className="text-right p-3">₹{item.rate}</td>
                        <td className="text-right p-3 font-medium">₹{item.amount.toFixed(2)}</td>
                        <td className="text-right p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOrderItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50">
                      <td colSpan={3} className="p-3 font-medium text-right">Total Amount:</td>
                      <td className="p-3 font-bold text-right text-lg">
                        ₹{newOrder.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddOrderDialogOpen(false);
                  setNewOrder(createEmptyPurchaseOrderDraft());
                  setCurrentOrderItem(createEmptyPurchaseOrderItem());
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateOrder}
                disabled={newOrder.items.length === 0}
              >
                Create Purchase Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}