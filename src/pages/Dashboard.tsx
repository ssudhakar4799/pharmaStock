import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector } from '@/store/hooks';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Clock,
  ShoppingCart,
  Calendar,
  BarChart3,
  Download,
  Eye,
  PieChart
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Dashboard() {
  const { items } = useAppSelector((state) => state.inventory);
  const { transactions, totalRevenue, totalCost } = useAppSelector((state) => state.transactions);
  const [timeRange, setTimeRange] = useState('month');

  const stats = useMemo(() => {
    const now = new Date();
    
    // Filter transactions based on time range
    const getFilteredTransactions = (range: string) => {
      const cutoffDate = new Date();
      
      switch (range) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return transactions;
      }
      
      return transactions.filter(t => new Date(t.date) >= cutoffDate);
    };

    const filteredTransactions = getFilteredTransactions(timeRange);
    const sales = filteredTransactions.filter(t => t.type === 'sale');
    const purchases = filteredTransactions.filter(t => t.type === 'purchase');
    
    const periodRevenue = sales.reduce((sum, t) => sum + t.totalAmount, 0);
    const periodCost = purchases.reduce((sum, t) => sum + t.totalAmount, 0);
    const periodProfit = periodRevenue - periodCost;

    const totalItems = items.length;
    const outOfStock = items.filter(item => item.stockStatus === 'out-of-stock').length;
    const lowStock = items.filter(item => item.stockStatus === 'low-stock').length;
    const expiredItems = items.filter(item => new Date(item.expiryDate) < new Date()).length;
    const nearExpiry = items.filter(item => {
      const expiryDate = new Date(item.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
    }).length;

    const recentTransactions = transactions.slice(-5);

    // Category breakdown
    const categoryStats = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, value: 0 };
      }
      acc[item.category].count += 1;
      acc[item.category].value += item.price * item.currentStock;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Top selling items from transactions
    const topSellingItems = sales.reduce((acc, transaction) => {
      if (!acc[transaction.itemId]) {
        acc[transaction.itemId] = {
          name: transaction.itemName,
          quantity: 0,
          revenue: 0
        };
      }
      acc[transaction.itemId].quantity += transaction.quantity;
      acc[transaction.itemId].revenue += transaction.totalAmount;
      return acc;
    }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

    return {
      totalItems,
      outOfStock,
      lowStock,
      expiredItems,
      nearExpiry,
      totalRevenue,
      totalCost,
      profit: totalRevenue - totalCost,
      periodRevenue,
      periodCost,
      periodProfit,
      recentTransactions,
      categoryStats,
      topSellingItems: Object.values(topSellingItems)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      salesCount: sales.length,
      purchaseCount: purchases.length,
    };
  }, [items, transactions, totalRevenue, totalCost, timeRange]);

  const quickStats = [
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      subtitle: `$${stats.periodRevenue.toFixed(2)} this ${timeRange}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      trend: stats.periodRevenue > 0 ? '+' : '',
    },
    {
      title: 'Total Profit',
      value: `$${stats.profit.toFixed(2)}`,
      subtitle: `$${stats.periodProfit.toFixed(2)} this ${timeRange}`,
      icon: TrendingUp,
      color: stats.profit >= 0 ? 'text-success' : 'text-destructive',
      bgColor: stats.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      trend: stats.periodProfit > 0 ? '+' : '',
    },
    {
      title: 'Sales Count',
      value: stats.salesCount,
      subtitle: `${timeRange} transactions`,
      icon: ShoppingCart,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Items',
      value: stats.totalItems,
      subtitle: `${stats.outOfStock} out of stock`,
      icon: Package,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome to your pharmacy management system
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card 
              key={stat.title} 
              className="animate-scale-in cursor-pointer hover:shadow-elevation transition-all duration-200" 
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => {
                if (stat.title === 'Total Revenue' || stat.title === 'Sales Count') {
                  window.location.href = '/transactions?filter=sales';
                } else if (stat.title === 'Total Profit') {
                  window.location.href = '/reports';
                } else if (stat.title === 'Total Items') {
                  window.location.href = '/inventory';
                }
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold mt-2">
                      {stat.value}
                    </p>
                    {stat.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.trend}{stat.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Analytics and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Performance */}
          <Card className="animate-slide-up cursor-pointer hover:shadow-elevation transition-all duration-200" onClick={() => window.location.href = '/inventory'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Inventory by Category
              </CardTitle>
              <CardDescription>
                Distribution of items across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.categoryStats).map(([category, data]) => (
                  <div key={category} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
                    <span className="text-sm capitalize">
                      {category.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{data.count}</span>
                      <Badge variant="outline" className="text-xs">
                        ${data.value.toFixed(0)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {Object.keys(stats.categoryStats).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No items in inventory
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card className="animate-slide-up cursor-pointer hover:shadow-elevation transition-all duration-200" style={{ animationDelay: '100ms' }} onClick={() => window.location.href = '/reports'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                Top Selling Items
              </CardTitle>
              <CardDescription>
                Best performers this {timeRange}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topSellingItems.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} units
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      ${item.revenue.toFixed(0)}
                    </Badge>
                  </div>
                ))}
                {stats.topSellingItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sales data
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Fast access to common tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/inventory'}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Low Stock Items ({stats.lowStock})
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/inventory'}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Check Expiry Alerts ({stats.expiredItems + stats.nearExpiry})
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/sales'}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Process New Sale
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/reports'}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expiry Alerts */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-warning" />
                <span>Expiry Alerts</span>
              </CardTitle>
              <CardDescription>
                Items that are expired or expiring soon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.expiredItems > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                  <span className="text-sm font-medium">Expired Items</span>
                  <Badge variant="destructive">{stats.expiredItems}</Badge>
                </div>
              )}
              {stats.nearExpiry > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
                  <span className="text-sm font-medium">Expiring in 30 days</span>
                  <Badge className="bg-warning text-warning-foreground">{stats.nearExpiry}</Badge>
                </div>
              )}
              {stats.expiredItems === 0 && stats.nearExpiry === 0 && (
                <p className="text-sm text-muted-foreground">No expiry alerts</p>
              )}
            </CardContent>
          </Card>

          {/* Stock Alerts */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Stock Status</span>
              </CardTitle>
              <CardDescription>
                Current inventory stock levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>In Stock</span>
                    <span>{stats.totalItems - stats.outOfStock - stats.lowStock}</span>
                  </div>
                  <Progress value={((stats.totalItems - stats.outOfStock - stats.lowStock) / Math.max(stats.totalItems, 1)) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Low Stock</span>
                    <span>{stats.lowStock}</span>
                  </div>
                  <Progress value={(stats.lowStock / Math.max(stats.totalItems, 1)) * 100} className="h-2 [&>div]:bg-warning" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Out of Stock</span>
                    <span>{stats.outOfStock}</span>
                  </div>
                  <Progress value={(stats.outOfStock / Math.max(stats.totalItems, 1)) * 100} className="h-2 [&>div]:bg-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Recent Transactions</span>
            </CardTitle>
            <CardDescription>
              Latest purchase and sale activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{transaction.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type === 'sale' ? 'Sold' : 'Purchased'} {transaction.quantity} units
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'sale' ? 'text-success' : 'text-primary'}`}>
                        ${transaction.totalAmount.toFixed(2)}
                      </p>
                      <Badge variant={transaction.type === 'sale' ? 'default' : 'secondary'}>
                        {transaction.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent transactions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}