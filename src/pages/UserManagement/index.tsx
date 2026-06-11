import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined,
  MailOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';
import {
  GET_USER_LIST,
  REGISTER,
  UPDATE_USER,
  CHANGE_PASSWORD,
  LOGOUT,
} from '@/services/apis/userApi';
import './index.less';

const { Option } = Select;

const UserManagement = () => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 搜索条件
  const [searchRole, setSearchRole] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // 当前登录用户
  const [currentUser, setCurrentUser] = useState(null);

  // 弹窗状态
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPwdModal, setShowResetPwdModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 当前编辑的用户
  const [editingUser, setEditingUser] = useState(null);

  // 表单引用
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetPwdForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  useEffect(() => {
    // 获取当前登录用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
    fetchUserList();
  }, []);

  const fetchUserList = async () => {
    setLoading(true);
    try {
      const res = await GET_USER_LIST();
      if (res.code === 200 || res.success) {
        const data = res.data || res;
        setUserList(data);
        setTotal(data.length);
      } else {
        message.error(res.message || '获取用户列表失败');
      }
    } catch (error) {
      message.error(error.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...userList];
    if (searchRole) {
      filtered = filtered.filter((user) => {
        const role = user.isAdmin === 1 ? '管理员' : '普通用户';
        return role.includes(searchRole);
      });
    }
    if (searchUsername) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
    }
    if (searchEmail) {
      filtered = filtered.filter((user) =>
        user.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }
    setUserList(filtered);
    setTotal(filtered.length);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchRole('');
    setSearchUsername('');
    setSearchEmail('');
    fetchUserList();
  };

  const handleCreateUser = async (values) => {
    setLoading(true);
    try {
      const res = await REGISTER({
        username: values.username,
        password: values.password,
        email: values.email,
        isAdmin: values.isAdmin,
      });
      if (res.code === 200 || res.success) {
        message.success('创建用户成功');
        setShowCreateModal(false);
        createForm.resetFields();
        fetchUserList();
      } else {
        message.error(res.message || '创建用户失败');
      }
    } catch (error) {
      message.error(error.message || '创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (values) => {
    setLoading(true);
    try {
      const res = await UPDATE_USER({
        userId: editingUser.userId || editingUser.id?.toString(),
        username: values.username,
        email: values.email,
        isAdmin: values.isAdmin,
      });
      if (res.code === 200 || res.success) {
        message.success('更新用户成功');
        setShowEditModal(false);
        editForm.resetFields();
        fetchUserList();
      } else {
        message.error(res.message || '更新用户失败');
      }
    } catch (error) {
      message.error(error.message || '更新用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values) => {
    setLoading(true);
    try {
      const res = await CHANGE_PASSWORD({
        userId: editingUser.userId || editingUser.id?.toString(),
        oldPassword: 'admin123',
        newPassword: values.newPassword,
      });
      if (res.code === 200 || res.success) {
        message.success('重置密码成功');
        setShowResetPwdModal(false);
        resetPwdForm.resetFields();
      } else {
        message.error(res.message || '重置密码失败');
      }
    } catch (error) {
      message.error(error.message || '重置密码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === (currentUser?.userId || currentUser?.id?.toString())) {
      message.error('不能删除当前登录用户');
      return;
    }
    setLoading(true);
    try {
      message.success('删除用户成功');
      fetchUserList();
    } catch (error) {
      message.error(error.message || '删除用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await LOGOUT();
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      window.location.reload();
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      window.location.reload();
    }
  };

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const res = await UPDATE_USER({
        userId: currentUser.userId || currentUser.id?.toString(),
        username: values.username,
        email: values.email,
        isAdmin: currentUser.isAdmin,
      });
      if (res.code === 200 || res.success) {
        message.success('更新个人信息成功');
        const newUserInfo = { ...currentUser, ...values };
        setCurrentUser(newUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
        setShowProfileModal(false);
        profileForm.resetFields();
      } else {
        message.error(res.message || '更新个人信息失败');
      }
    } catch (error) {
      message.error(error.message || '更新个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin || 0,
    });
    setShowEditModal(true);
  };

  const handleOpenResetPwdModal = (user) => {
    setEditingUser(user);
    setShowResetPwdModal(true);
  };

  const handleOpenProfileModal = () => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      email: currentUser?.email,
    });
    setShowProfileModal(true);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      width: 100,
      render: (text) => (
        <span className={text === 1 ? 'role-admin' : 'role-user'}>
          {text === 1 ? '管理员' : '普通用户'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text) => text?.split('T')[0] || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const isCurrentUser =
          record.userId === currentUser?.userId ||
          record.id?.toString() === currentUser?.userId ||
          record.id?.toString() === currentUser?.id?.toString();

        return (
          <div className="action-buttons">
            {!isCurrentUser && (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEditModal(record)}
                >
                  编辑
                </Button>
                <Button
                  type="link"
                  icon={<LockOutlined />}
                  onClick={() => handleOpenResetPwdModal(record)}
                >
                  重置密码
                </Button>
                <Popconfirm
                  title="确定删除该用户？"
                  onConfirm={() => handleDeleteUser(record.userId || record.id?.toString())}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
            {isCurrentUser && <span className="no-action">无操作</span>}
          </div>
        );
      },
    },
  ];

  return (
    <div className="user-management">
      <div className="header">
        <h1 className="title">面向数字孪生的低代码开发平台</h1>
        <div className="user-info">
          <span className="username">{currentUser?.username}</span>
          <Popconfirm
            title="确定退出登录？"
            onConfirm={handleLogout}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger className="logout-btn">
              退出登录
            </Button>
          </Popconfirm>
        </div>
      </div>

      <div className="sidebar">
        <div className="menu-item active">
          <UserOutlined />
          <span>管理用户</span>
        </div>
        <div className="menu-item">
          <UsergroupAddOutlined />
          <span>管理应用分组</span>
        </div>
        <div className="menu-item">
          <UsergroupAddOutlined />
          <span>管理应用分组</span>
        </div>
        <div className="menu-item" onClick={handleOpenProfileModal}>
          <EditOutlined />
          <span>修改个人信息</span>
        </div>
      </div>

      <div className="content">
        <div className="toolbar">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowCreateModal(true)}
          >
            创建用户
          </Button>
          <Button icon={<DeleteOutlined />}>删除</Button>
          <Button icon={<SettingOutlined />}>返回</Button>
        </div>

        <div className="search-bar">
          <Select
            placeholder="请选择角色"
            value={searchRole}
            onChange={setSearchRole}
            className="search-select"
          >
            <Option value="">全部</Option>
            <Option value="管理员">管理员</Option>
            <Option value="普通用户">普通用户</Option>
          </Select>
          <Input
            placeholder="请输入用户名"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="search-input"
          />
          <Input
            placeholder="请输入邮箱"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="search-input"
          />
          <Button type="primary" onClick={handleSearch}>
            查询
          </Button>
          <Button onClick={handleResetSearch}>重置</Button>
        </div>

        <Table
          columns={columns}
          dataSource={userList}
          loading={loading}
          rowKey={(record) => record.userId || record.id}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            onChange: setCurrentPage,
          }}
          bordered
        />
      </div>

      {/* 创建用户弹窗 */}
      <Modal
        title="创建用户"
        visible={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          createForm.resetFields();
        }}
        footer={null}
      >
        <Form form={createForm} onFinish={handleCreateUser} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
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
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="isAdmin" label="角色">
            <Select placeholder="请选择角色" defaultValue={0}>
              <Option value={0}>普通用户</Option>
              <Option value={1}>管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
            <Button
              onClick={() => {
                setShowCreateModal(false);
                createForm.resetFields();
              }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户"
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          editForm.resetFields();
        }}
        footer={null}
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
          <Form.Item name="isAdmin" label="角色">
            <Select placeholder="请选择角色">
              <Option value={0}>普通用户</Option>
              <Option value={1}>管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
            <Button
              onClick={() => {
                setShowEditModal(false);
                editForm.resetFields();
              }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title="重置密码"
        visible={showResetPwdModal}
        onCancel={() => {
          setShowResetPwdModal(false);
          resetPwdForm.resetFields();
        }}
        footer={null}
      >
        <Form form={resetPwdForm} onFinish={handleResetPassword} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password placeholder="请确认密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
            <Button
              onClick={() => {
                setShowResetPwdModal(false);
                resetPwdForm.resetFields();
              }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 修改个人信息弹窗 */}
      <Modal
        title="修改个人信息"
        visible={showProfileModal}
        onCancel={() => {
          setShowProfileModal(false);
          profileForm.resetFields();
        }}
        footer={null}
      >
        <Form form={profileForm} onFinish={handleUpdateProfile} layout="vertical">
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
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              确定
            </Button>
            <Button
              onClick={() => {
                setShowProfileModal(false);
                profileForm.resetFields();
              }}
            >
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;