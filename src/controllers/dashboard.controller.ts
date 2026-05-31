import { Response } from 'express';
import { User } from '../modules/users/user.model';
import { Item } from '../models/item.model';
import { Booking } from '../modules/bookings/booking.model';
import { AILog } from '../modules/ai/aiLog.model';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/apiResponse';
import { AuthRequest } from '../types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatCategoryName = (category: string): string =>
  category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getLastSevenDays = (): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    days.push(day);
  }

  return days;
};

const getLastSixMonths = (): { key: string; label: string }[] => {
  const months: { key: string; label: string }[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: MONTH_LABELS[date.getMonth()] });
  }

  return months;
};

export const getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalItems, totalOrders, revenueResult] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),
  ]);

  return successResponse(res, 'Stats fetched', {
    totalUsers,
    totalItems,
    totalOrders,
    totalRevenue: revenueResult[0]?.total ?? 0,
  });
});

export const getChartData = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const lastSevenDays = getLastSevenDays();
  const sevenDaysAgo = lastSevenDays[0];
  const lastSixMonths = getLastSixMonths();
  const sixMonthsAgo = new Date(
    Number(lastSixMonths[0].key.split('-')[0]),
    Number(lastSixMonths[0].key.split('-')[1]) - 1,
    1
  );

  const [dailyAIUsage, monthlySignups, categoryBreakdown] = await Promise.all([
    AILog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          aiCalls: { $sum: 1 },
        },
      },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          signups: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Item.aggregate([
      { $group: { _id: '$category', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
  ]);

  const aiCallsByDate = new Map(dailyAIUsage.map((entry) => [entry._id, entry.aiCalls]));

  const barChart = lastSevenDays.map((day) => {
    const dateKey = day.toISOString().slice(0, 10);
    return {
      date: DAY_LABELS[day.getDay()],
      aiCalls: aiCallsByDate.get(dateKey) ?? 0,
    };
  });

  const signupsByMonth = new Map(monthlySignups.map((entry) => [entry._id, entry.signups]));

  const lineChart = lastSixMonths.map(({ key, label }) => ({
    date: label,
    signups: signupsByMonth.get(key) ?? 0,
  }));

  const pieChart = categoryBreakdown.map((entry) => ({
    name: formatCategoryName(entry._id),
    value: entry.value,
  }));

  return successResponse(res, 'Chart data fetched', {
    barChart,
    lineChart,
    pieChart,
  });
});
