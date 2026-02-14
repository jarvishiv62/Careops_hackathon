"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  MessageSquare,
  HeartPulse,
  Mail,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
  children?: SidebarItem[];
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspace } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Role-based navigation items
  const getSidebarItems = (): SidebarItem[] => {
    const userRole = workspace?.userRole || user?.role;

    const baseItems = [
      {
        title: "Dashboard",
        href: "/app/dashboard",
        icon: LayoutDashboard,
      },
    ];

    const staffItems = [
      ...baseItems,
      {
        title: "My Patients",
        href: "/app/contacts",
        icon: HeartPulse,
        children: [
          {
            title: "All Patients",
            href: "/app/contacts",
            icon: Users,
          },
          {
            title: "New Patient",
            href: "/app/contacts/new",
            icon: HeartPulse,
          },
        ],
      },
      {
        title: "My Appointments",
        href: "/app/bookings",
        icon: Calendar,
        children: [
          {
            title: "My Schedule",
            href: "/app/bookings/my",
            icon: Calendar,
          },
          {
            title: "New Appointment",
            href: "/app/bookings/new",
            icon: Calendar,
          },
        ],
      },
      {
        title: "Health Forms",
        href: "/app/forms",
        icon: FileText,
        children: [
          {
            title: "Patient Forms",
            href: "/app/forms",
            icon: FileText,
          },
        ],
      },
      {
        title: "Conversations",
        href: "/app/inbox",
        icon: MessageSquare,
        children: [
          {
            title: "All Conversations",
            href: "/app/inbox",
            icon: MessageSquare,
          },
        ],
      },
      {
        title: "Service Requests",
        href: "/app/service-requests",
        icon: FileText,
      },
    ];

    const adminItems = [
      ...staffItems,
      {
        title: "All Appointments",
        href: "/app/bookings",
        icon: Calendar,
        children: [
          {
            title: "All Schedule",
            href: "/app/bookings",
            icon: Calendar,
          },
          {
            title: "New Appointment",
            href: "/app/bookings/new",
            icon: Calendar,
          },
        ],
      },
      {
        title: "Email Test",
        href: "/app/email-test",
        icon: Mail,
      },
    ];

    const ownerItems = [
      ...adminItems,
      {
        title: "Medical Supplies",
        href: "/app/inventory",
        icon: Package,
        children: [
          {
            title: "All Supplies",
            href: "/app/inventory",
            icon: Package,
          },
          {
            title: "New Supply",
            href: "/app/inventory/new",
            icon: Package,
          },
        ],
      },
    ];

    // Return items based on role
    switch (userRole) {
      case "OWNER":
        return ownerItems;
      case "ADMIN":
        return adminItems;
      case "MEMBER":
        return staffItems;
      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (href !== "/app/dashboard" && pathname.startsWith(href)) return true;
    return false;
  };

  const SidebarItemComponent = ({
    item,
    level = 0,
  }: {
    item: SidebarItem;
    level?: number;
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const active = isActive(item.href);

    return (
      <div className="w-full">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title);
            } else {
              router.push(item.href);
            }
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
            active ? "nav-active shadow-lg" : "nav-inactive"
          } ${isCollapsed && level === 0 ? "justify-center" : ""}`}
        >
          <div
            className={`flex items-center ${isCollapsed && level === 0 ? "justify-center" : ""}`}
          >
            <item.icon
              className={`w-5 h-5 ${!isCollapsed || level > 0 ? "mr-3" : ""}`}
            />
            {(!isCollapsed || level > 0) && (
              <span className="text-sm font-medium">{item.title}</span>
            )}
          </div>
          {hasChildren && !isCollapsed && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
          {item.badge && !isCollapsed && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-red-500/25">
              {item.badge}
            </span>
          )}
        </motion.button>

        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-4 mt-1 space-y-1"
          >
            {item.children?.map((child, index) => (
              <SidebarItemComponent
                key={index}
                item={child}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: isCollapsed ? "4rem" : "16rem",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="glass-dark border-r border-gray-800/50 h-full flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-black">VitalFlow</h3>
                <p className="text-xs text-gray-400">
                  {workspace?.name || "Healthcare"}
                </p>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
          >
            {isCollapsed ? (
              <Menu className="w-4 h-4 text-white" />
            ) : (
              <X className="w-4 h-4 text-white" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-6 space-y-3 overflow-y-auto">
        {sidebarItems.map((item, index) => (
          <SidebarItemComponent key={index} item={item} />
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 pt-8 border-t border-gray-800/50 mt-auto">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-100 text-sm font-bold truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {workspace?.userRole || user?.role || "Member"}
              </p>
            </div>
          </motion.div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
            <span className="text-white text-sm font-bold">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
