# ESAT-HUB Frontend

React frontend for ESAT-HUB, built with Vite and designed to support authentication, chat, posts, notifications, and profile management.

## Features
- User authentication and session management
- Real-time messaging and notifications
- Social feed with posts and comments
- Profile and room management
- PWA support via `vite-plugin-pwa`

## Prerequisites
- Node.js 18+
- npm
- `.env` configured for Firebase and API endpoints

## Installation
```bash
cd frontend
npm install
```

## Run in development
```bash
cd frontend
npm run dev
```

## Build for production
```bash
cd frontend
npm run build
npm run preview
```

## Project structure
- `src/components/`: React UI components
- `src/pages/`: Page views and routes
- `src/services/`: API clients for backend and notifications
- `src/contexts/`: Application state providers
- `src/hooks/`: Custom React hooks
- `src/styles/`: CSS for components and layouts
- `src/config/`: Firebase configuration

## Notes
The frontend uses React Router for routing and `@tanstack/react-query` for data fetching and caching.
