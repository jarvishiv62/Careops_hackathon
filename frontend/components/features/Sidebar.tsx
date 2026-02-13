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
  Building,
  MessageSquare,
  BarChart3,
  HeartPulse,
  Activity,
  Stethoscope,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "../../lib/auth";

interface SidebarItem {
  title: string;
  href: string;
  icon: any;
  badge?: number;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/app/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Patients",
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
    title: "Appointments",
    href: "/app/bookings",
    icon: Calendar,
    children: [
      {
        title: "All Appointments",
        href: "/app/bookings",
        icon: Calendar,
      },
      {
        title: "New Appointment",
        href: "/app/bookings/new",
        icon: Calendar,
      },
      {
        title: "Consultation Types",
        href: "/app/bookings/types",
        icon: Stethoscope,
      },
    ],
  },
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
  {
    title: "Health Forms",
    href: "/app/forms",
    icon: FileText,
    children: [
      {
        title: "All Forms",
        href: "/app/forms",
        icon: FileText,
      },
      {
        title: "New Form",
        href: "/app/forms/new",
        icon: FileText,
      },
    ],
  },
  {
    title: "Patient Inbox",
    href: "/app/inbox",
    icon: MessageSquare,
  },
  {
    title: "Fitness Programs",
    href: "/app/fitness",
    icon: Dumbbell,
    children: [
      {
        title: "All Programs",
        href: "/app/fitness",
        icon: Dumbbell,
      },
      {
        title: "New Program",
        href: "/app/fitness/new",
        icon: Dumbbell,
      },
    ],
  },
  {
    title: "Health Analytics",
    href: "/app/analytics",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/app/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspace } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
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
      className="glass border-r border-white/20 h-full flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <HeartPulse className="w-6 h-6 text-gradient animate-pulse-glow" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm heading-primary">
                  {workspace?.name || "VitalFlow"}
                </h3>
                <p className="text-xs text-gray-600">
                  Health & Wellness Center
                </p>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl hover:bg-white/50 transition-all duration-200"
          >
            {isCollapsed ? (
              <Menu className="w-5 h-5 text-gray-600" />
            ) : (
              <X className="w-5 h-5 text-gray-600" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item, index) => (
          <SidebarItemComponent key={index} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/20">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-500 text-center"
          >
            <p className="text-gradient font-bold">VitalFlow</p>
            <p className="text-xs text-gray-600">Health • Fitness • Care</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
