// ============================================
// Model Barrel Export
// ============================================
export { default as User } from './User';
export { default as Lead } from './Lead';
export { default as Call } from './Call';
export { default as Recording } from './Recording';
export { default as Note } from './Note';
export { default as Notification } from './Notification';
export { default as Activity } from './Activity';
export { default as FollowUp } from './FollowUp';
export { default as Settings } from './Settings';
export { default as Ticket } from './Ticket';

// Re-export document interfaces
export type { IUserDocument } from './User';
export type { ILeadDocument } from './Lead';
export type { ICallDocument } from './Call';
export type { IRecordingDocument } from './Recording';
export type { INoteDocument } from './Note';
export type { INotificationDocument } from './Notification';
export type { IActivityDocument } from './Activity';
export type { IFollowUpDocument } from './FollowUp';
export type { ISettingsDocument } from './Settings';
export type { ITicketDocument } from './Ticket';
