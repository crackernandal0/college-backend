const mongoose = require('mongoose');

const popupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Learn More'
  },
  buttonLink: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayDelay: {
    type: Number,
    default: 30000, // 30 seconds in milliseconds
    min: 5000, // minimum 5 seconds
    max: 120000 // maximum 2 minutes
  },
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#333333'
  },
  buttonColor: {
    type: String,
    default: '#007bff'
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

// Ensure only one active popup at a time
popupSchema.pre('save', async function(next) {
  if (this.isActive && this.isModified('isActive')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

// Indexes for better query performance
popupSchema.index({ isActive: 1 });
popupSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Popup', popupSchema);