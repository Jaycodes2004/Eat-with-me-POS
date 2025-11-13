import { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { 
  ChefHat, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Calculator,
  BookOpen,
  AlertCircle,
  X,
  Percent,
  Scale
} from 'lucide-react';

interface RecipeIngredient {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
}

export function RecipeManagement() {
  const { 
    recipes, 
    addRecipe, 
    updateRecipe, 
    deleteRecipe,
    calculateRecipeCost,
    inventoryItems,
    menuItems
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [newRecipe, setNewRecipe] = useState({
    menuItemId: '',
    menuItemName: '',
    yield: '',
    preparationTime: '',
    costPerServing: '',
    sellingPrice: '',
    instructions: '',
    notes: ''
  });

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState({
    inventoryItemId: '',
    quantity: '',
    unit: ''
  });

  const filteredRecipes = recipes.filter(recipe => 
    recipe.menuItemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ing => ing.inventoryItemName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const calculateActualCost = (recipeIngredients: RecipeIngredient[]): number => {
    return recipeIngredients.reduce((total, ingredient) => {
      const inventoryItem = inventoryItems.find(item => item.id === ingredient.inventoryItemId);
      if (inventoryItem) {
        return total + (ingredient.quantity * inventoryItem.costPerUnit);
      }
      return total;
    }, 0);
  };

  const calculateProfitMargin = (cost: number, sellingPrice: number): number => {
    if (!sellingPrice || sellingPrice === 0) return 0;
    return ((sellingPrice - cost) / sellingPrice) * 100;
  };

  const addIngredient = () => {
    if (!currentIngredient.inventoryItemId || !currentIngredient.quantity) {
      toast.error('Please select an item and enter quantity');
      return;
    }

    const inventoryItem = inventoryItems.find(item => item.id === currentIngredient.inventoryItemId);
    if (!inventoryItem) return;

    const newIngredient: RecipeIngredient = {
      inventoryItemId: currentIngredient.inventoryItemId,
      inventoryItemName: inventoryItem.name,
      quantity: parseFloat(currentIngredient.quantity),
      unit: currentIngredient.unit || inventoryItem.unit
    };

    setIngredients(prev => [...prev, newIngredient]);
    setCurrentIngredient({ inventoryItemId: '', quantity: '', unit: '' });
    toast.success('Ingredient added');
  };

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
    toast.success('Ingredient removed');
  };

  const validateRecipe = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!newRecipe.menuItemId) {
      newErrors.menuItemId = 'Please select a menu item';
    }

    if (!newRecipe.yield || parseFloat(newRecipe.yield) <= 0) {
      newErrors.yield = 'Yield must be greater than 0';
    }

    if (!newRecipe.preparationTime || parseFloat(newRecipe.preparationTime) <= 0) {
      newErrors.preparationTime = 'Preparation time is required';
    }

    if (ingredients.length === 0) {
      newErrors.ingredients = 'Add at least one ingredient';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddRecipe = () => {
    if (!validateRecipe()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    const actualCost = calculateActualCost(ingredients);
    const costPerServing = actualCost / parseFloat(newRecipe.yield);

    const menuItem = menuItems.find(item => item.id === newRecipe.menuItemId);
    const instructionsList = newRecipe.instructions
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    const recipe = {
      id: `recipe_${Date.now()}`,
      menuItemId: newRecipe.menuItemId,
      menuItemName: menuItem?.name || newRecipe.menuItemName,
      ingredients: ingredients,
      yield: parseFloat(newRecipe.yield),
      cost: costPerServing,
      preparationTime: parseFloat(newRecipe.preparationTime),
      instructions: instructionsList.length > 0 ? instructionsList : undefined,
      notes: newRecipe.notes || undefined
    };

    addRecipe(recipe);
    toast.success('Recipe added successfully');
    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditRecipe = () => {
    if (!editingRecipe) return;

    const actualCost = calculateActualCost(ingredients);
    const costPerServing = actualCost / parseFloat(newRecipe.yield);

    const instructionsList = newRecipe.instructions
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());

    updateRecipe(editingRecipe.id, {
      ingredients: ingredients,
      yield: parseFloat(newRecipe.yield),
      cost: costPerServing,
      preparationTime: parseFloat(newRecipe.preparationTime),
      instructions: instructionsList.length > 0 ? instructionsList : undefined,
      notes: newRecipe.notes || undefined
    });

    toast.success('Recipe updated successfully');
    resetForm();
    setIsEditDialogOpen(false);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    deleteRecipe(id);
    toast.success('Recipe deleted successfully');
  };

  const openEditDialog = (recipe: any) => {
    setEditingRecipe(recipe);
    setNewRecipe({
      menuItemId: recipe.menuItemId,
      menuItemName: recipe.menuItemName,
      yield: recipe.yield.toString(),
      preparationTime: recipe.preparationTime.toString(),
      costPerServing: recipe.cost.toFixed(2),
      sellingPrice: '',
      instructions: recipe.instructions?.join('\n') || '',
      notes: recipe.notes || ''
    });
    setIngredients(recipe.ingredients);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setNewRecipe({
      menuItemId: '',
      menuItemName: '',
      yield: '',
      preparationTime: '',
      costPerServing: '',
      sellingPrice: '',
      instructions: '',
      notes: ''
    });
    setIngredients([]);
    setCurrentIngredient({ inventoryItemId: '', quantity: '', unit: '' });
    setErrors({});
  };

  const stats = {
    totalRecipes: recipes.length,
    avgCost: recipes.length > 0 
      ? recipes.reduce((sum, r) => sum + r.cost, 0) / recipes.length 
      : 0,
    highestCost: recipes.length > 0 
      ? Math.max(...recipes.map(r => r.cost)) 
      : 0,
    lowestCost: recipes.length > 0 
      ? Math.min(...recipes.map(r => r.cost)) 
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary">Recipe Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage recipes for your menu items</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Recipe</DialogTitle>
              <DialogDescription>
                Add ingredients, instructions, and costing details for your menu item.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Menu Item Selection */}
              <div className="space-y-2">
                <Label htmlFor="menuItem">Menu Item *</Label>
                <Select 
                  value={newRecipe.menuItemId} 
                  onValueChange={(value) => {
                    const item = menuItems.find(m => m.id === value);
                    setNewRecipe({
                      ...newRecipe, 
                      menuItemId: value,
                      menuItemName: item?.name || '',
                      sellingPrice: item?.price.toString() || ''
                    });
                    if (errors.menuItemId) setErrors(prev => ({...prev, menuItemId: ''}));
                  }}
                >
                  <SelectTrigger className={errors.menuItemId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select menu item" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - ₹{item.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.menuItemId && (
                  <p className="text-sm text-destructive">{errors.menuItemId}</p>
                )}
              </div>

              {/* Recipe Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yield">Yield (Servings) *</Label>
                  <Input 
                    id="yield"
                    type="number"
                    placeholder="e.g., 2"
                    value={newRecipe.yield}
                    onChange={(e) => {
                      setNewRecipe({...newRecipe, yield: e.target.value});
                      if (errors.yield) setErrors(prev => ({...prev, yield: ''}));
                    }}
                    className={errors.yield ? 'border-destructive' : ''}
                  />
                  {errors.yield && (
                    <p className="text-sm text-destructive">{errors.yield}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prepTime">Preparation Time (minutes) *</Label>
                  <Input 
                    id="prepTime"
                    type="number"
                    placeholder="e.g., 30"
                    value={newRecipe.preparationTime}
                    onChange={(e) => {
                      setNewRecipe({...newRecipe, preparationTime: e.target.value});
                      if (errors.preparationTime) setErrors(prev => ({...prev, preparationTime: ''}));
                    }}
                    className={errors.preparationTime ? 'border-destructive' : ''}
                  />
                  {errors.preparationTime && (
                    <p className="text-sm text-destructive">{errors.preparationTime}</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Ingredients Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Ingredients *</Label>
                  {errors.ingredients && (
                    <p className="text-sm text-destructive">{errors.ingredients}</p>
                  )}
                </div>

                {/* Add Ingredient */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <Select 
                      value={currentIngredient.inventoryItemId}
                      onValueChange={(value) => {
                        const item = inventoryItems.find(i => i.id === value);
                        setCurrentIngredient({
                          ...currentIngredient,
                          inventoryItemId: value,
                          unit: item?.unit || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventoryItems.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="Quantity"
                      value={currentIngredient.quantity}
                      onChange={(e) => setCurrentIngredient({...currentIngredient, quantity: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      placeholder="Unit"
                      value={currentIngredient.unit}
                      onChange={(e) => setCurrentIngredient({...currentIngredient, unit: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button 
                      type="button" 
                      size="icon" 
                      onClick={addIngredient}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Ingredients List */}
                {ingredients.length > 0 && (
                  <ScrollArea className="h-40 border rounded-md p-4">
                    <div className="space-y-2">
                      {ingredients.map((ingredient, index) => {
                        const inventoryItem = inventoryItems.find(item => item.id === ingredient.inventoryItemId);
                        const itemCost = inventoryItem ? ingredient.quantity * inventoryItem.costPerUnit : 0;
                        
                        return (
                          <div key={index} className="flex items-center justify-between bg-accent/50 p-3 rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{ingredient.inventoryItemName}</span>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {ingredient.quantity} {ingredient.unit} × ₹{inventoryItem?.costPerUnit || 0} = ₹{itemCost.toFixed(2)}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeIngredient(index)}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Cost Summary */}
                {ingredients.length > 0 && newRecipe.yield && (
                  <Card className="bg-primary/5">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-xl font-bold text-primary">
                            ₹{calculateActualCost(ingredients).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cost per Serving</p>
                          <p className="text-xl font-bold text-primary">
                            ₹{(calculateActualCost(ingredients) / parseFloat(newRecipe.yield || '1')).toFixed(2)}
                          </p>
                        </div>
                        {newRecipe.sellingPrice && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground">Selling Price</p>
                              <p className="text-xl font-bold">
                                ₹{parseFloat(newRecipe.sellingPrice).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Profit Margin</p>
                              <p className="text-xl font-bold text-green-600">
                                {calculateProfitMargin(
                                  calculateActualCost(ingredients) / parseFloat(newRecipe.yield || '1'),
                                  parseFloat(newRecipe.sellingPrice)
                                ).toFixed(1)}%
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Cooking Instructions</Label>
                <Textarea 
                  id="instructions"
                  placeholder="Enter instructions (one per line)&#10;1. Marinate the chicken...&#10;2. Heat oil in a pan...&#10;3. Cook until golden brown..."
                  rows={6}
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({...newRecipe, instructions: e.target.value})}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea 
                  id="notes"
                  placeholder="Add any additional notes or tips..."
                  rows={3}
                  value={newRecipe.notes}
                  onChange={(e) => setNewRecipe({...newRecipe, notes: e.target.value})}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleAddRecipe}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Recipe
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalRecipes}</div>
          <div className="text-sm text-muted-foreground">Total Recipes</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">₹{stats.avgCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Avg Cost/Serving</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">₹{stats.lowestCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Lowest Cost</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">₹{stats.highestCost.toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Highest Cost</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search recipes by name or ingredient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Recipes List */}
      <div className="space-y-4">
        {filteredRecipes.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recipes Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search' : 'Start by creating your first recipe'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Recipe
              </Button>
            )}
          </Card>
        ) : (
          filteredRecipes.map((recipe) => {
            const actualCost = calculateRecipeCost(recipe.id);
            const menuItem = menuItems.find(item => item.id === recipe.menuItemId);
            const profitMargin = menuItem ? calculateProfitMargin(recipe.cost, menuItem.price) : 0;

            return (
              <Card key={recipe.id} className="overflow-hidden">
                <CardHeader className="bg-accent/50 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{recipe.menuItemName}</CardTitle>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Scale className="w-3 h-3" />
                            <span>{recipe.yield} servings</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{recipe.preparationTime} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span>{recipe.ingredients.length} ingredients</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSelectedRecipe(recipe)}
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{recipe.menuItemName}</DialogTitle>
                            <DialogDescription>
                              Complete recipe details with ingredients and instructions
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Recipe Info */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <Scale className="w-5 h-5 mx-auto mb-1 text-primary" />
                                <div className="font-semibold">{recipe.yield}</div>
                                <div className="text-xs text-muted-foreground">Servings</div>
                              </div>
                              <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                                <div className="font-semibold">{recipe.preparationTime} min</div>
                                <div className="text-xs text-muted-foreground">Prep Time</div>
                              </div>
                              <div className="text-center p-3 bg-accent/50 rounded-lg">
                                <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                                <div className="font-semibold">₹{recipe.cost.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">Cost/Serving</div>
                              </div>
                            </div>

                            {/* Ingredients */}
                            <div>
                              <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Ingredients
                              </h3>
                              <div className="space-y-2">
                                {recipe.ingredients.map((ingredient, index) => {
                                  const inventoryItem = inventoryItems.find(item => item.id === ingredient.inventoryItemId);
                                  const itemCost = inventoryItem ? ingredient.quantity * inventoryItem.costPerUnit : 0;
                                  
                                  return (
                                    <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-md">
                                      <div>
                                        <div className="font-medium">{ingredient.inventoryItemName}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {ingredient.quantity} {ingredient.unit}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold">₹{itemCost.toFixed(2)}</div>
                                        <div className="text-xs text-muted-foreground">
                                          ₹{inventoryItem?.costPerUnit || 0}/{ingredient.unit}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Instructions */}
                            {recipe.instructions && recipe.instructions.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  Instructions
                                </h3>
                                <ol className="space-y-2 list-decimal list-inside">
                                  {recipe.instructions.map((instruction, index) => (
                                    <li key={index} className="text-sm p-2 bg-accent/30 rounded">
                                      {instruction}
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}

                            {/* Notes */}
                            {recipe.notes && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4" />
                                  Notes
                                </h3>
                                <p className="text-sm text-muted-foreground p-3 bg-accent/30 rounded">
                                  {recipe.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(recipe)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Cost Analysis */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Cost/Serving</p>
                      <p className="text-lg font-bold text-primary">₹{recipe.cost.toFixed(2)}</p>
                    </div>
                    {menuItem && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Selling Price</p>
                          <p className="text-lg font-bold">₹{menuItem.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Profit/Serving</p>
                          <p className="text-lg font-bold text-green-600">
                            ₹{(menuItem.price - recipe.cost).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Margin</p>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-green-600">
                              {profitMargin.toFixed(1)}%
                            </p>
                            {profitMargin >= 60 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : profitMargin < 30 ? (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            ) : null}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ingredients Preview */}
                  <div>
                    <p className="text-sm font-medium mb-2">Ingredients:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recipe.ingredients.slice(0, 4).map((ingredient, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-accent/30 px-3 py-2 rounded">
                          <span className="text-muted-foreground">{ingredient.inventoryItemName}</span>
                          <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                        </div>
                      ))}
                    </div>
                    {recipe.ingredients.length > 4 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        +{recipe.ingredients.length - 4} more ingredients
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          setEditingRecipe(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe: {editingRecipe?.menuItemName}</DialogTitle>
            <DialogDescription>
              Update recipe ingredients, instructions, and costing details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Recipe Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-yield">Yield (Servings) *</Label>
                <Input 
                  id="edit-yield"
                  type="number"
                  value={newRecipe.yield}
                  onChange={(e) => setNewRecipe({...newRecipe, yield: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-prepTime">Preparation Time (minutes) *</Label>
                <Input 
                  id="edit-prepTime"
                  type="number"
                  value={newRecipe.preparationTime}
                  onChange={(e) => setNewRecipe({...newRecipe, preparationTime: e.target.value})}
                />
              </div>
            </div>

            <Separator />

            {/* Ingredients Section */}
            <div className="space-y-4">
              <Label className="text-base">Ingredients</Label>

              {/* Add Ingredient */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <Select 
                    value={currentIngredient.inventoryItemId}
                    onValueChange={(value) => {
                      const item = inventoryItems.find(i => i.id === value);
                      setCurrentIngredient({
                        ...currentIngredient,
                        inventoryItemId: value,
                        unit: item?.unit || ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} ({item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={currentIngredient.quantity}
                    onChange={(e) => setCurrentIngredient({...currentIngredient, quantity: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    placeholder="Unit"
                    value={currentIngredient.unit}
                    onChange={(e) => setCurrentIngredient({...currentIngredient, unit: e.target.value})}
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    type="button" 
                    size="icon" 
                    onClick={addIngredient}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Ingredients List */}
              {ingredients.length > 0 && (
                <ScrollArea className="h-40 border rounded-md p-4">
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => {
                      const inventoryItem = inventoryItems.find(item => item.id === ingredient.inventoryItemId);
                      const itemCost = inventoryItem ? ingredient.quantity * inventoryItem.costPerUnit : 0;
                      
                      return (
                        <div key={index} className="flex items-center justify-between bg-accent/50 p-3 rounded-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{ingredient.inventoryItemName}</span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {ingredient.quantity} {ingredient.unit} × ₹{inventoryItem?.costPerUnit || 0} = ₹{itemCost.toFixed(2)}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeIngredient(index)}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Cost Summary */}
              {ingredients.length > 0 && newRecipe.yield && (
                <Card className="bg-primary/5">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-xl font-bold text-primary">
                          ₹{calculateActualCost(ingredients).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost per Serving</p>
                        <p className="text-xl font-bold text-primary">
                          ₹{(calculateActualCost(ingredients) / parseFloat(newRecipe.yield || '1')).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Cooking Instructions</Label>
              <Textarea 
                id="edit-instructions"
                placeholder="Enter instructions (one per line)"
                rows={6}
                value={newRecipe.instructions}
                onChange={(e) => setNewRecipe({...newRecipe, instructions: e.target.value})}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea 
                id="edit-notes"
                placeholder="Add any additional notes or tips..."
                rows={3}
                value={newRecipe.notes}
                onChange={(e) => setNewRecipe({...newRecipe, notes: e.target.value})}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleEditRecipe}>
                <Edit className="w-4 h-4 mr-2" />
                Update Recipe
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingRecipe(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
