const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'user'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  permissions: [{
    type: String,
    enum: [
      'create_course',
      'edit_course',
      'delete_course',
      'create_college',
      'edit_college',
      'delete_college',
      'manage_users',
      'view_analytics'
    ]
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true; // Admin has all permissions
  return this.permissions.includes(permission);
};

// Get user's full permissions based on role
userSchema.methods.getPermissions = function() {
  const rolePermissions = {
    admin: [
      'create_course',
      'edit_course',
      'delete_course',
      'create_college',
      'edit_college',
      'delete_college',
      'manage_users',
      'view_analytics'
    ],
    moderator: [
      'create_course',
      'edit_course',
      'create_college',
      'edit_college',
      'view_analytics'
    ],
    user: []
  };
  
  const basePermissions = rolePermissions[this.role] || [];
  return [...new Set([...basePermissions, ...this.permissions])];
};

// Virtual for user's display name
userSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);