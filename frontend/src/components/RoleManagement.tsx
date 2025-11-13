import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Edit, Trash2, Shield, Users, Loader2 } from 'lucide-react';
import { useAppContext, type Role as ContextRole } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Switch } from './ui/switch';

interface RoleManagementProps {
  onNavigate?: (screen: string) => void;
}

type PermissionCategory = 'Sales' | 'Operations' | 'Analytics' | 'CRM' | 'HR' | 'Admin';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
}

interface RoleFormState {
  name: string;
  description: string;
  permissions: string[];
}

const PERMISSIONS: Permission[] = [
  { id: 'orders.manage', name: 'Manage Orders', description: 'Create, update, and finalize customer orders.', category: 'Sales' },
  { id: 'billing.process', name: 'Process Billing', description: 'Generate invoices and collect payments.', category: 'Sales' },
  { id: 'tables.manage', name: 'Manage Tables', description: 'Assign tables and update table status.', category: 'Operations' },
  { id: 'menu.edit', name: 'Edit Menu', description: 'Create and modify menu items and categories.', category: 'Operations' },
  { id: 'analytics.view', name: 'View Analytics', description: 'Access sales and performance dashboards.', category: 'Analytics' },
  { id: 'reports.export', name: 'Export Reports', description: 'Generate and download business reports.', category: 'Analytics' },
  { id: 'customers.manage', name: 'Manage Customers', description: 'Create and update customer records.', category: 'CRM' },
  { id: 'marketing.campaigns', name: 'Marketing Campaigns', description: 'Create and manage marketing campaigns.', category: 'CRM' },
  { id: 'staff.manage', name: 'Manage Staff', description: 'Create, update, and deactivate staff members.', category: 'HR' },
  { id: 'attendance.view', name: 'View Attendance', description: 'Access staff attendance and shift history.', category: 'HR' },
  { id: 'settings.manage', name: 'Manage Settings', description: 'Update restaurant and billing settings.', category: 'Admin' },
  { id: 'roles.manage', name: 'Manage Roles', description: 'Create and update roles and permissions.', category: 'Admin' },
];

const createInitialFormState = (): RoleFormState => ({
  name: '',
  description: '',
  permissions: [],
});

const RoleManagement = ({ onNavigate }: RoleManagementProps) => {
  const { roles, addRole, updateRole, deleteRole, staff } = useAppContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ContextRole | null>(null);
  const [formState, setFormState] = useState<RoleFormState>(createInitialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRoleIds, setDeletingRoleIds] = useState<Record<string, boolean>>({});

  const permissionGroups = useMemo(() => {
    return PERMISSIONS.reduce<Record<PermissionCategory, Permission[]>>((acc, permission) => {
      acc[permission.category] = [...acc[permission.category], permission];
      return acc;
    }, { Sales: [], Operations: [], Analytics: [], CRM: [], HR: [], Admin: [] });
  }, []);

  const selectedPermissions = useMemo(() => new Set(formState.permissions), [formState.permissions]);

  const getCategoryIcon = useCallback((category: PermissionCategory) => {
    switch (category) {
      case 'Sales':
        return '💰';
      case 'Operations':
        return '⚙️';
      case 'Analytics':
        return '📊';
      case 'CRM':
        return '👥';
      case 'HR':
        return '👤';
      case 'Admin':
        return '🔐';
      default:
        return '📋';
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormState(createInitialFormState());
    setEditingRole(null);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
      setIsSubmitting(false);
    }
  }, [resetForm]);

  const togglePermission = useCallback((permissionId: string) => {
    setFormState(prev => {
      const hasPermission = prev.permissions.includes(permissionId);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter(id => id !== permissionId)
          : [...prev.permissions, permissionId],
      };
    });
  }, []);

  const getAssignedStaffCount = useCallback((role: ContextRole) => {
    const normalized = role.name?.toLowerCase() ?? '';
    return staff.filter(member => member.role?.toLowerCase() === normalized).length;
  }, [staff]);

  const handleEditRole = useCallback((role: ContextRole) => {
    setEditingRole(role);
    setFormState({
      name: role.name ?? '',
      description: role.description ?? '',
      permissions: Array.isArray(role.permissions) ? [...new Set(role.permissions)] : [],
    });
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    const name = formState.name.trim();
    const description = formState.description.trim();
    if (!name) {
      toast.error('Role name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name,
          description: description || undefined,
          permissions: formState.permissions,
        });
        toast.success('Role updated successfully.');
      } else {
        await addRole({
          name,
          description: description || undefined,
          permissions: formState.permissions,
        });
        toast.success('Role created successfully.');
      }

      handleDialogOpenChange(false);
    } catch (error) {
      console.error('Failed to save role', error);
      toast.error(editingRole ? 'Failed to update role.' : 'Failed to create role.');
      setIsSubmitting(false);
    }
  }, [formState, editingRole, addRole, updateRole, handleDialogOpenChange]);

  const handleDeleteRole = useCallback(async (id: string) => {
    if (!id) {
      return;
    }

    setDeletingRoleIds(prev => ({ ...prev, [id]: true }));
    try {
      await deleteRole(id);
      toast.success('Role deleted successfully.');
    } catch (error) {
      console.error('Failed to delete role', error);
      toast.error('Failed to delete role.');
    } finally {
      setDeletingRoleIds(prev => ({ ...prev, [id]: false }));
    }
  }, [deleteRole]);

  const renderPermissions = useCallback(() => (
    <div className="space-y-4">
      <h3 className="font-medium">Permissions</h3>
      {Object.entries(permissionGroups).map(([category, perms]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span>{getCategoryIcon(category as PermissionCategory)}</span>
              {category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perms.map(permission => (
              <div key={permission.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{permission.name}</p>
                  <p className="text-xs text-muted-foreground">{permission.description}</p>
                </div>
                <Switch
                  checked={selectedPermissions.has(permission.id)}
                  onCheckedChange={() => togglePermission(permission.id)}
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  ), [permissionGroups, getCategoryIcon, selectedPermissions, togglePermission, isSubmitting]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        {onNavigate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('settings')}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">Role Management</h1>
          <p className="text-muted-foreground">Create and maintain staff roles with permissions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
              <DialogDescription>
                {editingRole
                  ? 'Update the role name, description, and permissions.'
                  : 'Define a new role and assign the permissions it should have.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role Name</label>
                  <Input
                    placeholder="Enter role name"
                    value={formState.name}
                    onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="Describe the role responsibilities"
                    value={formState.description}
                    onChange={event => setFormState(prev => ({ ...prev, description: event.target.value }))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {renderPermissions()}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {roles.map(role => {
          const staffCount = role.staffCount ?? getAssignedStaffCount(role);
          const isDeleting = deletingRoleIds[role.id];
          return (
            <Card key={role.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.name ?? 'Untitled Role'}</CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{staffCount} assigned</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      className="h-8 w-8 p-0"
                      disabled={isSubmitting}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRole(role.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isSubmitting || isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {role.description || 'No description provided.'}
                </p>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">
                    Permissions ({role.permissions?.length ?? 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(role.permissions ?? []).map(permissionId => {
                      const permission = PERMISSIONS.find(item => item.id === permissionId);
                      return (
                        <Badge key={permissionId} variant="secondary" className="text-xs">
                          {permission?.name ?? permissionId}
                        </Badge>
                      );
                    })}
                    {(role.permissions ?? []).length === 0 && (
                      <span className="text-xs text-muted-foreground">No permissions assigned.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {roles.length === 0 && (
          <div className="col-span-full flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No roles available yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;