import { Contact } from './contact.model';
import { IContact } from './contact.interface';
import AppError from '../../errorHelpers/AppError';
import { StatusCodes as httpStatus } from 'http-status-codes';
import { QueryBuilder } from '../../utils/QueryBuilder';

const ContactSearchableFields = ['name', 'email', 'subject', 'message'];

const createContact = async (payload: Partial<IContact>) => {
  const contact = await Contact.create(payload);
  return contact;
};

const getAllContacts = async (query: Record<string, string>) => {
  const contactQuery = new QueryBuilder(Contact.find(), query)
    .search(ContactSearchableFields)
    .filter()
    .sort()
    .paginate();

  const count = await Contact.countDocuments({ isRead: false });
  const countRead = await Contact.countDocuments({ isRead: true });

  const [data, meta] = await Promise.all([
    contactQuery.build().exec(),
    contactQuery.getMeta(),
  ]);

  return {
    contacts: data,
    pagination: { ...meta, unRead: count, read: countRead },
  };
};

const getContactById = async (id: string) => {
  const contact = await Contact.findById(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  return contact;
};

const markAsRead = async (id: string) => {
  const contact = await Contact.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  return contact;
};

const deleteContact = async (id: string) => {
  const contact = await Contact.findByIdAndDelete(id);

  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contact message not found');
  }

  return contact;
};



export const contactServices = {
  createContact,
  getAllContacts,
  getContactById,
  markAsRead,
  deleteContact
};
