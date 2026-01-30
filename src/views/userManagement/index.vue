<template>
    <div class="user-management">
        <!-- 头部（借鉴 KnowledgeBaseList.vue） -->
        <div class="header">
            <div class="header-title">
                <h2>{{ $t('userManagement.title')}}</h2>
                <p class="header-subtitle">{{ $t('userManagement.description') }}</p>
            </div>
        </div>
        <div class="header-divider"></div>

        <t-table row-key="user_id" :data="userList" :columns="columns">
            <template #operation="{ row }">
                <div style="display: flex; gap: 20px;">
                    <t-link theme="primary" hover="color" @click="handleOpenUpdateUser(row)">
                        更新用户
                    </t-link>
                    <t-popconfirm content="确认删除用户吗" @confirm="handleDelete(row)">
                        <t-button theme="primary" variant="text">删除用户</t-button>
                    </t-popconfirm>
                </div>
            </template>
        </t-table>
        <!-- 新增用户弹窗 -->
        <UserEditorModal :visible="visible" :mode="editorMode" @update:visible="visible = $event" @success="fetchUserList" />
        <!-- 更新用户弹窗 -->
        <UpdateUserDialog :visible="dialogVisible" :user="updatingUser" @update:visible="dialogVisible = $event" @success="fetchUserList" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UserEditorModal from './UserEditorModal.vue'
import UpdateUserDialog from './components/UpdateUserDialog.vue'
import { getUserList, deleteUser,updateUser } from '@/api/auth'
import type { User } from '@/api/auth'
import type { TdBaseTableProps } from 'tdesign-vue-next'
import { MessagePlugin } from 'tdesign-vue-next'

const { t } = useI18n()
const visible = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const userList = ref<User[]>([])
const editingUser = ref<User | null>(null)
const fixedRightColumn = ref(true)
const dialogVisible = ref(false)
const updatingUser = ref<User | null>(null)

type Column = Exclude<TdBaseTableProps['columns'], undefined>[number];
const columns: Column[] = [
    {
        colKey: 'user_name',
        title: t('userManagement.columns.userName'),
    },
    {
        colKey: 'account',
        title: t('userManagement.columns.account'),
    },
    {
        colKey: 'department_name',
        title: t('userManagement.columns.departmentName'),
    },
    {
        colKey: 'privilege',
        title: t('userManagement.columns.privilege'),
    },
    {
        colKey: 'operation',
        title: t('userManagement.columns.operation'),
        fixed: fixedRightColumn.value ? 'right' : undefined,
        width: 200,
    },
]

const handleEdit = (user: User) => {
    editorMode.value = 'edit'
    editingUser.value = user
    visible.value = true
}

// 打开更新用户弹窗（把当前行传给弹窗）
const handleOpenUpdateUser = (user: User) => {
    updatingUser.value = user
    dialogVisible.value = true
}

// 删除用户
const handleDelete = async (user: User) => {
    try {
        const res = await deleteUser(user.user_id)
        if (res.code === 200) {
            MessagePlugin.success(t('common.deleteSuccess'))
            await fetchUserList()
        } else {
            MessagePlugin.error(t('common.deleteFailed'))
        }
    } catch (error) {
        MessagePlugin.error(t('common.deleteFailed'))
    }
}

// 获取用户列表
const fetchUserList = async () => {
    const res = await getUserList();
    if (res.code === 200) {
        userList.value = res.data;
    }
};

// 打开新增用户弹窗
const handleOpenUserEditor = (event: CustomEvent) => {
    const mode = event.detail?.mode === 'edit' ? 'edit' : 'create'
    editorMode.value = mode
    visible.value = true
}

onMounted(() => {
    window.addEventListener('openUserEditor', handleOpenUserEditor as EventListener)
    fetchUserList()
})

onUnmounted(() => {
    window.removeEventListener('openUserEditor', handleOpenUserEditor as EventListener)
})

// 打开更新用户弹窗
// const openUserEditor

// 更新用户
/* const handleUpdateUser = async (user: User) => {  
    const res = await updateUser(user.user_id, user.department_id, user.privilege_id)
    if (res.code === 200) {
        MessagePlugin.success(t('common.updateSuccess'))
        await fetchUserList()
    } else {
        MessagePlugin.error(t('common.updateFailed'))
    }
} */
</script>

<style lang="less" scoped>
.user-management {
    width: 100%;
    height: 100%;
    padding: 24px 44px;
    box-sizing: border-box;
    overflow-y: auto;
    margin: 0 20px;
    height: calc(100vh);
    flex: 1;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;

        .header-title {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        h2 {
            margin: 0;
            color: #000000e6;
            font-family: "PingFang SC";
            font-size: 24px;
            font-weight: 600;
            line-height: 32px;
        }
    }

    .header-subtitle {
        margin: 0;
        color: #00000099;
        font-family: "PingFang SC";
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
    }

    .header-divider {
        height: 1px;
        background: #e7ebf0;
        margin-bottom: 20px;
    }
}
</style>
