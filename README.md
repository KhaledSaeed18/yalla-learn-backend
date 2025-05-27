# Yalla Learn Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

A comprehensive backend API for the Yalla Learn platform.

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with speakeasy for 2FA
- **Validation**: Zod schemas
- **Email**: Nodemailer with Google OAuth2
- **Security**: bcryptjs, sanitize-html, express-rate-limit

### Project Structure

```bash
src/
├── api/                    # API modules
│   ├── auth/              # Authentication endpoints
│   ├── blog/              # Blog management
│   ├── contact/           # Contact form
│   ├── expense-tracker/   # Financial tracking
│   ├── jobs/              # Job board
│   ├── kanban/            # Task management
│   ├── listings/          # Marketplace listings
│   ├── qa/                # Q&A platform
│   ├── services/          # Service directory
│   └── user/              # User management
├── constants/             # Application constants
├── middlewares/           # Express middlewares
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- SMTP credentials (for email functionality)
- Google OAuth2 credentials (for email service)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/KhaledSaeed18/yalla-learn-backend.git
   cd yalla-learn-backend
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment Setup**

   Configure the following variables in `.env`:

   ```env
   # Server Configurations
    PORT=
    API_VERSION=
    BASE_URL=

    # App Configurations
    SALT_ROUNDS=

    # Database Configurations
    DATABASE_URL=

    # JWT Configurations
    JWT_SECRET=
    JWT_REFRESH_SECRET=

    # Email Configurations
    CLIENT_ID=
    CLIENT_SECRET=
    REFRESH_TOKEN=
    USER_EMAIL=
    REDIRECT_URI=

    # AI Configurations
    GEMINI_API_KEY=

   ```

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start Development Server**

   ```bash
   yarn dev
   ```

### Production Deployment

1. **Build the project**

   ```bash
   yarn build
   ```

2. **Start production server**

   ```bash
   yarn start
   ```

## 📚 API Documentation

### Base URL

```bash
Development: http://localhost:5000/api/v1
```

### Response Format

All API responses follow a consistent format:

```json
{
  "status": "success" | "fail" | "error",
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

## 🛡️ Security Features

### Input Validation & Sanitization

- **Zod Schema Validation** for request data
- **HTML Sanitization** to prevent XSS attacks
- **SQL Injection Prevention** via Prisma ORM
- **Rate Limiting** to prevent abuse

### Authentication Security

- **Secure Password Hashing** using bcryptjs
- **JWT Token Security** with short-lived access tokens
- **2FA Implementation** using TOTP standard
- **Email Verification** for account security

### Data Protection

- **CORS Configuration** for cross-origin security
- **Security Headers** implementation
- **Environment Variable Protection**
- **Input Length Restrictions**

## 🔧 Development

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code linting
- **Prisma** for database operations
- **Modular Architecture** with separation of concerns

### Available Scripts

```bash
yarn dev        # Start development server with hot reload
yarn build      # Build for production
yarn start         # Start production server
yarn lint      # Run ESLint
```

### Environment Variables

The application requires proper environment configuration for:

- Database connection
- JWT secrets
- Email service credentials
- CORS origins
- Rate limiting settings

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Review Process

- All changes require review
- Automated checks must pass
- Follow existing code patterns
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Bug Reports**: [GitHub Issues](https://github.com/KhaledSaeed18/yalla-learn-backend/issues)

<div align="center">

## 🌐 Visit Our Website

**Experience Yalla Learn in your browser!**

### [🚀 Try Yalla Learn →](https://yalla-learn.me)

</div>
