import { post, get, put } from '@/utils/request'

// 查询权限
export interface Privilege {
  privilege_id: number;
  privilege: string;
}

export interface GetPermissionListResponse {
  code: number;
  data: Privilege[];
}

export async function getPermissionList(): Promise<GetPermissionListResponse> {
  const response = await get('/api/user/v1/get/privilege');
  return response as unknown as GetPermissionListResponse;
}