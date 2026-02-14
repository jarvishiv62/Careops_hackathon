"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Save, X } from "lucide-react";
import { useAuth } from "../../../../lib/auth";

interface InventoryFormData {
  name: string;
  description: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  category: string;
}

const categories = [
  "Equipment",
  "Supplies",
  "Materials",
  "Tools",
  "Furniture",
  "Electronics",
  "Other",
];

const units = [
  "pieces",
  "boxes",
  "kg",
  "lbs",
  "liters",
  "gallons",
  "meters",
  "feet",
  "sets",
  "units",
];

export default function NewInventoryPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<InventoryFormData>({
    name: "",
    description: "",
    quantity: 0,
    minThreshold: 5,
    unit: "pieces",
    category: "Supplies",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Wait for auth to be ready
    if (authLoading) {
      setError("Loading authentication...");
      return;
    }

    // Ensure we have a token before proceeding
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        router.push("/app/inventory");
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create inventory item");
      }
    } catch (error) {
      setError("Failed to create inventory item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof InventoryFormData,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full"
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
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.back()}
                className="p-2 rounded-xl hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="heading-primary"
              >
                New Inventory Item
              </motion.h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-gradient"
        >
          {/* Form Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h2 className="heading-secondary">Item Information</h2>
              <p className="text-gray-300">
                Add a new inventory item to track stock levels
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="input-field"
                placeholder="Office Chair"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                className="input-field resize-none"
                placeholder="Ergonomic office chair with lumbar support"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="input-field"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Threshold */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Current Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    handleInputChange("quantity", parseInt(e.target.value) || 0)
                  }
                  className="input-field"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Min. Threshold *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.minThreshold}
                  onChange={(e) =>
                    handleInputChange(
                      "minThreshold",
                      parseInt(e.target.value) || 1,
                    )
                  }
                  className="input-field"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Unit of Measurement *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                className="input-field"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Stock Status Preview
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    formData.quantity === 0
                      ? "bg-red-500"
                      : formData.quantity <= formData.minThreshold
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {formData.quantity === 0
                    ? "Out of Stock"
                    : formData.quantity <= formData.minThreshold
                      ? "Low Stock"
                      : "In Stock"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push("/app/inventory")}
                className="flex-1 btn-outline flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Creating..." : "Create Item"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
