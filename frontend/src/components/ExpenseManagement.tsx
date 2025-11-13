import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
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
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  FileText,
  Zap,
  Truck,
  Utensils,
  Users,
  Building,
  Upload,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function ExpenseManagement() {
  const { 
    suppliers, 
    getCategoriesByType, 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    getExpensesByCategory,
    getExpensesByDateRange,
    getTotalExpenses,
    getExpensesBySupplier,
    budgetCategories,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    getBudgetCategorySpent,
    updateBudgetCategorySpent,
    addCategory,
    addNotification
  } = useAppContext();
  
  const expenseCategories = getCategoriesByType('expense');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('this_month');
  const [activeTab, setActiveTab] = useState('expenses');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false);
  const [isViewExpenseDialogOpen, setIsViewExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: '',
    amount: 0,
    supplierId: '',
    description: '',
    paymentMethod: 'cash',
    recurring: false
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'cheque', label: 'Cheque' }
  ];

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || expense.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddExpense = () => {
    const selectedSupplier = suppliers.find(s => s.id === newExpense.supplierId);
    const expense = {
      id: Date.now().toString(),
      title: newExpense.title,
      category: newExpense.category,
      amount: newExpense.amount,
      vendor: selectedSupplier?.name || 'Unknown Supplier',
      description: newExpense.description,
      paymentMethod: newExpense.paymentMethod,
      recurring: newExpense.recurring,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      approvalRequired: false,
      supplierId: newExpense.supplierId
    };
    addExpense(expense);
    setNewExpense({
      title: '',
      category: '',
      amount: 0,
      supplierId: '',
      description: '',
      paymentMethod: 'cash',
      recurring: false
    });
    setIsAddDialogOpen(false);
    addNotification({
      title: 'Expense Added',
      message: `Expense "${newExpense.title}" added successfully`,
      type: 'success'
    });
  };

  const handleAddCategory = async () => {
    const trimmedName = newCategory.name.trim();
    const trimmedDescription = newCategory.description.trim();

    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }

    try {
      setIsSavingCategory(true);
      const created = await addCategory({
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        type: 'expense',
        isActive: true,
      });

      toast.success(`Category "${created.name}" added successfully`);
      addNotification({
        title: 'Category Added',
        message: `Category "${created.name}" added successfully`,
        type: 'success'
      });

      setNewCategory({ name: '', description: '' });
      setIsAddCategoryDialogOpen(false);
    } catch (error) {
      console.error('Add expense category error:', error);
      toast.error('Failed to add category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleViewExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsViewExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: any) => {
    setSelectedExpense(expense);
    setIsEditExpenseDialogOpen(true);
  };

  const handleUpdateExpense = () => {
    if (!selectedExpense) return;
    
    updateExpense(selectedExpense.id, selectedExpense);
    setIsEditExpenseDialogOpen(false);
    setSelectedExpense(null);
    addNotification({
      title: 'Expense Updated',
      message: 'Expense updated successfully',
      type: 'success'
    });
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
      addNotification({
        title: 'Expense Deleted',
        message: 'Expense deleted successfully',
        type: 'success'
      });
    }
  };

  const handleUpdateExpenseStatus = (id: string, status: 'paid' | 'pending' | 'overdue') => {
    updateExpense(id, { status });
    addNotification({
      title: 'Status Updated',
      message: `Expense marked as ${status}`,
      type: 'success'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Map icon string to actual icon component
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Utensils': return Utensils;
      case 'Zap': return Zap;
      case 'Users': return Users;
      case 'Building': return Building;
      case 'Truck': return Truck;
      default: return Receipt;
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + expense.amount, 0);
  const overdueExpenses = expenses.filter(e => e.status === 'overdue').reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Receipt className="text-primary" size={24} />
            Expense Management
          </h1>
          <p className="text-muted-foreground mt-1">Track and manage all business expenses</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Expense
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="font-semibold">₹{totalExpenses.toLocaleString()}</p>
                  </div>
                  <Receipt className="text-primary" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                    <p className="font-semibold text-green-600">₹{paidExpenses.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="text-green-500" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="font-semibold text-yellow-600">₹{pendingExpenses.toLocaleString()}</p>
                  </div>
                  <Calendar className="text-yellow-500" size={24} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                    <p className="font-semibold text-red-600">₹{overdueExpenses.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="text-red-500" size={24} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter size={18} />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {expenseCategories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <Download size={18} />
                Export
              </Button>
            </div>
          </div>

          {/* Expenses List */}
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{expense.title}</h3>
                        <Badge className={getStatusColor(expense.status)} variant="secondary">
                          {expense.status}
                        </Badge>
                        {expense.recurring && (
                          <Badge variant="outline" className="text-xs">
                            Recurring
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Utensils size={16} />
                          <span>{expense.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building size={16} />
                          <span>{expense.vendor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee size={16} />
                          <span>{expense.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                        </div>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-muted-foreground mt-2">{expense.description}</p>
                      )}
                      {expense.approvedBy && (
                        <p className="text-xs text-muted-foreground mt-1">Approved by: {expense.approvedBy}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">₹{expense.amount.toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewExpense(expense)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditExpense(expense)}>
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2>Expense Categories</h2>
            <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
              <Plus size={18} />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetCategories.map((category) => {
              const IconComponent = getIconComponent(category.icon);
              const spentPercentage = (category.spent / category.budget) * 100;
              
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {spentPercentage.toFixed(1)}% of budget used
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Spent: ₹{category.spent.toLocaleString()}</span>
                        <span>Budget: ₹{category.budget.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${spentPercentage > 90 ? 'bg-red-500' : spentPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Remaining: ₹{(category.budget - category.spent).toLocaleString()}</span>
                        <span>{(100 - spentPercentage).toFixed(1)}% left</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Expense trend chart would go here</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Category breakdown chart would go here</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new business expense
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Expense Title *</Label>
              <Input
                id="title"
                value={newExpense.title}
                onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                placeholder="Enter expense title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={newExpense.category} onValueChange={(value) => setNewExpense({...newExpense, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={newExpense.supplierId} onValueChange={(value) => setNewExpense({...newExpense, supplierId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.status === 'active').map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <span>{supplier.name}</span>
                        <span className="text-xs text-muted-foreground">({supplier.category})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={newExpense.paymentMethod} onValueChange={(value) => setNewExpense({...newExpense, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt</Label>
              <Button variant="outline" className="w-full justify-start">
                <Upload size={16} />
                Upload Receipt
              </Button>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                placeholder="Enter expense description (optional)"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense}>
              Add Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense Category</DialogTitle>
            <DialogDescription>
              Create a new category for expense tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                placeholder="Enter category description (optional)"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim() || isSavingCategory}
            >
              {isSavingCategory ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Add Category'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseDialogOpen} onOpenChange={setIsViewExpenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Title</Label>
                  <p className="font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="font-semibold text-lg">₹{selectedExpense.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedExpense.status)} variant="secondary">
                    {selectedExpense.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vendor</Label>
                  <p className="font-medium">{selectedExpense.vendor}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedExpense.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedExpense.recurring ? 'Recurring' : 'One-time'}</p>
                </div>
              </div>
              {selectedExpense.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{selectedExpense.description}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button 
                  variant={selectedExpense.status === 'paid' ? 'outline' : 'default'}
                  onClick={() => {
                    handleUpdateExpenseStatus(selectedExpense.id, 'paid');
                    setIsViewExpenseDialogOpen(false);
                  }}
                  disabled={selectedExpense.status === 'paid'}
                >
                  Mark as Paid
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    handleUpdateExpenseStatus(selectedExpense.id, 'pending');
                    setIsViewExpenseDialogOpen(false);
                  }}
                  disabled={selectedExpense.status === 'pending'}
                >
                  Mark as Pending
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewExpenseDialogOpen(false);
                    handleEditExpense(selectedExpense);
                  }}
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update expense details
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editTitle">Expense Title *</Label>
                  <Input
                    id="editTitle"
                    value={selectedExpense.title}
                    onChange={(e) => setSelectedExpense({...selectedExpense, title: e.target.value})}
                    placeholder="Enter expense title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Category *</Label>
                  <Select 
                    value={selectedExpense.category} 
                    onValueChange={(value) => setSelectedExpense({...selectedExpense, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAmount">Amount *</Label>
                  <Input
                    id="editAmount"
                    type="number"
                    value={selectedExpense.amount}
                    onChange={(e) => setSelectedExpense({...selectedExpense, amount: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select 
                    value={selectedExpense.status} 
                    onValueChange={(value) => setSelectedExpense({...selectedExpense, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPaymentMethod">Payment Method</Label>
                  <Select 
                    value={selectedExpense.paymentMethod} 
                    onValueChange={(value) => setSelectedExpense({...selectedExpense, paymentMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDate">Date</Label>
                  <Input
                    id="editDate"
                    type="date"
                    value={selectedExpense.date}
                    onChange={(e) => setSelectedExpense({...selectedExpense, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={selectedExpense.description || ''}
                    onChange={(e) => setSelectedExpense({...selectedExpense, description: e.target.value})}
                    placeholder="Enter expense description (optional)"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateExpense}>
                  Update Expense
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}