// frontend/app/app/inbox/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Search,
  Filter,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Paperclip,
  MoreVertical,
  Circle,
  CheckCircle,
  AlertCircle,
  Archive,
  Trash2,
  User,
  Clock,
  ArrowLeft,
  Smile,
  AtSign,
  Hash,
  Star,
  Bell,
  X,
  ChevronDown,
  Reply,
  Forward,
  Pin,
  ArchiveIcon,
  Settings,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import React from "react";

dayjs.extend(relativeTime);

interface Message {
  id: string;
  content: string;
  senderType: "USER" | "CONTACT" | "SYSTEM";
  messageType: "TEXT" | "IMAGE" | "FILE" | "AUDIO" | "VIDEO";
  createdAt: string;
  metadata?: any;
  sentiment?: {
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
    emotions: string[];
  };
}

interface Conversation {
  id: string;
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
  channel:
    | "EMAIL"
    | "CHAT"
    | "PHONE"
    | "SMS"
    | "WHATSAPP"
    | "TELEGRAM"
    | "SLACK";
  updatedAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  unreadCount?: number;
  lastMessage?: Message;
}

const quickReplies = [
  "Thank you for reaching out! We'll get back to you soon.",
  "Your message has been received and we're working on it.",
  "Could you provide more details about this?",
  "Thanks for your patience. We're looking into this.",
  "Is there anything else I can help you with?",
];

const channelIcons = {
  EMAIL: Mail,
  SMS: Phone,
  CHAT: MessageSquare,
  WHATSAPP: MessageSquare,
  TELEGRAM: MessageSquare,
  PHONE: Phone,
  SLACK: MessageSquare,
};

const channelColors = {
  EMAIL: "from-blue-500 to-blue-600",
  SMS: "from-green-500 to-green-600",
  CHAT: "from-purple-500 to-purple-600",
  WHATSAPP: "from-green-600 to-green-700",
  TELEGRAM: "from-blue-600 to-blue-700",
  PHONE: "from-orange-500 to-orange-600",
  SLACK: "from-purple-600 to-purple-700",
};

const statusColors = {
  ACTIVE: "from-green-500 to-green-600",
  CLOSED: "from-gray-500 to-gray-600",
  ARCHIVED: "from-yellow-500 to-yellow-600",
};

export default function InboxPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [showSmartReplies, setShowSmartReplies] = useState(false);
  const [isLoadingSmartReplies, setIsLoadingSmartReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, [searchQuery, filterStatus, filterChannel]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterChannel !== "all") params.append("channel", filterChannel);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
        if (data.data.length > 0 && !selectedConversation) {
          setSelectedConversation(data.data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/unread/count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setUnreadCount(data.data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        const messages = data.data.messages || [];
        setMessages(messages);

        // Analyze sentiment for contact messages that don't have sentiment data
        const contactMessagesWithoutSentiment = messages.filter(
          (msg: Message) => msg.senderType === "CONTACT" && !msg.sentiment,
        );

        // Analyze sentiment for up to 5 most recent contact messages
        contactMessagesWithoutSentiment
          .sort((a: Message, b: Message) =>
            dayjs(b.createdAt).diff(dayjs(a.createdAt)),
          )
          .slice(0, 5)
          .forEach((msg: Message) => {
            analyzeMessageSentiment(msg.content, msg.id);
          });
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${selectedConversation.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: message,
            messageType: "TEXT",
          }),
        },
      );

      if (response.ok) {
        setMessage("");
        fetchMessages(selectedConversation.id);
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const fetchSmartReplies = async () => {
    if (!selectedConversation || !message.trim()) return;

    setIsLoadingSmartReplies(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/smart-replies/${selectedConversation.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        setSmartReplies(data.data);
        setShowSmartReplies(true);
      }
    } catch (error) {
      console.error("Failed to fetch smart replies:", error);
    } finally {
      setIsLoadingSmartReplies(false);
    }
  };

  const analyzeMessageSentiment = async (
    messageText: string,
    messageId: string,
  ) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/sentiment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: messageText,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        // Update the message with sentiment data
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, sentiment: data.data } : msg,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to analyze sentiment:", error);
    }
  };

  const updateConversationStatus = async (status: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${selectedConversation.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        setSelectedConversation({
          ...selectedConversation,
          status: status as any,
        });
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const getContactName = (contact: Conversation["contact"]) => {
    return (
      `${contact.firstName} ${contact.lastName || ""}`.trim() ||
      contact.email ||
      "Unknown"
    );
  };

  const getChannelIcon = (channel: string) => {
    const IconComponent =
      channelIcons[channel as keyof typeof channelIcons] || MessageSquare;
    return IconComponent;
  };

  const formatMessageTime = (dateString: string) => {
    const date = dayjs(dateString);
    if (date.isSame(dayjs(), "day")) {
      return date.format("h:mm A");
    } else if (date.isSame(dayjs(), "week")) {
      return date.format("ddd h:mm A");
    } else {
      return date.format("MMM D, h:mm A");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gray-900 flex items-center"
              >
                <MessageSquare className="w-7 h-7 mr-2 text-blue-600" />
                Inbox
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </motion.h1>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchConversations}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Conversation List Sidebar */}
        <div className="w-96 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <select
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                  className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="CHAT">Chat</option>
                </select>
              </div>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conversation) => {
                  const ChannelIcon = getChannelIcon(conversation.channel);
                  const isSelected =
                    selectedConversation?.id === conversation.id;

                  return (
                    <motion.div
                      key={conversation.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-200/50 shadow-lg"
                          : "bg-white/40 hover:bg-white/60 border border-gray-200/30 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${channelColors[conversation.channel]} rounded-full flex items-center justify-center text-white`}
                          >
                            <ChannelIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {getContactName(conversation.contact)}
                            </h3>
                            {conversation.contact.email && (
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.contact.email}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.updatedAt)}
                          </span>
                          <div
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${statusColors[conversation.status]}`}
                          />
                        </div>
                      </div>

                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {conversation.lastMessage.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${channelColors[conversation.channel]} text-white`}
                          >
                            {conversation.channel}
                          </span>
                          {conversation.unreadCount &&
                            conversation.unreadCount > 0 && (
                              <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full bg-gradient-to-r ${statusColors[conversation.status]} text-white`}
                        >
                          {conversation.status}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-white/40 backdrop-blur-sm">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${channelColors[selectedConversation.channel]} rounded-full flex items-center justify-center text-white`}
                    >
                      {React.createElement(
                        getChannelIcon(selectedConversation.channel),
                        { className: "w-6 h-6" },
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {getContactName(selectedConversation.contact)}
                      </h2>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        {selectedConversation.contact.email && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {selectedConversation.contact.email}
                          </span>
                        )}
                        {selectedConversation.contact.phone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {selectedConversation.contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedConversation.status}
                      onChange={(e) => updateConversationStatus(e.target.value)}
                      className="px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${message.senderType === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl ${
                          message.senderType === "USER"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                            : "bg-white/80 backdrop-blur-sm text-gray-900 border border-gray-200/50 shadow-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.content}
                        </p>

                        {/* Sentiment Indicator for Contact Messages */}
                        {message.senderType === "CONTACT" &&
                          message.sentiment && (
                            <div className="flex items-center mt-2 space-x-2">
                              <div
                                className={`flex items-center text-xs px-2 py-1 rounded-full ${
                                  message.sentiment.sentiment === "positive"
                                    ? "bg-green-100 text-green-700"
                                    : message.sentiment.sentiment === "negative"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {message.sentiment.sentiment === "positive" &&
                                  "😊"}
                                {message.sentiment.sentiment === "negative" &&
                                  "😟"}
                                {message.sentiment.sentiment === "neutral" &&
                                  "😐"}
                                <span className="ml-1">
                                  {message.sentiment.sentiment}
                                </span>
                              </div>
                              {message.sentiment.confidence > 0.7 && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(
                                    message.sentiment.confidence * 100,
                                  )}
                                  % confident
                                </span>
                              )}
                            </div>
                          )}

                        <p
                          className={`text-xs mt-2 ${
                            message.senderType === "USER"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Message Composer */}
              <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4">
                {/* Quick Replies */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickReplies.slice(0, 3).map((quickReply, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMessage(quickReply)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
                    >
                      {quickReply.substring(0, 30)}...
                    </motion.button>
                  ))}
                </div>

                {/* AI Smart Replies */}
                {showSmartReplies && smartReplies.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        AI Suggestions
                      </span>
                      <button
                        onClick={() => setShowSmartReplies(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {smartReplies.map((reply, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setMessage(reply);
                            setShowSmartReplies(false);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-sm rounded-full transition-colors border border-blue-200"
                        >
                          {reply.substring(0, 50)}
                          {reply.length > 50 ? "..." : ""}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                <form
                  onSubmit={sendMessage}
                  className="flex items-end space-x-2"
                >
                  <div className="flex-1">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Paperclip className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchSmartReplies}
                      disabled={isLoadingSmartReplies || !message.trim()}
                      className="p-2 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoadingSmartReplies ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Star className="w-5 h-5" />
                      )}
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isSending || !message.trim()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      {isSending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
