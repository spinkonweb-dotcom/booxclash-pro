import express from 'express';
import http from 'http';
import ttsRoutes from './routes/ttsRoutes.js'; // <-- ADD THIS LINE
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js'; // <-- ADD THIS LINE
import path from 'path';
import connectDB from './config/db.js';
import lessonContentRoutes from './routes/lessonContentRoutes.js';
import materialsToolsRoutes from './routes/materialsTools.js';
import gameRoutes from './routes/gamesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import questionsRoutes from './routes/questionsRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js'; // <-- NEW
import foundationLessonRoutes from './routes/foundationLessonRoutes.js'; // <-- NEW: Import lesson content routes
import multiRoutes from './routes/multiRoutes.js'; // <-- NEW: Import multi routes
import adminRoutes from './routes/adminRoutes.js'; // <-- NEW: Import admin routes
import  initSocket  from './games/sockets/socket.js';
import roomRoutes from './games/routes/roomRoutes.js'
import childRoutes from './routes/childRoutes.js';
import activityLogRoutes from "./routes/activityLogRoutes.js";
import parentRoutes from './routes/parentRoutes.js';


dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const allowedOrigins = [
  'http://localhost:5173',
  'https://backend-162267981396.us-central1.run.app',
  'https://www-booxclash-com.vercel.app',
  'https://booxclashlearn.com',
  'https://www.booxclashlearn.com',
  'https://booxclash-learn.uc.r.appspot.com',
  'https://www-booxclash-com.onrender.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE','PATCH'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use(express.static('public', {
  maxAge: '1y',
  immutable: true
}));

app.use('/api/rooms', roomRoutes);
app.use('/api', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/lesson-content', lessonContentRoutes);
app.use('/api/materials-tools', materialsToolsRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/foundation-lessons', foundationLessonRoutes); // NEW: Lesson content routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/multi-rooms', multiRoutes);
app.use('/api/ai', aiRoutes); // <-- ADD THIS LINE for AI routes
app.use('/api', ttsRoutes);
app.use("/api", adminRoutes);
app.use("/api/children", childRoutes);
app.use('/api/parents', parentRoutes);
app.use("/api/activity-logs", activityLogRoutes);

// HTTP + Socket server

initSocket(server); 
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
