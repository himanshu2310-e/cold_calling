// ============================================
// Reset Passwords Seed Script
// ============================================
import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import env from '../config/env';
import User from '../models/User';

const reset = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Reset admin user password
    const admin = await User.findOne({ email: 'admin@coldconnect.com' });
    if (admin) {
      admin.password = 'Admin@123456';
      await admin.save();
      console.log('✅ Admin password reset to: Admin@123456');
    } else {
      console.log('❌ Admin user not found');
    }

    // Reset agent user password
    const agent = await User.findOne({ email: 'agent@coldconnect.com' });
    if (agent) {
      agent.password = 'Agent@123456';
      await agent.save();
      console.log('✅ Agent password reset to: Agent@123456');
    } else {
      console.log('❌ Agent user not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

reset();
