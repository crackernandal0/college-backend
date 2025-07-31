const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true,
    enum: ['home', 'about', 'contact', 'footer']
  },
  sections: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
contentSchema.index({ page: 1 });

// Pre-save middleware to increment version
contentSchema.pre('save', function(next) {
  if (this.isModified('sections')) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Content', contentSchema);