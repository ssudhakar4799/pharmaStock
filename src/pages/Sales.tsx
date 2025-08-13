import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addTransaction } from '@/store/slices/transactionSlice';
import { updateStock } from '@/store/slices/inventorySlice';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Search,
  TrendingUp,
  Package,
  AlertCircle
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function Sales() {
  const { items } = useAppSelector((state) => state.inventory);
  const { transactions } = useAppSelector((state) => state.transactions);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState<Record<string, { item: any; quantity: number }>>({});
  const [customerName, setCustomerName] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const inStock = item.currentStock > 0;
      return matchesSearch && matchesCategory && inStock;
    });
  }, [items, searchTerm, selectedCategory]);

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((total, { item, quantity }) => {
      return total + (item.price * quantity);
    }, 0);
  }, [cart]);

  const addToCart = (item: any) => {
    if (item.currentStock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${item.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }

    setCart(prev => {
      const currentQuantity = prev[item.id]?.quantity || 0;
      if (currentQuantity >= item.currentStock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${item.currentStock} units available`,
          variant: "destructive",
        });
        return prev;
      }
      
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: currentQuantity + 1
        }
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId]) {
        if (updated[itemId].quantity > 1) {
          updated[itemId].quantity -= 1;
        } else {
          delete updated[itemId];
        }
      }
      return updated;
    });
  };

  const clearCart = () => {
    setCart({});
    setCustomerName('');
  };

  const processSale = () => {
    if (Object.keys(cart).length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before processing sale",
        variant: "destructive",
      });
      return;
    }

    // Check stock availability for all items
    for (const { item, quantity } of Object.values(cart)) {
      if (quantity > item.currentStock) {
        toast({
          title: "Insufficient Stock",
          description: `Not enough stock for ${item.name}. Available: ${item.currentStock}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Process each item in cart
    Object.values(cart).forEach(({ item, quantity }) => {
      const transactionId = `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add transaction
      dispatch(addTransaction({
        id: transactionId,
        itemId: item.id,
        itemName: item.name,
        type: 'sale',
        quantity,
        pricePerUnit: item.price,
        totalAmount: item.price * quantity,
        date: new Date().toISOString(),
        customerName: customerName || 'Walk-in Customer',
      }));

      // Update stock
      dispatch(updateStock({
        id: item.id,
        quantity,
        operation: 'subtract'
      }));
    });

    toast({
      title: "Sale Completed",
      description: `Successfully processed sale for $${cartTotal.toFixed(2)}`,
    });

    clearCart();
  };

  const recentSales = useMemo(() => {
    return transactions
      .filter(t => t.type === 'sale')
      .slice(-5)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'tablets', label: 'Tablets' },
    { value: 'syrups', label: 'Syrups' },
    { value: 'ointments', label: 'Ointments' },
    { value: 'drugs', label: 'Drugs' },
    { value: 'syringes', label: 'Syringes' },
    { value: 'glucose-water', label: 'Glucose Water' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sales Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Process sales and manage customer transactions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Product Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {item.category.replace('-', ' ')}
                          </p>
                        </div>
                        <Badge variant={item.stockStatus === 'in-stock' ? 'default' : 'destructive'}>
                          {item.currentStock} left
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                        <Button
                          onClick={() => addToCart(item)}
                          disabled={item.currentStock <= 0}
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {filteredItems.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No products found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Recent Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{sale.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customerName} • {sale.quantity} units
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-success">${sale.totalAmount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {recentSales.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      No recent sales
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shopping Cart */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Shopping Cart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div>
                    <Label htmlFor="customer">Customer Name</Label>
                    <Input
                      id="customer"
                      placeholder="Enter customer name (optional)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {Object.entries(cart).map(([itemId, { item, quantity }]) => (
                      <div key={itemId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(itemId)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => addToCart(item)}
                            disabled={quantity >= item.currentStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right ml-4">
                          <p className="font-medium">
                            ${(item.price * quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {Object.keys(cart).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Cart Total */}
                  {Object.keys(cart).length > 0 && (
                    <>
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-medium">Total:</span>
                          <span className="text-2xl font-bold text-primary">
                            ${cartTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <Button 
                            onClick={processSale}
                            className="w-full bg-gradient-success hover:opacity-90"
                          >
                            Process Sale
                          </Button>
                          
                          <Button 
                            onClick={clearCart}
                            variant="outline"
                            className="w-full"
                          >
                            Clear Cart
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sales Count</span>
                    <span className="font-medium">
                      {transactions.filter(t => 
                        t.type === 'sale' && 
                        new Date(t.date).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-medium text-success">
                      ${transactions
                        .filter(t => 
                          t.type === 'sale' && 
                          new Date(t.date).toDateString() === new Date().toDateString()
                        )
                        .reduce((sum, t) => sum + t.totalAmount, 0)
                        .toFixed(2)
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Low Stock Items</span>
                    <span className="font-medium text-warning">
                      {items.filter(item => item.stockStatus === 'low-stock').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}