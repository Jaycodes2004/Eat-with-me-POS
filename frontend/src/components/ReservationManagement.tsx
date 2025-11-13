import { useState, useEffect } from 'react';
import { useAppContext, Reservation, CreateReservationPayload } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { 
  CalendarDays, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  Eye,
  MessageSquare,
  Utensils,
  Gift,
  CreditCard,
  User,
  Building,
  Smartphone,
  TrendingUp,
  Activity,
  Loader2
} from 'lucide-react';

// Using Reservation interface from AppContext

interface ReservationManagementProps {
  onNavigate?: (screen: string) => void;
  userRole?: string;
}

export function ReservationManagement({ onNavigate, userRole }: ReservationManagementProps) {
  const { 
    tables, 
    getAvailableTables, 
    updateTable,
    settings,
    reservations,
    addReservation,
    updateReservation,
    deleteReservation,
    getReservationsByDate,
    getReservationsByTable,
    getReservationsByStatus
  } = useAppContext();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('today');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState(getAvailableTables());
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [showTableSuggestions, setShowTableSuggestions] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [activeReservationActionId, setActiveReservationActionId] = useState<string | null>(null);
  
  const [newReservation, setNewReservation] = useState<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    date: string;
    time: string;
    partySize: number;
    specialRequests: string;
    occasion: string;
    source: Reservation['source'];
    priority: Reservation['priority'];
  }>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    partySize: 2,
    specialRequests: '',
    occasion: '',
    source: 'walk-in',
    priority: 'normal'
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Using reservations from context - no local state needed

  const timeSlots = [
    '18:00', '18:15', '18:30', '18:45',
    '19:00', '19:15', '19:30', '19:45',
    '20:00', '20:15', '20:30', '20:45',
    '21:00', '21:15', '21:30', '21:45',
    '22:00', '22:15', '22:30'
  ];

  const sources = [
    { value: 'walk-in', label: 'Walk-in', icon: User },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'online', label: 'Online', icon: Building },
    { value: 'app', label: 'Mobile App', icon: Smartphone }
  ];

  const priorities = [
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'vip', label: 'VIP', color: 'bg-purple-100 text-purple-800' }
  ];

  const occasions = [
    'Birthday', 'Anniversary', 'Business Meeting', 'Date Night',
    'Family Gathering', 'Celebration', 'Corporate Event', 'Other'
  ];

  // Filter reservations based on active tab and filters
  const getFilteredReservations = () => {
    let filtered = reservations;

    // Filter by date based on active tab
    if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(res => res.date === today);
    } else if (activeTab === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      filtered = filtered.filter(res => res.date === tomorrowStr);
    } else if (activeTab === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(res => res.date > today);
    } else if (activeTab === 'history') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(res => res.date < today || res.status === 'completed');
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(res => res.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(res =>
        res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.customerPhone.includes(searchTerm) ||
        res.id.includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: Reservation['status']) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'seated': 'bg-green-100 text-green-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800',
      'auto-assigned': 'bg-purple-100 text-purple-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Check table availability for selected time
  const checkAvailability = () => {
    if (!selectedTimeSlot || !newReservation.date) return;

    setIsCheckingAvailability(true);
    
    // Simulate availability check
    setTimeout(() => {
      const available = getAvailableTables().filter(table => 
        table.capacity >= newReservation.partySize
      );
      setAvailableTables(available);
      setShowTableSuggestions(true);
      setIsCheckingAvailability(false);
    }, 1000);
  };

  // Handle reservation creation
  const handleCreateReservation = async () => {
    const timeSlot = selectedTimeSlot || newReservation.time;

    if (!newReservation.customerName.trim() || !newReservation.customerPhone.trim() || !timeSlot) {
      toast.error('Please fill in the guest name, phone number, and time slot.');
      return;
    }

    const payload: CreateReservationPayload = {
      customerName: newReservation.customerName.trim(),
      customerPhone: newReservation.customerPhone.trim(),
      customerEmail: newReservation.customerEmail?.trim() || undefined,
      date: newReservation.date,
      time: timeSlot,
      partySize: Number(newReservation.partySize),
      specialRequests: newReservation.specialRequests || undefined,
      occasion: newReservation.occasion || undefined,
      source: newReservation.source,
      priority: newReservation.priority,
      status: 'pending'
    };

    setIsCreatingReservation(true);

    try {
      await addReservation(payload);
      toast.success('Reservation created successfully.');

      setNewReservation({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        partySize: 2,
        specialRequests: '',
        occasion: '',
        source: 'walk-in',
        priority: 'normal'
      });
      setSelectedTimeSlot('');
      setShowTableSuggestions(false);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Failed to create reservation', error);
      toast.error('Failed to create reservation. Please try again.');
    } finally {
      setIsCreatingReservation(false);
    }
  };

  const updateReservationStatus = async (id: string, status: Reservation['status']) => {
    setActiveReservationActionId(id);
    try {
      await updateReservation(id, { status });
      toast.success(`Reservation marked as ${status}.`);
    } catch (error) {
      console.error('Failed to update reservation status', error);
      toast.error('Unable to update reservation status.');
    } finally {
      setActiveReservationActionId(null);
    }
  };

  // Get statistics
  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(res => res.date === today);
    
    return {
      total: todayReservations.length,
      confirmed: todayReservations.filter(res => res.status === 'confirmed').length,
      seated: todayReservations.filter(res => res.status === 'seated').length,
      completed: todayReservations.filter(res => res.status === 'completed').length,
      pending: todayReservations.filter(res => res.status === 'pending').length
    };
  };

  const stats = getStats();
  const filteredReservations = getFilteredReservations();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Reservation Management</h1>
          <p className="text-muted-foreground">Manage table reservations and bookings</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
              <DialogDescription>
                Add a new table reservation with customer details and preferences
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={newReservation.customerName}
                  onChange={(e) => setNewReservation({...newReservation, customerName: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={newReservation.customerPhone}
                  onChange={(e) => setNewReservation({...newReservation, customerPhone: e.target.value})}
                  placeholder="+91 xxxxx xxxxx"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Optional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newReservation.customerEmail}
                  onChange={(e) => setNewReservation({...newReservation, customerEmail: e.target.value})}
                  placeholder="customer@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partySize">Party Size</Label>
                <Select 
                  value={newReservation.partySize.toString()} 
                  onValueChange={(value: string) => setNewReservation(prev => ({...prev, partySize: parseInt(value, 10)}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(size => (
                      <SelectItem key={size} value={size.toString()}>{size} {size === 1 ? 'person' : 'people'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReservation.date}
                  onChange={(e) => setNewReservation({...newReservation, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Time Slot</Label>
                <Select
                  value={selectedTimeSlot}
                  onValueChange={(value: string) => {
                    setSelectedTimeSlot(value);
                    setNewReservation(prev => ({ ...prev, time: value }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select 
                  value={newReservation.source} 
                  onValueChange={(value: Reservation['source']) => setNewReservation(prev => ({...prev, source: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map(source => (
                      <SelectItem key={source.value} value={source.value}>
                        <div className="flex items-center gap-2">
                          <source.icon className="w-4 h-4" />
                          {source.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newReservation.priority} 
                  onValueChange={(value: Reservation['priority']) => setNewReservation(prev => ({...prev, priority: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <Badge className={priority.color}>{priority.label}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="occasion">Occasion (Optional)</Label>
                <Select 
                  value={newReservation.occasion} 
                  onValueChange={(value: string) => setNewReservation(prev => ({...prev, occasion: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occasion" />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map(occasion => (
                      <SelectItem key={occasion} value={occasion}>{occasion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={newReservation.specialRequests}
                  onChange={(e) => setNewReservation({...newReservation, specialRequests: e.target.value})}
                  placeholder="Any special requirements, dietary restrictions, or preferences..."
                  rows={3}
                />
              </div>
            </div>
            
            {selectedTimeSlot && (
              <div className="space-y-4">
                <Button 
                  onClick={checkAvailability} 
                  disabled={isCheckingAvailability}
                  variant="outline" 
                  className="w-full"
                >
                  {isCheckingAvailability ? 'Checking...' : 'Check Table Availability'}
                </Button>
                
                {showTableSuggestions && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Found {availableTables.length} available tables for {newReservation.partySize} people at {selectedTimeSlot}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isCreatingReservation}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleCreateReservation()}
                disabled={isCreatingReservation}
                className="bg-primary hover:bg-primary/90"
              >
                {isCreatingReservation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Create Reservation'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Seated</p>
                <p className="text-2xl font-bold">{stats.seated}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Utensils className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, phone, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="seated">Seated</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="space-y-4">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No reservations found</h3>
                    <p className="text-muted-foreground">No reservations match your current filters.</p>
                  </div>
                ) : (
                  filteredReservations.map((reservation) => {
                    const isUpdatingStatus = activeReservationActionId === reservation.id;

                    return (
                      <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="font-medium">{reservation.customerName}</h3>
                              <Badge className={getStatusBadge(reservation.status)}>
                                {reservation.status}
                              </Badge>
                              {reservation.priority !== 'normal' && (
                                <Badge className={priorities.find(p => p.value === reservation.priority)?.color}>
                                  {priorities.find(p => p.value === reservation.priority)?.label}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{new Date(reservation.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{reservation.time}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>{reservation.partySize} people</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4" />
                                <span>{reservation.customerPhone}</span>
                              </div>
                            </div>
                            
                            {reservation.specialRequests && (
                              <div className="mt-3 p-3 bg-muted rounded-lg">
                                <p className="text-sm">{reservation.specialRequests}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {reservation.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => void updateReservationStatus(reservation.id, 'confirmed')}
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={isUpdatingStatus}
                                >
                                  {isUpdatingStatus ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Confirm
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => void updateReservationStatus(reservation.id, 'cancelled')}
                                  disabled={isUpdatingStatus}
                                >
                                  {isUpdatingStatus ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Cancel
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                            {reservation.status === 'confirmed' && (
                              <Button 
                                size="sm" 
                                onClick={() => void updateReservationStatus(reservation.id, 'seated')}
                                className="bg-blue-600 hover:bg-blue-700"
                                disabled={isUpdatingStatus}
                              >
                                {isUpdatingStatus ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Users className="w-4 h-4 mr-1" />
                                    Seat
                                  </>
                                )}
                              </Button>
                            )}
                            {reservation.status === 'seated' && (
                              <Button 
                                size="sm" 
                                onClick={() => void updateReservationStatus(reservation.id, 'completed')}
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={isUpdatingStatus}
                              >
                                {isUpdatingStatus ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Complete
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}