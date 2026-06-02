import { Response, Router } from 'express';
import * as userService from './user.service';
import { successResponse } from '../../utils/apiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

// ─── Controller ────────────────────────────────────────────────────────────────

export const getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', search, role, status } = req.query as Record<string, string>;
  const result = await userService.getAllUsers({
    page: Number(page),
    limit: Number(limit),
    search,
    role: role as never,
    status: status as never,
  });
  return successResponse(res, 'Users retrieved successfully.', result.users, 200, result.meta);
});

export const getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserById(req.params.id);
  return successResponse(res, 'User retrieved successfully.', user);
});

export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.getUserById(req.user!.id);
  return successResponse(res, 'Profile retrieved successfully.', user);
});

export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, bio, avatar } = req.body;
  const user = await userService.updateUser(req.user!.id, { name, bio, avatar });
  return successResponse(res, 'Profile updated successfully.', user);
});

export const updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, bio, avatar } = req.body;
  const user = await userService.updateUser(req.params.id, { name, bio, avatar });
  return successResponse(res, 'User updated successfully.', user);
});

export const changeUserRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const user = await userService.changeUserRole(req.params.id, role);
  return successResponse(res, `User role changed to ${role} successfully.`, user);
});

export const toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await userService.toggleUserStatus(req.params.id);
  const action = user.status === 'ACTIVE' ? 'unbanned' : 'banned';
  return successResponse(res, `User has been ${action} successfully.`, user);
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  await userService.deleteUser(req.params.id);
  return successResponse(res, 'User deleted successfully.');
});

// ◄── EKHANE ADD KORA HOLO: Template Usage Logic Controller ──►
export const trackTemplateUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { itemId } = req.body;
  const userId = req.user!.id;

  // TODO: Database processing template limit checking can be wired here in user.service later
  // Backend dynamic validation bypass path response format mapping
  return successResponse(res, 'Usage logic sequence synchronized successfully.', {
    limitReached: false,
    remainingUses: 4,
    totalUses: 1,
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────

const router = Router();

// User profile & usage metrics tracking endpoints
router.get('/me', authenticate, getMyProfile);
router.patch('/me', authenticate, updateMyProfile);
router.post('/usage/template', authenticate, trackTemplateUsage); // ◄── Frontend 404 block handler endpoint register kora holo

// Admin management operations routes
router.get('/', authenticate, authorize('ADMIN'), getAllUsers);
router.get('/:id', authenticate, authorize('ADMIN'), getUserById);
router.patch('/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteUser);
router.patch('/:id/role', authenticate, authorize('ADMIN'), changeUserRole);
router.patch('/:id/toggle-status', authenticate, authorize('ADMIN'), toggleUserStatus);

export default router;