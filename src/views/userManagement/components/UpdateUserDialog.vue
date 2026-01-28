<template>
  <t-dialog :visible="visible" header="更新用户信息" @update:visible="onDialogVisibleChange" @confirm="handleSubmit"
    @cancel="handleCancel" @close="handleCancel" :confirm-btn="{
      content: '确认',
      theme: isConfirmDisabled ? 'default' : 'primary',
      disabled: isConfirmDisabled,
    }" :cancel-btn="{
      content: '取消',
    }">
    <t-form @submit="handleSubmit">
      <t-form-item labelAlign="left">
        <template #label>
          <span class="required-star">*</span>
          <span>权限</span>
        </template>
        <t-cascader v-model="selectedPrivilege" :options="privilegeOptions" placeholder="请选择用户权限" clearable />
      </t-form-item>
      <t-form-item labelAlign="left">
        <template #label>
          <span class="required-star">*</span>
          <span>部门</span>
        </template>
        <t-cascader v-model="selectedDepartment" :options="departmentOptions" placeholder="请选择部门" clearable />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { getPermissionList } from '@/api/permission';
import { getDepartment, type Department } from '@/api/department';
import { updateUser, type User } from '@/api/auth';
import { MessagePlugin } from "tdesign-vue-next";

const props = defineProps<{
  visible: boolean;
  user?: User | null;
}>();

const emit = defineEmits(['update:visible', 'success']);

interface PrivilegeOption {
  label: string;
  value: number;
}
interface DepartmentOption {
  label: string;
  value: number;
  children?: DepartmentOption[];
}

// 权限选项
const selectedPrivilege = ref<number>();
const privilegeOptions = ref<PrivilegeOption[]>([]);
// 部门选项
const selectedDepartment = ref<number>();
const departmentOptions = ref<DepartmentOption[]>([]);

// 确认按钮是否禁用（权限或部门未选择时禁用）
const isConfirmDisabled = computed(() => {
  return !selectedPrivilege.value || !selectedDepartment.value;
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
    const response: any = await getDepartment({ department_id: 1, query_depth: 0 });
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
    }
  }
);

const onDialogVisibleChange = (val: boolean) => {
  emit('update:visible', val);
};

const resetSelections = () => {
  selectedPrivilege.value = undefined;
  selectedDepartment.value = undefined;
};

const handleCancel = () => {
  resetSelections();
  emit('update:visible', false);
};

const handleSubmit = async () => {
  const res = await updateUser(props.user?.user_id || '', selectedDepartment.value as number, selectedPrivilege.value as number);
  if (res.code === 200) {
    MessagePlugin.success('更新用户成功');
    emit('update:visible', false);
    emit('success');
    resetSelections();
  } else {
    MessagePlugin.error('更新用户失败');
    resetSelections();
  }
};
</script>

<style scoped lang="less">
.t-form-item {
  .t-form-item__label {
    text-align: left;
    width: 80px;
  }
}

.required-star {
  color: #e34d59;
  margin-right: 4px;
  font-family: SimSun, serif;
}
</style>