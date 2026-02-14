"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Activity,
  Clock,
  Server,
  Shield
} from "lucide-react";
import { useAuth } from "../../../lib/auth";

interface EmailStatus {
  sendgrid: {
    configured: boolean;
    working: boolean;
    provider: string;
    fromEmail?: string;
    error?: string;
  };
  smtp: {
    configured: boolean;
    working: boolean;
    provider: string;
    host?: string;
    port?: number;
    fromEmail?: string;
    error?: string;
  };
}

interface EmailLog {
  id: number;
  provider: string;
  to: string;
  subject: string;
  status: string;
  timestamp: string;
  messageId?: string;
  error?: string;
}

export default function EmailTestPage() {
  const { user, token } = useAuth();
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testForm, setTestForm] = useState({
    provider: "sendgrid",
    to: "",
    subject: "Test Email from CareOps",
    message: "This is a test email to demonstrate the email integration functionality.",
    type: "test"
  });

  useEffect(() => {
    loadEmailStatus();
    loadEmailLogs();
  }, []);

  const loadEmailStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-test/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setEmailStatus(result.data);
      }
    } catch (error) {
      console.error("Error loading email status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-test/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setEmailLogs(result.data);
      }
    } catch (error) {
      console.error("Error loading email logs:", error);
    }
  };

  const sendTestEmail = async () => {
    if (!testForm.to) {
      alert("Please enter a recipient email address");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-test/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testForm),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Email sent successfully! Message ID: ${result.data.messageId}`);
        loadEmailLogs(); // Refresh logs
        setTestForm({
          ...testForm,
          subject: "Test Email from CareOps",
          message: "This is a test email to demonstrate the email integration functionality.",
        });
      } else {
        alert(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email. Please check your configuration.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="heading-primary mb-4">Email Integration Demo</h1>
          <p className="text-gray-300 text-lg">
            Demonstrate email functionality with SendGrid and SMTP providers
          </p>
        </motion.div>

        {/* Email Provider Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          {emailStatus && Object.entries(emailStatus).map(([provider, status]) => (
            <motion.div
              key={provider}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="content-card-enhanced p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    status.working ? "gradient-green" : "gradient-orange"
                  }`}>
                    {status.working ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white capitalize">{provider}</h3>
                    <p className="text-sm text-gray-400">{status.provider}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  status.working 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {status.working ? "Working" : "Not Working"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Configured:</span>
                  <span className={`font-bold ${status.configured ? "text-green-400" : "text-red-400"}`}>
                    {status.configured ? "Yes" : "No"}
                  </span>
                </div>
                {status.fromEmail && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">From Email:</span>
                    <span className="text-white font-mono text-xs">{status.fromEmail}</span>
                  </div>
                )}
                {status.host && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Host:</span>
                    <span className="text-white font-mono text-xs">{status.host}:{status.port}</span>
                  </div>
                )}
                {status.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs">{status.error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Send Test Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="content-card-enhanced p-8 rounded-2xl mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Send className="w-6 h-6 mr-3 text-purple-400" />
            Send Test Email
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Provider
              </label>
              <select
                value={testForm.provider}
                onChange={(e) => setTestForm({ ...testForm, provider: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="sendgrid">SendGrid</option>
                <option value="smtp">SMTP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={testForm.to}
                onChange={(e) => setTestForm({ ...testForm, to: e.target.value })}
                placeholder="test@example.com"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={testForm.subject}
                onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Type
              </label>
              <select
                value={testForm.type}
                onChange={(e) => setTestForm({ ...testForm, type: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
              >
                <option value="test">Simple Test</option>
                <option value="appointment">Appointment Confirmation</option>
                <option value="welcome">Welcome Email</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={testForm.message}
                onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={sendTestEmail}
            disabled={sending || !testForm.to}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-purple-500/40 transition-all"
          >
            {sending ? (
              <div className="flex items-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                />
                Sending...
              </div>
            ) : (
              <div className="flex items-center">
                <Send className="w-5 h-5 mr-3" />
                Send Test Email
              </div>
            )}
          </motion.button>
        </motion.div>

        {/* Email Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="content-card-enhanced p-8 rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-purple-400" />
            Recent Email Activity
          </h2>

          {emailLogs.length > 0 ? (
            <div className="space-y-4">
              {emailLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="activity-item-enhanced p-4 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        log.status === "sent" ? "bg-green-500/20" : "bg-red-500/20"
                      }`}>
                        {log.status === "sent" ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{log.subject}</p>
                        <p className="text-sm text-gray-400">
                          To: {log.to} • {log.provider} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.messageId && (
                          <p className="text-xs text-gray-500">ID: {log.messageId}</p>
                        )}
                        {log.error && (
                          <p className="text-xs text-red-400 mt-1">Error: {log.error}</p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      log.status === "sent"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}>
                      {log.status}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No email activity yet. Send a test email to see logs here.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
