import React, { useState, useEffect } from 'react';
import {
  Button,
  Select,
  Input,
  Dropdown,
  Menu,
  message,
  Modal,
  Form,
} from 'antd';
import {
  LayoutOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  LogoutOutlined,
  EditOutlined,
  LockOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GET_USER_LIST, LOGOUT, UPDATE_USER } from '@/services/apis/userApi';
import './index.less';

const { Option } = Select;

interface Screen {
  id: string;
  name: string;
  status: '已配置' | '未配置';
  updateTime: string;
}

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [menuKey, setMenuKey] = useState('appConfig');
  const [screenList, setScreenList] = useState<Screen[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  const [searchCategory, setSearchCategory] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPlatform, setSearchPlatform] = useState('PC端');
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateScreenModal, setShowCreateScreenModal] = useState(false);
  
  const [profileForm] = Form.useForm();
  const [createScreenForm] = Form.useForm();

  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
    loadScreenList();
    loadUserList();
    loadGroups();
  }, []);

  const loadScreenList = () => {
    const mockScreens: Screen[] = [
      { id: '1', name: '数据大屏', status: '已配置', updateTime: '2026/3/11 14:14:43' },
      { id: '2', name: '大屏配置', status: '已配置', updateTime: '2026/3/11 21:20:57' },
      { id: '3', name: '大屏配置111', status: '已配置', updateTime: '2026/4/11 14:04:43' },
      { id: '4', name: '大屏配置', status: '已配置', updateTime: '2026/4/11 15:02:45' },
      { id: '5', name: 'aa', status: '未配置', updateTime: '2026/4/11 19:08:06' },
      { id: '6', name: '大屏配置', status: '已配置', updateTime: '2026/4/11 19:09:29' },
      { id: '7', name: 'test', status: '未配置', updateTime: '2026/4/2 15:04:42' },
      { id: '8', name: 'ttt', status: '未配置', updateTime: '2026/4/2 15:04:42' },
      { id: '9', name: '11', status: '未配置', updateTime: '2026/4/2 15:04:53' },
      { id: '10', name: 'gg', status: '未配置', updateTime: '2026/4/2 15:06:15' },
      { id: '11', name: 'gg', status: '未配置', updateTime: '2026/4/2 15:06:21' },
    ];
    setScreenList(mockScreens);
  };

  const loadUserList = async () => {
    try {
      const res = await GET_USER_LIST();
      if (res.code === 200 || res.success) {
        setUserList(res.data || res);
      }
    } catch (error) {
      console.error('加载用户列表失败', error);
    }
  };

  const loadGroups = () => {
    const mockGroups = [
      { id: '1', name: '默认分组', screenCount: 5, createTime: '2026/3/1' },
      { id: '2', name: '测试分组', screenCount: 3, createTime: '2026/3/15' },
      { id: '3', name: '生产分组', screenCount: 3, createTime: '2026/4/1' },
    ];
    setGroups(mockGroups);
  };

  const handleLogout = async () => {
    try {
      await LOGOUT();
    } catch (error) {
      console.error('退出失败', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      navigate('/login');
    }
  };

  const handleOpenProfileModal = () => {
    profileForm.setFieldsValue({
      username: currentUser?.username,
      email: currentUser?.email,
    });
    setShowProfileModal(true);
  };

  const handleUpdateProfile = async (values) => {
    try {
      const res = await UPDATE_USER({
        userId: currentUser.userId || currentUser.id?.toString(),
        username: values.username,
        email: values.email,
        isAdmin: currentUser.isAdmin,
      });
      if (res.code === 200 || res.success) {
        message.success('更新成功');
        const newUserInfo = { ...currentUser, username: values.username, email: values.email };
        setCurrentUser(newUserInfo);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
        setShowProfileModal(false);
        profileForm.resetFields();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleCreateScreen = (values) => {
    message.success('大屏创建成功');
    setShowCreateScreenModal(false);
    createScreenForm.resetFields();
    loadScreenList();
  };

  const handleEnterScreen = (screenId) => {
    navigate(`/platform?id=${screenId}&type=page`);
  };

  const isAdmin = currentUser?.isAdmin === 1;

  const renderAppConfig = () => (
    <div className="app-config-container">
      <div className="toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateScreenModal(true)}>创建大屏</Button>
        <Button icon={<DeleteOutlined />}>删除</Button>
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </div>

      <div className="search-bar">
        <Select
          placeholder="请选择分类"
          value={searchCategory}
          onChange={setSearchCategory}
          className="search-select"
        >
          <Option value="">全部</Option>
          <Option value="已配置">已配置</Option>
          <Option value="未配置">未配置</Option>
        </Select>
        <Input
          placeholder="请输入应用名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          className="search-input"
        />
        <Select value={searchPlatform} onChange={setSearchPlatform} className="search-select">
          <Option value="PC端">PC端</Option>
          <Option value="移动端">移动端</Option>
        </Select>
        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
        <Button onClick={() => { setSearchCategory(''); setSearchName(''); }}>重置</Button>
      </div>

      <div className="screen-grid">
        {screenList.map((screen) => (
          <div
            key={screen.id}
            className={`screen-card ${screen.status === '已配置' ? 'configured' : 'not-configured'}`}
            onClick={() => handleEnterScreen(screen.id)}
          >
            <div className="screen-thumbnail">
              <span className={`status-badge ${screen.status === '已配置' ? 'configured' : 'not-configured'}`}>
                {screen.status}
              </span>
            </div>
            <div className="screen-info">
              <span className="screen-name">{screen.name}</span>
              <span className="screen-time">{screen.updateTime}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <Button disabled>上一页</Button>
        <Button type="primary">1</Button>
        <Button>下一页</Button>
      </div>
    </div>
  );

  const renderManageUsers = () => (
    <div className="manage-container">
      <div className="toolbar">
        <Button type="primary" icon={<PlusOutlined />}>创建用户</Button>
        <Button icon={<DeleteOutlined />}>删除</Button>
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </div>

      <div className="search-bar">
        <Select placeholder="请选择角色" className="search-select">
          <Option value="">全部</Option>
          <Option value="admin">管理员</Option>
          <Option value="user">普通用户</Option>
        </Select>
        <Input placeholder="请输入用户名" className="search-input" />
        <Input placeholder="请输入邮箱" className="search-input" />
        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
        <Button>重置</Button>
      </div>

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
          {userList.map((user) => (
            <tr key={user.userId || user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span className={user.isAdmin === 1 ? 'role-admin' : 'role-user'}>
                  {user.isAdmin === 1 ? '管理员' : '普通用户'}
                </span>
              </td>
              <td>{user.createdAt?.split('T')[0] || '-'}</td>
              <td>
                <Button type="link" icon={<EditOutlined />}>编辑</Button>
                <Button type="link" icon={<LockOutlined />}>重置密码</Button>
                {user.userId !== currentUser?.userId && (
                  <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
                )}
                {user.userId === currentUser?.userId && <span className="no-action">无操作</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderManageGroups = () => (
    <div className="manage-container">
      <div className="toolbar">
        <Button type="primary" icon={<PlusOutlined />}>创建分组</Button>
        <Button icon={<DeleteOutlined />}>删除</Button>
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </div>

      <div className="search-bar">
        <Input placeholder="请输入分组名称" className="search-input" />
        <Button type="primary" icon={<SearchOutlined />}>查询</Button>
        <Button>重置</Button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>分组名称</th>
            <th>大屏数量</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id}>
              <td>{group.name}</td>
              <td>{group.screenCount}</td>
              <td>{group.createTime}</td>
              <td>
                <Button type="link" icon={<EditOutlined />}>编辑</Button>
                <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderEditProfile = () => (
    <div className="edit-profile-container">
      <h3>修改个人信息</h3>
      <Form form={profileForm} onFinish={handleUpdateProfile} layout="vertical">
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">保存修改</Button>
          <Button onClick={() => setMenuKey('appConfig')}>取消</Button>
        </Form.Item>
      </Form>
    </div>
  );

  const renderContent = () => {
    switch (menuKey) {
      case 'appConfig':
        return renderAppConfig();
      case 'manageUsers':
        return renderManageUsers();
      case 'manageGroups':
        return renderManageGroups();
      case 'editProfile':
        return renderEditProfile();
      default:
        return null;
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={handleOpenProfileModal}>
        <EditOutlined /> 修改个人信息
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        <LogoutOutlined /> 退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1 className="dashboard-title">面向数字孪生的低代码开发平台</h1>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <div className="user-dropdown">
            <UserOutlined />
            <span>{currentUser?.username}</span>
            <DownOutlined />
          </div>
        </Dropdown>
      </div>

      <div className="dashboard-body">
        <div className="dashboard-sidebar">
          <div
            className={`sidebar-item ${menuKey === 'appConfig' ? 'active' : ''}`}
            onClick={() => setMenuKey('appConfig')}
          >
            <LayoutOutlined />
            <span>应用配置</span>
          </div>
          
          {isAdmin && (
            <>
              <div
                className={`sidebar-item ${menuKey === 'manageUsers' ? 'active' : ''}`}
                onClick={() => setMenuKey('manageUsers')}
              >
                <UserOutlined />
                <span>管理用户</span>
              </div>
              <div
                className={`sidebar-item ${menuKey === 'manageGroups' ? 'active' : ''}`}
                onClick={() => setMenuKey('manageGroups')}
              >
                <UsergroupAddOutlined />
                <span>管理应用分组</span>
              </div>
            </>
          )}
          
          <div
            className={`sidebar-item ${menuKey === 'editProfile' ? 'active' : ''}`}
            onClick={() => setMenuKey('editProfile')}
          >
            <EditOutlined />
            <span>修改个人信息</span>
          </div>
        </div>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>

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
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确定</Button>
            <Button onClick={() => {
              setShowProfileModal(false);
              profileForm.resetFields();
            }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建大屏"
        visible={showCreateScreenModal}
        onCancel={() => {
          setShowCreateScreenModal(false);
          createScreenForm.resetFields();
        }}
        footer={null}
      >
        <Form form={createScreenForm} onFinish={handleCreateScreen} layout="vertical">
          <Form.Item
            name="name"
            label="大屏名称"
            rules={[{ required: true, message: '请输入大屏名称' }]}
          >
            <Input placeholder="请输入大屏名称" />
          </Form.Item>
          <Form.Item name="platform" label="平台类型">
            <Select defaultValue="PC端">
              <Option value="PC端">PC端</Option>
              <Option value="移动端">移动端</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确定</Button>
            <Button onClick={() => {
              setShowCreateScreenModal(false);
              createScreenForm.resetFields();
            }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;