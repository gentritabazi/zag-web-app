"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sale, Product } from "@/types";
import {
  getProducts,
  getSales,
  recordSale,
  getStockLevel,
} from "@/lib/store";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayProfit: 0,
    weekRevenue: 0,
    weekProfit: 0,
    monthRevenue: 0,
    monthProfit: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allSales = getSales();
    setSales(allSales);
    setProducts(getProducts());
    calculateStats(allSales);
  };

  const calculateStats = (salesData: Sale[]) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todaySales = salesData.filter(
      (s) => new Date(s.createdAt) >= startOfDay
    );
    const weekSales = salesData.filter((s) => new Date(s.createdAt) >= weekAgo);
    const monthSales = salesData.filter(
      (s) => new Date(s.createdAt) >= monthAgo
    );

    setStats({
      todayRevenue: todaySales.reduce((sum, s) => sum + s.totalPrice, 0),
      todayProfit: todaySales.reduce((sum, s) => sum + s.profit, 0),
      weekRevenue: weekSales.reduce((sum, s) => sum + s.totalPrice, 0),
      weekProfit: weekSales.reduce((sum, s) => sum + s.profit, 0),
      monthRevenue: monthSales.reduce((sum, s) => sum + s.totalPrice, 0),
      monthProfit: monthSales.reduce((sum, s) => sum + s.profit, 0),
    });
  };

  const filteredSales = sales.filter((s) =>
    s.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const currentStock = selectedProductId ? getStockLevel(selectedProductId) : 0;

  const handleOpenDialog = () => {
    setSelectedProductId("");
    setQuantity("");
    setCustomPrice("");
    setUseCustomPrice(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedProductId || !quantity) return;

    try {
      const price = useCustomPrice && customPrice
        ? parseFloat(customPrice)
        : undefined;
      
      recordSale(selectedProductId, parseInt(quantity), price);
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTotal = () => {
    if (!selectedProduct || !quantity) return { total: 0, profit: 0 };
    const price = useCustomPrice && customPrice
      ? parseFloat(customPrice)
      : selectedProduct.sellingPrice;
    const qty = parseInt(quantity) || 0;
    const total = price * qty;
    const profit = (price - selectedProduct.purchasePrice) * qty;
    return { total, profit };
  };

  const { total, profit } = calculateTotal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground mt-1">
            Record and track your sales transactions
          </p>
        </div>
        <Button onClick={handleOpenDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Sale
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record New Sale</DialogTitle>
            <DialogDescription>
              Record a sale transaction for your inventory
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => {
                    const stock = getStockLevel(product.id);
                    return (
                      <SelectItem
                        key={product.id}
                        value={product.id}
                        disabled={stock === 0}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{product.name}</span>
                          <span className={`ml-2 text-xs ${stock === 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            ({stock} in stock)
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-muted-foreground">
                  Default price: {formatCurrency(selectedProduct.sellingPrice)}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={currentStock}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
              {selectedProductId && (
                <p className="text-xs text-muted-foreground">
                  Available stock: {currentStock}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomPrice"
                  checked={useCustomPrice}
                  onChange={(e) => setUseCustomPrice(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="useCustomPrice" className="text-sm font-normal">
                  Use custom price
                </Label>
              </div>
              {useCustomPrice && (
                <Input
                  id="customPrice"
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Enter custom price"
                />
              )}
            </div>
            {selectedProduct && quantity && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className={`font-bold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProductId || !quantity || parseInt(quantity) > currentStock}
            >
              Record Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</div>
            <p className="text-xs text-green-400 mt-1">
              +{formatCurrency(stats.todayProfit)} profit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.weekRevenue)}</div>
            <p className="text-xs text-green-400 mt-1">
              +{formatCurrency(stats.weekProfit)} profit
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthRevenue)}</div>
            <p className="text-xs text-green-400 mt-1">
              +{formatCurrency(stats.monthProfit)} profit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales History */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Sales History
              </CardTitle>
              <CardDescription>
                {sales.length} total transactions
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No sales recorded</h3>
              <p className="text-muted-foreground mt-1">
                {searchTerm
                  ? "Try adjusting your search"
                  : "Record your first sale to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(sale.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell className="text-center">{sale.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.totalPrice)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        sale.profit >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatCurrency(sale.profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

