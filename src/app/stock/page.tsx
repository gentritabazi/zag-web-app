"use client";

import { useEffect, useState } from "react";
import { Boxes, Plus, Minus, ArrowUpDown, History, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { StockEntry, StockLevel } from "@/types";
import {
  getProducts,
  getStockLevels,
  getStockEntries,
  addStockEntry,
} from "@/lib/store";

export default function StockPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [stockHistory, setStockHistory] = useState<StockEntry[]>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "adjust">("add");

  // Form state
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStockLevels(getStockLevels());
    setStockHistory(getStockEntries());
    setProducts(getProducts().map((p) => ({ id: p.id, name: p.name })));
  };

  const filteredStock = stockLevels.filter((s) =>
    s.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (mode: "add" | "adjust") => {
    setDialogMode(mode);
    setSelectedProductId("");
    setQuantity("");
    setNotes("");
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedProductId || !quantity) return;

    try {
      addStockEntry(
        selectedProductId,
        dialogMode,
        parseInt(quantity),
        notes || undefined
      );
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "add":
        return "bg-green-500/20 text-green-400";
      case "sale":
        return "bg-blue-500/20 text-blue-400";
      case "adjust":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "add":
        return <Plus className="h-3 w-3" />;
      case "sale":
        return <Minus className="h-3 w-3" />;
      case "adjust":
        return <ArrowUpDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Stock Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Add stock or adjust inventory levels
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => handleOpenDialog("adjust")}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Adjust Stock</span>
            <span className="sm:hidden">Adjust</span>
          </Button>
          <Button
            onClick={() => handleOpenDialog("add")}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Stock</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Stock" : "Adjust Stock"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Add new stock to your inventory"
                : "Set the exact stock level for a product"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={selectedProductId}
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">
                {dialogMode === "add" ? "Quantity to Add" : "New Stock Level"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  dialogMode === "add" ? "Enter quantity" : "Enter new level"
                }
              />
              {selectedProductId && dialogMode === "add" && (
                <p className="text-xs text-muted-foreground">
                  Current stock:{" "}
                  {stockLevels.find((s) => s.productId === selectedProductId)
                    ?.quantity || 0}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for adjustment"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProductId || !quantity}
              className="w-full sm:w-auto"
            >
              {dialogMode === "add" ? "Add Stock" : "Update Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Stock Levels */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Boxes className="h-5 w-5 text-primary" />
                  Current Stock
                </CardTitle>
                <CardDescription className="text-sm">
                  Inventory levels for all products
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredStock.length === 0 ? (
              <div className="text-center py-12">
                <Boxes className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No stock data</h3>
                <p className="text-muted-foreground mt-1">
                  Add products first, then manage stock
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-auto pr-2">
                {filteredStock.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm sm:text-base">
                        {item.productName}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {item.quantity === 0
                          ? "Out of stock"
                          : `${item.quantity} units available`}
                      </p>
                    </div>
                    <div
                      className={`text-xl sm:text-2xl font-bold shrink-0 ${
                        item.quantity === 0
                          ? "text-red-400"
                          : item.quantity < 10
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock History */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <History className="h-5 w-5 text-primary" />
              Stock History
            </CardTitle>
            <CardDescription className="text-sm">
              Recent stock changes and movements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stockHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No history yet</h3>
                <p className="text-muted-foreground mt-1">
                  Stock changes will appear here
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Change</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockHistory.slice(0, 10).map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {entry.productName}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`gap-1 ${getTypeColor(entry.type)}`}
                            >
                              {getTypeIcon(entry.type)}
                              {entry.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-muted-foreground">
                              {entry.previousQuantity}
                            </span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">
                              {entry.newQuantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {formatDate(entry.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {stockHistory.slice(0, 10).map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.productName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`gap-1 ${getTypeColor(
                            entry.type
                          )} shrink-0 ml-2`}
                        >
                          {getTypeIcon(entry.type)}
                          {entry.type}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                          Change:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {entry.previousQuantity}
                          </span>
                          <span>→</span>
                          <span className="font-medium">
                            {entry.newQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
