const mongoose = require('mongoose');
const Content = require('../models/Content');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admissionshala', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Default content for all pages
const defaultContent = [
  {
    page: 'home',
    sections: [
      {
        type: 'Hero Section',
        title: 'Hero Slides',
        content: {
          slides: [
              {
                title: 'Your Dream College Awaits',
                subtitle: 'Expert Guidance for Admission Success',
                description: 'Get personalized counseling and guidance from our experienced admission consultants to secure your place in top colleges.',
                buttonText: 'Start Your Journey',
                buttonLink: '/contact',
                imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
              }
            ]
        },
        order: 1,
        isVisible: true
      },
      {
        type: 'About Section',
        title: 'About The Education Expert',
        content: {
          title: 'About The Education Expert',
          subtitle: 'Your Trusted Education Partner',
          description: 'With over 14 years of expertise in education counseling, The Education Expert is dedicated to guiding students toward academic excellence. Our comprehensive services include college admissions, career counseling, and personalized educational planning.',
          additionalText: 'Our experienced counselors have empowered thousands of students to secure admissions in top-tier institutions across India. We prioritize a student-centric approach, tailoring guidance to individual aspirations and strengths.',
          image: 'https://media.istockphoto.com/id/2122148349/photo/writing-an-exam-at-the-university.jpg?s=612x612&w=0&k=20&c=LgVzLcd_cxNDQrolZFFqg7AIQnTd_xBrvdWfr-eVoK8=',
          learnMoreLink: '/about',
          contactLink: '/contact'
        },
        order: 2,
        isVisible: true
      },
      {
        type: 'Statistics',
        title: 'Our Achievements',
        content: {
          stats: [
            {
              iconName: 'FaUsers',
              number: '10000+',
              label: 'Students',
              color: '#1e88e5'
            },
            {
              iconName: 'FaGraduationCap',
              number: '500+',
              label: 'Colleges',
              color: '#d32f2f'
            },
            {
              iconName: 'FaAward',
              number: '95%',
              label: 'Success',
              color: '#f57c00'
            },
            {
              iconName: 'FaCalendarAlt',
              number: '14+',
              label: 'Experience',
              color: '#2e7d32'
            }
          ]
        },
        order: 3,
        isVisible: true
      },
      {
        type: 'Services',
        title: 'Our Services',
        content: {
          title: 'Our Services',
          subtitle: 'Comprehensive educational services to guide you towards success',
          services: [
            {
              title: 'Career Counseling',
              description: 'Expert guidance to help you choose the right career path based on your interests, skills, and market trends.',
              features: ['Personality Assessment', 'Career Mapping', 'Industry Insights']
            },
            {
              title: 'Admission Guidance',
              description: 'Comprehensive support for college admissions including application process, documentation, and interview preparation.',
              features: ['Application Support', 'Document Preparation', 'Interview Training']
            },
            {
              title: 'Entrance Exam Prep',
              description: 'Specialized coaching and preparation strategies for various entrance examinations like JEE, NEET, CAT, and more.',
              features: ['Mock Tests', 'Study Materials', 'Expert Faculty']
            },
            {
              title: 'Group Discussions',
              description: 'Practice sessions and training for group discussions and personal interviews to boost your confidence.',
              features: ['GD Practice', 'PI Training', 'Communication Skills']
            },
            {
              title: 'Study Abroad',
              description: 'Complete assistance for international education including university selection, visa guidance, and scholarships.',
              features: ['University Selection', 'Visa Assistance', 'Scholarship Guidance']
            },
            {
              title: 'Placement Support',
              description: 'Connect with our alumni network and get assistance for internships and final placements in top companies.',
              features: ['Alumni Network', 'Internship Support', 'Job Placement']
            }
          ]
        },
        order: 4,
        isVisible: true
      }
    ],
    isActive: true,
    version: 1
  },
  {
    page: 'about',
    sections: [
      {
        type: 'About Content',
        title: 'About The Education Expert',
        content: {
          title: 'About The Education Expert',
          subtitle: 'Your Trusted Education Partner',
          description: 'With over 14 years of expertise in education counseling, The Education Expert is dedicated to guiding students toward academic excellence. Our comprehensive services include college admissions, career counseling, and personalized educational planning.',
          additionalText: 'Our experienced counselors have empowered thousands of students to secure admissions in top-tier institutions across India. We prioritize a student-centric approach, tailoring guidance to individual aspirations and strengths.'
        },
        order: 1,
        isVisible: true
      },
      {
          type: 'Company Statistics',
          title: 'Our Achievements',
          content: {
            stats: [
              {
                iconName: 'FaGraduationCap',
                number: '10,000+',
                label: 'Students Guided',
                color: '#3498db'
              },
              {
                iconName: 'FaUsers',
                number: '500+',
                label: 'Partner Colleges',
                color: '#e74c3c'
              },
              {
                iconName: 'FaAward',
                number: '95%',
                label: 'Success Rate',
                color: '#f39c12'
              },
              {
                iconName: 'FaHandshake',
                number: '8+',
                label: 'Years Experience',
                color: '#27ae60'
              }
            ]
          },
          order: 2,
          isVisible: true
        },
      {
        type: 'Values',
        title: 'Our Values',
        content: {
          values: [
            {
              iconName: 'FaEye',
              title: 'Transparency',
              description: 'We believe in complete transparency in our processes, fees, and guidance to build trust with our students and parents.'
            },
            {
              iconName: 'FaBullseye',
              title: 'Excellence',
              description: 'We strive for excellence in everything we do, from counseling to admission assistance, ensuring the best outcomes.'
            },
            {
              iconName: 'FaHeart',
              title: 'Compassion',
              description: 'We understand the stress of admission processes and provide compassionate support throughout the journey.'
            }
          ]
        },
        order: 3,
        isVisible: true
      },
      {
        type: 'Team',
        title: 'Our Team',
        content: {
          members: [
            {
              name: 'Dr. Rajesh Kumar',
              position: 'Founder & CEO',
              image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
              description: 'With over 15 years in education consulting, Dr. Kumar has helped thousands of students achieve their academic dreams.',
              linkedin: '#',
              twitter: '#'
            },
            {
              name: 'Priya Sharma',
              position: 'Head of Counseling',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
              description: 'Priya specializes in career counseling and has guided over 5000 students in making the right career choices.',
              linkedin: '#',
              twitter: '#'
            },
            {
              name: 'Amit Patel',
              position: 'Admission Specialist',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
              description: 'Amit has extensive knowledge of admission processes across various universities and has a 98% success rate.',
              linkedin: '#',
              twitter: '#'
            }
          ]
        },
        order: 4,
        isVisible: true
      }
    ],
    isActive: true,
    version: 1
  },
  {
    page: 'contact',
    sections: [
      {
        type: 'Contact Content',
        title: 'Contact Us',
        content: {
          title: 'Contact Us',
          subtitle: 'Get in Touch',
          description: 'We are here to help you with your educational journey. Contact us for any queries or assistance.'
        },
        order: 1,
        isVisible: true
      },
      {
          type: 'Contact Information',
          title: 'Contact Information',
          content: {
            contactInfo: [
              {
                iconName: 'FaMapMarkerAlt',
                title: 'Visit Our Office',
                details: [
                  'guha road, dum dum,',
                  'kolkata -700028West Bengal, India'
                ],
                color: '#e74c3c'
              },
              {
                iconName: 'FaPhone',
                title: 'Call Us',
                details: [
                  '+91 9064258642'
                ],
                color: '#3498db'
              },
              {
                iconName: 'FaEnvelope',
                title: 'Email Us',
                details: [
                  'info@admissionshala.com',
                  'support@admissionshala.com'
                ],
                color: '#f39c12'
              }
            ]
          },
          order: 2,
          isVisible: true
        },
      {
        type: 'Office Hours',
        title: 'Office Hours',
        content: {
          hours: [
            { day: 'Monday - Friday', time: '11:00 AM - 7:00 PM' },
            { day: 'Saturday', time: '11:00 AM - 5:00 PM' },
            { day: 'Sunday', time: 'Closed' }
          ]
        },
        order: 3,
        isVisible: true
      }
    ],
    isActive: true,
    version: 1
  }
];

async function seedContent() {
  try {
    console.log('🌱 Starting content seeding...');
    
    // Clear existing content
    await Content.deleteMany({});
    console.log('🗑️  Cleared existing content');
    
    // Create default admin user ID (you'll need to replace this with actual admin ID)
    const adminUserId = new mongoose.Types.ObjectId();
    
    // Insert default content for each page
    for (const pageContent of defaultContent) {
      const content = new Content({
        ...pageContent,
        lastUpdatedBy: adminUserId
      });
      
      await content.save();
      console.log(`✅ Created default content for ${pageContent.page} page`);
    }
    
    console.log('🎉 Content seeding completed successfully!');
    console.log('📝 Default content has been added for:');
    console.log('   - Home page (Hero, About, Services sections)');
    console.log('   - About page (Content, Statistics, Values, Team sections)');
    console.log('   - Contact page (Content, Contact Info, Office Hours sections)');
    
  } catch (error) {
    console.error('❌ Error seeding content:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the seeding function
seedContent();