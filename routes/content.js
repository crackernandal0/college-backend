const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');

// Get content by page (public)
router.get('/:page', async (req, res) => {
  try {
    const { page } = req.params;
    
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const content = await Content.findOne({ 
      page, 
      isActive: true 
    }).populate('lastUpdatedBy', 'name email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found for this page'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Get all content (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const contents = await Content.find()
      .populate('lastUpdatedBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: contents
    });
  } catch (error) {
    console.error('Error fetching all content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Create or update content (admin only)
router.post('/:page', auth, async (req, res) => {
  try {
    const { page } = req.params;
    const { sections, isActive } = req.body;

    if (!sections) {
      return res.status(400).json({
        success: false,
        message: 'Sections data is required'
      });
    }

    let content = await Content.findOne({ page });

    if (content) {
      // Update existing content
      content.sections = sections;
      content.lastUpdatedBy = req.user.id;
      if (isActive !== undefined) {
        content.isActive = isActive;
      }
      await content.save();
    } else {
      // Create new content
      content = new Content({
        page,
        sections,
        lastUpdatedBy: req.user.id,
        isActive: isActive !== undefined ? isActive : true
      });
      await content.save();
    }

    await content.populate('lastUpdatedBy', 'name email');

    res.json({
      success: true,
      message: `${page} content ${content.version === 1 ? 'created' : 'updated'} successfully`,
      data: content
    });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving content',
      error: error.message
    });
  }
});

// Delete content (admin only)
router.delete('/:page', auth, async (req, res) => {
  try {
    const { page } = req.params;
    
    const content = await Content.findOneAndDelete({ page });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
});

// Get content history/versions (admin only)
router.get('/:page/history', auth, async (req, res) => {
  try {
    const { page } = req.params;
    
    const content = await Content.findOne({ page })
      .populate('lastUpdatedBy', 'name email');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: {
        page: content.page,
        version: content.version,
        lastUpdated: content.updatedAt,
        lastUpdatedBy: content.lastUpdatedBy
      }
    });
  } catch (error) {
    console.error('Error fetching content history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content history',
      error: error.message
    });
  }
});

// Initialize default content for all pages (admin only)
router.post('/admin/initialize', auth, async (req, res) => {
  try {
    const defaultContents = [
      {
        page: 'home',
        sections: {
          hero: {
            title: 'Your Gateway to Educational Excellence',
            subtitle: 'Discover the best colleges and courses for your future',
            backgroundImage: '/images/hero-bg.jpg'
          },
          stats: {
            students: '10,000+',
            colleges: '500+',
            courses: '1,000+',
            successRate: '95%'
          }
        }
      },
      {
        page: 'about',
        sections: {
          hero: {
            title: 'About The Education Expert',
            subtitle: 'Your trusted partner in educational journey'
          },
          mission: {
            title: 'Our Mission',
            description: 'To provide comprehensive guidance for college admissions, career counseling, and academic excellence.'
          },
          vision: {
            title: 'Our Vision',
            description: 'To be the leading educational consultancy that empowers students to achieve their academic dreams.'
          }
        }
      },
      {
        page: 'contact',
        sections: {
          hero: {
            title: 'Get in Touch',
            subtitle: 'We are here to help you with your educational journey'
          },
          office: {
            address: 'guha road, dum dum, kolkata -700028 West Bengal, India',
            phone: '+91 9064258642',
            email: 'info@admissionshala.com'
          },
          hours: {
            weekdays: '11:00 AM - 7:00 PM',
            saturday: '11:00 AM - 5:00 PM',
            sunday: 'Closed'
          }
        }
      },
      {
        page: 'footer',
        sections: {
          company: {
            name: 'The Education Expert',
            tagline: 'Your Gateway to Success',
            description: 'The Education Expert is your trusted partner in educational journey. We provide comprehensive guidance for college admissions, career counseling, and academic excellence.'
          },
          contact: {
            address: 'guha road, dum dum, kolkata -700028 West Bengal, India',
            phone: '+91 9064258642',
            email: 'info@admissionshala.com'
          },
          social: {
            facebook: '#',
            twitter: '#',
            instagram: '#',
            linkedin: '#',
            youtube: '#'
          },
          links: {
            quickLinks: ['Home', 'About Us', 'Courses', 'Colleges', 'Blogs', 'Contact Us'],
            services: ['Career Counseling', 'College Admissions', 'Entrance Exam Prep', 'Scholarship Guidance']
          }
        }
      }
    ];

    const results = [];
    for (const defaultContent of defaultContents) {
      let content = await Content.findOne({ page: defaultContent.page });
      
      if (!content) {
        content = new Content({
          ...defaultContent,
          lastUpdatedBy: req.user.id
        });
        await content.save();
        results.push(`${defaultContent.page} content created`);
      } else {
        results.push(`${defaultContent.page} content already exists`);
      }
    }

    res.json({
      success: true,
      message: 'Default content initialization completed',
      data: results
    });
  } catch (error) {
    console.error('Error initializing content:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing content',
      error: error.message
    });
  }
});

module.exports = router;