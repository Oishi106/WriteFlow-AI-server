import './env';
import { connectDB } from './db';
import { User } from '../modules/users/user.model';
import { Item } from '../models/item.model';

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  await User.deleteMany({});
  await Item.deleteMany({});

  const adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@writeflow.com',
    password: '123456',
    role: 'ADMIN',
    plan: 'TEAM',
    bio: 'Platform administrator',
  });

  await User.create({
    name: 'Demo User',
    email: 'user@writeflow.com',
    password: '123456',
    role: 'USER',
    plan: 'PRO',
    bio: 'Content creator and writer',
  });

  const items = [
    {
      title: 'SEO Blog Post Generator',
      description: 'Generate comprehensive, SEO-optimized blog posts that rank on Google and engage readers.',
      category: 'blog',
      price: 29.99,
      rating: 4.8,
      usageCount: 1250,
      reviewCount: 42,
      createdBy: adminUser._id,
    },
    {
      title: 'Instagram Caption Wizard',
      description: 'Create scroll-stopping Instagram captions with perfect hashtags for maximum reach.',
      category: 'social',
      price: 9.99,
      rating: 4.6,
      usageCount: 3200,
      reviewCount: 88,
      createdBy: adminUser._id,
    },
    {
      title: 'Email Newsletter Writer',
      description: 'Craft engaging newsletters that drive opens, clicks, and conversions for your audience.',
      category: 'email',
      price: 19.99,
      rating: 4.7,
      usageCount: 890,
      reviewCount: 31,
      createdBy: adminUser._id,
    },
    {
      title: 'Facebook Ad Copy Master',
      description: 'Write high-converting Facebook and Instagram ad copy that turns visitors into customers.',
      category: 'ad-copy',
      price: 14.99,
      rating: 4.5,
      usageCount: 2100,
      reviewCount: 56,
      createdBy: adminUser._id,
    },
    {
      title: 'Technical Tutorial Writer',
      description: 'Write clear, step-by-step technical tutorials that developers and tech readers love.',
      category: 'blog',
      price: 34.99,
      rating: 4.9,
      usageCount: 680,
      reviewCount: 24,
      createdBy: adminUser._id,
    },
    {
      title: 'LinkedIn Thought Leadership',
      description: 'Create authoritative LinkedIn posts that establish your expertise and grow your network.',
      category: 'social',
      price: 12.99,
      rating: 4.4,
      usageCount: 1560,
      reviewCount: 37,
      createdBy: adminUser._id,
    },
    {
      title: 'Cold Email Outreach',
      description: 'Write personalized cold emails that get responses and open doors to new opportunities.',
      category: 'email',
      price: 17.99,
      rating: 4.3,
      usageCount: 420,
      reviewCount: 19,
      createdBy: adminUser._id,
    },
    {
      title: 'Google Ads Copy Generator',
      description: 'Generate compelling Google Ads headlines and descriptions within character limits.',
      category: 'ad-copy',
      price: 11.99,
      rating: 4.6,
      usageCount: 1800,
      reviewCount: 45,
      createdBy: adminUser._id,
    },
  ];

  await Item.insertMany(items);

  console.log('✅ Seeding complete!');
  console.log('📧 Admin: admin@writeflow.com / 123456');
  console.log('📧 User:  user@writeflow.com / 123456');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
