import { useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Category, Role as AppRole } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Grid3X3,
  UserCheck,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

type Role = AppRole;

export function CategoriesManagement() {
  const { 
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    roles,
    addRole,
    updateRole,
    deleteRole,
  } = useAppContext();

  // Get categories by type from AppContext
  const menuCategories = getCategoriesByType('menu');

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [activeCategoryActionId, setActiveCategoryActionId] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [activeRoleActionId, setActiveRoleActionId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const availablePermissions = [
    { id: 'pos_billing', name: 'POS Billing' },
    { id: 'menu_management', name: 'Menu Management' },
    { id: 'table_management', name: 'Table Management' },
    { id: 'kitchen_display', name: 'Kitchen Display' },
    { id: 'customer_management', name: 'Customer Management' },
    { id: 'inventory_management', name: 'Inventory Management' },
    { id: 'staff_management', name: 'Staff Management' },
    { id: 'reports', name: 'Reports & Analytics' },
    { id: 'settings', name: 'Settings' },
    { id: 'all_access', name: 'Full Access' }
  ];

  const colorOptions = [
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-orange-500', label: 'Orange' },
    { value: 'bg-yellow-400', label: 'Yellow' },
    { value: 'bg-green-500', label: 'Green' },
    { value: 'bg-cyan-500', label: 'Cyan' },
    { value: 'bg-blue-500', label: 'Blue' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-pink-500', label: 'Pink' }
  ];

  const colorClassMap: Record<string, string> = {
    '#ef4444': 'bg-red-500',
    '#f97316': 'bg-orange-500',
    '#eab308': 'bg-yellow-400',
    '#22c55e': 'bg-green-500',
    '#06b6d4': 'bg-cyan-500',
    '#3b82f6': 'bg-blue-500',
    '#8b5cf6': 'bg-purple-500',
    '#ec4899': 'bg-pink-500'
  };

  const resolveColorClass = (color?: string) => {
    if (!color) {
      return 'bg-blue-500';
    }
    if (color.startsWith('bg-')) {
      return color;
    }
    const normalized = color.toLowerCase();
    return colorClassMap[normalized] ?? 'bg-blue-500';
  };

  const handleAddCategory = async () => {
    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();

    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }

    try {
      setIsSavingCategory(true);
      const payload = {
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        color: resolveColorClass(categoryForm.color),
        type: 'menu' as const,
        isActive: true,
      };

      const created = await addCategory(payload);
      toast.success(`Category "${created.name}" added successfully`);
      setCategoryForm({ name: '', description: '', color: 'bg-blue-500' });
      setShowCategoryDialog(false);
    } catch (error) {
      console.error('Add category error:', error);
      toast.error('Failed to add category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description ?? '',
      color: resolveColorClass(category.color)
    });
    setShowCategoryDialog(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      return;
    }

    const trimmedName = categoryForm.name.trim();
    const trimmedDescription = categoryForm.description.trim();

    if (!trimmedName) {
      toast.error('Category name is required');
      return;
    }

    setActiveCategoryActionId(editingCategory.id);

    try {
      const updated = await updateCategory(editingCategory.id, {
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        color: resolveColorClass(categoryForm.color),
        type: editingCategory.type ?? 'menu',
      });
      toast.success(`Category "${updated.name}" updated successfully`);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', color: 'bg-blue-500' });
      setShowCategoryDialog(false);
    } catch (error) {
      console.error('Update category error:', error);
      toast.error('Failed to update category');
    } finally {
      setActiveCategoryActionId(null);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setActiveCategoryActionId(id);

    try {
      await deleteCategory(id);
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error('Failed to delete category');
    } finally {
      setActiveCategoryActionId(current => (current === id ? null : current));
    }
  };

  const handleAddRole = async () => {
    const trimmedName = roleForm.name.trim();
    const trimmedDescription = roleForm.description.trim();

    if (!trimmedName) {
      toast.error('Role name is required');
      return;
    }

    if (roleForm.permissions.length === 0) {
      toast.error('Select at least one permission');
      return;
    }

    setIsSavingRole(true);

    try {
      const created = await addRole({
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        permissions: Array.from(new Set(roleForm.permissions)),
      });
      toast.success(`Role "${created.name}" added successfully`);
      setRoleForm({ name: '', description: '', permissions: [] });
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Add role error:', error);
      toast.error('Failed to add role');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description ?? '',
      permissions: Array.isArray(role.permissions) ? role.permissions : [],
    });
    setShowRoleDialog(true);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) {
      return;
    }

    const trimmedName = roleForm.name.trim();
    const trimmedDescription = roleForm.description.trim();

    if (!trimmedName) {
      toast.error('Role name is required');
      return;
    }

    if (roleForm.permissions.length === 0) {
      toast.error('Select at least one permission');
      return;
    }

    setActiveRoleActionId(editingRole.id);

    try {
      const updated = await updateRole(editingRole.id, {
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
        permissions: Array.from(new Set(roleForm.permissions)),
      });
      toast.success(`Role "${updated.name}" updated successfully`);
      setEditingRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
      setShowRoleDialog(false);
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update role');
    } finally {
      setActiveRoleActionId(null);
    }
  };

  const handleDeleteRole = async (id: string) => {
    setActiveRoleActionId(id);

    try {
      await deleteRole(id);
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Delete role error:', error);
      toast.error('Failed to delete role');
    } finally {
      setActiveRoleActionId(current => (current === id ? null : current));
    }
  };

  const filteredCategories = menuCategories.filter(cat => {
    const normalizedSearch = searchTerm.toLowerCase();
    const nameMatch = cat.name.toLowerCase().includes(normalizedSearch);
    const descriptionMatch = cat.description?.toLowerCase().includes(normalizedSearch) ?? false;
    return nameMatch || descriptionMatch;
  });

  const filteredRoles = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return roles
      .map(role => ({
        ...role,
        staffCount: typeof role.staffCount === 'number' ? role.staffCount : 0,
        description: role.description ?? '',
      }))
      .filter(role => {
        if (!normalizedSearch) {
          return true;
        }

        const nameMatch = role.name.toLowerCase().includes(normalizedSearch);
        const descriptionMatch = role.description
          ? role.description.toLowerCase().includes(normalizedSearch)
          : false;

        return nameMatch || descriptionMatch;
      });
  }, [roles, searchTerm]);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories & Roles Management</h1>
          <p className="text-muted-foreground">Manage menu categories and staff roles</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search categories or roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Grid3X3 size={16} />
            Menu Categories
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCheck size={16} />
            Staff Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Menu Categories</h3>
            <Button onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ name: '', description: '', color: 'bg-blue-500' });
              setShowCategoryDialog(true);
            }}>
              <Plus size={16} className="mr-2" />
              Add Category
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${resolveColorClass(category.color)}`} />
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </div>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{category.description ?? 'No description provided'}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {category.itemCount ?? 0} items
                    </span>
                    <span className="text-muted-foreground">
                      Created: {category.createdAt ? category.createdAt.split('T')[0] : '--'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      className="flex-1"
                    >
                      <Edit2 size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={activeCategoryActionId === category.id}
                    >
                      {activeCategoryActionId === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Staff Roles</h3>
            <Button onClick={() => {
              setEditingRole(null);
              setRoleForm({ name: '', description: '', permissions: [] });
              setShowRoleDialog(true);
            }}>
              <Plus size={16} className="mr-2" />
              Add Role
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoles.map((role) => {
              const permissions = Array.isArray(role.permissions) ? role.permissions : [];
              const displayedPermissions = permissions.slice(0, 3);
              const remainingPermissions = permissions.length - displayedPermissions.length;
              const staffCount = role.staffCount ?? 0;
              const createdDate = role.createdAt ? role.createdAt.split('T')[0] : '--';
              const isProcessing = activeRoleActionId === role.id;

              return (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{role.name}</CardTitle>
                      <Badge variant="secondary">
                        {staffCount} staff
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {role.description || 'No description provided'}
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Permissions:</p>
                      <div className="flex flex-wrap gap-1">
                        {displayedPermissions.map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {availablePermissions.find(p => p.id === permission)?.name || permission}
                          </Badge>
                        ))}
                        {remainingPermissions > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{remainingPermissions} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {staffCount} staff members
                      </span>
                      <span className="text-muted-foreground">
                        Created: {createdDate}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRole(role)}
                        className="flex-1"
                        disabled={isProcessing}
                      >
                        <Edit2 size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the menu category details' : 'Create a new menu category for organizing items'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="Enter category name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter category description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="flex gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategoryForm(prev => ({ ...prev, color: option.value }))}
                    className={`w-8 h-8 rounded-full border-2 ${option.value} ${
                      categoryForm.color === option.value ? 'border-primary' : 'border-transparent'
                    }`}
                    aria-label={`Select ${option.label} color`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCategoryDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                disabled={!categoryForm.name.trim() || (editingCategory ? activeCategoryActionId === editingCategory.id : isSavingCategory)}
                className="flex-1"
              >
                {editingCategory ? (
                  activeCategoryActionId === editingCategory.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Category'
                  )
                ) : (
                  isSavingCategory ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add Category'
                  )
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? 'Update the staff role and permissions' : 'Create a new staff role with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Name</label>
              <Input
                placeholder="Enter role name"
                value={roleForm.name}
                onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Enter role description"
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Permissions</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={roleForm.permissions.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoleForm(prev => ({
                            ...prev,
                            permissions: [...prev.permissions, permission.id]
                          }));
                        } else {
                          setRoleForm(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(p => p !== permission.id)
                          }));
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowRoleDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={editingRole ? handleUpdateRole : handleAddRole}
                disabled={!roleForm.name.trim() || roleForm.permissions.length === 0 || (editingRole ? activeRoleActionId === editingRole.id : isSavingRole)}
                className="flex-1"
              >
                {editingRole ? (
                  activeRoleActionId === editingRole.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    'Update Role'
                  )
                ) : (
                  isSavingRole ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </span>
                  ) : (
                    'Add Role'
                  )
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}