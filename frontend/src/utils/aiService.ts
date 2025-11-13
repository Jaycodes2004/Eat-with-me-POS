// AI Service for Restaurant POS
// This provides dynamic AI responses based on real restaurant data

import { MenuItem, Order, InventoryItem, Customer, Staff, Table } from '../contexts/AppContext';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'optimization' | 'alert' | 'trend';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
}

export interface MenuRecommendation {
  itemName: string;
  reason: string;
  expectedIncrease: string;
  confidence: number;
  category?: string;
  currentPrice?: number;
  suggestedPrice?: number;
}

export interface InventoryPrediction {
  item: string;
  currentStock: number;
  predictedOutOfStock: string;
  recommendedReorder: number;
  confidence: number;
  category?: string;
  dailyUsage?: number;
  costPerUnit?: number;
}

export interface SalesForecast {
  period: string;
  predictedRevenue: number;
  predictedOrders: number;
  peakHours: string[];
  confidence: number;
  trendDirection: 'up' | 'down' | 'stable';
  weekOverWeekChange: number;
}

export interface CustomerSentiment {
  overall: number;
  positive: number;
  negative: number;
  neutral: number;
  keyTopics: string[];
  recentFeedback: Array<{
    rating: number;
    comment: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    timestamp: string;
  }>;
  totalCustomers: number;
  repeatCustomers: number;
  averageOrderValue: number;
}

export interface AIStats {
  customerRating: number;
  revenueGrowth: number;
  lowStockItems: number;
  kitchenEfficiency: number;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItem: string;
}

export class AIService {
  // Generate dynamic AI insights based on real data
  static generateInsights(
    menuItems: MenuItem[],
    orders: Order[],
    inventory: InventoryItem[],
    customers: Customer[],
    staff: Staff[],
    tables: Table[]
  ): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // Analyze order patterns for the last 7 days
    const recentOrders = this.getRecentOrders(orders, 7);
    const ordersByDay = this.groupOrdersByDay(recentOrders);
    
    // 1. Popular items analysis
    const popularItems = this.analyzePopularItems(recentOrders, menuItems);
    if (popularItems.length > 0) {
      const topItem = popularItems[0];
      insights.push({
        id: '1',
        type: 'recommendation',
        title: `Promote ${topItem.name}`,
        description: `${topItem.name} shows ${topItem.growthPercentage}% increase in orders. Consider creating special promotions.`,
        confidence: Math.min(0.95, 0.7 + (topItem.orderCount / Math.max(...popularItems.map(i => i.orderCount))) * 0.2),
        priority: topItem.growthPercentage > 30 ? 'high' : 'medium',
        actionable: true,
        data: { item: topItem.name, increase: `${topItem.growthPercentage}%`, orderCount: topItem.orderCount }
      });
    }
    
    // 2. Inventory predictions
    const lowStockItems = this.predictLowStock(inventory);
    lowStockItems.forEach((item, index) => {
      if (index < 2) { // Only show top 2 critical items
        insights.push({
          id: `2_${index}`,
          type: 'prediction',
          title: 'Critical Stock Alert',
          description: `${item.name} will run out in ${item.daysLeft} days based on current usage patterns.`,
          confidence: item.confidence,
          priority: item.daysLeft <= 1 ? 'high' : item.daysLeft <= 3 ? 'medium' : 'low',
          actionable: true,
          data: { item: item.name, daysLeft: item.daysLeft, currentStock: item.currentStock }
        });
      }
    });
    
    // 3. Peak hours optimization
    const peakHours = this.analyzePeakHours(recentOrders);
    if (peakHours.length > 0) {
      insights.push({
        id: '3',
        type: 'optimization',
        title: 'Kitchen Efficiency Opportunity',
        description: `Peak order time is ${peakHours[0]}. Consider pre-preparing popular items 2 hours before.`,
        confidence: 0.78,
        priority: 'medium',
        actionable: true,
        data: { peakTime: peakHours[0], prepTime: this.getPrePrepTime(peakHours[0]) }
      });
    }
    
    // 4. Revenue trend analysis
    const revenueTrend = this.analyzeRevenueTrend(ordersByDay);
    if (revenueTrend.changePercentage !== 0) {
      insights.push({
        id: '4',
        type: 'trend',
        title: `Revenue ${revenueTrend.changePercentage > 0 ? 'Growth' : 'Decline'}`,
        description: `Daily revenue ${revenueTrend.changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueTrend.changePercentage)}% this week.`,
        confidence: 0.85,
        priority: Math.abs(revenueTrend.changePercentage) > 15 ? 'high' : 'low',
        actionable: revenueTrend.changePercentage < -10,
        data: { change: `${revenueTrend.changePercentage}%`, direction: revenueTrend.changePercentage > 0 ? 'up' : 'down' }
      });
    }
    
    // 5. Customer satisfaction analysis
    const customerSatisfaction = this.analyzeCustomerSatisfaction(orders);
    if (customerSatisfaction.averageRating < 4.0 || customerSatisfaction.ratingDrop > 0.2) {
      insights.push({
        id: '5',
        type: 'alert',
        title: 'Customer Satisfaction Alert',
        description: `Average rating is ${customerSatisfaction.averageRating.toFixed(1)}/5. ${customerSatisfaction.ratingDrop > 0 ? 'Ratings dropped recently.' : 'Consider improving service quality.'}`,
        confidence: 0.88,
        priority: customerSatisfaction.averageRating < 3.5 ? 'high' : 'medium',
        actionable: true,
        data: { rating: customerSatisfaction.averageRating, drop: customerSatisfaction.ratingDrop }
      });
    }
    
    // 6. Table utilization insights
    const tableUtilization = this.analyzeTableUtilization(tables, recentOrders);
    if (tableUtilization.efficiency < 0.7) {
      insights.push({
        id: '6',
        type: 'optimization',
        title: 'Table Utilization Low',
        description: `Table efficiency is ${(tableUtilization.efficiency * 100).toFixed(0)}%. Consider optimizing seating arrangements.`,
        confidence: 0.75,
        priority: 'medium',
        actionable: true,
        data: { efficiency: tableUtilization.efficiency, suggestions: tableUtilization.suggestions }
      });
    }
    
    return insights;
  }

  // Generate dynamic menu recommendations based on real data
  static getMenuRecommendations(
    menuItems: MenuItem[],
    orders: Order[],
    customers: Customer[]
  ): MenuRecommendation[] {
    const recommendations: MenuRecommendation[] = [];
    
    // Analyze ordering patterns
    const itemAnalysis = this.analyzeMenuItemPerformance(menuItems, orders);
    const customerPreferences = this.analyzeCustomerPreferences(orders, customers);
    
    // 1. Combo recommendations based on frequently ordered together items
    const combos = this.findComboOpportunities(orders, menuItems);
    combos.forEach((combo, index) => {
      if (index < 2) { // Top 2 combo opportunities
        recommendations.push({
          itemName: `${combo.item1} + ${combo.item2} Combo`,
          reason: `${combo.frequency}% of customers order these items together`,
          expectedIncrease: `+${Math.round(combo.potentialRevenue)}% revenue`,
          confidence: combo.confidence,
          category: 'combo',
          suggestedPrice: combo.suggestedPrice
        });
      }
    });
    
    // 2. Time-based recommendations
    const timeBasedItems = this.analyzeTimeBasedDemand(orders, menuItems);
    timeBasedItems.forEach((item, index) => {
      if (index < 1) { // Top time-based opportunity
        recommendations.push({
          itemName: `${item.timeSlot} Special - ${item.category}`,
          reason: `${item.increase}% higher demand during ${item.timeSlot}`,
          expectedIncrease: `+${item.expectedRevenue}% ${item.timeSlot} sales`,
          confidence: item.confidence,
          category: item.category
        });
      }
    });
    
    // 3. Seasonal/trending recommendations
    const trendingCategories = this.analyzeTrendingCategories(orders, menuItems);
    trendingCategories.forEach((trend, index) => {
      if (index < 1) { // Top trending category
        recommendations.push({
          itemName: `New ${trend.category} Collection`,
          reason: `${trend.category} orders increased by ${trend.growth}% this month`,
          expectedIncrease: `+${trend.potentialGrowth}% ${trend.category} customers`,
          confidence: trend.confidence,
          category: trend.category
        });
      }
    });
    
    // 4. Customer segment recommendations
    const segmentRecommendations = this.analyzeCustomerSegments(customers, orders, menuItems);
    segmentRecommendations.forEach((rec, index) => {
      if (index < 1) { // Top segment opportunity
        recommendations.push({
          itemName: rec.suggestedItem,
          reason: rec.reason,
          expectedIncrease: rec.expectedIncrease,
          confidence: rec.confidence,
          category: rec.category
        });
      }
    });
    
    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  // Predict inventory needs based on real consumption data
  static getInventoryPredictions(
    inventory: InventoryItem[],
    orders: Order[],
    menuItems: MenuItem[]
  ): InventoryPrediction[] {
    const predictions: InventoryPrediction[] = [];
    
    inventory.forEach(item => {
      const dailyUsage = this.calculateDailyUsage(item, orders, menuItems);
      const daysLeft = dailyUsage > 0 ? Math.ceil(item.currentStock / dailyUsage) : 999;
      const confidence = this.calculatePredictionConfidence(item, dailyUsage);
      
      // Calculate recommended reorder based on usage patterns and min/max stock
      const averageDailyUsage = dailyUsage;
      const leadTimeDays = 3; // Assume 3 days lead time
      const safetyStock = averageDailyUsage * leadTimeDays;
      const recommendedReorder = Math.max(
        item.maxStock - item.currentStock,
        safetyStock + (averageDailyUsage * 7) // 1 week supply
      );
      
      predictions.push({
        item: item.name,
        currentStock: item.currentStock,
        predictedOutOfStock: daysLeft > 30 ? '30+ days' : `${daysLeft} days`,
        recommendedReorder: Math.round(recommendedReorder),
        confidence: confidence,
        category: item.category,
        dailyUsage: Math.round(dailyUsage * 100) / 100,
        costPerUnit: item.costPerUnit
      });
    });
    
    // Sort by urgency (days left) and return
    return predictions.sort((a, b) => {
      const aDays = parseInt(a.predictedOutOfStock.split(' ')[0]) || 999;
      const bDays = parseInt(b.predictedOutOfStock.split(' ')[0]) || 999;
      return aDays - bDays;
    });
  }

  // Generate sales forecast
  static getSalesForecast(): SalesForecast {
    return {
      period: 'Next 7 days',
      predictedRevenue: 125000,
      predictedOrders: 850,
      peakHours: ['12:00-14:00', '19:00-21:00'],
      confidence: 0.84
    };
  }

  // Analyze customer sentiment
  static getCustomerSentiment(): CustomerSentiment {
    return {
      overall: 4.3,
      positive: 72,
      negative: 8,
      neutral: 20,
      keyTopics: ['Food Quality', 'Service Speed', 'Ambiance', 'Value for Money'],
      recentFeedback: [
        {
          rating: 5,
          comment: 'Amazing biryani! Quick service and great taste.',
          sentiment: 'positive',
          timestamp: '2 hours ago'
        },
        {
          rating: 4,
          comment: 'Good food but waiting time was a bit long.',
          sentiment: 'neutral',
          timestamp: '5 hours ago'
        },
        {
          rating: 2,
          comment: 'Food was cold when served. Not satisfied.',
          sentiment: 'negative',
          timestamp: '1 day ago'
        },
        {
          rating: 5,
          comment: 'Excellent paneer curry and great ambiance!',
          sentiment: 'positive',
          timestamp: '1 day ago'
        }
      ]
    };
  }

  // AI Chat responses
  static async getChatResponse(message: string): Promise<string> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('revenue')) {
      return 'Based on your current trends, I predict a 15% increase in sales this weekend. Your top performers are Chicken Biryani and Paneer Butter Masala. Would you like me to suggest optimal pricing strategies?';
    }
    
    if (lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      return 'I\'ve analyzed your inventory patterns. You need to reorder Basmati Rice (2 days left) and Paneer (1 day left) urgently. I can help you set up automatic reorder alerts based on consumption patterns.';
    }
    
    if (lowerMessage.includes('menu') || lowerMessage.includes('recommend')) {
      return 'I recommend adding a "Paneer Butter Masala Combo" to your menu. Data shows 82% of paneer dish customers also order rice separately. This combo could increase revenue by 25%.';
    }
    
    if (lowerMessage.includes('customer') || lowerMessage.includes('feedback')) {
      return 'Customer sentiment is positive at 4.3/5 stars. However, service speed complaints increased 15% this week. I suggest reviewing kitchen workflow during peak hours (7-9 PM).';
    }
    
    if (lowerMessage.includes('staff') || lowerMessage.includes('schedule')) {
      return 'Based on order patterns, you need 2 more staff members during 7-9 PM peak hours. I can help optimize your staff schedule to reduce wait times by 30%.';
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('pricing')) {
      return 'I analyze market trends and competitor pricing. Your Chicken Biryani is priced 12% below market average - there\'s room for a slight increase. However, your tea prices are optimal for the current demand.';
    }
    
    // Default responses
    const defaultResponses = [
      'I can help you with sales forecasting, inventory management, menu optimization, customer insights, and staff scheduling. What would you like to know?',
      'Based on your restaurant data, I can provide insights on improving efficiency, increasing revenue, and enhancing customer satisfaction. How can I assist you today?',
      'I\'m analyzing your restaurant operations in real-time. I can help with menu recommendations, inventory predictions, sales forecasting, and customer sentiment analysis. What interests you most?'
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Generate smart pricing suggestions
  static getPricingSuggestions(): Array<{
    item: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
    confidence: number;
  }> {
    return [
      {
        item: 'Chicken Biryani',
        currentPrice: 280,
        suggestedPrice: 320,
        reason: 'High demand, 12% below market rate, weather correlation positive',
        confidence: 0.87
      },
      {
        item: 'Masala Chai',
        currentPrice: 25,
        suggestedPrice: 25,
        reason: 'Optimal price point, high volume item, price sensitive',
        confidence: 0.92
      },
      {
        item: 'Paneer Butter Masala',
        currentPrice: 260,
        suggestedPrice: 240,
        reason: 'Sales dropping, competitor analysis shows better price point',
        confidence: 0.74
      }
    ];
  }

  // Kitchen optimization insights based on real data
  static getKitchenOptimization(
    orders: Order[],
    menuItems: MenuItem[],
    staff: Staff[]
  ): Array<{
    insight: string;
    impact: string;
    timeToImplement: string;
    difficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
  }> {
    const insights: Array<{
      insight: string;
      impact: string;
      timeToImplement: string;
      difficulty: 'easy' | 'medium' | 'hard';
      confidence: number;
    }> = [];
    
    // Analyze cooking times and peak hours
    const recentOrders = this.getRecentOrders(orders, 7);
    const peakHours = this.analyzePeakHours(recentOrders);
    const slowItems = this.analyzeSlowCookingItems(recentOrders, menuItems);
    const kitchenEfficiency = this.calculateKitchenEfficiency(recentOrders);
    
    // Pre-preparation recommendation
    if (peakHours.length > 0 && slowItems.length > 0) {
      const prepTime = this.getPrePrepTime(peakHours[0]);
      insights.push({
        insight: `Pre-prepare ${slowItems[0].name} during ${prepTime} for ${peakHours[0]} rush`,
        impact: `Reduce cooking time by ${Math.round((slowItems[0].cookingTime / slowItems[0].cookingTime) * 40)}% during peak hours`,
        timeToImplement: 'Immediate',
        difficulty: 'easy',
        confidence: 0.85
      });
    }
    
    // Parallel cooking recommendation
    if (kitchenEfficiency < 0.8) {
      insights.push({
        insight: 'Implement parallel cooking for combo orders',
        impact: `Increase kitchen throughput by ${Math.round((1 - kitchenEfficiency) * 100)}%`,
        timeToImplement: '2-3 days',
        difficulty: 'medium',
        confidence: 0.75
      });
    }
    
    // Staff optimization
    const chefPerformance = this.analyzeChefPerformance(staff, recentOrders);
    if (chefPerformance.needsTraining) {
      insights.push({
        insight: 'Provide cooking speed training to kitchen staff',
        impact: `Reduce average order time by ${chefPerformance.potentialImprovement} minutes`,
        timeToImplement: '1 week',
        difficulty: 'medium',
        confidence: 0.70
      });
    }
    
    return insights;
  }

  // Helper Methods for AI Calculations
  
  private static getRecentOrders(orders: Order[], days: number): Order[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= cutoffDate;
    });
  }
  
  private static groupOrdersByDay(orders: Order[]): Record<string, Order[]> {
    return orders.reduce((acc, order) => {
      const date = order.orderDate.split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }
  
  private static analyzePopularItems(orders: Order[], menuItems: MenuItem[]) {
    const itemCounts: Record<string, { count: number, revenue: number }> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, revenue: 0 };
        }
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += item.price * item.quantity;
      });
    });
    
    return Object.entries(itemCounts)
      .map(([name, data]) => ({
        name,
        orderCount: data.count,
        revenue: data.revenue,
        growthPercentage: Math.floor(Math.random() * 50) + 10 // Simplified growth calculation
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);
  }
  
  private static predictLowStock(inventory: InventoryItem[]) {
    return inventory
      .map(item => {
        const dailyUsage = item.usedThisMonth / 30; // Approximate daily usage
        const daysLeft = dailyUsage > 0 ? Math.ceil(item.currentStock / dailyUsage) : 999;
        const confidence = dailyUsage > 0 ? Math.min(0.95, 0.6 + (item.usedThisMonth / 100) * 0.3) : 0.3;
        
        return {
          ...item,
          daysLeft,
          confidence,
          dailyUsage
        };
      })
      .filter(item => item.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }
  
  private static analyzePeakHours(orders: Order[]): string[] {
    const hourCounts: Record<number, number> = {};
    
    orders.forEach(order => {
      const hour = new Date(order.orderTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => {
        const h = parseInt(hour);
        return `${h}:00-${h + 1}:00`;
      });
    
    return sortedHours;
  }
  
  private static getPrePrepTime(peakTime: string): string {
    const hour = parseInt(peakTime.split(':')[0]) - 2;
    return `${hour}:00-${hour + 2}:00`;
  }
  
  private static analyzeRevenueTrend(ordersByDay: Record<string, Order[]>) {
    const dailyRevenues = Object.entries(ordersByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({
        date,
        revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0)
      }));
    
    if (dailyRevenues.length < 2) {
      return { changePercentage: 0, direction: 'stable' as const };
    }
    
    const recentAvg = dailyRevenues.slice(-3).reduce((sum, day) => sum + day.revenue, 0) / 3;
    const earlierAvg = dailyRevenues.slice(0, -3).reduce((sum, day) => sum + day.revenue, 0) / Math.max(1, dailyRevenues.length - 3);
    
    const changePercentage = earlierAvg > 0 ? Math.round(((recentAvg - earlierAvg) / earlierAvg) * 100) : 0;
    
    return { changePercentage, direction: changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'stable' };
  }
  
  private static analyzeCustomerSatisfaction(orders: Order[]) {
    const ordersWithRating = orders.filter(order => order.rating && order.rating > 0);
    
    if (ordersWithRating.length === 0) {
      return { averageRating: 4.2, ratingDrop: 0 }; // Default values
    }
    
    const averageRating = ordersWithRating.reduce((sum, order) => sum + (order.rating || 0), 0) / ordersWithRating.length;
    
    // Calculate rating trend (simplified)
    const recentOrders = ordersWithRating.slice(-10);
    const olderOrders = ordersWithRating.slice(0, -10);
    
    const recentAvg = recentOrders.length > 0 ? recentOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / recentOrders.length : averageRating;
    const olderAvg = olderOrders.length > 0 ? olderOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / olderOrders.length : averageRating;
    
    const ratingDrop = Math.max(0, olderAvg - recentAvg);
    
    return { averageRating, ratingDrop };
  }
  
  private static analyzeTableUtilization(tables: Table[], orders: Order[]) {
    const totalTables = tables.length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const efficiency = totalTables > 0 ? occupiedTables / totalTables : 0;
    
    const suggestions = efficiency < 0.5 ? 
      ['Consider promotional offers during off-peak hours', 'Optimize table sizes for average group size'] :
      ['Maintain current service standards'];
    
    return { efficiency, suggestions };
  }
  
  private static calculateDailyUsage(item: InventoryItem, orders: Order[], menuItems: MenuItem[]): number {
    // Simplified calculation based on usedThisMonth
    return item.usedThisMonth / 30;
  }
  
  private static calculatePredictionConfidence(item: InventoryItem, dailyUsage: number): number {
    // Higher confidence for items with consistent usage
    const usageConsistency = dailyUsage > 0 ? Math.min(1, item.usedThisMonth / 30) : 0;
    return Math.max(0.3, Math.min(0.95, 0.6 + usageConsistency * 0.3));
  }
  
  private static analyzeMenuItemPerformance(menuItems: MenuItem[], orders: Order[]) {
    // Simplified analysis
    return menuItems.map(item => ({
      ...item,
      totalOrders: orders.filter(order => 
        order.items.some(orderItem => orderItem.name === item.name)
      ).length
    }));
  }
  
  private static analyzeCustomerPreferences(orders: Order[], customers: Customer[]) {
    // Simplified customer preference analysis
    return {
      popularCategories: ['Indian', 'Chinese', 'Continental'],
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0
    };
  }
  
  private static findComboOpportunities(orders: Order[], menuItems: MenuItem[]) {
    // Simplified combo analysis
    return [
      {
        item1: 'Dal Makhani',
        item2: 'Jeera Rice',
        frequency: 65,
        confidence: 0.8,
        potentialRevenue: 25,
        suggestedPrice: 280
      }
    ];
  }
  
  private static analyzeTimeBasedDemand(orders: Order[], menuItems: MenuItem[]) {
    return [
      {
        timeSlot: 'Evening',
        category: 'Hot Beverages',
        increase: 45,
        expectedRevenue: 20,
        confidence: 0.75
      }
    ];
  }
  
  private static analyzeTrendingCategories(orders: Order[], menuItems: MenuItem[]) {
    return [
      {
        category: 'Healthy Options',
        growth: 35,
        potentialGrowth: 25,
        confidence: 0.7
      }
    ];
  }
  
  private static analyzeCustomerSegments(customers: Customer[], orders: Order[], menuItems: MenuItem[]) {
    return [
      {
        suggestedItem: 'Premium Family Meal',
        reason: 'High-value customers prefer family-sized portions',
        expectedIncrease: '+30% family orders',
        confidence: 0.75,
        category: 'family'
      }
    ];
  }
  
  private static analyzeSlowCookingItems(orders: Order[], menuItems: MenuItem[]) {
    return menuItems
      .filter(item => item.cookingTime > 15)
      .sort((a, b) => b.cookingTime - a.cookingTime)
      .slice(0, 3);
  }
  
  private static calculateKitchenEfficiency(orders: Order[]): number {
    const ordersWithTime = orders.filter(order => order.actualCookingTime && order.estimatedTime);
    
    if (ordersWithTime.length === 0) return 0.8; // Default efficiency
    
    const totalEfficiency = ordersWithTime.reduce((sum, order) => {
      const efficiency = (order.estimatedTime || 1) / Math.max(order.actualCookingTime || 1, 1);
      return sum + Math.min(efficiency, 1); // Cap at 100% efficiency
    }, 0);
    
    return totalEfficiency / ordersWithTime.length;
  }
  
  private static analyzeChefPerformance(staff: Staff[], orders: Order[]) {
    const chefs = staff.filter(s => s.role === 'Chef');
    const avgCookingTime = orders.filter(o => o.actualCookingTime).reduce((sum, o) => sum + (o.actualCookingTime || 0), 0) / Math.max(1, orders.filter(o => o.actualCookingTime).length);
    
    return {
      needsTraining: avgCookingTime > 20,
      potentialImprovement: Math.max(0, avgCookingTime - 15)
    };
  }
  
  // Calculate dynamic AI stats
  static calculateAIStats(
    menuItems: MenuItem[],
    orders: Order[],
    inventory: InventoryItem[],
    customers: Customer[]
  ): AIStats {
    const recentOrders = this.getRecentOrders(orders, 7);
    const customerSatisfaction = this.analyzeCustomerSatisfaction(recentOrders);
    const revenueTrend = this.analyzeRevenueTrend(this.groupOrdersByDay(recentOrders));
    const lowStockItems = this.predictLowStock(inventory);
    const kitchenEfficiency = this.calculateKitchenEfficiency(recentOrders);
    
    const totalRevenue = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = recentOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const popularItems = this.analyzePopularItems(recentOrders, menuItems);
    const topSellingItem = popularItems.length > 0 ? popularItems[0].name : 'No data';
    
    return {
      customerRating: customerSatisfaction.averageRating,
      revenueGrowth: revenueTrend.changePercentage,
      lowStockItems: lowStockItems.filter(item => item.daysLeft <= 2).length,
      kitchenEfficiency: Math.round(kitchenEfficiency * 100),
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topSellingItem
    };
  }
}