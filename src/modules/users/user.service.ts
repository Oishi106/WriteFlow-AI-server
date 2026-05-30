import { User } from './user.model';
import { AppError } from '../../utils/asyncHandler';
import { UserRole, UserStatus } from '../../types';

interface GetUsersOptions {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export const getAllUsers = async (options: GetUsersOptions) => {
  const { page, limit, search, role, status } = options;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (search) query.$text = { $search: search };
  if (role) query.role = role;
  if (status) query.status = status;

  const [users, total] = await Promise.all([
    User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return {
    users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const updateUser = async (id: string, data: Partial<{ name: string; bio: string; avatar: string }>) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const changeUserRole = async (id: string, role: UserRole) => {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

export const toggleUserStatus = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);

  user.status = user.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
  await user.save();
  return user;
};

export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};
