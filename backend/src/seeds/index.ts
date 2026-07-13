// ============================================
// Database Seeder — Creates initial admin user
// ============================================
import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import env from '../config/env';
import User from '../models/User';

const seedAdmin = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@coldconnect.com',
      password: 'Admin@123456',
      role: 'admin',
      isActive: true,
    });

    console.log('✅ Admin user created successfully');
    console.log('   Email:    admin@coldconnect.com');
    console.log('   Password: Admin@123456');
    console.log('   Role:     admin');

    // Create a demo agent
    const agent = await User.create({
      firstName: 'Bot',
      lastName: 'Agent',
      email: 'agent@coldconnect.com',
      password: 'Agent@123456',
      role: 'agent',
      isActive: true,
    });

    console.log('');
    console.log('✅ Demo agent created successfully');
    console.log('   Email:    agent@coldconnect.com');
    console.log('   Password: Agent@123456');
    console.log('   Role:     agent');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedAdmin();
