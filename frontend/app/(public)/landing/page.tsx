// frontend/app/(public)/landing/page.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  Calendar,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MapPin,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header with Login Button */}
      <header className="glass-dark border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-black text-gradient">VitalFlow</div>
          <Link href="/login" className="btn-outline px-6 py-2">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background with abstract shapes */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-cyan-900/30 pointer-events-none"></div>

        {/* Abstract shapes behind buttons */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute top-40 right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "4s" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="heading-primary mb-8 animate-float text-6xl">
                Welcome to VitalFlow
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 text-lg leading-relaxed">
                Your comprehensive platform for service requests, appointments,
                and professional consultations. Get help you need, when you need
                it.
              </p>

              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mt-12">
                {/* Request Service Button - Glass Morphism with Glow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 40px rgba(168, 85, 247, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all duration-300"></div>
                  <Link
                    href="/service-request"
                    className="relative flex items-center justify-center px-10 py-5 bg-gray-900/90 backdrop-blur-xl rounded-2xl text-white font-bold text-lg border border-purple-500/30 hover:border-purple-400 transition-all duration-300 group-hover:border-transparent"
                  >
                    <FileText className="w-6 h-6 mr-3 text-purple-400 group-hover:text-white transition-colors" />
                    Request Service
                    <ArrowRight className="w-5 h-5 ml-3 text-purple-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                {/* Start Onboarding Button - Encouraging CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all duration-300"></div>
                  <Link
                    href="/app/onboarding"
                    className="relative flex items-center justify-center px-8 py-4 bg-gray-900/90 backdrop-blur-xl rounded-2xl text-white font-bold text-lg border border-green-500/30 hover:border-green-400 transition-all duration-300 group-hover:border-transparent"
                  >
                    <Zap className="w-6 h-6 mr-3 text-green-400 group-hover:text-white transition-colors" />
                    Start Your Onboarding
                    <ArrowRight className="w-5 h-5 ml-3 text-green-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                {/* Live Chat Button - Neon Blue Effect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all duration-300"></div>
                  <Link
                    href="/contact-us"
                    className="relative flex items-center justify-center px-10 py-5 bg-gray-900/90 backdrop-blur-xl rounded-2xl text-white font-bold text-lg border border-blue-500/30 hover:border-blue-400 transition-all duration-300 group-hover:border-transparent"
                  >
                    <MessageSquare className="w-6 h-6 mr-3 text-blue-400 group-hover:text-white transition-colors" />
                    Live Chat
                    <div className="ml-3 w-2 h-2 bg-blue-400 rounded-full group-hover:bg-green-400 group-hover:animate-pulse transition-all"></div>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-secondary mb-6">How It Works</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Simple, fast, and efficient way to get the services you need
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Submit Request",
                description:
                  "Fill out our comprehensive service request form with your details and requirements",
                color: "blue",
              },
              {
                icon: MessageSquare,
                title: "Staff Response",
                description:
                  "Our team reviews your request and contacts you within 24 hours",
                color: "green",
              },
              {
                icon: Calendar,
                title: "Get Scheduled",
                description:
                  "We schedule your appointment based on your preferences and availability",
                color: "purple",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-gradient hover:scale-105 transition-transform duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="heading-secondary mb-4">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-secondary mb-6">Our Services</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Professional services tailored to your specific needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "General Consultation",
              "Technical Support",
              "Business Advisory",
              "Health Services",
              "Financial Consultation",
              "Legal Services",
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="card hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center mb-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mr-2" />
                  <h3 className="font-bold text-gray-100">{service}</h3>
                </div>
                <p className="text-gray-400 text-sm">
                  Professional {service.toLowerCase()} services with expert
                  guidance and support.
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 via-pink-900/40 to-cyan-900/40"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-primary mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-gray-200 mb-12">
              Submit your service request now and our team will get back to you
              within 24 hours.
            </p>

            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 40px rgba(168, 85, 247, 0.4)",
              }}
              whileTap={{ scale: 0.98 }}
              className="relative group inline-block"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition-all duration-300"></div>
              <Link
                href="/service-request"
                className="relative flex items-center justify-center px-8 py-4 bg-gray-900/90 backdrop-blur-xl rounded-2xl text-white font-bold text-lg border border-purple-500/30 hover:border-purple-400 transition-all duration-300 group-hover:border-transparent"
              >
                <FileText className="w-5 h-5 mr-2 text-purple-400 group-hover:text-white transition-colors" />
                Submit Service Request
                <ArrowRight className="w-5 h-5 ml-2 text-purple-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 glass-dark border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center card-gradient p-6 rounded-2xl">
              <Phone className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="font-bold text-gray-100 mb-2">Phone</h3>
              <p className="text-gray-300">+91 98765 43210</p>
            </div>

            <div className="flex flex-col items-center card-gradient p-6 rounded-2xl">
              <Mail className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="font-bold text-gray-100 mb-2">Email</h3>
              <p className="text-gray-300">support@vitalflow.com</p>
            </div>

            <div className="flex flex-col items-center card-gradient p-6 rounded-2xl">
              <MapPin className="w-8 h-8 text-pink-400 mb-3" />
              <h3 className="font-bold text-gray-100 mb-2">Office</h3>
              <p className="text-gray-300">123 Connaught Place, Mumbai</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/80 backdrop-blur-xl border-t border-gray-800/50 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 mb-6">
              © 2024 VitalFlow. All rights reserved.
            </p>
            <div className="flex justify-center space-x-8">
              <Link
                href="/service-request"
                className="text-gray-400 hover:text-cyan-400 transition-colors font-medium"
              >
                Service Request
              </Link>
              <Link
                href="/contact-us"
                className="text-gray-400 hover:text-purple-400 transition-colors font-medium"
              >
                Live Chat
              </Link>
              <Link
                href="/login"
                className="text-gray-400 hover:text-pink-400 transition-colors font-medium"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
