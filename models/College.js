const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  address: {
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty website
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Website must be a valid URL starting with http:// or https://'
    }
  },
  status: {
    type: String,
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});





// Indexes for better query performance
collegeSchema.index({ status: 1 });
collegeSchema.index({ name: 'text', description: 'text' });
collegeSchema.index({ name: 1 });
collegeSchema.index({ address: 1 });

// Ensure virtual fields are serialized
collegeSchema.set('toJSON', { virtuals: true });
collegeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('College', collegeSchema);