# 🏥 VitalFlow - Integrated Health & Fitness Platform

> **Hackathon Project**: A comprehensive health and wellness platform that combines medical care with fitness programs for complete patient wellness.

## 🎯 Project Overview

VitalFlow is a **unified health-fitness platform** designed for wellness centers that struggle with disconnected medical and fitness services. It brings together patient management, appointments, health forms, medical supplies, and wellness programs into one cohesive system.

### 🏆 Hackathon Achievement

This project demonstrates **enterprise-grade features** including:

- Real-time WebSocket notifications
- AI-powered business insights
- Complete automation workflows
- Multi-tenant architecture
- Professional UI/UX design

## ✨ Key Features

### 🔥 **Core Platform Features**

- **Multi-tenant Workspace System** - Complete isolation for different wellness centers
- **Patient Management** - Full CRM with health records and conversation tracking
- **Smart Appointment System** - Automated scheduling with availability management
- **Dynamic Health Forms** - Custom forms with automated workflows
- **Medical Supplies Management** - Resource tracking with automated alerts
- **Real-time Notifications** - SSE-powered live updates

### 🤖 **AI-Powered Intelligence**

- **Smart Reply System** - One-click AI-generated contextual responses in inbox
- **Sentiment Analysis** - Real-time emotion detection (Happy/Sad/Neutral) with confidence scores
- **Conversation Summaries** - AI-generated briefs for long conversations
- **Health Performance Analytics** - Patient outcomes, recovery rates, wellness trends
- **Predictive Health Insights** - Forecast appointments, identify health risks
- **Patient Segmentation** - Behavioral analysis and wellness journey tracking
- **Actionable Health Recommendations** - AI-generated wellness improvements
- **Operational Health Monitoring** - Real-time clinic diagnostics

### ⚡ **Automation Engine**

- **Event-driven Workflows** - 5 core automation rules for patient care
- **Email/SMS Integration** - SendGrid, SMTP, Twilio support for patient communication
- **Welcome Sequences** - Automated patient onboarding
- **Appointment Reminders** - Smart scheduling with notifications
- **Medical Supply Alerts** - Low-stock warnings and reorder prompts

### 👥 **Team Collaboration**

- **Role-based Access Control** - Doctor, Admin, Staff roles
- **Staff Invitation System** - Secure team onboarding
- **Real-time Collaboration** - Live updates and typing indicators
- **Permission Management** - Granular access controls

## 🏗️ Technical Architecture

### **Backend Stack**

- **Node.js** with Express.js
- **PostgreSQL** with Prisma ORM
- **Server-Sent Events** for real-time updates (Socket.io alternative)
- **JWT Authentication** with refresh tokens
- **Event-driven Architecture** with automation processor
- **OpenAI Integration** for AI-powered features

### **Frontend Stack**

- **Next.js 16** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Chart.js** for analytics
- **Server-Sent Events** client for real-time updates

### **Infrastructure**

- **Docker** containerization
- **Multi-environment support** (dev/staging/prod)
- **Database migrations** with Prisma
- **Background job processing** for reminders

## 🚀 Quick Start

1. **Install dependencies** - `npm install` in both `/backend` and `/frontend`
2. **Set up environment** - Copy `.env.example` files and configure database/API keys
3. **Database setup** - Run `npx prisma migrate dev && npx prisma generate`
4. **Seed demo data** - Run `node prisma/seed-demo.js`
5. **Start servers** - Backend: `npm run dev` (port 4000), Frontend: `npm run dev` (port 3000)

**Demo Credentials**: Owner: `admin@demo.com` / `admin123`, Staff: `staff@demo.com` / `staff123`

**Public Access**: `/book/{workspaceId}` for appointments, `/contact/{workspaceId}` for patient forms

## 📱 User Journey

### **Public-Facing Features**

#### **Appointment Booking** (`/book/[workspaceId]`)

- Step-by-step booking: Service → Date → Time → Patient Info
- Real-time availability showing only open slots
- Mobile-optimized with instant confirmation
- Automatic reference code and email delivery

#### **Patient Intake Form** (`/contact/[workspaceId]`)

- Beautiful embeddable forms for any website
- Automatic patient record creation in inbox
- Smart contact creation with welcome emails

### **1. Business Owner Setup**

1. Create account and wellness center
2. Configure email/SMS integrations
3. Set up appointment types and availability
4. Create health forms and medical supplies
5. Invite staff members
6. Activate wellness center

### **2. Customer Experience**

1. **Health First**: Submit intake form → Receive welcome email → Staff replies with AI assistance → Book appointment
2. **Appointment First**: Visit booking page → Select service/time → Get confirmation → Receive health forms

### **3. Staff Workflow**

1. Monitor **Patient Inbox** for all communications (Email, SMS, Chat)
2. Use **AI Smart Replies** for contextual responses
3. View **Sentiment Analysis** to understand patient emotions
4. Manage appointments and status updates in real-time
5. Track form completions and medical supply alerts

## 🔧 Configuration

**Required Environment Variables**:

- Database: `DATABASE_URL=postgresql://user:pass@localhost:5432/vitalflow_db`
- Email: SendGrid API key or SMTP settings
- SMS: Twilio credentials (optional)
- OpenAI: API key for AI features

## 🐳 Docker Deployment

**Using Docker Compose**: `docker-compose up -d` to start all services

**Individual Services**: Build and run backend/frontend separately using provided Dockerfiles

## 🌐 Production Deployment

**Vercel (Recommended)**: Connect repository and set environment variables for automatic deployment

**Manual**: Build both frontend and backend, then start production servers with `npm start`

## 📊 API Overview

**Core Endpoints**: Auth, Workspaces, Contacts, Conversations, Bookings, AI Insights

**Real-time Events**: Notifications, booking/contact creation, messages with sentiment analysis, automation execution, AI suggestions

## 🧪 Testing

**Run Tests**: `npm test` in both backend and frontend directories

**API Testing**: Health check at `/health`, test booking creation via public API endpoint

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Input Validation** with Zod schemas
- **SQL Injection Prevention** with Prisma
- **XSS Protection** with content security policy
- **Rate Limiting** on API endpoints
- **Encrypted Passwords** with bcrypt

## 📈 Performance

- **Database Indexing** on frequently queried fields
- **Connection Pooling** for database efficiency
- **Caching Strategy** with Redis
- **Lazy Loading** for large datasets
- **Image Optimization** for uploads
- **Code Splitting** in frontend

## 🤝 Contributing

### **Development Workflow**

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### **Code Style**

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Hackathon Submission

### **Demo Video Highlights**

- **0:00-1:00** - Owner onboarding and workspace setup
- **1:00-2:00** - Customer booking journey
- **2:00-3:00** - Staff dashboard and real-time features
- **3:00-4:00** - AI insights and analytics
- **4:00-5:00** - Automation and integrations

### **Key Differentiators**

1. **Complete End-to-End Flow** - From lead to analytics
2. **Real-time Collaboration** - Live updates and notifications
3. **AI-Powered Insights** - Predictive analytics and recommendations
4. **Enterprise Architecture** - Scalable and production-ready
5. **Professional UX** - Modern, intuitive interface

### **Technical Achievements**

- **Multi-tenant SaaS Architecture**
- **Event-driven Automation Engine**
- **Real-time WebSocket Communication**
- **AI Analytics Pipeline**
- **Production-ready Deployment**

---

## 🎯 Why This Wins

### **Problem Solving**

- **Unified Health Platform** replaces 5+ disconnected medical/fitness tools
- **Automation First** reduces manual administrative work by 80%
- **Real-time Patient Care** enables proactive health management
- **AI Health Insights** drive data-driven wellness decisions

### **Technical Excellence**

- **Modern Stack** with latest technologies
- **Scalable Architecture** ready for production
- **Type Safety** with comprehensive TypeScript
- **Professional Code** following best practices

### **Business Impact**

- **Clear Health ROI** through improved patient outcomes and efficiency
- **Market Ready** for immediate wellness center deployment
- **Competitive Edge** with integrated health-fitness AI features
- **Scalable Solution** for wellness center growth

---

**Built with ❤️ for the VitalFlow Hackathon** 🏥
