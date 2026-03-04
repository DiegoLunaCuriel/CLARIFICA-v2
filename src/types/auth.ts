
export interface User {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passcode: string, name?: string, userType?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface UserProfile {
  id: number;
  user_id: number;
  name: string;
  user_type: 'homeowner' | 'contractor' | 'builder';
  phone?: string;
  company_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
