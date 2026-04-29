# Teachers Companion AI

Teachers Companion AI is an intelligent assistant designed to help educators streamline their workflow. It provides powerful AI-driven tools such as contextual chat suggestions, automated lesson plan creation, dynamic assignment generation, and an auto-grading system powered by Google's Gemini AI.

## Project Structure

This project is a monorepo containing both the frontend and backend codebases:

```text
├── .gitignore
├── .vscode
│   ├── launch.json
│   └── settings.json
├── client
│   ├── .env
│   ├── .gitignore
│   ├── convert.mjs
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── README.md
│   ├── src
│   │   ├── analytics.css
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── assets
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── chat.css
│   │   ├── components
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context
│   │   │   └── ThemeContext.jsx
│   │   ├── dashboard.css
│   │   ├── grading.css
│   │   ├── index.css
│   │   ├── lessons.css
│   │   ├── library.css
│   │   ├── login.css
│   │   ├── main.jsx
│   │   ├── pages
│   │   │   ├── Analytics.jsx
│   │   │   ├── Assignments.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Grading.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Lessons.jsx
│   │   │   ├── Library.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Students.jsx
│   │   ├── settings.css
│   │   ├── signup.css
│   │   ├── students.css
│   │   ├── style.css
│   │   └── supabaseClient.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── package-lock.json
├── package.json
├── README.md
├── server
│   ├── .env
│   ├── error.log
│   ├── error.txt
│   ├── error2.txt
│   ├── index.js
│   ├── package-lock.json
│   └── package.json
├── supabase
│   └── schema.sql
└── testInsert.js
```

## Technologies Used

### Frontend
- **React** (v19)
- **Vite** - Next Generation Frontend Tooling
- **Tailwind CSS** - For rapid UI styling
- **React Router DOM** - For navigation
- **Supabase JS** - For authentication and database integration
- **Lucide React** - For beautiful, consistent icons

### Backend
- **Node.js & Express** - For the RESTful API
- **Google Generative AI (Gemini)** - For AI-powered suggestions, lesson plans, assignments, and grading
- **Supabase JS** - Backend database client
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing middleware

## Getting Started

Follow these steps to get the application up and running locally.

### Prerequisites
- Node.js (v16 or higher)
- npm (Node Package Manager)

### Installation & Running (Recommended)

You can install dependencies and run both the frontend and backend concurrently from the root directory.

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```
   *(This will install dependencies for both the `client` and `server` folders.)*

2. **Start the development servers:**
   ```bash
   npm run dev
   ```
   *(This uses `concurrently` to run both Vite and Nodemon simultaneously.)*

### Running Individually

If you prefer to run them separately:

#### Backend
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a `.env` file in the `server` folder.
   - Add your API keys (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:3000` by default.*

#### Frontend
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a `.env` file in the `client` folder if necessary.
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open in your browser, typically at `http://localhost:5173`.*

## Environment Variables

Ensure you have the required environment variables set up to use the full functionality of the app.

**Server (`/server/.env`):**
- `GEMINI_API_KEY`: Your Google Gemini API Key.
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_ANON_KEY`: Your Supabase Project Anon Key.
- `PORT`: (Optional) Port for the backend API, defaults to 3000.
