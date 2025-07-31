const express = require('express');
const router = express.Router();
const Popup = require('../models/Popup');
// const auth = require('../middleware/auth');
// const adminAuth = require('../middleware/adminAuth');

// Get active popup (public route)
router.get('/active', async (req, res) => {
  try {
    const popup = await Popup.findOne({ isActive: true });
    res.json({ success: true, popup: popup });
  } catch (error) {
    console.error('Error fetching active popup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all popups (admin only)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const popups = await Popup.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    const total = await Popup.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: popups,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching popups:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new popup (admin only)
router.post('/',  async (req, res) => {
  try {
    const {
      title,
      content,
      buttonText,
      buttonLink,
      displayDelay,
      backgroundColor,
      textColor,
      buttonColor
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const popup = new Popup({
      title,
      content,
      buttonText,
      buttonLink,
      displayDelay,
      backgroundColor,
      textColor,
      buttonColor,
      // createdBy: req.user.id
    });

    await popup.save();
    await popup.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Popup created successfully',
      data: popup
    });
  } catch (error) {
    console.error('Error creating popup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update popup (admin only)
router.put('/:id',  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updatedBy: req.user.id };

    const popup = await Popup.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy updatedBy', 'name email');

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: 'Popup not found'
      });
    }

    res.json({
      success: true,
      message: 'Popup updated successfully',
      data: popup
    });
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete popup (admin only)
router.delete('/:id',  async (req, res) => {
  try {
    const { id } = req.params;

    const popup = await Popup.findByIdAndDelete(id);

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: 'Popup not found'
      });
    }

    res.json({
      success: true,
      message: 'Popup deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting popup:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle popup status (admin only)
router.patch('/:id/toggle',  async (req, res) => {
  try {
    const { id } = req.params;

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: 'Popup not found'
      });
    }

    popup.isActive = !popup.isActive;
    popup.updatedBy = req.user.id;
    await popup.save();

    res.json({
      success: true,
      message: `Popup ${popup.isActive ? 'activated' : 'deactivated'} successfully`,
      data: popup
    });
  } catch (error) {
    console.error('Error toggling popup status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;