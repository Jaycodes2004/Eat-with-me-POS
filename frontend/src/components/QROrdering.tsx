import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAppContext } from '../contexts/AppContext';
import { CustomerOrderingInterface } from './CustomerOrderingInterface';
import { toast } from 'sonner@2.0.3';
import { 
  QrCode, 
  Smartphone, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Clock,
  CheckCircle,
  Phone,
  MessageCircle,
  Eye,
  IndianRupee,
  Download,
  Printer,
  Table2,
  Users,
  Trash2
} from 'lucide-react';

interface QROrder {
  id: string;
  tableNumber: string;
  customerPhone: string;
  customerName: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served';
  timestamp: string;
}

interface QRTable {
  id: string;
  number: string;
  name: string;
  capacity: number;
  qrCodeGenerated: boolean;
  assignedBy: string;
  createdAt: string;
}

export function QROrdering() {
  const { settings, tables, orders, addOrder, updateOrder, addTable, deleteTable, currentUser } = useAppContext();
  const [activeTab, setActiveTab] = useState<'orders' | 'tables'>('orders');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  // Use tables from AppContext and add QR-specific properties
  const qrTables = tables.map(table => ({
    id: table.id,
    number: `T${table.number.toString().padStart(2, '0')}`,
    name: `Table ${table.number}`,
    capacity: table.capacity,
    qrCodeGenerated: true, // In real app, this would be stored in table metadata
    assignedBy: currentUser?.name || 'Admin',
    createdAt: '2024-08-20' // In real app, this would be actual creation date
  }));

  const [newTable, setNewTable] = useState({
    number: '',
    name: '',
    capacity: 4
  });

  // Get QR orders from AppContext (orders placed via QR code)
  const activeOrders = orders
    .filter(order => order.orderSource === 'qr-code')
    .map(order => ({
      id: order.id,
      tableNumber: `T${order.tableNumber?.toString().padStart(2, '0')}` || 'N/A',
      customerPhone: order.customerPhone || '',
      customerName: order.customerName || '',
      items: order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: order.totalAmount,
      status: order.status === 'new' ? 'pending' : 
             order.status === 'served' ? 'served' :
             order.status === 'ready' ? 'ready' :
             order.status === 'preparing' ? 'preparing' : 'confirmed',
      timestamp: order.orderTime
    }));

  const [showCustomerView, setShowCustomerView] = useState(false);
  const [customerStep, setCustomerStep] = useState<'phone' | 'otp' | 'ordering'>('phone');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedTable, setSelectedTable] = useState('T01');


  const updateOrderStatus = (orderId: string, newStatus: QROrder['status']) => {
    // Map QR status to Order status
    const statusMap: Record<QROrder['status'], 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'> = {
      'pending': 'new',
      'confirmed': 'new',
      'preparing': 'preparing',
      'ready': 'ready',
      'served': 'served'
    };
    
    updateOrder(orderId, { status: statusMap[newStatus] });
  };

  const getStatusColor = (status: QROrder['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendOTP = () => {
    if (customerPhone.length >= 10) {
      // Simulate OTP sending
      alert(`OTP sent to ${customerPhone}: 123456`);
      setCustomerStep('otp');
    }
  };

  const handleVerifyOTP = () => {
    if (otp === '123456') { // Mock verification
      setCustomerStep('ordering');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };



  const generateQRCode = (tableId: string) => {
    // In a real app, you would update the table metadata to mark QR as generated
    // For now, we'll just generate the QR code data
    const qrData = `${window.location.origin}/order?table=${tableId}`;
    
    // Here you would actually generate the QR code image
    // For demo purposes, we'll just show a success message
    const table = qrTables.find(t => t.id === tableId);
    alert(`QR Code generated for ${table?.name}!\nQR Data: ${qrData}`);
  };

  const addNewTable = async () => {
    const trimmedNumber = newTable.number.trim();
    if (!trimmedNumber) {
      toast.error('Enter a table number');
      return;
    }

    const tableNumber = Number(trimmedNumber);
    if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
      toast.error('Invalid table number');
      return;
    }

    if (tables.some(table => table.number === tableNumber)) {
      toast.error(`Table ${tableNumber} already exists`);
      return;
    }

    const capacity = Number(newTable.capacity) || 4;

    try {
      await addTable({
        number: tableNumber,
        capacity,
        status: 'free',
      });

      toast.success(`Table ${tableNumber} added for QR ordering`);
      setNewTable({ number: '', name: '', capacity });
      setShowQRGenerator(false);
    } catch (error) {
      toast.error('Failed to add table');
      console.error('QR add table error:', error);
    }
  };

  const deleteQRTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) {
      return;
    }

    try {
      await deleteTable(tableId);
      toast.success('Table removed');
    } catch (error) {
      toast.error('Failed to delete table');
      console.error('QR delete table error:', error);
    }
  };

  const downloadQRCode = (table: QRTable) => {
    // In a real implementation, this would generate and download a QR code image
    const qrData = `${window.location.origin}/order?table=${table.id}`;
    alert(`Downloading QR code for ${table.name}\nQR Data: ${qrData}`);
  };

  const printQRCode = (table: QRTable) => {
    // In a real implementation, this would send the QR code to a printer
    alert(`Printing QR code for ${table.name}`);
  };

  if (showCustomerView) {
    // If customer has completed OTP verification, show the full ordering interface
    if (customerStep === 'ordering') {
      return (
        <CustomerOrderingInterface 
          tableNumber={selectedTable}
          onBack={() => {
            setShowCustomerView(false);
            setCustomerStep('phone');
            setCustomerPhone('');
            setCustomerName('');
            setOtp('');
          }}
          onOrderPlace={(order) => {
            const newOrder: QROrder = {
              id: Date.now().toString(),
              tableNumber: order.tableNumber,
              customerPhone: customerPhone,
              customerName: customerName,
              items: order.items,
              total: order.total,
              status: 'pending',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            // Add order to AppContext with proper QR source
            const contextOrder = {
              id: newOrder.id,
              tableNumber: parseInt(order.tableNumber.replace('T', '')) || 1,
              orderSource: 'qr-code' as const,
              customerName: customerName,
              customerPhone: customerPhone,
              items: order.items,
              status: 'new' as const,
              orderTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              orderDate: new Date().toISOString().split('T')[0],
              estimatedTime: 20,
              priority: 'normal' as const,
              deliveryType: 'dine-in' as const,
              totalAmount: order.total,
              subtotal: order.total * 0.9, // Assuming 10% tax
              taxes: [{ name: 'GST', rate: 10, amount: order.total * 0.1 }]
            };
            
            addOrder(contextOrder);
            
            // Reset customer view state
            setShowCustomerView(false);
            setCustomerStep('phone');
            setCustomerPhone('');
            setCustomerName('');
            setOtp('');
            
            alert('Order placed successfully! You will receive updates via WhatsApp.');
          }}
        />
      );
    }

    // Show phone/OTP verification flow
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-primary-foreground">🍽️</span>
            </div>
            <h1 className="text-xl font-bold">Welcome to {settings.restaurantName}</h1>
            <p className="text-sm text-muted-foreground">Table {selectedTable} - Order Online</p>
          </div>

          {customerStep === 'phone' && (
            <Card>
              <CardHeader>
                <CardTitle>Enter Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Name</label>
                  <Input
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleSendOTP}
                  disabled={customerPhone.length < 10 || !customerName.trim()}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send OTP
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  We'll send you an OTP for verification
                </p>
              </CardContent>
            </Card>
          )}

          {customerStep === 'otp' && (
            <Card>
              <CardHeader>
                <CardTitle>Verify OTP</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit OTP sent to {customerPhone}
                </p>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP Code</label>
                  <Input
                    type="number"
                    placeholder="Enter 6-digit OTP (123456)"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    For demo: use 123456
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setCustomerStep('phone')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6}
                    className="flex-1"
                  >
                    Verify & Continue
                  </Button>
                </div>
                
                <div className="text-center">
                  <Button variant="link" size="sm" onClick={handleSendOTP}>
                    Resend OTP
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">QR Code Ordering</h1>
          <p className="text-muted-foreground">Manage contactless dining experience</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              // Set to first available table when previewing
              const firstTable = qrTables[0];
              if (firstTable) {
                setSelectedTable(firstTable.number);
              }
              setShowCustomerView(true);
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Customer View
          </Button>
          <Dialog open={showQRGenerator} onOpenChange={setShowQRGenerator}>
            <DialogTrigger asChild>
              <Button>
                <QrCode className="w-4 h-4 mr-2" />
                Manage QR Tables
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Table</DialogTitle>
                <DialogDescription>
                  Create a new table and assign QR code
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Table Number</label>
                  <Input
                    type="number"
                    placeholder="e.g., 4, 5, 6"
                    value={newTable.number}
                    onChange={(e) => setNewTable({...newTable, number: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter just the number (e.g., 4 for Table 4)
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <Select value={newTable.capacity.toString()} onValueChange={(value) => setNewTable({...newTable, capacity: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 persons</SelectItem>
                      <SelectItem value="4">4 persons</SelectItem>
                      <SelectItem value="6">6 persons</SelectItem>
                      <SelectItem value="8">8 persons</SelectItem>
                      <SelectItem value="10">10 persons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowQRGenerator(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={addNewTable}
                    disabled={!newTable.number.trim()}
                  >
                    Add Table
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('orders')}
          className="rounded-b-none"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Orders
        </Button>
        <Button
          variant={activeTab === 'tables' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('tables')}
          className="rounded-b-none"
        >
          <Table2 className="w-4 h-4 mr-2" />
          QR Tables
        </Button>
      </div>

      {activeTab === 'tables' && (
        <div className="space-y-6">
          {/* QR Tables Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 size={20} />
                  QR Code Tables
                </div>
                <Badge variant="secondary">
                  {qrTables.length} tables
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {qrTables.map((table) => (
                  <Card key={table.id} className={`p-4 ${table.qrCodeGenerated ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{table.name}</h4>
                          <p className="text-sm text-muted-foreground">{table.number}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span className="text-sm">{table.capacity}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {table.qrCodeGenerated ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            QR Generated
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock size={12} className="mr-1" />
                            Pending QR
                          </Badge>
                        )}
                      </div>

                      {table.qrCodeGenerated && (
                        <div className="text-xs text-muted-foreground">
                          <p>Created by: {table.assignedBy}</p>
                          <p>Date: {table.createdAt}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!table.qrCodeGenerated ? (
                          <Button 
                            size="sm" 
                            onClick={() => generateQRCode(table.id)}
                            className="flex-1"
                          >
                            <QrCode size={14} className="mr-1" />
                            Generate QR
                          </Button>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => downloadQRCode(table)}
                              className="flex-1"
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => printQRCode(table)}
                              className="flex-1"
                            >
                              <Printer size={14} className="mr-1" />
                              Print
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteQRTable(table.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              {qrTables.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Table2 size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No tables created yet</p>
                  <p className="text-sm">Create your first table to start QR ordering</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{activeOrders.length}</div>
                <div className="text-sm text-muted-foreground">Active Orders</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {activeOrders.filter(o => o.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {activeOrders.filter(o => o.status === 'preparing').length}
                </div>
                <div className="text-sm text-muted-foreground">Preparing</div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {activeOrders.filter(o => o.status === 'ready').length}
                </div>
                <div className="text-sm text-muted-foreground">Ready</div>
              </div>
            </Card>
          </div>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Active QR Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No active QR orders</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <Card key={order.id} className="p-4 border">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">Table {order.tableNumber}</h4>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{order.timestamp}</span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Customer:</span> {order.customerName}</p>
                            <p><span className="font-medium">Phone:</span> {order.customerPhone}</p>
                          </div>
                          
                          <div className="mt-2">
                            <h5 className="font-medium text-sm mb-1">Items:</h5>
                            <div className="text-sm text-muted-foreground space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span>₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between font-semibold text-sm">
                              <span>Total:</span>
                              <span>₹{order.total}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 min-w-[120px]">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              className="w-full"
                            >
                              Confirm
                            </Button>
                          )}
                          
                          {order.status === 'confirmed' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="w-full"
                            >
                              Start Preparing
                            </Button>
                          )}
                          
                          {order.status === 'preparing' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="w-full"
                            >
                              Mark Ready
                            </Button>
                          )}
                          
                          {order.status === 'ready' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateOrderStatus(order.id, 'served')}
                              className="w-full"
                            >
                              Mark Served
                            </Button>
                          )}

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const message = `Hi ${order.customerName}, your order status: ${order.status.toUpperCase()}. Total: ₹${order.total}`;
                              const whatsappUrl = `https://wa.me/${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                              window.open(whatsappUrl, '_blank');
                            }}
                            className="w-full"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}