import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Calendar,
  Download,
  BarChart3
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function Analytics() {
  const { transactions, totalRevenue, totalCost } = useAppSelector((state) => state.transactions);
  const { items } = useAppSelector((state) => state.inventory);
  const [timeRange, setTimeRange] = useState('month');

  const analytics = useMemo(() => {
    const now = new Date();
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
    
    const salesRevenue = sales.reduce((sum, t) => sum + t.totalAmount, 0);
    const purchaseCost = purchases.reduce((sum, t) => sum + t.totalAmount, 0);
    const profit = salesRevenue - purchaseCost;
    
    // Daily breakdown for trend analysis
    const dailyData = filteredTransactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sales: 0, purchases: 0, profit: 0 };
      }
      if (transaction.type === 'sale') {
        acc[date].sales += transaction.totalAmount;
      } else {
        acc[date].purchases += transaction.totalAmount;
      }
      acc[date].profit = acc[date].sales - acc[date].purchases;
      return acc;
    }, {} as Record<string, { sales: number; purchases: number; profit: number }>);

    return {
      salesRevenue,
      purchaseCost,
      profit,
      salesCount: sales.length,
      purchaseCount: purchases.length,
      dailyData: Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data
      }))
    };
  }, [transactions, timeRange]);

  const topSellingItems = useMemo(() => {
    const itemSales = transactions
      .filter(t => t.type === 'sale')
      .reduce((acc, t) => {
        if (!acc[t.itemId]) {
          acc[t.itemId] = {
            itemName: t.itemName,
            quantity: 0,
            revenue: 0
          };
        }
        acc[t.itemId].quantity += t.quantity;
        acc[t.itemId].revenue += t.totalAmount;
        return acc;
      }, {} as Record<string, { itemName: string; quantity: number; revenue: number }>);

    return Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [transactions]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive business insights and performance metrics
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
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sales Revenue</p>
                  <p className="text-2xl font-bold text-success mt-2">
                    ${analytics.salesRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.salesCount} transactions
                  </p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purchase Cost</p>
                  <p className="text-2xl font-bold text-destructive mt-2">
                    ${analytics.purchaseCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.purchaseCount} orders
                  </p>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <TrendingDown className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold mt-2 ${analytics.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${analytics.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.profit >= 0 ? 'Profitable' : 'Loss'}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${analytics.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <DollarSign className={`h-6 w-6 ${analytics.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {items.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    In inventory
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Items */}
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Selling Items
              </CardTitle>
              <CardDescription>
                Best performing products by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSellingItems.map((item, index) => (
                  <div key={item.itemName} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      ${item.revenue.toFixed(2)}
                    </Badge>
                  </div>
                ))}
                {topSellingItems.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No sales data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Performance Summary
              </CardTitle>
              <CardDescription>
                Key insights for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-success/10">
                    <p className="text-2xl font-bold text-success">
                      {analytics.salesCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-2xl font-bold text-primary">
                      {analytics.purchaseCount}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Purchases</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profit Margin</span>
                    <span className={`font-medium ${
                      analytics.salesRevenue > 0 
                        ? ((analytics.profit / analytics.salesRevenue) * 100) >= 20 
                          ? 'text-success' 
                          : 'text-warning'
                        : 'text-muted-foreground'
                    }`}>
                      {analytics.salesRevenue > 0 
                        ? `${((analytics.profit / analytics.salesRevenue) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Sale</span>
                    <span className="font-medium">
                      ${analytics.salesCount > 0 
                        ? (analytics.salesRevenue / analytics.salesCount).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Purchase</span>
                    <span className="font-medium">
                      ${analytics.purchaseCount > 0 
                        ? (analytics.purchaseCost / analytics.purchaseCount).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}