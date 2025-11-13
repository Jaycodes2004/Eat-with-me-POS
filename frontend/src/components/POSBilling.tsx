import { useState, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Printer, 
  FileText,
  Trash2,
  IndianRupee,
  Users,
  ShoppingBag,
  Phone,
  MessageCircle,
  User,
  Table,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderDetails {
  type: 'dine-in' | 'takeaway' | null;
  tableNumber?: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'split' | null;
  referralCode?: string;
}

export function POSBilling() {
  const { 
    tables, 
    menuItems: contextMenuItems, 
    settings, 
    calculateTaxes,
    updateTable,
    getTableById,
    getAvailableTables,
    addOrder,
    addCustomer,
    updateCustomer,
    customers,
    awardLoyaltyPoints,
    calculateLoyaltyTier,
    generateReferralCode,
    handleReferral,
    addNotification
  } = useAppContext();
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showOrderTypeDialog, setShowOrderTypeDialog] = useState(false);
  const [showCustomerDetailsDialog, setShowCustomerDetailsDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    type: null,
    customerName: '',
    customerPhone: '',
    paymentMethod: null,
    referralCode: ''
  });

  // Get unique categories from menu items
  const categories = [...new Set(contextMenuItems.map(item => item.category))];
  
  // Set initial category to first available category if not already set
  useEffect(() => {
    if (categories.length > 0 && (!selectedCategory || !categories.includes(selectedCategory))) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);
  
  // Use menu items from context
  const menuItems = contextMenuItems;
  const filteredItems = menuItems.filter(item => item.category === selectedCategory && item.available);
  
  // Get available tables (only free tables should be available for new orders)
  const availableTables = tables.map(table => ({
    id: table.id,
    name: `Table ${table.number}`,
    number: table.number,
    isOccupied: table.status !== 'free', // Any status other than 'free' should be considered occupied/unavailable
    status: table.status,
    capacity: table.capacity,
    customer: table.customer,
    waiter: table.waiter,
    statusDisplay: table.status === 'occupied' ? 'Occupied' :
                   table.status === 'reserved' ? 'Reserved' : 'Available'
  }));

  // Debug: Log table statuses for troubleshooting
  useEffect(() => {
    console.log('POS Billing - Table Data:', tables.map(t => ({
      number: t.number,
      status: t.status,
      isOccupied: t.status !== 'free'
    })));
  }, [tables]);

  // Set default category to first available category
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const addToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, increment: boolean) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate taxes based on menu items and settings
  const taxCalculation = cart.reduce((acc, item) => {
    const menuItem = contextMenuItems.find(mi => mi.id === item.id);
    const itemTotal = item.price * item.quantity;
    const itemTaxCategory = menuItem?.taxCategory || settings.defaultTaxCategory;
    const { taxes, totalTax } = calculateTaxes(itemTotal, itemTaxCategory);
    
    acc.totalTax += totalTax;
    taxes.forEach(tax => {
      const existingTax = acc.taxes.find(t => t.name === tax.name);
      if (existingTax) {
        existingTax.amount += tax.amount;
      } else {
        acc.taxes.push({ ...tax });
      }
    });
    
    return acc;
  }, { taxes: [] as Array<{name: string, rate: number, amount: number}>, totalTax: 0 });

  const total = subtotal + taxCalculation.totalTax;

  const startNewOrder = () => {
    if (cart.length === 0) {
      setShowOrderTypeDialog(true);
    } else {
      // If cart has items, proceed to customer details
      setShowCustomerDetailsDialog(true);
    }
  };

  const handleOrderTypeSelect = (type: 'dine-in' | 'takeaway') => {
    setOrderDetails(prev => ({ ...prev, type }));
    setShowOrderTypeDialog(false);
    
    if (type === 'dine-in') {
      // Show table selection or proceed
      setShowCustomerDetailsDialog(true);
    } else {
      setShowCustomerDetailsDialog(true);
    }
  };

  const handleTableSelect = async (tableId: string) => {
    const table = getTableById(tableId);
    if (table) {
      setOrderDetails(prev => ({ 
        ...prev, 
        tableNumber: `Table ${table.number}` 
      }));
      
      // Update table status to occupied if not already
      if (table.status === 'free') {
        await updateTable(tableId, {
          status: 'occupied',
          lastOrderAt: new Date().toISOString()
        });
      }
    }
  };

  const handlePaymentMethodSelect = (method: 'cash' | 'card' | 'upi' | 'split') => {
    setOrderDetails(prev => ({ ...prev, paymentMethod: method }));
    setShowPaymentDialog(false);
    setShowInvoiceDialog(true);
  };

  const handleCompleteOrder = async () => {
    // Create the order object
    const newOrder = {
      id: `ORD${Date.now()}`,
      tableNumber: orderDetails.type === 'dine-in' && orderDetails.tableNumber 
        ? parseInt(orderDetails.tableNumber.replace('Table ', '')) 
        : undefined,
      orderSource: orderDetails.type === 'dine-in' ? 'dine-in' as const : 'takeaway' as const,
      customerName: orderDetails.customerName,
      customerPhone: orderDetails.customerPhone,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        category: item.category
      })),
      status: 'completed' as const,
      orderTime: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      priority: 'normal' as const,
      waiter: 'POS System',
      deliveryType: orderDetails.type || 'takeaway',
      paymentMethod: orderDetails.paymentMethod || 'cash',
      totalAmount: total,
      subtotal: subtotal,
      taxes: taxCalculation.taxes,
      completedAt: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };

    // Add the order to context
    addOrder(newOrder);

    // Add or update customer if provided
    if (orderDetails.customerName && orderDetails.customerPhone) {
      const existingCustomer = customers.find(c => c.phone === orderDetails.customerPhone);
      if (existingCustomer) {
        // Award loyalty points for existing customer
        const pointsAwarded = awardLoyaltyPoints(existingCustomer.id, total);
        
        // Show notification
        addNotification({
          title: 'Loyalty Points Earned!',
          message: `${existingCustomer.name} earned ${pointsAwarded} points on this order`,
          type: 'success'
        });
      } else {
        // Add new customer with loyalty program
        const newCustomerId = `CUST${Date.now()}`;
        const referralCode = generateReferralCode(newCustomerId);
        const tier = calculateLoyaltyTier(total);
        
        addCustomer({
          id: newCustomerId,
          name: orderDetails.customerName,
          phone: orderDetails.customerPhone,
          email: '',
          joinDate: new Date().toISOString().split('T')[0],
          totalOrders: 1,
          totalSpent: total,
          loyaltyPoints: Math.floor(total), // 1 point per rupee
          loyaltyTier: tier,
          lastVisit: new Date().toISOString().split('T')[0],
          averageRating: 0,
          tags: ['New Customer'],
          status: 'active',
          referralCode: referralCode,
          referralCount: 0
        });
        
        // Handle referral if code was provided
        if (orderDetails.referralCode) {
          handleReferral(newCustomerId, orderDetails.referralCode);
        }
        
        // Show notification for new customer
        addNotification({
          title: 'New Customer Added!',
          message: `${orderDetails.customerName} joined loyalty program with ${Math.floor(total)} points${orderDetails.referralCode ? ' + referral bonus!' : ''}`,
          type: 'success'
        });
      }
    }
    
    // Free up the table if it was a dine-in order
    if (orderDetails.type === 'dine-in' && orderDetails.tableNumber) {
      const tableNumber = parseInt(orderDetails.tableNumber.replace('Table ', ''));
      const table = tables.find(t => t.number === tableNumber);
      if (table) {
        await updateTable(table.id, {
          status: 'free',
          guests: undefined,
          currentOrderId: null,
          currentBillId: null,
          lastOrderAt: new Date().toISOString()
        });
      }
    }
    
    // Success message
    alert('Order completed and saved successfully!');
    
    // Clear the cart and reset order details
    setCart([]);
    setOrderDetails({
      type: null,
      customerName: '',
      customerPhone: '',
      paymentMethod: null,
      referralCode: ''
    });
    setShowInvoiceDialog(false);
  };

  const sendWhatsAppInvoice = () => {
    const message = `Hi ${orderDetails.customerName}, your order total is ${settings.currencySymbol}${total.toFixed(2)}. Thank you for visiting us!`;
    const whatsappUrl = `https://wa.me/91${orderDetails.customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadExcel = () => {
    const invoiceData = {
      'Invoice Details': [
        ['Restaurant Name', 'Eat With Me'],
        ['Order Type', orderDetails.type === 'dine-in' ? 'Dine-In' : 'Takeaway'],
        ['Table Number', orderDetails.tableNumber || 'N/A'],
        ['Customer Name', orderDetails.customerName || 'Walk-in Customer'],
        ['Customer Phone', orderDetails.customerPhone || 'N/A'],
        ['Payment Method', orderDetails.paymentMethod?.toUpperCase() || 'N/A'],
        ['Date & Time', new Date().toLocaleString()],
        ['Invoice #', `INV-${Date.now()}`],
        [],
        ['Item Name', 'Quantity', 'Unit Price', 'Total Price']
      ]
    };

    // Add cart items
    cart.forEach(item => {
      invoiceData['Invoice Details'].push([
        item.name,
        item.quantity.toString(),
        `${settings.currencySymbol}${item.price.toFixed(2)}`,
        `${settings.currencySymbol}${(item.price * item.quantity).toFixed(2)}`
      ]);
    });

    // Add totals
    invoiceData['Invoice Details'].push([]);
    invoiceData['Invoice Details'].push(['', '', 'Subtotal:', `${settings.currencySymbol}${subtotal.toFixed(2)}`]);
    
    taxCalculation.taxes.forEach(tax => {
      invoiceData['Invoice Details'].push(['', '', `${tax.name} (${tax.rate}%):`, `${settings.currencySymbol}${tax.amount.toFixed(2)}`]);
    });
    
    invoiceData['Invoice Details'].push(['', '', 'Total:', `${settings.currencySymbol}${total.toFixed(2)}`]);

    const ws = XLSX.utils.aoa_to_sheet(invoiceData['Invoice Details']);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    
    // Set column widths
    ws['!cols'] = [
      { width: 25 },
      { width: 10 },
      { width: 15 },
      { width: 15 }
    ];

    const fileName = `Invoice_${orderDetails.customerName || 'Customer'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Primary color
    doc.text('Eat With Me', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(16);
    doc.text('Invoice', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Invoice Details
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    
    const invoiceNumber = `INV-${Date.now()}`;
    const dateTime = new Date().toLocaleString();
    
    doc.text(`Invoice #: ${invoiceNumber}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Date & Time: ${dateTime}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Order Type: ${orderDetails.type === 'dine-in' ? 'Dine-In' : 'Takeaway'}`, 20, yPosition);
    yPosition += 7;
    
    if (orderDetails.tableNumber) {
      doc.text(`Table: ${orderDetails.tableNumber}`, 20, yPosition);
      yPosition += 7;
    }
    
    doc.text(`Customer: ${orderDetails.customerName || 'Walk-in Customer'}`, 20, yPosition);
    yPosition += 7;
    
    if (orderDetails.customerPhone) {
      doc.text(`Phone: ${orderDetails.customerPhone}`, 20, yPosition);
      yPosition += 7;
    }
    
    doc.text(`Payment: ${orderDetails.paymentMethod?.toUpperCase() || 'N/A'}`, 20, yPosition);
    yPosition += 15;

    // Table header
    doc.setFontSize(10);
    doc.setFillColor(30, 64, 175);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
    
    doc.text('Item', 25, yPosition);
    doc.text('Qty', 100, yPosition);
    doc.text('Price', 130, yPosition);
    doc.text('Total', 160, yPosition);
    yPosition += 10;

    // Cart items
    doc.setTextColor(0, 0, 0);
    cart.forEach((item, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, yPosition - 5, pageWidth - 40, 10, 'F');
      }
      
      doc.text(item.name.substring(0, 25), 25, yPosition);
      doc.text(item.quantity.toString(), 105, yPosition);
      doc.text(`${settings.currencySymbol}${item.price.toFixed(2)}`, 135, yPosition);
      doc.text(`${settings.currencySymbol}${(item.price * item.quantity).toFixed(2)}`, 165, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Totals
    doc.line(20, yPosition - 5, pageWidth - 20, yPosition - 5);
    
    doc.text('Subtotal:', 130, yPosition);
    doc.text(`${settings.currencySymbol}${subtotal.toFixed(2)}`, 165, yPosition);
    yPosition += 7;

    taxCalculation.taxes.forEach(tax => {
      doc.text(`${tax.name} (${tax.rate}%):`, 130, yPosition);
      doc.text(`${settings.currencySymbol}${tax.amount.toFixed(2)}`, 165, yPosition);
      yPosition += 7;
    });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
    doc.text('Total:', 130, yPosition);
    doc.text(`${settings.currencySymbol}${total.toFixed(2)}`, 165, yPosition);

    // Footer
    yPosition += 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Thank you for visiting Eat With Me!', pageWidth / 2, yPosition, { align: 'center' });

    const fileName = `Invoice_${orderDetails.customerName || 'Customer'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-background">
      {/* Menu Section */}
      <div className="flex-1 p-4 space-y-4">
        {/* Header with order status */}
        {orderDetails.type && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {orderDetails.type === 'dine-in' ? (
                  <Table className="w-5 h-5 text-primary" />
                ) : (
                  <ShoppingBag className="w-5 h-5 text-primary" />
                )}
                <div>
                  <p className="font-medium">
                    {orderDetails.type === 'dine-in' ? 'Dine-In Order' : 'Takeaway Order'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {orderDetails.tableNumber && `Table: ${orderDetails.tableNumber}`}
                    {orderDetails.customerName && ` • Customer: ${orderDetails.customerName}`}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setOrderDetails({ type: null, customerName: '', customerPhone: '', paymentMethod: null });
                  setCart([]);
                }}
              >
                New Order
              </Button>
            </div>
          </Card>
        )}

        {/* Categories */}
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`whitespace-nowrap ${
                  selectedCategory === category 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-primary text-primary hover:bg-primary/10'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 ${
                !item.available ? 'opacity-50' : 'cursor-pointer hover:scale-105'
              }`}
              onClick={() => {
                if (item.available) {
                  if (!orderDetails.type) {
                    setShowOrderTypeDialog(true);
                  } else {
                    addToCart(item);
                  }
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-primary line-clamp-2">{item.name}</h4>
                  {!item.available && (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-primary">{settings.currencySymbol}</span>
                    <span className="text-lg font-semibold text-primary">{item.price}</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-8 h-8 rounded-full p-0 bg-primary hover:bg-primary/90"
                    disabled={!item.available}
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      if (!orderDetails.type) {
                        setShowOrderTypeDialog(true);
                      } else {
                        addToCart(item);
                      }
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 bg-card border-l border-border p-4">
        <Card className="h-full border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShoppingCart size={20} />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            {/* Cart Items */}
            <ScrollArea className="flex-1 mb-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No items in cart</p>
                  <Button 
                    className="mt-4" 
                    onClick={startNewOrder}
                  >
                    Start New Order
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{item.name}</h5>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span className="text-primary">{settings.currencySymbol}</span>
                          <span>{item.price} × {item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                          onClick={() => updateQuantity(item.id, false)}
                        >
                          <Minus size={12} />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                          onClick={() => updateQuantity(item.id, true)}
                        >
                          <Plus size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-8 h-8 p-0 ml-1"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Order Total */}
            {cart.length > 0 && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{settings.currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {taxCalculation.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm text-muted-foreground">
                      <span>{tax.name} ({tax.rate}%)</span>
                      <span>{settings.currencySymbol}{tax.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg text-primary">
                    <span>Total</span>
                    <span>{settings.currencySymbol}{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Customer Info */}
                {orderDetails.customerName && (
                  <div className="bg-muted/50 p-2 rounded text-sm">
                    <p className="font-medium">{orderDetails.customerName}</p>
                    <p className="text-muted-foreground">{orderDetails.customerPhone}</p>
                  </div>
                )}

                {/* Payment Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-12 flex-col gap-1 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handlePaymentMethodSelect('cash')}
                  >
                    <Banknote size={18} />
                    <span className="text-xs">Cash</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex-col gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => handlePaymentMethodSelect('card')}
                  >
                    <CreditCard size={18} />
                    <span className="text-xs">Card</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex-col gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => handlePaymentMethodSelect('upi')}
                  >
                    <Smartphone size={18} />
                    <span className="text-xs">UPI</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12 flex-col gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={() => handlePaymentMethodSelect('split')}
                  >
                    <FileText size={18} />
                    <span className="text-xs">Split</span>
                  </Button>
                </div>

                {/* Checkout Button */}
                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    if (!orderDetails.customerName) {
                      setShowCustomerDetailsDialog(true);
                    } else {
                      setShowPaymentDialog(true);
                    }
                  }}
                >
                  <Users className="mr-2" size={18} />
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Type Selection Dialog */}
      <Dialog open={showOrderTypeDialog} onOpenChange={setShowOrderTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Order Type</DialogTitle>
            <DialogDescription>
              Choose whether this is a dine-in or takeaway order
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              className="h-20 flex-col gap-2 text-left"
              variant="outline"
              onClick={() => handleOrderTypeSelect('dine-in')}
            >
              <Table size={24} />
              <div>
                <p className="font-medium">Dine-In</p>
                <p className="text-sm text-muted-foreground">Customer will eat at the restaurant</p>
              </div>
            </Button>
            
            <Button
              className="h-20 flex-col gap-2 text-left"
              variant="outline"
              onClick={() => handleOrderTypeSelect('takeaway')}
            >
              <ShoppingBag size={24} />
              <div>
                <p className="font-medium">Takeaway</p>
                <p className="text-sm text-muted-foreground">Customer will take the order to go</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetailsDialog} onOpenChange={setShowCustomerDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Enter customer information and table assignment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {orderDetails.type === 'dine-in' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Table</label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {availableTables.map((table) => (
                    <Button
                      key={table.id}
                      variant={orderDetails.tableNumber === `Table ${table.number}` ? "default" : "outline"}
                      disabled={table.isOccupied}
                      onClick={() => handleTableSelect(table.id)}
                      className={`h-12 text-xs ${
                        table.status === 'occupied' ? 'border-red-300 text-red-700' :
                        table.status === 'reserved' ? 'border-yellow-300 text-yellow-700' :
                        'border-green-300 text-green-700'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{table.name}</span>
                        <span className="text-[10px] opacity-75">
                          {table.statusDisplay}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name (Optional)</label>
              <Input
                placeholder="Enter customer name"
                value={orderDetails.customerName}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number (Optional)</label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={orderDetails.customerPhone}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, customerPhone: e.target.value }))}
              />
            </div>

            {orderDetails.customerPhone && !customers.find(c => c.phone === orderDetails.customerPhone) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Code (Optional)</label>
                <Input
                  placeholder="Enter referral code"
                  value={orderDetails.referralCode || ''}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-muted-foreground">
                  New customer? Enter a referral code to get 100 bonus loyalty points!
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCustomerDetailsDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowCustomerDetailsDialog(false)}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Options Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Complete - {settings.currencySymbol}{total.toFixed(2)}</DialogTitle>
            <DialogDescription>
              Choose how to handle the invoice for this completed order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-800 font-medium">Payment Successful!</p>
              <p className="text-sm text-green-600">
                Paid via {orderDetails.paymentMethod?.toUpperCase()}
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full h-12 gap-2"
                onClick={async () => {
                  alert('Printing invoice...');
                  await handleCompleteOrder();
                }}
              >
                <Printer size={18} />
                Print Invoice
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12 gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  onClick={async () => {
                    downloadExcel();
                    await handleCompleteOrder();
                  }}
                >
                  <FileSpreadsheet size={18} />
                  Download Excel
                </Button>

                <Button
                  variant="outline"
                  className="h-12 gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={async () => {
                    downloadPDF();
                    await handleCompleteOrder();
                  }}
                >
                  <Download size={18} />
                  Download PDF
                </Button>
              </div>

              {orderDetails.customerPhone && (
                <Button
                  variant="outline"
                  className="w-full h-12 gap-2"
                  onClick={sendWhatsAppInvoice}
                >
                  <MessageCircle size={18} />
                  Send Invoice via WhatsApp
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full h-12 gap-2"
                onClick={handleCompleteOrder}
              >
                <FileText size={18} />
                Save & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}