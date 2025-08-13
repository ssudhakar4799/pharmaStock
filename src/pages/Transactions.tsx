import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addTransaction, deleteTransaction } from '@/store/slices/transactionSlice';
import { updateStock } from '@/store/slices/inventorySlice';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Download,
  Trash2,
  ShoppingCart,
  Package,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as XLSX from 'xlsx';

export default function Transactions() {
  const { transactions } = useAppSelector((state) => state.transactions);
  const { items } = useAppSelector((state) => state.inventory);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form states for new transaction
  const [newTransaction, setNewTransaction] = useState({
    itemId: '',
    type: 'sale' as 'sale' | 'purchase',
    quantity: 1,
    customerName: '',
    supplierName: '',
    notes: '',
    paymentMethod: 'cash'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || transaction.type === filterType;
      
      let matchesPeriod = true;
      if (filterPeriod !== 'all') {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        
        switch (filterPeriod) {
          case 'today':
            matchesPeriod = transactionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesPeriod = transactionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesPeriod = transactionDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesPeriod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType, filterPeriod]);

  const stats = useMemo(() => {
    const sales = filteredTransactions.filter(t => t.type === 'sale');
    const purchases = filteredTransactions.filter(t => t.type === 'purchase');
    
    return {
      totalSales: sales.reduce((sum, t) => sum + t.totalAmount, 0),
      totalPurchases: purchases.reduce((sum, t) => sum + t.totalAmount, 0),
      salesCount: sales.length,
      purchasesCount: purchases.length,
      profit: sales.reduce((sum, t) => sum + t.totalAmount, 0) - purchases.reduce((sum, t) => sum + t.totalAmount, 0)
    };
  }, [filteredTransactions]);

  const handleAddTransaction = () => {
    const selectedItem = items.find(item => item.id === newTransaction.itemId);
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select an item",
        variant: "destructive",
      });
      return;
    }

    if (newTransaction.type === 'sale' && newTransaction.quantity > selectedItem.currentStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${selectedItem.currentStock} units available`,
        variant: "destructive",
      });
      return;
    }

    const transactionId = `${newTransaction.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    dispatch(addTransaction({
      id: transactionId,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      type: newTransaction.type,
      quantity: newTransaction.quantity,
      pricePerUnit: selectedItem.price,
      totalAmount: selectedItem.price * newTransaction.quantity,
      date: new Date().toISOString(),
      customerName: newTransaction.type === 'sale' ? newTransaction.customerName : undefined,
      supplierName: newTransaction.type === 'purchase' ? newTransaction.supplierName : undefined,
      notes: newTransaction.notes,
      paymentMethod: newTransaction.paymentMethod
    }));

    // Update stock
    dispatch(updateStock({
      id: selectedItem.id,
      quantity: newTransaction.quantity,
      operation: newTransaction.type === 'sale' ? 'subtract' : 'add'
    }));

    toast({
      title: "Success",
      description: `${newTransaction.type === 'sale' ? 'Sale' : 'Purchase'} transaction added successfully`,
    });

    setIsAddDialogOpen(false);
    setNewTransaction({
      itemId: '',
      type: 'sale',
      quantity: 1,
      customerName: '',
      supplierName: '',
      notes: '',
      paymentMethod: 'cash'
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      dispatch(deleteTransaction(id));
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Date': new Date(transaction.date).toLocaleDateString(),
      'Type': transaction.type.toUpperCase(),
      'Item': transaction.itemName,
      'Quantity': transaction.quantity,
      'Price Per Unit': transaction.pricePerUnit,
      'Total Amount': transaction.totalAmount,
      'Customer/Supplier': transaction.customerName || transaction.supplierName || 'N/A',
      'Payment Method': transaction.paymentMethod || 'N/A',
      'Notes': transaction.notes || 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, `transactions-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Export Complete",
      description: "Transactions exported to Excel successfully",
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Transactions
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage purchase and sales records
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Record a new purchase or sale transaction
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select value={newTransaction.type} onValueChange={(value: 'sale' | 'purchase') => 
                      setNewTransaction(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="purchase">Purchase</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="item">Item</Label>
                    <Select value={newTransaction.itemId} onValueChange={(value) => 
                      setNewTransaction(prev => ({ ...prev, itemId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} (Stock: {item.currentStock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newTransaction.quantity}
                      onChange={(e) => setNewTransaction(prev => ({ 
                        ...prev, 
                        quantity: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  
                  {newTransaction.type === 'sale' ? (
                    <div>
                      <Label htmlFor="customer">Customer Name</Label>
                      <Input
                        id="customer"
                        value={newTransaction.customerName}
                        onChange={(e) => setNewTransaction(prev => ({ 
                          ...prev, 
                          customerName: e.target.value 
                        }))}
                        placeholder="Enter customer name"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="supplier">Supplier Name</Label>
                      <Input
                        id="supplier"
                        value={newTransaction.supplierName}
                        onChange={(e) => setNewTransaction(prev => ({ 
                          ...prev, 
                          supplierName: e.target.value 
                        }))}
                        placeholder="Enter supplier name"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="payment">Payment Method</Label>
                    <Select value={newTransaction.paymentMethod} onValueChange={(value) => 
                      setNewTransaction(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="check">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction(prev => ({ 
                        ...prev, 
                        notes: e.target.value 
                      }))}
                      placeholder="Add any notes..."
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTransaction}>
                    Add Transaction
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="animate-scale-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-success">${stats.totalSales.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{stats.salesCount} transactions</p>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <ShoppingCart className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-scale-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold text-primary">${stats.totalPurchases.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{stats.purchasesCount} transactions</p>
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
                  <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${stats.profit.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((stats.profit / Math.max(stats.totalSales, 1)) * 100).toFixed(1)}% margin
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stats.profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  <TrendingUp className={`h-6 w-6 ${stats.profit >= 0 ? 'text-success' : 'text-destructive'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="animate-scale-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                  <p className="text-xs text-muted-foreground">Filtered results</p>
                </div>
                <div className="p-3 rounded-full bg-accent/10">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sales Only</SelectItem>
                  <SelectItem value="purchase">Purchases Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              Showing {filteredTransactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Customer/Supplier</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'sale' ? 'default' : 'secondary'}>
                            {transaction.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.itemName}</TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>${transaction.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className={`font-medium ${
                          transaction.type === 'sale' ? 'text-success' : 'text-primary'
                        }`}>
                          ${transaction.totalAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transaction.customerName || transaction.supplierName || 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}