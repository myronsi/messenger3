
# Messenger 3.0 - Real-time Chat Application

A modern real-time messaging application built with React, TypeScript, FastAPI, WebSockets, and SQLite.

## Features

- 🔄 Real-time messaging with WebSockets
- 🔐 Secure authentication with JWT tokens
- 👥 User search and chat creation
- 📱 Responsive design for all devices
- 🔔 Online status indicators
- 🗄️ Message history persistence

## Technology Stack

### Frontend
- TypeScript & React
- Tailwind CSS
- shadcn/ui components
- React Router for navigation
- Tanstack Query for data fetching

### Backend
- Python 3.8+ with FastAPI
- WebSockets for real-time communication
- SQLAlchemy ORM with SQLite
- JWT authentication
- Pydantic for data validation

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Node.js 14.0 or higher
- npm or yarn

### Server Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows:**
   ```bash
   venv\Scripts\activate
   ```
   - **macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Set up environment variables (optional):
   Create a `.env` file in the server directory with the following content:
   ```
   secret_key=your_secret_key_here
   ENVIRONMENT=development
   ```

6. Start the server:
```bash
python main.py
```

The server will start at `http://localhost:8000`. The API documentation will be available at `http://localhost:8000/docs`.

### Client Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```
or
```bash
yarn
```

3. Start the development server:
```bash
npm run dev
```
or
```bash
yarn dev
```

The client will be available at `http://localhost:8080`.

## Project Structure

```
/
├── client/               # Frontend code
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts for state management
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Application pages
│   │   └── App.tsx       # Main application component
│   └── package.json      # Frontend dependencies
│
└── server/               # Backend code
    ├── app/
    │   ├── api/          # API routes and endpoints
    │   ├── core/         # Core functionality (auth, config, etc.)
    │   ├── db/           # Database models and connection
    │   ├── models/       # SQLAlchemy models
    │   └── schemas/      # Pydantic schemas for validation
    ├── requirements.txt  # Backend dependencies
    └── main.py           # Entry point for the server
```

## API Endpoints

The API provides the following endpoints:

- **Authentication**
  - `POST /api/auth/register` - Register a new user
  - `POST /api/auth/login` - Log in a user

- **Users**
  - `GET /api/users/me` - Get current user info
  - `GET /api/users/` - Get all users
  - `GET /api/users/{user_id}` - Get a specific user
  - `GET /api/users/search/?query={query}` - Search users

- **Chats**
  - `GET /api/chats/` - Get all chats for current user
  - `POST /api/chats/` - Create a new chat
  - `GET /api/chats/{chat_id}` - Get a specific chat

- **Messages**
  - `GET /api/messages/?chat_id={chat_id}` - Get messages for a chat
  - `POST /api/messages/` - Send a new message

## WebSocket Connection

Real-time messaging is implemented through WebSockets. The WebSocket endpoint is available at:

```
ws://localhost:8000/ws?token={jwt_token}
```

## Development

### Database

The application uses SQLite by default. The database file is created automatically when you start the server. No additional setup is required.

### Authentication

The application uses JWT tokens for authentication. Tokens are stored in local storage on the client and provided in the `Authorization` header for API requests and as a query parameter for WebSocket connections.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
