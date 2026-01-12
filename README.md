# YODECO Voting Portal - Frontend

A modern, secure biometric voting portal built with React and featuring YODECO branding.

## Features

- 🔐 **Biometric Authentication** - WebAuthn integration for secure voting
- 🎨 **YODECO Branding** - Professional green and gold color scheme
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🎯 **Side Drawer Navigation** - Clean, modern navigation experience
- ✨ **Smooth Animations** - Polished user interface with subtle transitions
- 🚫 **Hidden Scrollbars** - Clean overlay components without visible scrollbars

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router v6** - Client-side routing with future flags
- **CSS3** - Custom styling with CSS variables
- **WebAuthn API** - Biometric authentication
- **Axios** - HTTP client for API communication

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/opeoladettp/yodeco-frontend.git
cd yodeco-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your backend URL:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

5. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin dashboard components
│   ├── auth/           # Authentication components
│   ├── common/         # Common UI components
│   ├── content/        # Content management components
│   ├── layout/         # Layout components (Navigation, etc.)
│   └── voting/         # Voting-specific components
├── contexts/           # React contexts
├── pages/              # Page components
├── services/           # API services
├── styles/             # Global styles and YODECO branding
└── utils/              # Utility functions
```

## YODECO Brand Colors

- **Primary Green**: `#398213`
- **Secondary Gold**: `#C19E33`
- **Light variants** and hover states included

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

© 2024 YODECO. All rights reserved.