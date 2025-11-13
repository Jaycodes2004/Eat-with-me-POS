import { useState } from 'react';
import { useAppContext, InventoryItem, InventoryWastageReason } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { AIService } from '../utils/aiService';
import { RecipeManagement } from './RecipeManagement';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  TrendingDown,
  Calendar,
  Scale,
  Receipt,
  ChefHat,
  Bot,
  Clock,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';

// Recipe interface is now imported from AppContext

type WastageFormState = {
  inventoryItemId: string;
  quantity: string;
  reason: InventoryWastageReason | '';
  notes: string;
};

type WastageFormErrors = Partial<Record<'inventoryItemId' | 'quantity' | 'reason', string>>;

const initialWastageForm: WastageFormState = {
  inventoryItemId: '',
  quantity: '',
  reason: '',
  notes: ''
};

const wastageReasonLabels: Record<InventoryWastageReason, string> = {
  expired: 'Expired',
  damaged: 'Damaged',
  overcooked: 'Overcooked',
  'customer-return': 'Customer Return',
  other: 'Other'
};

const wastageReasonBadges: Record<InventoryWastageReason, string> = {
  expired: 'bg-red-100 text-red-700',
  damaged: 'bg-orange-100 text-orange-700',
  overcooked: 'bg-yellow-100 text-yellow-700',
  'customer-return': 'bg-purple-100 text-purple-700',
  other: 'bg-slate-200 text-slate-700'
};

export function InventoryManagement() {
  const { 
    suppliers, 
    inventoryItems, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    getCategoriesByType,
    inventoryWastageRecords,
    recordInventoryWastage,
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    calculateRecipeCost
  } = useAppContext();
  // Using inventory items from context instead of local state
  const inventory = inventoryItems;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    costPerUnit: '',
    supplierId: '',
    expiryDate: ''
  });

  const [wastageForm, setWastageForm] = useState<WastageFormState>(initialWastageForm);
  const [wastageFormErrors, setWastageFormErrors] = useState<WastageFormErrors>({});

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    if (item.currentStock <= item.minStock) return { status: 'critical', color: 'bg-red-500', text: 'Critical' };
    if (percentage < 30) return { status: 'low', color: 'bg-yellow-500', text: 'Low' };
    if (percentage < 70) return { status: 'medium', color: 'bg-blue-500', text: 'Medium' };
    return { status: 'good', color: 'bg-green-500', text: 'Good' };
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(inventory.map(item => item.category))];

  const validateInventoryItem = (item: any): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};
    
    if (!item.name.trim()) {
      errors.name = 'Item name is required';
    }
    
    if (!item.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (!item.unit.trim()) {
      errors.unit = 'Unit is required';
    }
    
    if (!item.currentStock) {
      errors.currentStock = 'Current stock is required';
    } else if (parseFloat(item.currentStock) < 0) {
      errors.currentStock = 'Current stock cannot be negative';
    }
    
    if (!item.minStock) {
      errors.minStock = 'Minimum stock is required';
    } else if (parseFloat(item.minStock) < 0) {
      errors.minStock = 'Minimum stock cannot be negative';
    }
    
    if (!item.maxStock) {
      errors.maxStock = 'Maximum stock is required';
    } else if (parseFloat(item.maxStock) <= parseFloat(item.minStock)) {
      errors.maxStock = 'Maximum stock must be greater than minimum stock';
    }
    
    if (!item.costPerUnit) {
      errors.costPerUnit = 'Cost per unit is required';
    } else if (parseFloat(item.costPerUnit) <= 0) {
      errors.costPerUnit = 'Cost per unit must be greater than 0';
    }
    
    return errors;
  };

  const addNewInventoryItem = () => {
    const validationErrors = validateInventoryItem(newItem);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors before saving');
      return;
    }
    
    try {
      const item = {
        id: Date.now().toString(),
        name: newItem.name.trim(),
        category: newItem.category.trim(),
        unit: newItem.unit.trim(),
        currentStock: parseFloat(newItem.currentStock),
        minStock: parseFloat(newItem.minStock),
        maxStock: parseFloat(newItem.maxStock),
        costPerUnit: parseFloat(newItem.costPerUnit),
        supplierId: newItem.supplierId,
        expiryDate: newItem.expiryDate || undefined,
        lastPurchase: new Date().toISOString().split('T')[0],
        usedThisMonth: 0
      };
      
      addInventoryItem(item);
      
      toast.success('Inventory item added successfully');
      
      setNewItem({
        name: '',
        category: '',
        unit: '',
        currentStock: '',
        minStock: '',
        maxStock: '',
        costPerUnit: '',
        supplierId: '',
        expiryDate: ''
      });
      setErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add inventory item');
      console.error('Add inventory item error:', error);
    }
  };

  const resetWastageForm = () => {
    setWastageForm(initialWastageForm);
    setWastageFormErrors({});
  };

  const handleRecordWastage = () => {
    const validationErrors: WastageFormErrors = {};
    const selectedItem = inventory.find(item => item.id === wastageForm.inventoryItemId);

    if (!selectedItem) {
      validationErrors.inventoryItemId = 'Select an inventory item';
    }

    const quantityNumber = Number.parseFloat(wastageForm.quantity);
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      validationErrors.quantity = 'Enter a valid quantity greater than zero';
    } else if (selectedItem && quantityNumber > selectedItem.currentStock) {
      validationErrors.quantity = 'Quantity cannot exceed current stock';
    }

    if (!wastageForm.reason) {
      validationErrors.reason = 'Select a reason for wastage';
    }

    if (Object.keys(validationErrors).length > 0) {
      setWastageFormErrors(validationErrors);
      toast.error('Please fix the highlighted fields before recording wastage');
      return;
    }

    try {
      recordInventoryWastage({
        inventoryItemId: wastageForm.inventoryItemId,
        quantity: quantityNumber,
        reason: wastageForm.reason as InventoryWastageReason,
        notes: wastageForm.notes.trim() ? wastageForm.notes.trim() : undefined
      });

      toast.success('Wastage recorded successfully');
      resetWastageForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record wastage';
      toast.error(message);
      console.error('Record wastage error:', error);
    }
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }
    
    try {
      deleteInventoryItem(id);
      toast.success('Inventory item deleted successfully');
    } catch (error) {
      toast.error('Failed to delete inventory item');
      console.error('Delete inventory item error:', error);
    }
  };

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(item => item.currentStock <= item.minStock).length,
    expiringSoon: inventory.filter(item => item.expiryDate && isExpiringSoon(item.expiryDate)).length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0)
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
          <p className="text-muted-foreground">Track raw materials and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Receipt className="w-4 h-4 mr-2" />
                Purchase Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Purchase Entry</DialogTitle>
                <DialogDescription>
                  Record a new purchase or stock delivery from your suppliers.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" placeholder="Enter supplier name" />
                </div>
                <div>
                  <Label htmlFor="invoice">Invoice Number</Label>
                  <Input id="invoice" placeholder="Enter invoice number" />
                </div>
                <div>
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input id="date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Items</Label>
                  <div className="grid grid-cols-4 gap-2 text-sm font-medium">
                    <div>Item</div>
                    <div>Quantity</div>
                    <div>Unit Price</div>
                    <div>Total</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Qty" />
                    <Input placeholder="Price" />
                    <Input placeholder="Total" readOnly />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">Save Purchase</Button>
                  <Button variant="outline" className="flex-1">Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory with stock levels and supplier information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter item name"
                      value={newItem.name}
                      onChange={(e) => {
                        setNewItem({...newItem, name: e.target.value});
                        if (errors.name) setErrors(prev => ({...prev, name: ''}));
                      }}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                      value={newItem.category} 
                      onValueChange={(value: string) => {
                        setNewItem({...newItem, category: value});
                        if (errors.category) setErrors(prev => ({...prev, category: ''}));
                      }}
                    >
                      <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="spices">Spices</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="oil">Oil & Fats</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-sm text-destructive">{errors.category}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit *</Label>
                    <Input 
                      id="unit" 
                      placeholder="kg, liter, pieces"
                      value={newItem.unit}
                      onChange={(e) => {
                        setNewItem({...newItem, unit: e.target.value});
                        if (errors.unit) setErrors(prev => ({...prev, unit: ''}));
                      }}
                      className={errors.unit ? 'border-destructive' : ''}
                    />
                    {errors.unit && (
                      <p className="text-sm text-destructive">{errors.unit}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentStock">Current Stock *</Label>
                    <Input 
                      id="currentStock" 
                      type="number" 
                      placeholder="0"
                      value={newItem.currentStock}
                      onChange={(e) => {
                        setNewItem({...newItem, currentStock: e.target.value});
                        if (errors.currentStock) setErrors(prev => ({...prev, currentStock: ''}));
                      }}
                      className={errors.currentStock ? 'border-destructive' : ''}
                    />
                    {errors.currentStock && (
                      <p className="text-sm text-destructive">{errors.currentStock}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Min Stock *</Label>
                    <Input 
                      id="minStock" 
                      type="number" 
                      placeholder="0"
                      value={newItem.minStock}
                      onChange={(e) => {
                        setNewItem({...newItem, minStock: e.target.value});
                        if (errors.minStock) setErrors(prev => ({...prev, minStock: ''}));
                      }}
                      className={errors.minStock ? 'border-destructive' : ''}
                    />
                    {errors.minStock && (
                      <p className="text-sm text-destructive">{errors.minStock}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Max Stock *</Label>
                    <Input 
                      id="maxStock" 
                      type="number" 
                      placeholder="0"
                      value={newItem.maxStock}
                      onChange={(e) => {
                        setNewItem({...newItem, maxStock: e.target.value});
                        if (errors.maxStock) setErrors(prev => ({...prev, maxStock: ''}));
                      }}
                      className={errors.maxStock ? 'border-destructive' : ''}
                    />
                    {errors.maxStock && (
                      <p className="text-sm text-destructive">{errors.maxStock}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost per Unit *</Label>
                    <Input 
                      id="cost" 
                      type="number" 
                      placeholder="₹0"
                      value={newItem.costPerUnit}
                      onChange={(e) => {
                        setNewItem({...newItem, costPerUnit: e.target.value});
                        if (errors.costPerUnit) setErrors(prev => ({...prev, costPerUnit: ''}));
                      }}
                      className={errors.costPerUnit ? 'border-destructive' : ''}
                    />
                    {errors.costPerUnit && (
                      <p className="text-sm text-destructive">{errors.costPerUnit}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input 
                      id="expiryDate" 
                      type="date"
                      value={newItem.expiryDate}
                      onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={addNewInventoryItem}
                    disabled={Object.keys(errors).length > 0}
                  >
                    Add Item
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setErrors({});
                      setNewItem({
                        name: '',
                        category: '',
                        unit: '',
                        currentStock: '',
                        minStock: '',
                        maxStock: '',
                        costPerUnit: '',
                        supplierId: '',
                        expiryDate: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.lowStock}</div>
          <div className="text-sm text-muted-foreground">Low Stock</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
          <div className="text-sm text-muted-foreground">Expiring Soon</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">₹{stats.totalValue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Value</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="wastage">Wastage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="space-y-4">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item);
              const stockPercentage = (item.currentStock / item.maxStock) * 100;
              const supplierRecord = suppliers.find(supplier => supplier.id === item.supplierId);
              const supplierName = supplierRecord ? supplierRecord.name : 'Unassigned';
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{item.category}</span>
                          <span>{supplierName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold">{item.currentStock}</div>
                        <div className="text-xs text-muted-foreground">{item.unit}</div>
                      </div>
                      
                      <div className="w-24">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${stockStatus.color} text-white`}>
                            {stockStatus.text}
                          </Badge>
                          {item.expiryDate && isExpiringSoon(item.expiryDate) && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <Progress value={stockPercentage} className="h-2" />
                      </div>
                      
                      <div className="text-right">
                        <div className="font-medium">₹{item.costPerUnit}</div>
                        <div className="text-sm text-muted-foreground">per {item.unit}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit {item.name}</DialogTitle>
                              <DialogDescription>
                                Update item details, stock levels, and pricing information.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="currentStock">Current Stock</Label>
                                  <Input id="currentStock" type="number" defaultValue={item.currentStock} />
                                </div>
                                <div>
                                  <Label htmlFor="minStock">Min Stock</Label>
                                  <Input id="minStock" type="number" defaultValue={item.minStock} />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="costPerUnit">Cost per Unit</Label>
                                  <Input id="costPerUnit" type="number" defaultValue={item.costPerUnit} />
                                </div>
                                <div>
                                  <Label htmlFor="expiryDate">Expiry Date</Label>
                                  <Input id="expiryDate" type="date" defaultValue={item.expiryDate} />
                                </div>
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button className="flex-1">Update</Button>
                                <Button variant="outline" className="flex-1">Cancel</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="recipes" className="space-y-4">
          <RecipeManagement />
        </TabsContent>
        
        <TabsContent value="wastage" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>Wastage Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wasteItem">Item *</Label>
                    <Select
                      value={wastageForm.inventoryItemId}
                      onValueChange={(value: string) => {
                        setWastageForm(prev => ({ ...prev, inventoryItemId: value }));
                        if (wastageFormErrors.inventoryItemId) {
                          setWastageFormErrors(prev => ({ ...prev, inventoryItemId: undefined }));
                        }
                      }}
                      disabled={inventory.length === 0}
                    >
                      <SelectTrigger className={wastageFormErrors.inventoryItemId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={inventory.length === 0 ? 'No items available' : 'Select item'} />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map(item => (
                          <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {wastageFormErrors.inventoryItemId && (
                      <p className="text-sm text-destructive">{wastageFormErrors.inventoryItemId}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wasteQuantity">Quantity *</Label>
                    <Input
                      id="wasteQuantity"
                      type="number"
                      placeholder="0"
                      value={wastageForm.quantity}
                      onChange={(event) => {
                        setWastageForm(prev => ({ ...prev, quantity: event.target.value }));
                        if (wastageFormErrors.quantity) {
                          setWastageFormErrors(prev => ({ ...prev, quantity: undefined }));
                        }
                      }}
                      className={wastageFormErrors.quantity ? 'border-destructive' : ''}
                      min="0"
                      step="0.01"
                    />
                    {wastageFormErrors.quantity && (
                      <p className="text-sm text-destructive">{wastageFormErrors.quantity}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wasteReason">Reason *</Label>
                    <Select
                      value={wastageForm.reason || undefined}
                      onValueChange={(value: string) => {
                        setWastageForm(prev => ({ ...prev, reason: value as InventoryWastageReason }));
                        if (wastageFormErrors.reason) {
                          setWastageFormErrors(prev => ({ ...prev, reason: undefined }));
                        }
                      }}
                    >
                      <SelectTrigger className={wastageFormErrors.reason ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(wastageReasonLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {wastageFormErrors.reason && (
                      <p className="text-sm text-destructive">{wastageFormErrors.reason}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wasteNotes">Notes</Label>
                    <Input
                      id="wasteNotes"
                      placeholder="Optional notes"
                      value={wastageForm.notes}
                      onChange={(event) => setWastageForm(prev => ({ ...prev, notes: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 justify-between">
                  <div className="text-sm text-muted-foreground">
                    Track wastage to keep an eye on cost leaks and stock issues.
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={resetWastageForm}
                      disabled={
                        !wastageForm.inventoryItemId &&
                        !wastageForm.quantity &&
                        !wastageForm.reason &&
                        !wastageForm.notes
                      }
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={handleRecordWastage}
                      className="w-full sm:w-auto"
                      disabled={inventory.length === 0}
                    >
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Record Wastage
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {inventoryWastageRecords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No wastage recorded yet. Start logging to identify trends.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {inventoryWastageRecords.slice().reverse().map(record => (
                        <Card key={record.id} className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{record.itemName}</h4>
                                <Badge className={wastageReasonBadges[record.reason]}>
                                  {wastageReasonLabels[record.reason]}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                                <span>
                                  {record.quantity} {record.unit}
                                </span>
                                <span>₹{record.valueLost.toFixed(2)} loss</span>
                                <span>{new Date(record.recordedAt).toLocaleString()}</span>
                              </div>
                              {record.notes && (
                                <p className="mt-1 text-sm text-muted-foreground">{record.notes}</p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}