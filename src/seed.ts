import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './modules/users/user.model';
import { Item } from './models/item.model';
import { Review } from './modules/reviews/review.model';
import { Booking } from './modules/bookings/booking.model';
import { DocumentModel } from './models/document.model';
import { AILog } from './models/ailog.model';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomRating = (): number => {
  const rating = Math.random() * (4.9 - 3.8) + 3.8;
  return Math.round(rating * 10) / 10;
};

const seed = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI (or MONGO_URI) is not set');
    }

    await mongoose.connect(mongoUri);
    console.log('Step 1 - Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Review.deleteMany({}),
      Booking.deleteMany({}),
      DocumentModel.deleteMany({}),
      AILog.deleteMany({}),
    ]);
    console.log('Step 2 - Cleared existing data');

    const adminPassword = await bcrypt.hash('123456', 10);
    const userPassword = await bcrypt.hash('123456', 10);

    const [adminUser, regularUser] = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@writeflow.com',
        password: adminPassword,
        role: 'ADMIN',
      },
      {
        name: 'Demo User',
        email: 'user@writeflow.com',
        password: userPassword,
        role: 'USER',
      },
    ]);
    console.log('Step 3 - Created users');

    const baseItems = [
      {
        title: 'SEO Blog Post Template',
        description: 'A structured template for ranking blog posts...',
        price: 0,
        category: 'blog',
        location: 'Digital',
      },
      {
        title: 'How-To Guide Template',
        description: 'Step-by-step guide format perfect for tutorials...',
        price: 9.99,
        category: 'blog',
        location: 'Digital',
      },
      {
        title: 'Listicle Template',
        description: 'Attention-grabbing list-format article template...',
        price: 0,
        category: 'blog',
        location: 'Digital',
      },
      {
        title: 'Instagram Caption Pack',
        description: '30 engaging caption templates for Instagram...',
        price: 14.99,
        category: 'social',
        location: 'Digital',
      },
      {
        title: 'Twitter Thread Template',
        description: 'Format for viral Twitter thread content...',
        price: 0,
        category: 'social',
        location: 'Digital',
      },
      {
        title: 'LinkedIn Post Template',
        description: 'Professional LinkedIn post templates...',
        price: 9.99,
        category: 'social',
        location: 'Digital',
      },
      {
        title: 'Bali Beach Resort',
        description: 'Luxury beachfront resort in Seminyak...',
        price: 199,
        category: 'travel',
        location: 'Bali, Indonesia',
      },
      {
        title: 'Santorini Cave Suite',
        description: 'Cliffside cave hotel with caldera views...',
        price: 350,
        category: 'travel',
        location: 'Santorini, Greece',
      },
      {
        title: 'Tokyo City Hostel',
        description: 'Budget-friendly hostel in Shinjuku district...',
        price: 45,
        category: 'travel',
        location: 'Tokyo, Japan',
      },
      {
        title: 'The Spice Garden',
        description: 'Award-winning Indian fusion restaurant...',
        price: 35,
        category: 'restaurant',
        location: 'London, UK',
      },
      {
        title: 'Sakura Sushi Bar',
        description: 'Authentic Japanese omakase dining...',
        price: 80,
        category: 'restaurant',
        location: 'New York, USA',
      },
      {
        title: 'Cafe del Mar',
        description: 'Beachside Mediterranean cafe and bar...',
        price: 25,
        category: 'restaurant',
        location: 'Barcelona, Spain',
      },
    ];

    const items = baseItems.map((item) => ({
      ...item,
      createdBy: adminUser._id,
      rating: getRandomRating(),
      reviewCount: getRandomInt(5, 50),
      usageCount: getRandomInt(10, 200),
      image: '/placeholder.jpg',
    }));

    const createdItems = await Item.insertMany(items);
    console.log('Step 4 - Created items');

    const reviewRatings = [5, 4, 5, 3, 4, 5];
    const reviewComments = [
      'Well structured and easy to follow, this template saved me hours.',
      'Solid guidance with clear steps, great for beginners.',
      'Excellent flow and formatting suggestions, highly recommend.',
      'Decent structure but could use more examples.',
      'Helpful outline and prompts, improved my writing pace.',
      'Great starting point and the tips are practical.',
    ];

    const reviews = reviewRatings.map((rating, index) => ({
      rating,
      comment: reviewComments[index],
      userId: regularUser._id,
      itemId: createdItems[index]._id,
      approved: index < 3,
    }));

    await Review.insertMany(reviews);
    console.log('Step 5 - Created reviews');

    const bookingItems = [createdItems[0], createdItems[4], createdItems[8]];
    const bookings = bookingItems.map((item) => ({
      userId: regularUser._id,
      itemId: item._id,
      quantity: 1,
      price: item.price,
      status: 'confirmed',
    }));

    await Booking.insertMany(bookings);
    console.log('Step 6 - Created bookings');

    const documents = [
      {
        title: 'My First Blog Post',
        content: 'This is a draft about AI writing tools...',
        status: 'DRAFT',
        wordCount: 45,
      },
      {
        title: 'Instagram Campaign Q1',
        content: 'Social media copy for our January campaign...',
        status: 'PUBLISHED',
        wordCount: 120,
      },
      {
        title: 'Old Newsletter Draft',
        content: 'February newsletter content...',
        status: 'ARCHIVED',
        wordCount: 89,
      },
      {
        title: 'Product Launch Email',
        content: 'Announcing our new product line...',
        status: 'DRAFT',
        wordCount: 200,
      },
      {
        title: 'SEO Article: AI Tools 2025',
        content: 'Comprehensive guide to AI writing tools...',
        status: 'PUBLISHED',
        wordCount: 850,
      },
    ].map((document) => ({
      ...document,
      userId: regularUser._id,
    }));

    await DocumentModel.insertMany(documents);
    console.log('Step 7 - Created documents');

    const dayOffsets = [0, 1, 2, 3, 4, 5, 6, 1];
    const agents = ['Content Draft', 'Rewrite & Tone', 'Chat Assistant'];

    const aiLogs = dayOffsets.map((offset, index) => {
      const createdAt = new Date(Date.now() - offset * 86400000);
      return {
        userId: regularUser._id,
        agentUsed: agents[index % agents.length],
        prompt: `Seeded AI prompt ${index + 1}`,
        tokensUsed: getRandomInt(200, 800),
        createdAt,
        updatedAt: createdAt,
      };
    });

    await AILog.insertMany(aiLogs);
    console.log('Step 8 - Created AI logs');

    console.log('Step 9 - Seeding complete');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seed();
