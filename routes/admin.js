const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const College = require('../models/College');
const { auth, adminAuth, requirePermission } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin/Moderator)
router.get('/dashboard', [
  auth,
  requirePermission('view_analytics')
], async (req, res) => {
  try {
    // Get basic counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCourses = await Course.countDocuments({ status: 'active' });
    const totalColleges = await College.countDocuments({ status: 'active' });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    });
    const recentCourses = await Course.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'active'
    });
    const recentColleges = await College.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'active'
    });

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get courses by category
    const coursesByCategory = await Course.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get colleges by type
    const collegesByType = await College.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activities
    const recentActivities = await Promise.all([
      Course.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title createdAt createdBy')
        .populate('createdBy', 'name'),
      College.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name createdAt createdBy')
        .populate('createdBy', 'name'),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt')
    ]);

    const [latestCourses, latestColleges, latestUsers] = recentActivities;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalCourses,
          totalColleges,
          totalAdmins
        },
        recentActivity: {
          recentUsers,
          recentCourses,
          recentColleges
        },
        analytics: {
          usersByRole,
          coursesByCategory,
          collegesByType
        },
        latestData: {
          courses: latestCourses,
          colleges: latestColleges,
          users: latestUsers
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard data'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin)
router.get('/users', [
  auth,
  requirePermission('manage_users'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'moderator', 'user']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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
      role,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get users with pagination
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password -__v');

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: users,
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create a new user
// @access  Private (Admin)
router.post('/users', [
  auth,
  adminAuth,
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'moderator', 'user'])
    .withMessage('Role must be admin, moderator, or user'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid phone number')
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

    const { name, email, password, role, phone, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      phone,
      isActive: true
    };

    // Add permissions if provided and role is not admin
    if (permissions && role !== 'admin') {
      userData.permissions = permissions;
    }

    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        permissions: user.getPermissions(),
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update a user
// @access  Private (Admin)
router.put('/users/:id', [
  auth,
  adminAuth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'moderator', 'user'])
    .withMessage('Role must be admin, moderator, or user'),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid phone number'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
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

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const updateData = { ...req.body };
    delete updateData.password; // Don't allow password update through this route
    delete updateData.email; // Don't allow email update

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -__v');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Deactivate a user
// @access  Private (Admin)
router.delete('/users/:id', [
  auth,
  adminAuth
], async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete by deactivating
    await User.findByIdAndUpdate(req.params.id, {
      isActive: false
    });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin/Moderator)
router.get('/analytics', [
  auth,
  requirePermission('view_analytics')
], async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration trends
    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Course creation trends
    const courseTrends = await Course.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // College creation trends
    const collegeTrends = await College.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top performing courses
    const topCourses = await Course.find({ status: 'active' })
      .sort({ rating: -1, enrollments: -1 })
      .limit(10)
      .select('title category rating enrollments');

    // Top colleges by ranking
    const topColleges = await College.find({ status: 'active' })
      .sort({ 'ranking.national': 1 })
      .limit(10)
      .select('name type location.state ranking');

    res.json({
      success: true,
      data: {
        trends: {
          users: userTrends,
          courses: courseTrends,
          colleges: collegeTrends
        },
        topPerformers: {
          courses: topCourses,
          colleges: topColleges
        },
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
    });
  }
});

module.exports = router;