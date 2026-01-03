import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { contactServices } from './contact.service';

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await contactServices.createContact(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Contact message sent successfully',
    data: result,
  });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const result = await contactServices.getAllContacts(req.query as any);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact messages retrieved successfully',
    data: result.contacts,
    meta: result.pagination,
  });
});

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await contactServices.getContactById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact message retrieved successfully',
    data: result,
  });
});

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await contactServices.markAsRead(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact message marked as read',
    data: result,
  });
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await contactServices.deleteContact(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Contact message deleted successfully',
    data: null,
  });
});


export const contactController = {
  createContact,
  getAllContacts,
  getContactById,
  markAsRead,
  deleteContact
};
