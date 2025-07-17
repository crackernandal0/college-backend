const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Course = require('../models/Course');
const { auth, requirePermission } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/courses
// @desc    Get all courses with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
  query('featured').optional().isBoolean().withMessage('Featured must be a boolean'),
  query('trending').optional().isBoolean().withMessage('Trending must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      category,
      level,
      featured,
      trending,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
    
    if (category) filter.category = new RegExp(category, 'i');
    if (level) filter.level = level;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (trending !== undefined) filter.trending = trending === 'true';
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get courses with pagination
    const courses = await Course.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Course.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses'
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select('-__v');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Increment view count (optional)
    course.views = (course.views || 0) + 1;
    await course.save();

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('Get course error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching course'
    });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Admin/Moderator with create_course permission)
router.post('/', [
  auth,
  requirePermission('create_course'),
  upload.single('image'),
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 3, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters'),
   body('duration')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Duration must be between 1 and 50 characters'),
  body('fees.min')
    .isNumeric()
    .withMessage('Minimum fee must be a number'),
  body('fees.max')
    .isNumeric()
    .withMessage('Maximum fee must be a number'),
  body('eligibility')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Eligibility must be between 5 and 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const courseData = req.body;
    
    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'admissionshala/courses',
              transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        courseData.image = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Add creator information
    courseData.createdBy = req.user.id;
    courseData.updatedBy = req.user.id;

    // Create course
    const course = new Course(courseData);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Create course error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this title already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating course'
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private (Admin/Moderator with edit_course permission)
router.put('/:id', [
  auth,
  requirePermission('edit_course'),
  upload.single('image')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const updateData = { ...req.body };
    
    // Handle image upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'admissionshala/courses',
              transformation: [
                { width: 800, height: 600, crop: 'fill' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        updateData.image = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Add updater information
    updateData.updatedBy = req.user.id;
    updateData.updatedAt = new Date();

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating course'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private (Admin with delete_course permission)
router.delete('/:id', [
  auth,
  requirePermission('delete_course')
], async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Soft delete by updating status
    await Course.findByIdAndUpdate(req.params.id, {
      status: 'deleted',
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting course'
    });
  }
});

module.exports = router;