import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'sonner@2.0.3';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  IndianRupee, 
  Search,
  UserCheck,
  Key,
  Calendar,
  TrendingUp,
  Settings,
  Award,
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Eye,
  PlayCircle,
  StopCircle,
  RotateCcw,
  Timer,
  History,
  Wallet,
  Receipt,
  PiggyBank
} from 'lucide-react';
import RoleManagement from './RoleManagement';

const DEFAULT_ROLE_NAMES = ['Manager', 'Cashier', 'Waiter', 'Chef', 'Helper'];

export function StaffManagement() {
  // Use context instead of local state for staff data
  const { 
    staff, 
    shifts, 
    salaryPayments,
    roles: roleDefinitions,
    addStaff, 
    updateStaff, 
    deleteStaff,
    addShift,
    updateShift,
    addSalaryPayment,
    addNotification
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStaffForShift, setSelectedStaffForShift] = useState<string>('');
  const [selectedStaffForPayment, setSelectedStaffForPayment] = useState<string>('');
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentType: 'Full Salary' as 'Full Salary' | 'Partial Payment' | 'Advance' | 'Bonus' | 'Overtime',
    description: '',
    paidBy: ''
  });
  const [selectAllNewStaffPermissions, setSelectAllNewStaffPermissions] = useState(false);
  const [selectAllNewStaffDashboard, setSelectAllNewStaffDashboard] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    pin: '',
    salary: '',
    permissions: [] as string[],
    dashboardModules: [] as string[]
  });

  const [newShiftDetails, setNewShiftDetails] = useState<{ shiftType: 'Morning' | 'Evening' | 'Night'; openingCash: string }>({
    shiftType: 'Morning',
    openingCash: ''
  });

  const permissions = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard', description: 'Access to main dashboard and overview', category: 'core' },
    { id: 'pos', label: 'POS Billing', description: 'Access to billing and checkout system', category: 'sales' },
    { id: 'menu', label: 'Menu Management', description: 'Add, edit, and manage menu items', category: 'operations' },
    { id: 'reports', label: 'Reports & Analytics', description: 'View sales and performance reports', category: 'analytics' },
    { id: 'settings', label: 'Settings', description: 'System configuration and setup', category: 'admin' },
    { id: 'tables', label: 'Table Management', description: 'Manage table reservations and layout', category: 'operations' },
    { id: 'kitchen', label: 'Kitchen Display', description: 'View and manage kitchen orders', category: 'operations' },
    { id: 'customers', label: 'Customer Management', description: 'Manage customer data and CRM', category: 'sales' },
    { id: 'marketing', label: 'Marketing', description: 'Access marketing campaigns and promotions', category: 'sales' },
    { id: 'inventory', label: 'Inventory Management', description: 'Track and manage stock levels', category: 'operations' },
    { id: 'staff', label: 'Staff Management', description: 'Manage staff and roles', category: 'admin' },
    { id: 'qr-ordering', label: 'QR Ordering', description: 'Manage QR code ordering system', category: 'sales' },
    { id: 'suppliers', label: 'Supplier Management', description: 'Manage vendor relationships', category: 'operations' },
    { id: 'expenses', label: 'Expense Management', description: 'Track and manage expenses', category: 'finance' },
    { id: 'reservations', label: 'Reservation Management', description: 'Manage table reservations and bookings', category: 'operations' },
    { id: 'loyalty', label: 'Loyalty Program', description: 'Manage customer loyalty programs', category: 'sales' },
    { id: 'online-orders', label: 'Online Orders Management', description: 'Manage orders from Zomato, Swiggy, and website', category: 'sales' }
  ]), []);

  const roleOptions = useMemo(() => {
    const contextNames = roleDefinitions
      .map(role => role.name?.trim())
      .filter((name): name is string => Boolean(name));
    const uniqueContextNames = Array.from(new Set(contextNames));
    if (uniqueContextNames.length > 0) {
      return uniqueContextNames;
    }

    const staffRoleNames = Array.from(new Set(staff.map(member => member.role).filter(Boolean)));
    if (staffRoleNames.length > 0) {
      return staffRoleNames;
    }

    return DEFAULT_ROLE_NAMES;
  }, [roleDefinitions, staff]);

  const findRoleDefinition = useCallback((roleName: string) => {
    if (!roleName) {
      return undefined;
    }
    const normalized = roleName.toLowerCase();
    return roleDefinitions.find(role => (role.name ?? '').toLowerCase() === normalized);
  }, [roleDefinitions]);

  const getFallbackPermissions = useCallback((roleName: string): string[] => {
    switch (roleName) {
      case 'Manager':
        return permissions.map(p => p.id);
      case 'Cashier':
        return ['dashboard', 'pos', 'reports', 'customers', 'loyalty', 'online-orders'];
      case 'Waiter':
        return ['dashboard', 'pos', 'tables', 'customers', 'reservation_management', 'qr-ordering', 'online-orders'];
      case 'Chef':
        return ['dashboard', 'kitchen', 'inventory', 'menu', 'suppliers', 'online-orders'];
      case 'Helper':
        return ['dashboard', 'pos', 'kitchen', 'online-orders'];
      default:
        return ['dashboard'];
    }
  }, [permissions]);

  const getFallbackDashboardModules = useCallback((roleName: string): string[] => {
    switch (roleName) {
      case 'Manager':
        return ['dashboard', 'pos', 'reports', 'staff', 'inventory'];
      case 'Cashier':
        return ['dashboard', 'pos', 'reports', 'customers'];
      case 'Waiter':
        return ['dashboard', 'tables', 'pos', 'customers'];
      case 'Chef':
        return ['dashboard', 'kitchen', 'inventory', 'menu'];
      case 'Helper':
        return ['dashboard', 'kitchen'];
      default:
        return ['dashboard'];
    }
  }, []);

  const getDefaultPermissionsForRole = useCallback((roleName: string): string[] => {
    const role = findRoleDefinition(roleName);
    if (role && Array.isArray(role.permissions) && role.permissions.length > 0) {
      return role.permissions;
    }
    return getFallbackPermissions(roleName);
  }, [findRoleDefinition, getFallbackPermissions]);

  const getDefaultDashboardModulesForRole = useCallback((roleName: string): string[] => {
    const role = findRoleDefinition(roleName);
    if (role && Array.isArray(role.dashboardModules) && role.dashboardModules.length > 0) {
      return role.dashboardModules;
    }
    return getFallbackDashboardModules(roleName);
  }, [findRoleDefinition, getFallbackDashboardModules]);

  useEffect(() => {
    if (!newStaff.role) {
      setSelectAllNewStaffPermissions(false);
      setSelectAllNewStaffDashboard(false);
      return;
    }

    setNewStaff(prev => {
      const defaultPermissions = getDefaultPermissionsForRole(newStaff.role);
      const defaultDashboardModules = getDefaultDashboardModulesForRole(newStaff.role);

      return {
        ...prev,
        permissions: prev.permissions.length ? prev.permissions : defaultPermissions,
        dashboardModules: prev.dashboardModules.length ? prev.dashboardModules : defaultDashboardModules,
      };
    });
  }, [newStaff.role, getDefaultPermissionsForRole, getDefaultDashboardModulesForRole]);

  useEffect(() => {
    const allPermissionIds = permissions.map(p => p.id);
    setSelectAllNewStaffPermissions(allPermissionIds.every(id => newStaff.permissions.includes(id)));
  }, [newStaff.permissions, permissions]);

  useEffect(() => {
    const allModuleIds = permissions.map(p => p.id);
    setSelectAllNewStaffDashboard(allModuleIds.every(id => newStaff.dashboardModules.includes(id)));
  }, [newStaff.dashboardModules, permissions]);

  const validateStaff = (staffData: any): {[key: string]: string} => {
    const errors: {[key: string]: string} = {};
    
    if (!staffData.name.trim()) {
      errors.name = 'Staff name is required';
    } else if (staffData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!staffData.role) {
      errors.role = 'Role is required';
    }
    
    if (!staffData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]{10,}$/.test(staffData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (staffData.email && !/\S+@\S+\.\S+/.test(staffData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!staffData.pin.trim()) {
      errors.pin = 'PIN is required';
    } else if (!/^\d{4}$/.test(staffData.pin)) {
      errors.pin = 'PIN must be exactly 4 digits';
    }
    
    if (!staffData.salary) {
      errors.salary = 'Salary is required';
    } else if (parseFloat(staffData.salary) <= 0) {
      errors.salary = 'Salary must be greater than 0';
    }
    
    return errors;
  };

  const updateNewStaffField = (field: keyof typeof newStaff, value: string) => {
    setNewStaff(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNewStaffPermissionChange = (permissionId: string, checked: boolean) => {
    setNewStaff(prev => {
      const current = prev.permissions;
      const next = checked
        ? Array.from(new Set([...current, permissionId]))
        : current.filter(item => item !== permissionId);
      return {
        ...prev,
        permissions: next,
      };
    });
  };

  const handleNewStaffDashboardChange = (moduleId: string, checked: boolean) => {
    setNewStaff(prev => {
      const current = prev.dashboardModules;
      const next = checked
        ? Array.from(new Set([...current, moduleId]))
        : current.filter(item => item !== moduleId);
      return {
        ...prev,
        dashboardModules: next,
      };
    });
  };

  const handleSelectAllNewStaffPermissions = (checked: boolean) => {
    setSelectAllNewStaffPermissions(checked);
    setNewStaff(prev => ({
      ...prev,
      permissions: checked ? permissions.map(p => p.id) : [],
    }));
  };

  const handleSelectAllNewStaffDashboard = (checked: boolean) => {
    setSelectAllNewStaffDashboard(checked);
    setNewStaff(prev => ({
      ...prev,
      dashboardModules: checked ? permissions.map(p => p.id) : [],
    }));
  };

  const addNewStaff = async () => {
    const validationErrors = validateStaff(newStaff);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the validation errors before saving');
      return;
    }
    
    // Check for duplicate phone or email
    const existingStaff = staff.find(s => 
      s.phone === newStaff.phone || 
      (newStaff.email && s.email === newStaff.email)
    );
    
    if (existingStaff) {
      if (existingStaff.phone === newStaff.phone) {
        setErrors({ phone: 'A staff member with this phone number already exists' });
      } else {
        setErrors({ email: 'A staff member with this email already exists' });
      }
      toast.error('Staff member already exists');
      return;
    }

    try {
      const salaryValue = parseFloat(newStaff.salary);
      const effectivePermissions = newStaff.permissions.length
        ? newStaff.permissions
        : getDefaultPermissionsForRole(newStaff.role);
      const effectiveDashboardModules = newStaff.dashboardModules.length
        ? newStaff.dashboardModules
        : getDefaultDashboardModulesForRole(newStaff.role);

      const createdStaff = await addStaff({
        name: newStaff.name.trim(),
        roleName: newStaff.role,
        phone: newStaff.phone.trim(),
        email: newStaff.email.trim() || undefined,
        pin: newStaff.pin,
        salary: salaryValue,
        permissions: effectivePermissions,
        dashboardModules: effectiveDashboardModules,
        joinDate: new Date().toISOString().split('T')[0],
        isActive: true,
      });

      toast.success('Staff member added successfully');
      addNotification({
        type: 'success',
        title: 'New Staff Added',
        message: `${createdStaff.name} has been added to the team`,
        moduleId: 'staff'
      });

      setNewStaff({
        name: '',
        role: '',
        phone: '',
        email: '',
        pin: '',
        salary: '',
        permissions: [],
        dashboardModules: []
      });
      setSelectAllNewStaffPermissions(false);
      setSelectAllNewStaffDashboard(false);
      setErrors({});
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error('Failed to add staff member');
      console.error('Add staff error:', error);
    }
  };

  const deleteStaffMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      const staffMember = staff.find(s => s.id === id);
      deleteStaff(id);
      
      toast.success('Staff member deleted successfully');
      addNotification({
        type: 'info',
        title: 'Staff Member Removed',
        message: `${staffMember?.name} has been removed from the team`,
        moduleId: 'staff'
      });
    } catch (error) {
      toast.error('Failed to delete staff member');
      console.error('Delete staff error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Manager': return 'bg-purple-500';
      case 'Cashier': return 'bg-blue-500';
      case 'Waiter': return 'bg-green-500';
      case 'Chef': return 'bg-orange-500';
      case 'Helper': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'Morning': return 'bg-yellow-100 text-yellow-800';
      case 'Evening': return 'bg-blue-100 text-blue-800';
      case 'Night': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = useMemo(() => {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.isActive !== false).length;
    const onDuty = shifts.filter(shift => shift.status === 'Active').length;
    const totalSalary = staff.reduce((sum, member) => sum + Number(member.salary ?? 0), 0);
    const avgSalary = totalStaff > 0 ? Math.round(totalSalary / totalStaff) : 0;

    return {
      totalStaff,
      activeStaff,
      onDuty,
      avgSalary,
    };
  }, [staff, shifts]);

  // Shift Management Functions - Using context functions
  const handleStartShift = async () => {
    if (!selectedStaffForShift) {
      toast.error('Select a staff member to start the shift');
      return;
    }

    if (!newShiftDetails.openingCash) {
      toast.error('Enter the opening cash amount');
      return;
    }

    try {
      const startTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

      await addShift({
        staffId: selectedStaffForShift,
        shiftType: newShiftDetails.shiftType,
        openingCash: Number(newShiftDetails.openingCash),
        startTime,
        status: 'Active',
        date: new Date().toISOString(),
      });

      const staffMember = staff.find(s => s.id === selectedStaffForShift);

      toast.success('Shift started successfully');
      addNotification({
        type: 'success',
        title: 'Shift Started',
        message: `${staffMember?.name ?? 'Staff'} started the ${newShiftDetails.shiftType} shift`,
        moduleId: 'staff',
      });

      setSelectedStaffForShift('');
      setNewShiftDetails({ shiftType: 'Morning', openingCash: '' });
    } catch (error) {
      toast.error('Failed to start shift');
      console.error('Start shift error:', error);
    }
  };

  const handleEndShift = async (shiftId: string) => {
    const closingCashInput = window.prompt('Enter closing cash amount', '0');
    if (closingCashInput === null) {
      return;
    }

    const totalSalesInput = window.prompt('Enter total sales amount', '0');
    if (totalSalesInput === null) {
      return;
    }

    const tipsInput = window.prompt('Enter tips amount', '0');
    if (tipsInput === null) {
      return;
    }

    const closingCash = Number(closingCashInput);
    const totalSales = Number(totalSalesInput);
    const tips = Number(tipsInput);

    try {
      const endTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
      const updatedShift = await updateShift(shiftId, {
        endTime,
        closingCash,
        totalSales,
        tips,
        status: 'Completed',
      });

      const staffMember = staff.find(s => s.id === updatedShift.staffId);

      toast.success('Shift ended successfully');
      addNotification({
        type: 'info',
        title: 'Shift Ended',
        message: `${staffMember?.name ?? 'Staff'} completed their shift`,
        moduleId: 'staff',
      });
    } catch (error) {
      toast.error('Failed to end shift');
      console.error('End shift error:', error);
    }
  };

  // Salary Payment Functions - Using context functions
  const handleAddSalaryPayment = async () => {
    if (!selectedStaffForPayment || !newPayment.amount || !newPayment.description || !newPayment.paidBy) {
      toast.error('Fill in all payment details');
      return;
    }

    try {
      const amountValue = parseFloat(newPayment.amount);
      const payment = await addSalaryPayment({
        staffId: selectedStaffForPayment,
        amount: amountValue,
        paymentType: newPayment.paymentType,
        description: newPayment.description,
        paidBy: newPayment.paidBy,
      });

      const staffMember = staff.find(s => s.id === selectedStaffForPayment);

      toast.success(`₹${amountValue.toLocaleString()} payment recorded`);
      addNotification({
        type: 'success',
        title: 'Payment Recorded',
        message: `${staffMember?.name ?? 'Staff'} received ${payment.paymentType.toLowerCase()}`,
        moduleId: 'staff',
      });

      setNewPayment({
        amount: '',
        paymentType: 'Full Salary',
        description: '',
        paidBy: ''
      });
      setSelectedStaffForPayment('');
    } catch (error) {
      toast.error('Failed to record salary payment');
      console.error('Add salary payment error:', error);
    }
  };

  const getActiveShiftForStaff = (staffId: string) => {
    return shifts.find(shift => shift.staffId === staffId && shift.status === 'Active');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff roles, shifts, and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Enter the details for the new staff member and assign their role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter staff name"
                    value={newStaff.name}
                    onChange={(e) => updateNewStaffField('name', e.target.value)}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newStaff.role} onValueChange={(value) => updateNewStaffField('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="mt-1 text-xs text-destructive">{errors.role}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+91 XXXXX XXXXX"
                    value={newStaff.phone}
                    onChange={(e) => updateNewStaffField('phone', e.target.value)}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@restaurant.com"
                    value={newStaff.email}
                    onChange={(e) => updateNewStaffField('email', e.target.value)}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pin">Login PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="4-digit PIN"
                    maxLength={4}
                    value={newStaff.pin}
                    onChange={(e) => updateNewStaffField('pin', e.target.value)}
                  />
                  {errors.pin && <p className="mt-1 text-xs text-destructive">{errors.pin}</p>}
                </div>
                <div>
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    type="number"
                    placeholder="Monthly salary"
                    value={newStaff.salary}
                    onChange={(e) => updateNewStaffField('salary', e.target.value)}
                  />
                  {errors.salary && <p className="mt-1 text-xs text-destructive">{errors.salary}</p>}
                </div>
              </div>
              <Tabs defaultValue="permissions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="permissions">Module Permissions</TabsTrigger>
                  <TabsTrigger value="dashboard">Dashboard Display</TabsTrigger>
                </TabsList>
                
                <TabsContent value="permissions" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Module Access Permissions</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-permissions-new"
                        checked={selectAllNewStaffPermissions}
                        onCheckedChange={(checked) => handleSelectAllNewStaffPermissions(Boolean(checked))}
                      />
                      <Label htmlFor="select-all-permissions-new" className="text-sm">Select All</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                    {['core', 'sales', 'operations', 'analytics', 'finance', 'admin'].map(category => {
                      const categoryPermissions = permissions.filter(p => p.category === category);
                      if (categoryPermissions.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-sm text-primary capitalize">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {categoryPermissions.map(perm => (
                              <div key={perm.id} className="flex items-start space-x-3 p-2 border rounded-lg">
                                <Checkbox
                                  id={perm.id}
                                  checked={newStaff.permissions.includes(perm.id)}
                                  onCheckedChange={(checked) => handleNewStaffPermissionChange(perm.id, Boolean(checked))}
                                />
                                <div className="flex-1 min-w-0">
                                  <Label htmlFor={perm.id} className="text-sm font-medium">{perm.label}</Label>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="dashboard" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Dashboard Modules</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all-dashboard-new"
                        checked={selectAllNewStaffDashboard}
                        onCheckedChange={(checked) => handleSelectAllNewStaffDashboard(Boolean(checked))}
                      />
                      <Label htmlFor="select-all-dashboard-new" className="text-sm">Select All</Label>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which modules should be visible on the dashboard for this staff member.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {permissions.map(perm => (
                      <div key={perm.id} className="flex items-start space-x-3 p-2 border rounded-lg">
                        <Checkbox
                          id={`dashboard-${perm.id}`}
                          checked={newStaff.dashboardModules.includes(perm.id)}
                          onCheckedChange={(checked) => handleNewStaffDashboardChange(perm.id, Boolean(checked))}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`dashboard-${perm.id}`} className="text-sm font-medium">{perm.label}</Label>
                          <p className="text-xs text-muted-foreground">Show on dashboard</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={addNewStaff}>Add Staff</Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalStaff}</div>
          <div className="text-sm text-muted-foreground">Total Staff</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeStaff}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.onDuty}</div>
          <div className="text-sm text-muted-foreground">On Duty</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">₹{stats.avgSalary.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Avg Salary</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search staff by name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleOptions.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
          <TabsTrigger value="shifts">Shift Management</TabsTrigger>
          <TabsTrigger value="payments">Salary Payments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Staff Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(staffMember => {
              const activeShift = getActiveShiftForStaff(staffMember.id);
              return (
                <Card key={staffMember.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className={`${getRoleColor(staffMember.role)} text-white`}>
                          {staffMember.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{staffMember.name}</h3>
                        <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch checked={staffMember.isActive} />
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{staffMember.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Salary:</span>
                      <span>₹{staffMember.salary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <div className="flex items-center space-x-2">
                        {staffMember.currentShift ? (
                          <Badge className={`text-xs ${getShiftColor(staffMember.currentShift)}`}>
                            {staffMember.currentShift}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Off Duty</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Performance:</span>
                      <div className="flex items-center space-x-1">
                        <span>{staffMember.performance.customerRating}/5</span>
                        <Award className="w-3 h-3 text-yellow-500" />
                      </div>
                    </div>
                  </div>

                  {activeShift && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <div className="text-xs text-blue-700">
                        Active Shift: {activeShift.startTime} • ₹{activeShift.openingCash} opening
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Role Management */}
        <TabsContent value="roles" className="p-0">
          <RoleManagement />
        </TabsContent>

        {/* Shift Management */}
        <TabsContent value="shifts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Start New Shift */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Start New Shift
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Staff Member</Label>
                  <Select value={selectedStaffForShift} onValueChange={setSelectedStaffForShift}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff
                        .filter(s => s.isActive !== false && !getActiveShiftForStaff(s.id))
                        .map(staffMember => (
                          <SelectItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.name} - {staffMember.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shift Type</Label>
                    <Select
                      value={newShiftDetails.shiftType}
                      onValueChange={(value) => setNewShiftDetails(prev => ({ ...prev, shiftType: value as 'Morning' | 'Evening' | 'Night' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning (9 AM - 5 PM)</SelectItem>
                        <SelectItem value="Evening">Evening (2 PM - 10 PM)</SelectItem>
                        <SelectItem value="Night">Night (6 PM - 2 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Opening Cash</Label>
                    <Input
                      type="number"
                      placeholder="Amount in ₹"
                      value={newShiftDetails.openingCash}
                      onChange={(e) => setNewShiftDetails(prev => ({ ...prev, openingCash: e.target.value }))}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedStaffForShift || !newShiftDetails.openingCash}
                  onClick={handleStartShift}
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Shift
                </Button>
              </CardContent>
            </Card>

            {/* Active Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="w-5 h-5" />
                  Active Shifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shifts.filter(shift => shift.status === 'Active').map(shift => {
                    const staffMember = staff.find(s => s.id === shift.staffId);
                    return (
                      <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{staffMember?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {shift.shiftType} • Started: {shift.startTime}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Opening: ₹{shift.openingCash}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleEndShift(shift.id)}>
                            <StopCircle className="w-4 h-4" />
                            End
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {shifts.filter(shift => shift.status === 'Active').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No active shifts
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Shifts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shifts.filter(shift => shift.status === 'Completed').slice(0, 5).map(shift => {
                  const staffMember = staff.find(s => s.id === shift.staffId);
                  return (
                    <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="font-medium">{staffMember?.name}</div>
                            <div className="text-sm text-muted-foreground">{shift.shiftType}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Duration</div>
                            <div>{shift.startTime} - {shift.endTime}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Sales</div>
                            <div>₹{shift.totalSales.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Tips</div>
                            <div>₹{shift.tips}</div>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Payments */}
        <TabsContent value="payments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Record Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Staff Member</Label>
                  <Select value={selectedStaffForPayment} onValueChange={setSelectedStaffForPayment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.filter(s => s.isActive).map(staffMember => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.name} - {staffMember.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Type</Label>
                    <Select value={newPayment.paymentType} onValueChange={(value: any) => setNewPayment(prev => ({ ...prev, paymentType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full Salary">Full Salary</SelectItem>
                        <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                        <SelectItem value="Advance">Advance</SelectItem>
                        <SelectItem value="Bonus">Bonus</SelectItem>
                        <SelectItem value="Overtime">Overtime</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input 
                      type="number" 
                      placeholder="Amount in ₹"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Payment description"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Paid By</Label>
                  <Input 
                    placeholder="Name of person making payment"
                    value={newPayment.paidBy}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, paidBy: e.target.value }))}
                  />
                </div>
                <Button className="w-full" onClick={handleAddSalaryPayment}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{salaryPayments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Total Paid</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        ₹{salaryPayments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-orange-700">Pending</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Payments</h4>
                    {salaryPayments.slice(0, 3).map(payment => {
                      const staffMember = staff.find(s => s.id === payment.staffId);
                      return (
                        <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{staffMember?.name}</div>
                            <div className="text-xs text-muted-foreground">{payment.paymentType}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">₹{payment.amount.toLocaleString()}</div>
                            <Badge variant={payment.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salaryPayments.map(payment => {
                  const staffMember = staff.find(s => s.id === payment.staffId);
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <div className="font-medium">{staffMember?.name}</div>
                            <div className="text-sm text-muted-foreground">{staffMember?.role}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div>{payment.paymentType}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Amount</div>
                            <div>₹{payment.amount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Date</div>
                            <div>{payment.paymentDate}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge variant={payment.status === 'Completed' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {payment.description}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map(staffMember => (
              <Card key={staffMember.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className={`${getRoleColor(staffMember.role)} text-white`}>
                          {staffMember.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">{staffMember.role}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{staffMember.performance.ordersHandled}</div>
                        <div className="text-xs text-blue-700">Orders Handled</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{staffMember.performance.avgOrderTime}m</div>
                        <div className="text-xs text-green-700">Avg Order Time</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Customer Rating</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{staffMember.performance.customerRating}/5</span>
                          <Award className="w-4 h-4 text-yellow-500" />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Salary</span>
                        <span className="font-medium">₹{staffMember.salaryDetails.totalSalary.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Join Date</span>
                        <span className="font-medium">{staffMember.joinDate}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Salary Breakdown</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Base Salary:</span>
                          <span>₹{staffMember.salaryDetails.baseSalary.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allowances:</span>
                          <span>₹{staffMember.salaryDetails.allowances.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overtime:</span>
                          <span>₹{staffMember.salaryDetails.overtime.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Deductions:</span>
                          <span>-₹{staffMember.salaryDetails.deductions.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}