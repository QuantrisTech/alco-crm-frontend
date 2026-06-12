export type LoginData = {
  email: string;
  password: string;
}

export type RegisterData = {
  name: string;
  email: string;
  password: string;
}

export type UpdateUserData = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export type UserRole = "super_admin" | "admin" | "sales_manager" | "sales_rep" | "support" | "user";

export type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export type AuthResponse = {
  success: boolean;
  token: string;
  user: User;
}

export type UsersResponse = {
  success: boolean;
  count: number;
  users: User[];
  totalPages?: any;
  total?: any;
}