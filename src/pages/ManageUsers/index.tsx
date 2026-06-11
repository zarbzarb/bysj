import React, { useState, useEffect } from 'react';
import { Button, Select, Input, Modal, Form, message, Pagination } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  EditOutlined,
  LockOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { GET_USER_LIST, UPDATE_USER, DELETE_USER, RESET_PASSWORD, REGISTER } from '@/services/apis/userApi';
import './index.less';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  return timeStr.split('T')[0] || '-';
};

const { Option } = Select;

interface User {
  userId?: string | number;
  id?: string | number;
  username: string;
  email: string;
  isAdmin?: number;
  createdAt?: string;
  createdTime?: string;
}

const ManageUsers: React.FC = () => {
  const [userList, setUserList] = useState<User[]>([]);
  const [filteredList, setFilteredList] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchRole, setSearchRole] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
    loadUserList();
  }, []);

  useEffect(() => {
    filterUserList();
  }, [searchRole, searchName, searchEmail, userList]);

  const loadUserList = async () => {
    try {
      const res = await GET_USER_LIST();
      if (res.code === 200 || res.success) {
        setUserList(res.data || []);
        setFilteredList(res.data || []);
      } else {
        setUserList([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('加载用户列表失败', error);
      setUserList([]);
      setFilteredList([]);
    }
  };

  const filterUserList = () => {
    let filtered = [...userList];

    if (searchRole) {
      const isAdmin = searchRole === 'admin' ? 1 : 0;
      filtered = filtered.filter((user) => user.isAdmin === isAdmin);
    }

    if (searchName) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (searchEmail) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    filterUserList();
  };

  const handleReset = () => {
    setSearchRole('');
    setSearchName('');
    setSearchEmail('');
  };

  const handleCreateUser = async (values: any) => {
    try {
      const params: any = {
        username: values.username,
        email: values.email,
        password: values.password,
        isAdmin: values.isAdmin,
      };
      const res = await REGISTER(params);
      if (res.code === 200 || res.success) {
        message.success('用户创建成功');
        setShowCreateModal(false);
        form.resetFields();
        loadUserList();
      } else {
        message.error(res.message || '用户创建失败');
      }
    } catch (error) {
      message.error('用户创建失败');
    }
  };

  const handleEditUser = async (values: any) => {
    try {
      const params: any = {
        userId: editingUser?.userId?.toString() || editingUser?.id?.toString(),
        username: values.username,
        email: values.email,
        isAdmin: values.isAdmin,
      };
      const res = await UPDATE_USER(params);
      if (res.code === 200 || res.success) {
        message.success('用户信息修改成功');
        setShowEditModal(false);
        editForm.resetFields();
        loadUserList();
      } else {
        message.error(res.message || '用户信息修改失败');
      }
    } catch (error) {
      message.error('用户信息修改失败');
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue(user);
    setShowEditModal(true);
  };

  const handleResetPassword = async (user: User) => {
    try {
      const params: any = {
        userId: user.userId?.toString() || user.id?.toString(),
        newPassword: '123456',
      };
      const res = await RESET_PASSWORD(params);
      if (res.code === 200 || res.success) {
        message.success('密码重置成功，新密码为123456');
      } else {
        message.error(res.message || '密码重置失败');
      }
    } catch (error) {
      message.error('密码重置失败');
    }
  };

  const handleRefresh = () => {
    message.info('正在刷新数据...');
    setTimeout(() => {
      loadUserList();
      message.success('数据刷新成功');
    }, 500);
  };

  const handleDeleteUser = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该用户吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const params: any = {
            userId: user.userId?.toString() || user.id?.toString(),
          };
          const res = await DELETE_USER(params);
          if (res.code === 200 || res.success) {
            message.success('用户删除成功');
            loadUserList();
          } else {
            message.error(res.message || '用户删除失败');
          }
        } catch (error) {
          message.error('用户删除失败');
        }
      },
    });
  };

  const paginatedData = filteredList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="manage-users-container">
      <div className="toolbar">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowCreateModal(true)}
          style={{ color: '#fff' }}
        >
          创建用户
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </div>

      <div className="search-bar">
        <Select
          placeholder="请选择角色"
          value={searchRole}
          onChange={setSearchRole}
          className="search-select"
        >
          <Option value="">全部</Option>
          <Option value="admin">管理员</Option>
          <Option value="user">普通用户</Option>
        </Select>
        <Input
          placeholder="请输入用户名"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="search-input"
        />
        <Input
          placeholder="请输入邮箱"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="search-input"
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((user) => {
              const userId = user.userId || user.id;
              const isCurrentUser = userId === currentUser?.userId || userId === currentUser?.id;
              const isAdminUser = user.isAdmin === 1;
              return (
                <tr key={userId}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${isAdminUser ? 'admin' : 'user'}`}>
                      {isAdminUser ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td>{formatTime(user.createdAt || user.createdTime)}</td>
                  <td>
                    {isAdminUser ? (
                      <span className="no-action">无</span>
                    ) : (
                      <>
                        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenEditModal(user)}>
                          编辑
                        </Button>
                        <Button type="link" icon={<LockOutlined />} onClick={() => handleResetPassword(user)}>
                          重置密码
                        </Button>
                        {!isCurrentUser && (
                          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteUser(user)}>
                            删除
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredList.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>

      <Modal
        title="创建用户"
        visible={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={form} onFinish={handleCreateUser} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item
            name="isAdmin"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value={0}>普通用户</Option>
              <Option value={1}>管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item className="button-group">
            <Button type="primary" htmlType="submit" style={{ color: '#fff' }}>
              确定
            </Button>
            <Button onClick={() => {
              setShowCreateModal(false);
              form.resetFields();
            }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          editForm.resetFields();
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={editForm} onFinish={handleEditUser} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="isAdmin"
            label="角色"
          >
            <Select placeholder="请选择角色">
              <Option value={0}>普通用户</Option>
              <Option value={1}>管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item className="button-group">
            <Button type="primary" htmlType="submit" style={{ color: '#fff' }}>
              确定
            </Button>
            <Button onClick={() => {
              setShowEditModal(false);
              editForm.resetFields();
            }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      
    </div>
  );
};

export default ManageUsers;
