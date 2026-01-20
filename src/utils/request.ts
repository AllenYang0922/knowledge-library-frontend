// src/utils/request.js
import axios from "axios";
import { generateRandomString } from "./index";

// API基础URL
const BASE_URL = import.meta.env.VITE_IS_DOCKER ? "" : "http://localhost:8080";


// 创建Axios实例
const instance = axios.create({
  baseURL: '', // 使用配置的API基础URL
  timeout: 30000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
    "X-Request-ID": `${generateRandomString(12)}`,
  },
});


instance.interceptors.request.use(
  (config) => {
    // 添加JWT token认证
    const token = localStorage.getItem('weknora_token');
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // 添加跨租户访问请求头（如果选择了其他租户）
    const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id');
    const defaultTenantId = localStorage.getItem('weknora_tenant');
    if (selectedTenantId) {
      try {
        const defaultTenant = defaultTenantId ? JSON.parse(defaultTenantId) : null;
        const defaultId = defaultTenant?.id ? String(defaultTenant.id) : null;
        // 如果选择的租户ID与默认租户ID不同，添加请求头
        if (selectedTenantId !== defaultId) {
          config.headers["X-Tenant-ID"] = selectedTenantId;
        }
      } catch (e) {
        console.error('Failed to parse tenant info', e);
      }
    }
    
    config.headers["X-Request-ID"] = `${generateRandomString(12)}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token刷新标志，防止多个请求同时刷新token
let hasRedirectedOn401 = false;

instance.interceptors.response.use(
  (response) => {
    console.log('response: ', response);
    // 根据业务状态码处理逻辑
    const { status, data } = response;
    if (status === 200 || status === 201) {
      return data;
    } else {
      return Promise.reject(data);
    }
  },
  async (error: any) => {
    const originalRequest = error.config;
    
    if (!error.response) {
      return Promise.reject({ message: "网络错误，请检查您的网络连接" });
    }
    
    // 如果是登录接口的401，直接返回错误以便页面展示toast，不做跳转
    if (error.response.status === 401 && originalRequest?.url?.includes('/auth/login')) {
      const { status, data } = error.response;
      const msg = typeof data === 'object' ? (data?.msg || data?.message) : data;
      return Promise.reject({ status, message: msg || '用户名或密码错误' });
    }

    // 401: 当前后端不再提供 refresh_token，直接清理登录态并跳转登录页
    if (error.response.status === 401) {
      localStorage.removeItem('weknora_token');
      localStorage.removeItem('weknora_refresh_token');
      localStorage.removeItem('weknora_user');
      localStorage.removeItem('weknora_tenant');
      localStorage.removeItem('weknora_selected_tenant_id');
      localStorage.removeItem('weknora_selected_tenant_name');

      if (!hasRedirectedOn401 && typeof window !== 'undefined') {
        hasRedirectedOn401 = true;
        window.location.href = '/login';
      }

      return Promise.reject({ status: 401, message: '请重新登录' });
    }
    
    const { status, data } = error.response;
    // 将HTTP状态码一并抛出，方便上层判断401等场景
    // 后端返回格式: { success: false, error: { code, message, details } }
    // 提取 error.message 作为顶层 message，方便前端使用 error?.message 获取
    const errorMessage = typeof data === 'object' && data?.error?.message 
      ? data.error.message 
      : (typeof data === 'object' ? (data?.msg || data?.message) : data);
    return Promise.reject({ 
      status, 
      message: errorMessage,
      ...(typeof data === 'object' ? data : {}) 
    });
  }
);

export function get(url: string) {
  return instance.get(url);
}

export async function getDown(url: string) {
  let res = await instance.get(url, {
    responseType: "blob",
  });
  return res
}

export function postUpload(url: string, data = {}, onUploadProgress?: (progressEvent: any) => void) {
  return instance.post(url, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-Request-ID": `${generateRandomString(12)}`,
    },
    onUploadProgress,
  });
}

export function postChat(url: string, data = {}) {
  return instance.post(url, data, {
    headers: {
      "Content-Type": "text/event-stream;charset=utf-8",
      "X-Request-ID": `${generateRandomString(12)}`,
    },
  });
}

export function post(url: string, data = {}, config?: any) {
  return instance.post(url, data, config);
}

export function put(url: string, data = {}) {
  return instance.put(url, data);
}

export function del(url: string, data?: any) {
  return instance.delete(url, { data });
}
