import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, Package } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSearchTerm, setSelectedCategory, deleteItem } from '@/store/slices/inventorySlice';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { AddItemDialog } from '@/components/AddItemDialog';
import { EditItemDialog } from '@/components/EditItemDialog';
import type { PharmacyItem } from '@/store/slices/inventorySlice';

export default function Inventory() {
  const dispatch = useAppDispatch();
  const { items, searchTerm, selectedCategory } = useAppSelector((state) => state.inventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);

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

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-success text-success-foreground';
      case 'low-stock':
        return 'bg-warning text-warning-foreground';
      case 'out-of-stock':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isNearExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry > new Date();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteItem(id));
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your pharmacy inventory and stock levels
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="animate-pulse-glow"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(value) => dispatch(setSelectedCategory(value))}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground text-center mb-6">
                {items.length === 0 
                  ? "Start by adding your first inventory item."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {items.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <Card 
                key={item.id} 
                className="animate-scale-in hover:shadow-elevation transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {item.category.replace('-', ' ')}
                      </CardDescription>
                    </div>
                    <Badge className={getStockStatusColor(item.stockStatus)}>
                      {item.stockStatus.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Stock</p>
                      <p className="font-medium">{item.currentStock} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Expiry Date</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{new Date(item.expiryDate).toLocaleDateString()}</p>
                        {isExpired(item.expiryDate) && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        {isNearExpiry(item.expiryDate) && !isExpired(item.expiryDate) && (
                          <Badge className="text-xs bg-warning text-warning-foreground">Near Expiry</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingItem(item)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialogs */}
        <AddItemDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen} 
        />
        
        {editingItem && (
          <EditItemDialog 
            open={!!editingItem} 
            onOpenChange={(open) => !open && setEditingItem(null)}
            item={editingItem}
          />
        )}
      </div>
    </Layout>
  );
}