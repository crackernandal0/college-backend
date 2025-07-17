const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: ['Engineering', 'Medical', 'Management', 'Arts', 'Science', 'Commerce', 'Law', 'Other']
  },
  level: {
    type: String,
    // required: [true, 'Course level is required'],
    // enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Certificate']
  },
  duration: {
    type: String,
    required: [true, 'Course duration is required']
  },
  fees: {
    min: {
      type: Number,
      required: [true, 'Minimum fees is required'],
      min: [0, 'Fees cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Maximum fees is required'],
      min: [0, 'Fees cannot be negative']
    }
  },
  eligibility: {
    type: String,
    required: [true, 'Eligibility criteria is required']
  },
  image: {
    type: String,
    required: [true, 'Course image is required']
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  enrollments: {
    type: Number,
    default: 0,
    min: [0, 'Enrollments cannot be negative']
  },
  syllabus: [{
    topic: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  careerOpportunities: [{
    type: String,
    required: true
  }],
  topColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ featured: 1 });
courseSchema.index({ trending: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ title: 'text', description: 'text' });

// Virtual for fee range display


// Ensure virtual fields are serialized
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Course', courseSchema);