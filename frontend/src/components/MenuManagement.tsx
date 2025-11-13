import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { AIService } from '../utils/aiService';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  IndianRupee,
  Save,
  X,
  Bot,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Star,
  Clock,
  Flame,
  Heart,
  AlertTriangle,
  Leaf,
  Utensils,
  Loader2
} from 'lucide-react';

import { useAppContext, type MenuItem, type CreateMenuItemPayload, type UpdateMenuItemPayload } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';

import { MenuAI } from './MenuAI';

export function MenuManagement() {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, addNotification, getCategoriesByType } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [availabilityUpdating, setAvailabilityUpdating] = useState<string | null>(null);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);





  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    available: true,
    isVeg: true,
    spiceLevel: 'mild' as 'mild' | 'medium' | 'hot',
    cookingTime: '15',
    isPopular: false,
    allergens: [] as string[],
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const categories = ['all', ...getCategoriesByType('menu').map(category => category.name)];

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const validateMenuItem = (item: any): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};
    
    if (!item.name.trim()) {
      errors.name = 'Item name is required';
    } else if (item.name.length < 2) {
      errors.name = 'Item name must be at least 2 characters';
    }
    
    if (!item.price) {
      errors.price = 'Price is required';
    } else if (parseFloat(item.price) <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    if (!item.category) {
      errors.category = 'Category is required';
    }
    
    if (!item.cookingTime) {
      errors.cookingTime = 'Cooking time is required';
    } else if (parseInt(item.cookingTime) <= 0 || parseInt(item.cookingTime) > 180) {
      errors.cookingTime = 'Cooking time must be between 1-180 minutes';
    }
    
    return errors;
  };

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(menuItem => menuItem.id === id);
    if (!item) {
      return;
    }

    const updatedAvailability = !item.available;
    setAvailabilityUpdating(id);

    try {
      await updateMenuItem(id, { available: updatedAvailability });

      toast.success(`${item.name} is now ${updatedAvailability ? 'available' : 'unavailable'}`);

      addNotification({
        type: 'info',
        title: 'Menu Item Updated',
        message: `${item.name} availability changed`,
        moduleId: 'menu'
      });
    } catch (error) {
      toast.error('Failed to update item availability');
      console.error('Toggle availability error:', error);
    } finally {
      setAvailabilityUpdating(null);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      const item = menuItems.find(item => item.id === id);
      await deleteMenuItem(id);
      
      toast.success('Menu item deleted successfully');
      addNotification({
        type: 'success',
        title: 'Menu Item Deleted',
        message: `${item?.name} has been removed from the menu`,
        moduleId: 'menu'
      });
    } catch (error) {
      toast.error('Failed to delete menu item');
      console.error('Delete item error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const addNewItem = async () => {
    const validationErrors = validateMenuItem(newItem);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors before saving');
      return;
    }
    
    // Check for duplicate names
    const existingItem = menuItems.find(item => 
      item.name.toLowerCase() === newItem.name.toLowerCase()
    );
    
    if (existingItem) {
      setErrors({ name: 'A menu item with this name already exists' });
      toast.error('Menu item name already exists');
      return;
    }

    try {
      setIsSavingNew(true);

      const payload: CreateMenuItemPayload = {
        name: newItem.name.trim(),
        price: parseFloat(newItem.price),
        category: newItem.category,
        description: newItem.description.trim() || undefined,
        available: newItem.available,
        isVeg: newItem.isVeg,
        spiceLevel: newItem.spiceLevel,
        cookingTime: parseInt(newItem.cookingTime, 10),
        isPopular: newItem.isPopular,
        allergens: newItem.allergens,
        calories: newItem.calories ? parseInt(newItem.calories, 10) : undefined,
        protein: newItem.protein ? parseInt(newItem.protein, 10) : undefined,
        carbs: newItem.carbs ? parseInt(newItem.carbs, 10) : undefined,
        fat: newItem.fat ? parseInt(newItem.fat, 10) : undefined,
      };

      const created = await addMenuItem(payload);
      
      toast.success('Menu item added successfully');
      addNotification({
        type: 'success',
        title: 'New Menu Item Added',
        message: `${created.name} has been added to the menu`,
        moduleId: 'menu'
      });
      
      setNewItem({ 
        name: '', 
        price: '', 
        category: '', 
        description: '', 
        available: true,
        isVeg: true,
        spiceLevel: 'mild',
        cookingTime: '15',
        isPopular: false,
        allergens: [],
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      });
      setErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add menu item');
      console.error('Add item error:', error);
    } finally {
      setIsSavingNew(false);
    }
  };

  const saveEditedItem = async () => {
    if (!editingItem) return;
    
    const validationErrors = validateMenuItem({
      name: editingItem.name,
      price: editingItem.price.toString(),
      category: editingItem.category,
      cookingTime: editingItem.cookingTime.toString()
    });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors before saving');
      return;
    }
    
    // Check for duplicate names (excluding current item)
    const existingItem = menuItems.find(item => 
      item.id !== editingItem.id && 
      item.name.toLowerCase() === editingItem.name.toLowerCase()
    );
    
    if (existingItem) {
      setErrors({ name: 'A menu item with this name already exists' });
      toast.error('Menu item name already exists');
      return;
    }

    try {
      setIsUpdatingItem(true);

      const payload: UpdateMenuItemPayload = {
        name: editingItem.name.trim(),
        price: editingItem.price,
        category: editingItem.category,
        description: editingItem.description?.trim() || undefined,
        available: editingItem.available,
        isVeg: editingItem.isVeg,
        spiceLevel: editingItem.spiceLevel,
        cookingTime: editingItem.cookingTime,
        isPopular: editingItem.isPopular,
        allergens: editingItem.allergens,
        calories: editingItem.nutritionalInfo?.calories,
        protein: editingItem.nutritionalInfo?.protein,
        carbs: editingItem.nutritionalInfo?.carbs,
        fat: editingItem.nutritionalInfo?.fat,
      };

      const updated = await updateMenuItem(editingItem.id, payload);
      
      toast.success('Menu item updated successfully');
      addNotification({
        type: 'success',
        title: 'Menu Item Updated',
        message: `${updated.name} has been updated`,
        moduleId: 'menu'
      });
      
      setEditingItem(null);
      setErrors({});
    } catch (error) {
      toast.error('Failed to update menu item');
      console.error('Update item error:', error);
    } finally {
      setIsUpdatingItem(false);
    }
  };

  return (
    <div className="flex-1 bg-background p-4 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-primary">Menu Management</h1>
          <p className="text-muted-foreground">Manage your restaurant menu items</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2" size={18} />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Fill in the details for the new menu item including dietary information
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Utensils size={16} />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        placeholder="Enter item name"
                        value={newItem.name}
                        onChange={(e) => {
                          setNewItem({...newItem, name: e.target.value});
                          if (errors.name) {
                            setErrors(prev => ({ ...prev, name: '' }));
                          }
                        }}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Price *</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          type="number"
                          placeholder="0.00"
                          className={`pl-10 ${errors.price ? 'border-destructive' : ''}`}
                          value={newItem.price}
                          onChange={(e) => {
                            setNewItem({...newItem, price: e.target.value});
                            if (errors.price) {
                              setErrors(prev => ({ ...prev, price: '' }));
                            }
                          }}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {errors.price}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select 
                        value={newItem.category} 
                        onValueChange={(value: string) => {
                          setNewItem({...newItem, category: value});
                          if (errors.category) {
                            setErrors(prev => ({ ...prev, category: '' }));
                          }
                        }}
                      >
                        <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat !== 'all').map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {errors.category}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Cooking Time * (minutes)</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          type="number"
                          placeholder="15"
                          className={`pl-10 ${errors.cookingTime ? 'border-destructive' : ''}`}
                          value={newItem.cookingTime}
                          onChange={(e) => {
                            setNewItem({...newItem, cookingTime: e.target.value});
                            if (errors.cookingTime) {
                              setErrors(prev => ({ ...prev, cookingTime: '' }));
                            }
                          }}
                        />
                      </div>
                      {errors.cookingTime && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertTriangle size={14} />
                          {errors.cookingTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Enter item description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    />
                  </div>
                </div>

                {/* Dietary Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Leaf size={16} />
                    Dietary Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Food Type</Label>
                      <Select value={newItem.isVeg ? 'veg' : 'non-veg'} onValueChange={(value: 'veg' | 'non-veg') => setNewItem({...newItem, isVeg: value === 'veg'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veg">🟢 Vegetarian</SelectItem>
                          <SelectItem value="non-veg">🔴 Non-Vegetarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Spice Level</Label>
                      <Select value={newItem.spiceLevel} onValueChange={(value: 'mild' | 'medium' | 'hot') => setNewItem({...newItem, spiceLevel: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">🌶️ Mild</SelectItem>
                          <SelectItem value="medium">🌶️🌶️ Medium</SelectItem>
                          <SelectItem value="hot">🌶️🌶️🌶️ Hot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Nutritional Information */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Star size={16} />
                    Nutritional Information (Optional)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Calories</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItem.calories}
                        onChange={(e) => setNewItem({...newItem, calories: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Protein (g)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItem.protein}
                        onChange={(e) => setNewItem({...newItem, protein: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Carbs (g)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItem.carbs}
                        onChange={(e) => setNewItem({...newItem, carbs: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fat (g)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newItem.fat}
                        onChange={(e) => setNewItem({...newItem, fat: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h4 className="font-medium">Additional Options</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newItem.available}
                        onCheckedChange={(checked: boolean) => setNewItem({...newItem, available: checked})}
                      />
                      <Label>Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newItem.isPopular}
                        onCheckedChange={(checked: boolean) => setNewItem({...newItem, isPopular: checked})}
                      />
                      <Label>Mark as Popular</Label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={addNewItem}
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isSavingNew}
              >
                {isSavingNew ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={16} />
                    Add Item
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search menu items..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items List */}
      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-4">
              {editingItem?.id === item.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          type="number"
                          className="pl-10"
                          value={editingItem.price}
                          onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={saveEditedItem} className="bg-primary hover:bg-primary/90">
                      <Save className="mr-2" size={16} />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                      <X className="mr-2" size={16} />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-primary">{item.name}</h4>
                      <Badge variant={item.available ? "default" : "secondary"} className="text-xs">
                        {item.available ? 'Available' : 'Out of Stock'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.isPopular && (
                        <Badge className="text-xs bg-yellow-100 text-yellow-800">
                          <Star size={10} className="mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mb-2 text-sm">
                      <div className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        <span className="font-semibold text-primary">₹{item.price}</span>
                      </div>
                      
                      {/* Veg/Non-veg indicator */}
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
                        <span className="text-xs text-muted-foreground">
                          {item.isVeg ? 'Veg' : 'Non-veg'}
                        </span>
                      </div>
                      
                      {/* Spice level */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs">
                          {item.spiceLevel === 'mild' && '🌶️'}
                          {item.spiceLevel === 'medium' && '🌶️🌶️'}
                          {item.spiceLevel === 'hot' && '🌶️🌶️🌶️'}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.spiceLevel}
                        </span>
                      </div>
                      
                      {/* Cooking time */}
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {item.cookingTime} min
                        </span>
                      </div>
                      
                      {/* Rating */}
                      {item.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-muted-foreground">
                            {item.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Allergens */}
                    {item.allergens.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={12} className="text-orange-500" />
                        <div className="flex gap-1">
                          {item.allergens.map((allergen, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {allergen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Nutritional info */}
                    {item.nutritionalInfo && (
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {item.nutritionalInfo.calories && (
                          <span>{item.nutritionalInfo.calories} cal</span>
                        )}
                        {item.nutritionalInfo.protein && (
                          <span>Protein: {item.nutritionalInfo.protein}g</span>
                        )}
                        {item.nutritionalInfo.carbs && (
                          <span>Carbs: {item.nutritionalInfo.carbs}g</span>
                        )}
                        {item.nutritionalInfo.fat && (
                          <span>Fat: {item.nutritionalInfo.fat}g</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={item.available}
                      onCheckedChange={() => toggleAvailability(item.id)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-8 h-8 p-0"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-8 h-8 p-0"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search size={48} className="mx-auto mb-4 opacity-50" />
              <p>No menu items found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Menu Insights Section */}
      <div className="mt-8">
        <Tabs defaultValue="management" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="management">Menu Management</TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="management" className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              <p>Menu management tools are above. Switch to AI Insights for smart recommendations.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="ai-insights" className="mt-6">
            <MenuAI />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}