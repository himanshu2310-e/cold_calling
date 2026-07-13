// ============================================
// Route Index — Mounts all API routes
// ============================================
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import leadRoutes from './lead.routes';
import callRoutes from './call.routes';
import recordingRoutes from './recording.routes';
import noteRoutes from './note.routes';
import activityRoutes from './activity.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import followupRoutes from './followup.routes';
import settingsRoutes from './settings.routes';
import ticketRoutes from './ticket.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/leads', leadRoutes);
router.use('/calls', callRoutes);
router.use('/recordings', recordingRoutes);
router.use('/notes', noteRoutes);
router.use('/activities', activityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/followups', followupRoutes);
router.use('/settings', settingsRoutes);
router.use('/tickets', ticketRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'ColdConnect API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
