# Judicial Management System (JMS) - Republic of Zambia

A comprehensive Next.js-based Judicial Management System with role-based access control, designed for the Zambian Judiciary. This system provides case management, court scheduling, document handling, and AI-powered legal assistance features.

## 🏛️ Overview

The Judicial Management System is built with modern web technologies and follows a mobile-first approach. It provides secure access to different user roles including administrators, judges, lawyers, and the general public.

## ✨ Features

### 🔐 Role-Based Access Control
- **Administrator**: Full system access, user management, case assignment
- **Judge**: Case management, ruling updates, calendar management
- **Lawyer**: Case access, document uploads, client representation
- **Public**: Limited case viewing and search capabilities

### 📋 Case Management
- Case creation and assignment
- Status tracking and updates
- Party and lawyer management
- Document association
- Priority and categorization

### 📅 Court Calendar & Scheduling
- Interactive calendar view
- Hearing scheduling and management
- Judge availability tracking
- Location and time management
- Status updates for hearings

### 📄 Document Management
- Secure file uploads with Firebase Storage
- Role-based document access
- Document categorization and tagging
- Version control and tracking
- Confidential document handling

### 🤖 AI-Powered Features
- Document summarization
- Legal query answering
- Case analysis and prediction
- Document classification
- Smart search capabilities

## 🎨 Design System

### Zambian Color Scheme
- **Primary Background**: White (#FFFFFF)
- **Accent Colors**: 
  - Orange (#FF7F00) - Primary actions and highlights
  - Green (#008000) - Success and positive indicators
  - Black (#000000) - Text and important elements
  - Red (#FF0000) - Errors and warnings

### UI Components
- Built with shadcn/ui component library
- Fully responsive design
- Dark mode support
- Accessibility compliant
- Consistent design patterns

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **TypeScript 5** for type safety
- **TailwindCSS 4** for styling
- **shadcn/ui** for UI components

### Backend & Database
- **Firebase** (Auth, Firestore, Storage)
- **Prisma ORM** with SQLite
- **RESTful API** architecture

### State Management
- **Zustand** for client state
- **TanStack Query** for server state
- **React Context** for global state

### Testing & Development
- **Vitest** for unit testing
- **ESLint** for code quality
- **Prettier** for code formatting
- **Husky** for git hooks

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── admin/                    # Administrator dashboard
│   │   ├── dashboard/
│   │   ├── cases/
│   │   ├── calendar/
│   │   └── users/
│   ├── judges/                   # Judge dashboard
│   │   ├── dashboard/
│   │   ├── cases/
│   │   └── calendar/
│   ├── lawyers/                  # Lawyer dashboard
│   │   ├── dashboard/
│   │   ├── cases/
│   │   └── documents/
│   ├── public/                   # Public portal
│   │   ├── dashboard/
│   │   ├── cases/
│   │   └── search/
│   ├── login/                    # Authentication page
│   └── unauthorized/             # Access denied page
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── RoleGuard.tsx
│   ├── Calendar.tsx
│   └── CaseCard.tsx
├── contexts/                     # React contexts
│   └── AuthContext.tsx
├── lib/                         # Utility libraries
│   ├── firebase.ts
│   ├── auth.ts
│   ├── demoAccounts.ts
│   ├── aiServices.ts
│   └── firestoreRules.test.ts
├── models/                       # TypeScript interfaces
│   ├── User.ts
│   ├── Case.ts
│   ├── Role.ts
│   └── index.ts
└── hooks/                       # Custom React hooks
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project (for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd judicial-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Demo Accounts

For testing purposes, use these demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@courts.gov.zm | admin123 |
| Judge | judge@courts.gov.zm | judge123 |
| Lawyer | lawyer@courts.gov.zm | lawyer123 |
| Public | public@courts.gov.zm | public123 |

## 📱 Mobile Responsiveness

The application follows a mobile-first approach with:
- Responsive navigation with hamburger menu
- Touch-friendly interface elements
- Optimized layouts for all screen sizes
- Progressive Web App (PWA) ready

## 🔒 Security Features

### Authentication & Authorization
- Firebase Authentication integration
- Role-based access control
- JWT token management
- Session handling

### Data Protection
- Firestore security rules
- Role-based data access
- Document-level permissions
- Audit logging

### API Security
- Input validation
- XSS protection
- CSRF protection
- Rate limiting

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Test Coverage
- Role-based permissions
- Authentication flows
- Firestore security rules
- Component rendering
- API endpoints

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Setup
1. **Firebase Project**: Create and configure Firebase project
2. **Environment Variables**: Set up production environment variables
3. **Database**: Set up Firestore database and security rules
4. **Storage**: Configure Firebase Storage with appropriate rules
5. **Deployment**: Deploy to your preferred hosting platform

## 📚 API Documentation

### QUICK USAGE EXAMPLES (fetch from client)
------------------------------------------------
#### Create case:
* fetch('/api/cases', { method: 'POST', body: JSON.stringify({...data, actorId: user.id}) })
* Update case status:
* fetch(`/api/cases/${caseId}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed', actorId: user.id }) })
* Case history:
* fetch(`/api/cases/${caseId}/history`)
* Schedule hearing:
* fetch('/api/hearings', { method: 'POST', body: JSON.stringify({...data, actorId: user.id}) })
* File document metadata:
* fetch('/api/documents', { method: 'POST', body: JSON.stringify({...doc, actorId: user.id}) })
#### Sign document:
* fetch(`/api/documents/${docId}/sign`, { method: 'POST', body: JSON.stringify({ signedBy: user.id, signatureHash }) })
#### Reports:
* fetch('/api/reports/caseload')
* fetch('/api/reports/performance')
* fetch('/api/reports/trends')

#### For future configuration:

* ##### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

* ###### Case Management Endpoints
- `GET /api/cases` - List cases (with filtering)
- `POST /api/cases` - Create new case
- `GET /api/cases/[id]` - Get case details
- `PUT /api/cases/[id]` - Update case
- `DELETE /api/cases/[id]` - Delete case

* ##### Document Management Endpoints
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/[id]` - Download document
- `DELETE /api/documents/[id]` - Delete document

* ##### AI Service Endpoints
- `POST /api/ai/summarize` - Summarize document
- `POST /api/ai/query` - Answer legal query
- `POST /api/ai/analyze` - Analyze case

## 🔧 Configuration

### Firebase Security Rules
The system includes comprehensive Firestore security rules that enforce:
- Role-based document access
- User-specific data isolation
- Field-level validation
- Audit trail requirements

### Environment Variables
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PROJECT_ID=your_project_id
```

### Environment API keys
create  a .env.local file in the directory root folder (the folder that has package.json, src and db)
```env
GOOGLE_API_KEY=THe_provided_api_key
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Republic of Zambia Judiciary
- Firebase team for the excellent backend services
- Next.js team for the amazing framework
- shadcn/ui for the beautiful component library
- All contributors to the open-source libraries used

## 📞 Support

For technical support or questions:
- **Email**: support@courts.gov.zm
- **Phone**: +260 211 123456
- **Documentation**: [Project Wiki](wiki-url)

---

**Built with ❤️ for the Republic of Zambia Judiciary**
