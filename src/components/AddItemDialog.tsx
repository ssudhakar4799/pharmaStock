import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch } from '@/store/hooks';
import { addItem } from '@/store/slices/inventorySlice';
import type { PharmacyItem } from '@/store/slices/inventorySlice';
import { toast } from '@/hooks/use-toast';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddItemDialog({ open, onOpenChange }: AddItemDialogProps) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<Partial<PharmacyItem>>({
    name: '',
    category: 'tablets',
    manufactureDate: '',
    expiryDate: '',
    price: 0,
    quantity: 0,
    currentStock: 0,
    stockStatus: 'in-stock',
    description: '',
    manufacturer: '',
    batchNumber: '',
  });

  const categories = [
    { value: 'tablets', label: 'Tablets' },
    { value: 'syrups', label: 'Syrups' },
    { value: 'ointments', label: 'Ointments' },
    { value: 'drugs', label: 'Drugs' },
    { value: 'syringes', label: 'Syringes' },
    { value: 'glucose-water', label: 'Glucose Water' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.expiryDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const stockStatus = formData.currentStock === 0 
      ? 'out-of-stock' 
      : formData.currentStock! <= 10 
        ? 'low-stock' 
        : 'in-stock';

    const newItem: PharmacyItem = {
      id: Date.now().toString(),
      name: formData.name!,
      category: formData.category as PharmacyItem['category'],
      manufactureDate: formData.manufactureDate || '',
      expiryDate: formData.expiryDate!,
      price: formData.price || 0,
      quantity: formData.quantity || 0,
      currentStock: formData.currentStock || 0,
      stockStatus,
      description: formData.description,
      manufacturer: formData.manufacturer,
      batchNumber: formData.batchNumber,
    };

    dispatch(addItem(newItem));
    
    toast({
      title: "Success",
      description: "Item added successfully!",
    });

    // Reset form
    setFormData({
      name: '',
      category: 'tablets',
      manufactureDate: '',
      expiryDate: '',
      price: 0,
      quantity: 0,
      currentStock: 0,
      stockStatus: 'in-stock',
      description: '',
      manufacturer: '',
      batchNumber: '',
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new item to your pharmacy inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value as PharmacyItem['category'] })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Enter manufacturer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="Enter batch number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufactureDate">Manufacture Date</Label>
              <Input
                id="manufactureDate"
                type="date"
                value={formData.manufactureDate}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, quantity: qty, currentStock: qty });
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter item description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}