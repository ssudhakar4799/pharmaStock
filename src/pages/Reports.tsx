import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileText, 
  Calendar,
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';
import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { items } = useAppSelector((state) => state.inventory);
  const { transactions } = useAppSelector((state) => state.transactions);
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState('sales');

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filteredTransactions = transactions.filter(t => 
      new Date(t.date) >= startDate
    );

    const sales = filteredTransactions.filter(t => t.type === 'sale');
    const purchases = filteredTransactions.filter(t => t.type === 'purchase');

    // Current stock report
    const currentStock = items.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      stockStatus: item.stockStatus,
      price: item.price,
      totalValue: item.currentStock * item.price,
      expiryDate: item.expiryDate,
      isExpired: new Date(item.expiryDate) < now,
      isNearExpiry: new Date(item.expiryDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) && new Date(item.expiryDate) > now
    }));

    // Out of stock items
    const outOfStock = currentStock.filter(item => item.stockStatus === 'out-of-stock');
    
    // Low stock items
    const lowStock = currentStock.filter(item => item.stockStatus === 'low-stock');

    // Expired items
    const expiredItems = currentStock.filter(item => item.isExpired);

    // Sales summary
    const salesSummary = sales.reduce((acc, transaction) => {
      acc.totalRevenue += transaction.totalAmount;
      acc.totalQuantity += transaction.quantity;
      acc.transactionCount += 1;
      
      if (!acc.topItems[transaction.itemId]) {
        acc.topItems[transaction.itemId] = {
          name: transaction.itemName,
          quantity: 0,
          revenue: 0
        };
      }
      acc.topItems[transaction.itemId].quantity += transaction.quantity;
      acc.topItems[transaction.itemId].revenue += transaction.totalAmount;
      
      return acc;
    }, {
      totalRevenue: 0,
      totalQuantity: 0,
      transactionCount: 0,
      topItems: {} as Record<string, { name: string; quantity: number; revenue: number }>
    });

    // Purchase summary
    const purchaseSummary = purchases.reduce((acc, transaction) => {
      acc.totalCost += transaction.totalAmount;
      acc.totalQuantity += transaction.quantity;
      acc.transactionCount += 1;
      
      return acc;
    }, {
      totalCost: 0,
      totalQuantity: 0,
      transactionCount: 0
    });

    const topSellingItems = Object.values(salesSummary.topItems)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      period: selectedPeriod,
      dateRange: { start: startDate, end: now },
      currentStock,
      outOfStock,
      lowStock,
      expiredItems,
      salesSummary,
      purchaseSummary,
      topSellingItems,
      profit: salesSummary.totalRevenue - purchaseSummary.totalCost
    };
  }, [items, transactions, selectedPeriod]);

  const exportToExcel = (dataType: string) => {
    let data: any[] = [];
    let filename = '';

    switch (dataType) {
      case 'current-stock':
        data = reportData.currentStock.map(item => ({
          'Item Name': item.name,
          'Category': item.category.replace('-', ' '),
          'Current Stock': item.currentStock,
          'Stock Status': item.stockStatus.replace('-', ' '),
          'Unit Price': item.price,
          'Total Value': item.totalValue.toFixed(2),
          'Expiry Date': new Date(item.expiryDate).toLocaleDateString(),
          'Status': item.isExpired ? 'EXPIRED' : item.isNearExpiry ? 'NEAR EXPIRY' : 'GOOD'
        }));
        filename = `current-stock-${selectedPeriod}`;
        break;
        
      case 'out-of-stock':
        data = reportData.outOfStock.map(item => ({
          'Item Name': item.name,
          'Category': item.category.replace('-', ' '),
          'Unit Price': item.price,
          'Expiry Date': new Date(item.expiryDate).toLocaleDateString()
        }));
        filename = `out-of-stock-items`;
        break;
        
      case 'sales':
        data = transactions
          .filter(t => t.type === 'sale' && 
            new Date(t.date) >= reportData.dateRange.start)
          .map(transaction => ({
            'Date': new Date(transaction.date).toLocaleDateString(),
            'Item': transaction.itemName,
            'Quantity': transaction.quantity,
            'Unit Price': transaction.pricePerUnit,
            'Total Amount': transaction.totalAmount,
            'Customer': transaction.customerName || 'Walk-in',
            'Payment Method': transaction.paymentMethod || 'Cash'
          }));
        filename = `sales-report-${selectedPeriod}`;
        break;
        
      case 'purchases':
        data = transactions
          .filter(t => t.type === 'purchase' && 
            new Date(t.date) >= reportData.dateRange.start)
          .map(transaction => ({
            'Date': new Date(transaction.date).toLocaleDateString(),
            'Item': transaction.itemName,
            'Quantity': transaction.quantity,
            'Unit Price': transaction.pricePerUnit,
            'Total Amount': transaction.totalAmount,
            'Supplier': transaction.supplierName || 'N/A',
            'Payment Method': transaction.paymentMethod || 'N/A'
          }));
        filename = `purchase-report-${selectedPeriod}`;
        break;
    }

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available for the selected report",
        variant: "destructive",
      });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export Complete",
      description: "Report exported to Excel successfully",
    });
  };

  const exportToPDF = (dataType: string) => {
    const doc = new jsPDF();
    const title = `${dataType.replace('-', ' ').toUpperCase()} REPORT`;
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    // Add date range
    doc.setFontSize(10);
    doc.text(`Period: ${selectedPeriod} (${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()})`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 36);

    let tableData: any[] = [];
    let columns: string[] = [];

    switch (dataType) {
      case 'current-stock':
        columns = ['Item', 'Category', 'Stock', 'Status', 'Price', 'Value'];
        tableData = reportData.currentStock.map(item => [
          item.name,
          item.category.replace('-', ' '),
          item.currentStock,
          item.stockStatus.replace('-', ' '),
          `$${item.price.toFixed(2)}`,
          `$${item.totalValue.toFixed(2)}`
        ]);
        break;
        
      case 'sales':
        columns = ['Date', 'Item', 'Qty', 'Unit Price', 'Total', 'Customer'];
        tableData = transactions
          .filter(t => t.type === 'sale' && new Date(t.date) >= reportData.dateRange.start)
          .map(t => [
            new Date(t.date).toLocaleDateString(),
            t.itemName,
            t.quantity,
            `$${t.pricePerUnit.toFixed(2)}`,
            `$${t.totalAmount.toFixed(2)}`,
            t.customerName || 'Walk-in'
          ]);
        break;
    }

    if (tableData.length === 0) {
      doc.text('No data available for this report.', 14, 50);
    } else {
      autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });
    }

    doc.save(`${dataType}-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Export Complete",
      description: "Report exported to PDF successfully",
    });
  };

  const reportCards = [
    {
      title: 'Current Stock Report',
      description: 'Complete inventory with stock levels and values',
      icon: Package,
      count: reportData.currentStock.length,
      value: `$${reportData.currentStock.reduce((sum, item) => sum + item.totalValue, 0).toFixed(2)}`,
      type: 'current-stock'
    },
    {
      title: 'Out of Stock Items',
      description: 'Items that need immediate restocking',
      icon: AlertTriangle,
      count: reportData.outOfStock.length,
      value: 'Urgent',
      type: 'out-of-stock',
      urgent: true
    },
    {
      title: 'Sales Report',
      description: `Sales transactions for the last ${selectedPeriod}`,
      icon: TrendingUp,
      count: reportData.salesSummary.transactionCount,
      value: `$${reportData.salesSummary.totalRevenue.toFixed(2)}`,
      type: 'sales'
    },
    {
      title: 'Purchase Report',
      description: `Purchase transactions for the last ${selectedPeriod}`,
      icon: DollarSign,
      count: reportData.purchaseSummary.transactionCount,
      value: `$${reportData.purchaseSummary.totalCost.toFixed(2)}`,
      type: 'purchases'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Reports
            </h1>
            <p className="text-muted-foreground mt-2">
              Generate and download comprehensive reports
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-success">
                    ${reportData.salesSummary.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reportData.salesSummary.transactionCount} sales
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
                  <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold text-primary">
                    ${reportData.purchaseSummary.totalCost.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reportData.purchaseSummary.transactionCount} purchases
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${reportData.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${reportData.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((reportData.profit / Math.max(reportData.salesSummary.totalRevenue, 1)) * 100).toFixed(1)}% margin
                  </p>
                </div>
                <div className={`p-3 rounded-full ${reportData.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <DollarSign className={`h-6 w-6 ${reportData.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stock Issues</p>
                  <p className="text-2xl font-bold text-warning">
                    {reportData.outOfStock.length + reportData.lowStock.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reportData.outOfStock.length} out, {reportData.lowStock.length} low
                  </p>
                </div>
                <div className="p-3 rounded-full bg-warning/10">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportCards.map((report, index) => (
            <Card key={report.type} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <report.icon className={`h-5 w-5 ${report.urgent ? 'text-warning' : 'text-primary'}`} />
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold">{report.count}</p>
                    <p className="text-sm text-muted-foreground">Items</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-medium ${report.urgent ? 'text-warning' : ''}`}>
                      {report.value}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => exportToExcel(report.type)}
                    size="sm" 
                    variant="outline" 
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                  </Button>
                  <Button 
                    onClick={() => exportToPDF(report.type)}
                    size="sm" 
                    variant="outline" 
                    className="flex-1 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Selling Items */}
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Selling Items ({selectedPeriod})
            </CardTitle>
            <CardDescription>
              Best performing products by revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportData.topSellingItems.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No sales data for this period</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topSellingItems.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'outline'}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity} units</TableCell>
                      <TableCell className="font-medium text-success">
                        ${item.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(item.revenue / reportData.topSellingItems[0].revenue) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {((item.revenue / reportData.topSellingItems[0].revenue) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}