
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';

export async function userRegisterCallback(user: {
  id: string;
  email: string;
  role: string;
  name?: string;
  userType?: string;
}): Promise<void> {
  try {
    const adminToken = await generateAdminUserToken();
    const profilesCrud = new CrudOperations("user_profiles", adminToken);

    // Create user profile record
    const profileData = {
      user_id: parseInt(user.id),
      name: user.name || user.email.split('@')[0],
      user_type: user.userType || 'homeowner',
    };

    await profilesCrud.create(profileData);
    console.log(`Created user profile for user ${user.id}`);
  } catch (error) {
    console.error('Failed to create user profile:', error);
    // Do not throw error to avoid affecting registration process
  }
}
