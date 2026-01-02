import bcryptjs from 'bcryptjs';
import { User } from '../modules/user/user.model';
import { envVars } from '../config/env';
import { IAuthProvider, ERole, IsActive } from '../modules/user/user.interface';

export const createAdmin = async () => {
  try {
    const isAdminExist = await User.findOne({
      email: envVars.ADMIN_EMAIL,
    });

    if (isAdminExist) {
      console.log('Admin Already Exists!');
      return;
    }

    const isHashPassword = await bcryptjs.hash(
      envVars.ADMIN_PASSWORD,
      envVars.BCRYPT_SALT_ROUND
    );

    const authProvider: IAuthProvider = {
      provider: 'email',
      providerId: envVars.ADMIN_EMAIL,
    };

    const payload = {
      name: envVars.ADMIN_NAME,
      role: ERole.ADMIN,
      email: envVars.ADMIN_EMAIL,
      passwordHash: isHashPassword,
      isVerified: true,
      isActive: IsActive.ACTIVE,
      phoneNumber: '+8801791732611',
      location: 'Dhaka, Bangladesh',
      auths: [authProvider],
    };

    await User.create(payload);
    console.log('Admin created successfully!');
  } catch (error) {
    console.log('Error creating admin:', error);
  }
};
