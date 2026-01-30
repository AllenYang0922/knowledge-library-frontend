<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="handleClose">
        <div class="settings-modal">
          <!-- 关闭按钮 -->
          <button class="close-btn" @click="handleClose" :aria-label="$t('common.close')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 内容区域 -->
          <div class="settings-container">
            <!-- 左侧导航 -->
            <div class="settings-sidebar">
              <div class="sidebar-header">
                <h2 class="sidebar-title">新建用户</h2>
              </div>
              <div class="settings-nav">
                <div 
                  v-for="(item, index) in navItems" 
                  :key="index"
                  :class="['nav-item', { 'active': currentSection === item.key }]"
                  @click="currentSection = item.key"
                >
                  <t-icon :name="item.icon" class="nav-icon" />
                  <span class="nav-label">{{ item.label }}</span>
                </div>
              </div>
            </div>

            <!-- 右侧内容区域 -->
            <div class="settings-content">
              <div class="content-wrapper">
                <!-- 增加单个用户 -->
                <div v-show="currentSection === 'single'" class="section">
                  <div class="section-content">
                    <div class="section-header">
                      <h3 class="section-title">增加单个用户</h3>
                      <p class="section-desc">填写用户的基本信息，包括账户、用户名、密码、权限和部门</p>
                    </div>
                    <div class="section-body">
                      <div class="form-wrapper">
                        <t-form @submit="handleSubmit" :data="formData">
                          <div class="form-item">
                            <label class="form-label required">账户</label>
                            <t-input v-model="formData.account" placeholder="请输入账户" clearable />
                          </div>
                          <div class="form-item">
                            <label class="form-label required">用户名</label>
                            <t-input v-model="formData.user_name" placeholder="请输入用户名" clearable />
                          </div>
                          <div class="form-item">
                            <label class="form-label required">密码</label>
                            <t-input v-model="formData.user_password" type="password" placeholder="请输入密码" clearable />
                          </div>
                          <div class="form-item">
                            <label class="form-label required">权限</label>
                            <t-cascader v-model="selectedPrivilege" :options="privilegeOptions" placeholder="请选择用户权限" clearable />
                          </div>
                          <div class="form-item">
                            <label class="form-label required">部门</label>
                            <t-cascader v-model="selectedDepartment" :options="departmentOptions" placeholder="请选择部门" clearable
                              check-strictly value-type="single" />
                          </div>
                          <div class="form-item">
                            <t-space>
                              <t-button theme="primary" type="submit" :disabled="isSubmitDisabled">提交</t-button>
                              <t-button theme="default" @click="handleReset">重置</t-button>
                            </t-space>
                          </div>
                        </t-form>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 批量增加用户 -->
                <div v-show="currentSection === 'batch'" class="section">
                  <div class="section-content">
                    <div class="section-header">
                      <h3 class="section-title">批量增加用户</h3>
                      <p class="section-desc">通过上传 Excel 文件批量导入用户信息</p>
                    </div>
                    <div class="section-body">
                      <div class="form-wrapper">
                        <t-form>
                          <div class="form-item">
                            <label class="form-label required">上传文件</label>
                            <t-upload
                              v-model="batchFileList"
                              :request-method="handleUpload"
                              accept=".xlsx,.xls"
                              :max="1"
                              theme="file-input"
                              placeholder="请选择 Excel 文件"
                            >
                              <template #file-list-display="{ files }">
                                <div v-if="files && files.length > 0" class="file-list">
                                  <div v-for="(file, index) in files" :key="index" class="file-item">
                                    <t-icon name="file-excel" />
                                    <span class="file-name">{{ file.name }}</span>
                                  </div>
                                </div>
                              </template>
                            </t-upload>
                            <p class="form-tip">支持 .xlsx 和 .xls 格式的 Excel 文件</p>
                          </div>
                          <div class="form-item">
                            <t-space>
                              <t-button theme="primary" @click="handleBatchSubmit" :disabled="!batchFileList || batchFileList.length === 0">提交</t-button>
                              <t-button theme="default" @click="handleBatchReset">重置</t-button>
                            </t-space>
                          </div>
                        </t-form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPermissionList } from '@/api/permission';
import { getDepartment, type Department } from '@/api/department';
import { addUser } from '@/api/auth';
import { MessagePlugin } from "tdesign-vue-next";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  mode?: 'create' | 'edit';
}>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

interface PrivilegeOption {
  label: string;
  value: number;
}
interface DepartmentOption {
  label: string;
  value: number;
  children?: DepartmentOption[];
}

// 当前选中的导航项
const currentSection = ref<string>('single');

// 导航项配置
const navItems = [
  { key: 'single', icon: 'user-add', label: '增加单个用户' },
  { key: 'batch', icon: 'upload', label: '批量增加用户' }
];

// 表单数据
const formData = ref({
  account: '',
  user_name: '',
  user_password: '',
});

// 批量上传文件列表
const batchFileList = ref<any[]>([]);

// 权限选项
const selectedPrivilege = ref<number>();
const privilegeOptions = ref<PrivilegeOption[]>([]);
// 部门选项
const selectedDepartment = ref<number>();
const departmentOptions = ref<DepartmentOption[]>([]);

// 提交按钮是否禁用（必填项未填写时禁用）
const isSubmitDisabled = computed(() => {
  return !formData.value.account || 
         !formData.value.user_name || 
         !formData.value.user_password || 
         !selectedPrivilege.value || 
         !selectedDepartment.value;
});

// 获取权限
const fetchPrivileges = async () => {
  try {
    const response = await getPermissionList();
    if (response.code === 200) {
      privilegeOptions.value = response.data.map((item: any) => ({
        label: item.privilege,
        value: item.privilege_id,
      }));
    }
  } catch (error) {
    console.error('获取权限列表失败:', error);
  }
};

// 后端返回结构为 Department[]，下级字段为 sub_department（递归）
const departmentsToOptions = (departments: Department[] | undefined | null): DepartmentOption[] => {
  return (departments ?? [])
    .filter((d): d is Department => !!d && typeof d === 'object')
    .map((d) => {
      const children = departmentsToOptions(d.sub_department);
      return {
        label: d.department_name,
        value: d.department_id,
        children: children.length ? children : undefined,
      };
    })
    .filter((opt) => opt.value && opt.label);
};

// 获取部门
const fetchDepartments = async () => {
  try {
    const response: any = await getDepartment({ query_depth: 0 });
    if (response?.code === 200) {
      departmentOptions.value = departmentsToOptions(response.data);
    }
  } catch (error) {
    console.error('获取部门列表失败:', error);
  }
};

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fetchPrivileges();
      fetchDepartments();
      // 重置到第一个导航项
      currentSection.value = 'single';
    } else {
      // 关闭时重置表单
      handleReset();
      handleBatchReset();
    }
  }
);

const handleClose = () => {
  emit('update:visible', false);
};

const handleReset = () => {
  formData.value = {
    account: '',
    user_name: '',
    user_password: '',
  };
  selectedPrivilege.value = undefined;
  selectedDepartment.value = undefined;
};

const handleSubmit = async () => {
  if (isSubmitDisabled.value) {
    MessagePlugin.warning('请填写所有必填项');
    return;
  }

  try {
    const res = await addUser(
      formData.value.account,
      formData.value.user_name,
      formData.value.user_password,
      selectedDepartment.value as number,
      selectedPrivilege.value as number
    );
    
    if (res.code === 200) {
      MessagePlugin.success('添加用户成功');
      emit('update:visible', false);
      emit('success');
      handleReset();
    } else {
      MessagePlugin.error(res.data || '添加用户失败');
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '添加用户失败');
  }
};

// 批量上传处理
const handleUpload = async (file: File) => {
  // 这里可以添加文件上传逻辑
  // 暂时只是将文件添加到列表
  return {
    url: URL.createObjectURL(file),
    name: file.name,
    size: file.size
  };
};

// 批量提交
const handleBatchSubmit = async () => {
  if (!batchFileList.value || batchFileList.value.length === 0) {
    MessagePlugin.warning('请先上传 Excel 文件');
    return;
  }

  // TODO: 实现批量导入用户的逻辑
  MessagePlugin.info('批量导入功能开发中...');
};

// 批量重置
const handleBatchReset = () => {
  batchFileList.value = [];
};
</script>

<style scoped lang="less">
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.settings-modal {
  position: relative;
  width: 90vw;
  max-width: 1100px;
  height: 85vh;
  max-height: 750px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: #e5e5e5;
    color: #000;
  }
}

.settings-container {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  background: #fafafa;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.sidebar-title {
  margin: 0;
  font-family: "PingFang SC";
  font-size: 18px;
  font-weight: 600;
  color: #000000e6;
}

.settings-nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "PingFang SC";
  font-size: 14px;
  color: #00000099;

  &:hover {
    background: #f0f0f0;
  }

  &.active {
    background: #07c05f1a;
    color: #07c05f;
    font-weight: 500;
  }
}

.nav-icon {
  margin-right: 8px;
  font-size: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-label {
  flex: 1;
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-content {
  .section-header {
    margin-bottom: 20px;
  }

  .section-title {
    margin: 0 0 8px 0;
    font-family: "PingFang SC";
    font-size: 16px;
    font-weight: 600;
    color: #000000e6;
  }

  .section-desc {
    margin: 0;
    font-family: "PingFang SC";
    font-size: 14px;
    color: #00000099;
    line-height: 22px;
  }

  .section-body {
    background: #fff;

    .form-wrapper {
      max-width: 600px;
    }
  }
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-family: "PingFang SC";
  font-size: 14px;
  font-weight: 500;
  color: #000000e6;

  &.required::after {
    content: '*';
    color: #FA5151;
    margin-left: 4px;
  }
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #00000066;
}

.file-list {
  margin-top: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-name {
  font-size: 14px;
  color: #000000e6;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .settings-modal {
    transform: scale(0.95);
  }
}
</style>
