const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@admissionshala.com' 
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create default admin user
    const adminData = {
      name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@admissionshala.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456',
      role: 'admin',
      isActive: true,
      permissions: [
        'create_course',
        'edit_course',
        'delete_course',
        'create_college',
        'edit_college',
        'delete_college',
        'manage_users',
        'view_analytics'
      ]
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('⚠️  Please change the default password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeder
seedAdmin();