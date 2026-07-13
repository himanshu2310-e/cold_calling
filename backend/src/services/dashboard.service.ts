// ============================================
// Dashboard & Analytics Service — Business Logic
// ============================================
import mongoose from 'mongoose';
import Lead from '../models/Lead';
import Call from '../models/Call';
import User from '../models/User';
import Activity from '../models/Activity';
import Recording from '../models/Recording';
import FollowUp from '../models/FollowUp';

/**
 * Get Admin dashboard stats, metrics, charts, and activity feeds.
 */
export const getAdminStats = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // 1. Widgets count calculations
  const [
    totalLeads,
    callsToday,
    connectedCalls,
    missedCalls,
    activeAgents,
    conversions,
    pendingFollowUps,
    notCalledCount,
    calledCount,
    interestedCount,
  ] = await Promise.all([
    Lead.countDocuments(),
    Call.countDocuments({ startTime: { $gte: todayStart, $lte: todayEnd } }),
    Call.countDocuments({ outcome: 'connected' }),
    Call.countDocuments({ outcome: { $in: ['no_answer', 'busy', 'voicemail'] } }),
    User.countDocuments({ isSuspended: false }),
    Lead.countDocuments({ status: 'converted' }),
    FollowUp.countDocuments({ isCompleted: false }),
    Lead.countDocuments({ status: 'not_called' }),
    Lead.countDocuments({ status: 'called' }),
    Lead.countDocuments({ status: 'interested' }),
  ]);

  const calledLeads = totalLeads - notCalledCount;
  const interestedLeads = interestedCount;

  const statusBreakdown = [
    { name: 'Not Called', value: notCalledCount },
    { name: 'Called', value: calledCount },
    { name: 'Interested', value: interestedCount },
    { name: 'Converted', value: conversions },
  ];

  // Average Call Duration
  const callDurationRaw = await Call.aggregate([
    {
      $group: {
        _id: null,
        avgDuration: { $avg: '$duration' },
      },
    },
  ]);
  const avgCallDuration = callDurationRaw[0] ? Math.round(callDurationRaw[0].avgDuration) : 0;

  // 2. Charts Data Aggregations

  // Lead Sources distribution
  const leadSources = await Lead.aggregate([
    {
      $group: {
        _id: '$leadSource',
        value: { $sum: 1 },
      },
    },
    { $project: { name: { $ifNull: ['$_id', 'Unknown'] }, value: 1, _id: 0 } },
    { $sort: { value: -1 } },
    { $limit: 5 },
  ]);

  // Weekly Calls: group by day of the week
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyCallsRaw = await Call.aggregate([
    { $match: { startTime: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const weeklyCalls = weeklyCallsRaw.map((day) => ({
    day: formatDayName(day._id),
    calls: day.count,
  }));

  // Recent Activity Feed
  const recentActivities = await Activity.find()
    .populate('user', 'firstName lastName avatar role')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Recent Calls list
  const recentCalls = await Call.find()
    .populate('lead', 'fullName')
    .sort({ startTime: -1 })
    .limit(5)
    .lean();

  // Upcoming Follow-ups list
  const upcomingFollowUps = await FollowUp.find({ isCompleted: false })
    .populate('lead', 'fullName')
    .sort({ scheduledDate: 1 })
    .limit(5)
    .lean();

  return {
    totalLeads,
    callsToday,
    connectedCalls,
    missedCalls,
    activeAgents,
    conversions,
    avgCallDuration,
    pendingFollowUps,
    weeklyCalls,
    leadSources,
    recentActivities,
    recentCalls,
    upcomingFollowUps,
    calledLeads,
    interestedLeads,
    statusBreakdown,
  };
};

/**
 * Get Agent dashboard stats, metrics, progress charts.
 */
export const getAgentStats = async (agentId: string) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const agentObjectId = new mongoose.Types.ObjectId(agentId);

  const [
    totalLeads,
    callsToday,
    conversions,
    pendingFollowUps,
  ] = await Promise.all([
    Lead.countDocuments({ assignedTo: agentObjectId }),
    Call.countDocuments({ agent: agentObjectId, startTime: { $gte: todayStart, $lte: todayEnd } }),
    Lead.countDocuments({ assignedTo: agentObjectId, status: 'converted' }),
    FollowUp.countDocuments({ agent: agentObjectId, isCompleted: false }),
  ]);

  return {
    totalLeads,
    callsToday,
    conversions,
    pendingFollowUps,
  };
};

// ---- Helper ----
function formatDayName(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}
