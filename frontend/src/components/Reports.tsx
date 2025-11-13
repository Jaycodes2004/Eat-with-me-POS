import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAppContext } from '../contexts/AppContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  ShoppingBag,
  Users,
  Receipt,
  Clock,
  Target,
  Award,
  AlertTriangle,
  Calculator
} from 'lucide-react';

interface ReportsProps {
  onNavigate?: (screen: string) => void;
  userRole?: string;
  currentOrder?: any;
  setCurrentOrder?: (order: any) => void;
  selectedTable?: string | null;
  setSelectedTable?: (table: string | null) => void;
}

export function Reports(props: ReportsProps) {
  const { 
    settings, 
    calculateTaxes, 
    orders, 
    menuItems, 
    getTodayRevenue,
    getRevenueBetweenDates,
    getRevenueByPaymentMethod,
    getRevenueByOrderSource,
    getOrderStats
  } = useAppContext();
  const [dateFilter, setDateFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('sales');

  // Generate real sales data from actual orders
  const salesData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    
    return days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index)); // Last 7 days
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(order => 
        order.orderDate === dateStr && order.status === 'completed'
      );
      
      const sales = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = dayOrders.length;
      const profit = Math.round(sales * 0.3); // Assuming 30% profit margin
      const customers = new Set(dayOrders.map(order => order.customerPhone)).size;
      
      return { name: day, sales, orders: orderCount, profit, customers };
    });
  }, [orders]);

  // Generate real category data from actual menu items and orders
  const categoryData = useMemo(() => {
    const categories = [...new Set(menuItems.map(item => item.category))];
    const totalRevenue = orders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    return categories.map((category, index) => {
      const categoryItems = menuItems.filter(item => item.category === category);
      const categoryOrders = orders
        .filter(order => order.status === 'completed')
        .flatMap(order => order.items)
        .filter(item => categoryItems.some(menuItem => menuItem.id === item.id));
      
      const revenue = categoryOrders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const value = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0;
      const growth = Math.floor(Math.random() * 30) - 10; // Mock growth for now
      
      const colors = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#f1f5f9'];
      
      return {
        name: category,
        value,
        color: colors[index % colors.length],
        revenue: Math.round(revenue),
        growth
      };
    });
  }, [menuItems, orders]);

  // Generate real top items data from actual orders
  const topItems = useMemo(() => {
    const itemStats = {};
    
    orders
      .filter(order => order.status === 'completed')
      .forEach(order => {
        order.items.forEach(item => {
          if (!itemStats[item.name]) {
            itemStats[item.name] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
              profit: 0,
              margin: 30 // Default margin
            };
          }
          itemStats[item.name].quantity += item.quantity;
          itemStats[item.name].revenue += item.price * item.quantity;
          itemStats[item.name].profit += Math.round(item.price * item.quantity * 0.3);
        });
      });
    
    return Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // Generate real hourly data from actual orders
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 9 AM to 10 PM
    const today = new Date().toISOString().split('T')[0];
    
    return hours.map(hour => {
      const hourOrders = orders.filter(order => {
        if (order.orderDate !== today || order.status !== 'completed') return false;
        const orderHour = parseInt(order.orderTime.split(':')[0]);
        return orderHour === hour;
      });
      
      const sales = hourOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const orderCount = hourOrders.length;
      
      const formatHour = hour <= 12 ? 
        (hour === 12 ? '12 PM' : `${hour} AM`) : 
        `${hour - 12} PM`;
      
      return { hour: formatHour, orders: orderCount, sales };
    });
  }, [orders]);

  // Calculate total revenue from actual orders for tax calculations with error handling
  const totalRevenue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return orders
      .filter(order => order.orderDate === today && order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  }, [orders]);
  const baseAmount = totalRevenue / 1.18; // Assuming taxes are already included
  
  // Safe currency symbol with fallback
  const safeCurrencySymbol = settings?.currencySymbol || '$';
  
  let calculatedTaxes: Array<{name: string, rate: number, amount: number}> = [];
  let totalTax = 0;
  let barTaxes: {taxes: Array<{name: string, rate: number, amount: number}>, totalTax: number} = {taxes: [], totalTax: 0};
  
  try {
    const foodTaxResult = calculateTaxes(baseAmount, 'food');
    calculatedTaxes = foodTaxResult.taxes;
    totalTax = foodTaxResult.totalTax;
    
    barTaxes = calculateTaxes(baseAmount * 0.1, 'bar'); // Assuming 10% of sales is bar
  } catch (error) {
    console.error('Error calculating taxes:', error);
    // Fallback to basic calculation
    const fallbackRate = 10;
    const fallbackAmount = (baseAmount * fallbackRate) / 100;
    calculatedTaxes = [{name: 'Tax', rate: fallbackRate, amount: fallbackAmount}];
    totalTax = fallbackAmount;
  }

  // Calculate actual today's stats from real data
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => order.orderDate === today);
    const completedTodayOrders = todayOrders.filter(order => order.status === 'completed');
    
    const totalOrders = todayOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Calculate cash vs digital sales from actual orders
    const cashSales = completedTodayOrders
      .filter(order => order.paymentMethod === 'cash')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const digitalSales = completedTodayOrders
      .filter(order => ['upi', 'card'].includes(order.paymentMethod || ''))
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    // Calculate unique customers
    const customerCount = new Set(
      todayOrders
        .filter(order => order.customerPhone)
        .map(order => order.customerPhone)
    ).size;
    
    // Calculate peak hour from order times
    const hourCounts = {};
    todayOrders.forEach(order => {
      const hour = parseInt(order.orderTime.split(':')[0]);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourCounts).length > 0 
      ? Object.entries(hourCounts).reduce((max, [hour, count]) => 
          count > max.count ? {hour: parseInt(hour), count} : max, 
          {hour: 12, count: 0}
        ).hour
      : 12;
    
    const peakHourFormatted = `${peakHour > 12 ? peakHour - 12 : peakHour}:00 ${peakHour >= 12 ? 'PM' : 'AM'}`;
    
    return {
      totalSales: totalRevenue,
      totalOrders,
      avgOrderValue,
      taxesCollected: Math.round(totalTax + barTaxes.totalTax),
      cashSales: Math.round(cashSales),
      digitalSales: Math.round(digitalSales),
      profitMargin: totalRevenue > 0 ? Math.round((totalRevenue * 0.3 / totalRevenue) * 100 * 10) / 10 : 0,
      customerCount,
      peakHour: peakHourFormatted,
      avgWaitTime: todayOrders.length > 0 ? Math.round(todayOrders.reduce((sum, order) => 
        sum + (order.estimatedTime || 15), 0) / todayOrders.length) : 0
    };
  }, [orders, totalRevenue, totalTax, barTaxes.totalTax]);

  const downloadReport = (format: 'pdf' | 'excel') => {
    // Mock download functionality
    console.log(`Downloading ${format} report for ${dateFilter}`);
  };

  return (
    <div className="flex-1 bg-background p-4 space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-primary">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your restaurant performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2" size={16} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="quarterly">This Quarter</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadReport('pdf')}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <FileText className="mr-2" size={16} />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadReport('excel')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              <Download className="mr-2" size={16} />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <div className="flex items-center gap-1 mt-1">
                  <DollarSign size={18} className="text-primary" />
                  <span className="text-xl font-bold text-primary">
                    {safeCurrencySymbol}{todayStats.totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders</p>
                <span className="text-xl font-bold text-primary">{todayStats.totalOrders}</span>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-xs text-green-600">+8%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order</p>
                <div className="flex items-center gap-1">
                  <DollarSign size={16} className="text-primary" />
                  <span className="text-xl font-bold text-primary">
                    {safeCurrencySymbol}{todayStats.avgOrderValue}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown size={12} className="text-red-600" />
                  <span className="text-xs text-red-600">-3%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Calculator size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxes Collected</p>
                <div className="flex items-center gap-1">
                  <DollarSign size={16} className="text-primary" />
                  <span className="text-xl font-bold text-primary">
                    {safeCurrencySymbol}{todayStats.taxesCollected.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-xs text-green-600">+15%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Receipt size={20} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <span className="text-xl font-bold text-primary">{todayStats.customerCount}</span>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-xs text-green-600">+5%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <Users size={20} className="text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <span className="text-xl font-bold text-primary">{todayStats.profitMargin}%</span>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp size={12} className="text-green-600" />
                  <span className="text-xs text-green-600">+2.1%</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Target size={20} className="text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tax">Tax Report</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Sales Trend - Weekly</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'sales' ? `${safeCurrencySymbol}${value}` : value,
                        name === 'sales' ? 'Sales' : name === 'orders' ? 'Orders' : 'Profit'
                      ]}
                    />
                    <Area type="monotone" dataKey="sales" stackId="1" stroke="#1e40af" fill="#1e40af" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="profit" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Hourly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'sales' ? `${safeCurrencySymbol}${value}` : value,
                        name === 'sales' ? 'Sales' : 'Orders'
                      ]}
                    />
                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span>Cash Payments</span>
                  <div className="text-right">
                    <div className="font-semibold text-green-700">
                      {safeCurrencySymbol}{todayStats.cashSales.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">41.4%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span>Digital Payments</span>
                  <div className="text-right">
                    <div className="font-semibold text-blue-700">
                      {safeCurrencySymbol}{todayStats.digitalSales.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">58.6%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Peak Hour</span>
                  <Badge className="bg-primary">{todayStats.peakHour}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg Wait Time</span>
                  <Badge variant="outline">{todayStats.avgWaitTime} min</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Customer Satisfaction</span>
                  <Badge className="bg-green-500">4.7/5</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Daily Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sales Target</span>
                    <span>91% achieved</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Order Target</span>
                    <span>105% achieved</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profit Target</span>
                    <span>87% achieved</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Top Performing Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.quantity} orders</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.margin}% margin
                          </Badge>
                          {index < 3 && (
                            <Badge className="text-xs bg-green-500">
                              <Award size={10} className="mr-1" />
                              Top 3
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        {safeCurrencySymbol}{item.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">
                        {safeCurrencySymbol}{item.profit.toLocaleString()} profit
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {safeCurrencySymbol}{Math.round(item.revenue / item.quantity)} avg
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Item Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="font-medium text-green-800">Best Performer</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Butter Chicken leads with 35% profit margin and consistent high orders
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-800">Growth Opportunity</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Paneer Tikka has highest margin - consider promoting more
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-orange-600" />
                    <span className="font-medium text-orange-800">Needs Attention</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Biryani orders down 15% - check quality or pricing
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Revenue vs Profit Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topItems} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${safeCurrencySymbol}${value}`,
                        name === 'revenue' ? 'Revenue' : 'Profit'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#1e40af" />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary">Category Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'revenue' ? `${safeCurrencySymbol}${value}` : `${value}%`,
                        name === 'revenue' ? 'Revenue' : 'Growth'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#1e40af" />
                    <Bar dataKey="growth" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Detailed Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={index} className="p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h4 className="font-medium">{category.name}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={category.growth > 0 ? "default" : "destructive"}>
                          {category.growth > 0 ? '+' : ''}{category.growth}%
                        </Badge>
                        <span className="font-semibold text-primary">
                          {safeCurrencySymbol}{category.revenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Share</span>
                        <div className="font-medium">{category.value}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Order</span>
                        <div className="font-medium">
                          {safeCurrencySymbol}{Math.round(category.revenue / (category.value * 1.27))}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Performance</span>
                        <div className="flex items-center gap-1">
                          {category.growth > 10 ? (
                            <>
                              <TrendingUp size={12} className="text-green-600" />
                              <span className="text-green-600 font-medium">Excellent</span>
                            </>
                          ) : category.growth > 0 ? (
                            <>
                              <TrendingUp size={12} className="text-blue-600" />
                              <span className="text-blue-600 font-medium">Good</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown size={12} className="text-red-600" />
                              <span className="text-red-600 font-medium">Needs Focus</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Tax Summary - {settings?.country || 'N/A'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {calculatedTaxes.map((tax, index) => (
                  <div key={index} className="text-center p-6 bg-muted/30 rounded-lg">
                    <h4 className="text-primary">{tax.name} ({tax.rate}%)</h4>
                    <div className="text-2xl font-bold text-primary mt-2">
                      {safeCurrencySymbol}{Math.round(tax.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
                {barTaxes.taxes.length > 0 && (
                  <div className="text-center p-6 bg-orange-50 rounded-lg">
                    <h4 className="text-orange-800">Bar Taxes</h4>
                    <div className="text-2xl font-bold text-orange-800 mt-2">
                      {safeCurrencySymbol}{Math.round(barTaxes.totalTax).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-4">Food & Beverage Taxes</h5>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div className="flex justify-between">
                      <span>Taxable Amount:</span>
                      <span>{safeCurrencySymbol}{Math.round(baseAmount).toLocaleString()}</span>
                    </div>
                    {calculatedTaxes.map((tax, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tax.name} ({tax.rate}%):</span>
                        <span>{safeCurrencySymbol}{Math.round(tax.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Tax:</span>
                      <span>{safeCurrencySymbol}{Math.round(totalTax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {barTaxes.taxes.length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h5 className="font-medium text-orange-900 mb-4">Bar Taxes</h5>
                    <div className="text-sm text-orange-800 space-y-2">
                      <div className="flex justify-between">
                        <span>Taxable Amount:</span>
                        <span>{safeCurrencySymbol}{Math.round(baseAmount * 0.1).toLocaleString()}</span>
                      </div>
                      {barTaxes.taxes.map((tax, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{tax.name} ({tax.rate}%):</span>
                          <span>{safeCurrencySymbol}{Math.round(tax.amount).toLocaleString()}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total Bar Tax:</span>
                        <span>{safeCurrencySymbol}{Math.round(barTaxes.totalTax).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-900 mb-4">Tax Configuration</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="font-medium text-green-800 mb-2">Active Tax Rules</h6>
                    <div className="space-y-1 text-sm">
                      {(settings?.taxRules || []).filter(rule => rule.isActive).map(rule => (
                        <div key={rule.id} className="flex justify-between">
                          <span>{rule.name}:</span>
                          <span>{rule.rate}% on {rule.applicableCategories.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h6 className="font-medium text-green-800 mb-2">Summary</h6>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Sales:</span>
                        <span>{safeCurrencySymbol}{todayStats.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Taxes:</span>
                        <span>{safeCurrencySymbol}{todayStats.taxesCollected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Tax Rate:</span>
                        <span>{((todayStats.taxesCollected / todayStats.totalSales) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <Award size={20} />
                  AI Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-green-600" />
                    <span className="font-medium text-green-800">Revenue Growth</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Sales are up 12% compared to last week. Peak performance on weekends with Saturday showing 61 orders.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-800">Operational Efficiency</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Average wait time of 12 minutes is excellent. 8 PM is your peak hour - consider staff optimization.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-purple-600" />
                    <span className="font-medium text-purple-800">Profit Optimization</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    28.5% profit margin is healthy. Focus on promoting high-margin items like Paneer Tikka (35% margin).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} className="text-orange-600" />
                    <span className="font-medium text-orange-800">Menu Strategy</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    Consider creating combo meals during slow hours (3-5 PM) to boost average order value.
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="font-medium text-red-800">Attention Needed</span>
                  </div>
                  <p className="text-sm text-red-700">
                    Beverage sales down 3%. Review pricing or introduce seasonal drinks to boost this category.
                  </p>
                </div>

                <div className="p-4 bg-cyan-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-cyan-600" />
                    <span className="font-medium text-cyan-800">Customer Experience</span>
                  </div>
                  <p className="text-sm text-cyan-700">
                    With 4.7/5 satisfaction, consider launching a loyalty program to retain top customers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Forecasting & Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <h4 className="text-blue-800 mb-2">Tomorrow's Predicted Sales</h4>
                  <div className="text-3xl font-bold text-blue-900">
                    {safeCurrencySymbol}{(todayStats.totalSales * 1.08).toLocaleString()}
                  </div>
                  <p className="text-sm text-blue-700 mt-2">+8% increase expected</p>
                </div>
                
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <h4 className="text-green-800 mb-2">Weekly Revenue Target</h4>
                  <div className="text-3xl font-bold text-green-900">
                    {safeCurrencySymbol}{(todayStats.totalSales * 7.2).toLocaleString()}
                  </div>
                  <p className="text-sm text-green-700 mt-2">91% likely to achieve</p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <h4 className="text-purple-800 mb-2">Optimal Staff Count</h4>
                  <div className="text-3xl font-bold text-purple-900">8</div>
                  <p className="text-sm text-purple-700 mt-2">Based on predicted demand</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}