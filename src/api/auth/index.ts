import { post, get, put } from '@/utils/request'

export interface User {
  account: string;
  department_name: string;
  privilege: string;
  user_id: string;
  user_name: string;
}

interface UserListResponse {
  code: number;
  data: User[];
}

// 用户登录接口
export interface LoginRequest {
  account: string
  user_password: string
}

export interface LoginResponse {
  code: number
  msg: string
  data: {
    user_id: string
    account: string
    user_name?: string
    department_name?: string
    privilege?: string
  }
  access_token?: string
}

// 用户注册接口
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface RegisterResponse {
  success: boolean
  message?: string
  data?: {
    user: {
      id: string
      username: string
      email: string
    }
    tenant: {
      id: string
      name: string
      api_key: string
    }
  }
}

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  tenant_id: string
  can_access_all_tenants?: boolean
  created_at: string
  updated_at: string
}

// 租户信息接口
export interface TenantInfo {
  id: string
  name: string
  description?: string
  api_key: string
  status?: string
  business?: string
  owner_id: string
  storage_quota?: number
  storage_used?: number
  created_at: string
  updated_at: string
  knowledge_bases?: KnowledgeBaseInfo[]
}

// 知识库信息接口
export interface KnowledgeBaseInfo {
  id: string
  name: string
  description: string
  tenant_id: string
  created_at: string
  updated_at: string
  document_count?: number
  chunk_count?: number
}

// 模型信息接口
export interface ModelInfo {
  id: string
  name: string
  type: string
  source: string
  description?: string
  is_default?: boolean
  created_at: string
  updated_at: string
}

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await post('/api/user/v1/login', data)
  return response as unknown as LoginResponse
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await post('/api/v1/auth/register', data)
    return response as unknown as RegisterResponse
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '注册失败'
    }
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{ success: boolean; data?: { user: UserInfo; tenant: TenantInfo }; message?: string }> {
  try {
    const response = await get('/api/v1/auth/me')
    return response as unknown as { success: boolean; data?: { user: UserInfo; tenant: TenantInfo }; message?: string }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '获取用户信息失败'
    }
  }
}

/**
 * 获取当前租户信息
 */
export async function getCurrentTenant(): Promise<{ success: boolean; data?: TenantInfo; message?: string }> {
  try {
    const response = await get('/api/v1/auth/tenant')
    return response as unknown as { success: boolean; data?: TenantInfo; message?: string }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '获取租户信息失败'
    }
  }
}

/**
 * 刷新Token
 */
export async function refreshToken(refreshToken: string): Promise<{ success: boolean; data?: { token: string; refreshToken: string }; message?: string }> {
  try {
    const response: any = await post('/api/v1/auth/refresh', { refreshToken })
    if (response && response.success) {
      if (response.access_token || response.refresh_token) {
        return {
          success: true,
          data: {
            token: response.access_token,
            refreshToken: response.refresh_token,
          }
        }
      }
    }

    // 其他情况直接返回原始消息
    return {
      success: false,
      message: response?.message || '刷新Token失败'
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '刷新Token失败'
    }
  }
}

/**
 * 用户登出
 */
export async function logout(): Promise<{ success: boolean; message?: string }> {
  // try {
  const response = await post('/api/user/v1/logout', {})
  return response as unknown as { success: boolean; message?: string }
}

/**
 * 验证Token有效性
 */
export async function validateToken(): Promise<{ success: boolean; valid?: boolean; message?: string }> {
  try {
    const response = await get('/api/v1/auth/validate')
    return response as unknown as { success: boolean; valid?: boolean; message?: string }
  } catch (error: any) {
    return {
      success: false,
      valid: false,
      message: error.message || 'Token验证失败'
    }
  }
}

// 用户管理模块
// 获取用户列表
export async function getUserList(): Promise<UserListResponse> {
  try {
    const response = await get('/api/user/v1/get/user');
    return response as unknown as UserListResponse;
  } catch (error: any) {
    throw new Error(error.message || '获取用户列表失败');
  }
}

// 删除用户
export async function deleteUser(userId: string): Promise<{ code: number; msg: string }> {
  try {
    const response = await post('/api/user/v1/del/user', { user_id: userId });
    return response as unknown as { code: number; msg: string };
  } catch (error: any) {
    throw new Error(error.message || '删除用户失败');
  }
}

// 更新用户
export async function updateUser(
  user_id: string,
  department_id: number,
  privilege_id: number
): Promise<{ code: number; msg: string }> {
  try {
    const response = await post('/api/user/v1/update/user', {
      user_id,
      department_id,
      privilege_id
    });
    return response as unknown as { code: number; msg: string };
  } catch (error: any) {
    throw new Error(error.message || '更新用户失败');
  }
}

