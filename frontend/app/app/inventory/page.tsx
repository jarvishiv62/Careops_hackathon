"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "../../../lib/auth";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    minThreshold: number;
  };
}

// Helper function to calculate stock status
const getStockStatus = (
  item: InventoryItem,
): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" => {
  const minThreshold = item.metadata?.minThreshold || 5;
  if (item.quantity === 0) return "OUT_OF_STOCK";
  if (item.quantity <= minThreshold) return "LOW_STOCK";
  return "IN_STOCK";
};

// Helper function to get minThreshold
const getMinThreshold = (item: InventoryItem): number => {
  return item.metadata?.minThreshold || 5;
};

export default function InventoryPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventory`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setInventory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${itemToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setInventory(inventory.filter((item) => item.id !== itemToDelete));
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } catch (error) {
      console.error("Failed to delete inventory item:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "LOW_STOCK":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "OUT_OF_STOCK":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getStockIcon = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return <TrendingUp className="w-4 h-4" />;
      case "LOW_STOCK":
        return <AlertTriangle className="w-4 h-4" />;
      case "OUT_OF_STOCK":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-dark border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="heading-primary"
              >
                Inventory
              </motion.h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/app/inventory/new")}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-gradient hover-glow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      getStockStatus(item) === "IN_STOCK"
                        ? "bg-green-500/20"
                        : getStockStatus(item) === "LOW_STOCK"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                    }`}
                  >
                    <Package
                      className={`w-6 h-6 ${
                        getStockStatus(item) === "IN_STOCK"
                          ? "text-green-400"
                          : getStockStatus(item) === "LOW_STOCK"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-100">{item.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${getStatusColor(getStockStatus(item))}`}
                    >
                      {getStockIcon(getStockStatus(item))}
                      {getStockStatus(item).replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/app/inventory/${item.id}/edit`)
                    }
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item.id);
                      setShowDeleteModal(true);
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-300 mb-4">{item.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Quantity</span>
                  <span className="font-bold text-gray-100">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Min. Threshold</span>
                  <span className="text-sm text-gray-300">
                    {getMinThreshold(item)} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Category</span>
                  <span className="text-sm text-gray-300">
                    {item.category || "Uncategorized"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Created</span>
                  <span className="text-sm text-gray-300">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="font-bold text-gray-100">{item.quantity}</div>
                  <div className="text-gray-400 text-sm">Current Stock</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="heading-secondary mb-2">No inventory items found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by adding your first inventory item"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push("/app/inventory/new")}
                className="btn-primary"
              >
                Add Item
              </button>
            )}
          </div>
        )}
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
          <div className="card-gradient max-w-md w-full mx-4">
            <h3 className="heading-secondary mb-4">Delete Inventory Item</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this inventory item? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all shadow-lg shadow-red-500/25"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
