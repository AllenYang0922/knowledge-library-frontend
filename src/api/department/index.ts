import { post, get, put } from '@/utils/request'

// 查询部门
export interface Department {
  department_id: number;
  parent_id: number | null;
  department_name: string;
  department_level: number;
  sub_department: Department[];
}

export interface GetDepartmentResponse {
  code: number;
  data: Department[];
}

export async function getDepartment(params: { department_id?: number, query_depth: number }): Promise<GetDepartmentResponse> {
  const response = await get('/api/user/v1/get/department', params);
  return response as unknown as GetDepartmentResponse;
}