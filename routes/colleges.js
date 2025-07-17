const express = require('express');
const { body, validationResult, query } = require('express-validator');
const College = require('../models/College');
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

// @route   GET /api/colleges
// @desc    Get all colleges with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
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
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status: 'active' };
        
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get colleges with pagination
    const colleges = await College.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description image address status createdAt updatedAt')
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const total = await College.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: colleges,
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
    console.error('Get colleges error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching colleges'
    });
  }
});
// @route   GET /api/colleges/:id
// @desc    Get single college by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id)
      .select('name description image address status createdAt updatedAt');
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    res.json({
      success: true,
      data: college
    });
  } catch (error) {
    console.error('Get college error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching college'
    });
  }
});

// @route   POST /api/colleges
// @desc    Create a new college
// @access  Private (Admin/Moderator with create_college permission)
router.post('/', [
  auth,
  requirePermission('create_college'),
  upload.single('image'),
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('address').notEmpty().withMessage('Address is required').trim()
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

    const collegeData = {
      name: req.body.name,
      description: req.body.description,
      address: req.body.address
    };
    
    // Handle image upload to Cloudinary
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'admissionshala/colleges',
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
        
        collegeData.image = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    // Add creator information
    collegeData.createdBy = req.user.id;
    collegeData.updatedBy = req.user.id;

    // Create college
    const college = new College(collegeData);
    await college.save();

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college
    });
  } catch (error) {
    console.error('Create college error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'College with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating college'
    });
  }
});

// @route   PUT /api/colleges/:id
// @desc    Update a college
// @access  Private (Admin/Moderator with edit_college permission)
router.put('/:id', [
  auth,
  requirePermission('edit_college'),
  upload.single('image')
], async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    const updateData = {};
    
    // Only allow updating specific fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.address) updateData.address = req.body.address;
    
    // Handle image upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'admissionshala/colleges',
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

    // Update college
    const updatedCollege = await College.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'College updated successfully',
      data: updatedCollege
    });
  } catch (error) {
    console.error('Update college error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating college'
    });
  }
});

// @route   DELETE /api/colleges/:id
// @desc    Delete a college
// @access  Private (Admin with delete_college permission)
router.delete('/:id', [
  auth,
  requirePermission('delete_college')
], async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

    // Soft delete by updating status
    await College.findByIdAndUpdate(req.params.id, {
      status: 'deleted',
      updatedBy: req.user.id,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'College deleted successfully'
    });
  } catch (error) {
    console.error('Delete college error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting college'
    });
  }
});

// @route   GET /api/colleges/stats/overview
// @desc    Get colleges statistics
// @access  Private (Admin/Moderator)
router.get('/stats/overview', [
  auth,
  requirePermission('view_analytics')
], async (req, res) => {
  try {
    const totalColleges = await College.countDocuments({ status: 'active' });
    const recentColleges = await College.countDocuments({
      status: 'active',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    res.json({
      success: true,
      data: {
        totalColleges,
        recentColleges
      }
    });
  } catch (error) {
    console.error('Get colleges stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;