import { Notification } from './notification.model';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';

const getUserNotifications = async (userId: string) => {
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  return notifications;
};

const markAsRead = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only mark your own notifications as read');
  }

  notification.isRead = true;
  await notification.save();

  return notification;
};

const markAllAsRead = async (userId: string) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { message: 'All notifications marked as read' };
};

const deleteNotification = async (id: string, userId: string) => {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId.toString() !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You can only delete your own notifications');
  }

  await Notification.findByIdAndDelete(id);
  return notification;
};

const getUnreadCount = async (userId: string) => {
  const count = await Notification.countDocuments({ userId, isRead: false });
  return { unreadCount: count };
};

export const notificationServices = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};
