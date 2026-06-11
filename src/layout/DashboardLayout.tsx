import React, { useState, useEffect } from 'react';
import { Dropdown, Menu } from 'antd';
import './DashboardLayout.less';
import {
  LayoutOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  LogoutOutlined,
  DownOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LOGOUT } from '@/services/apis/userApi';
import './DashboardLayout.less';

const DashboardLayout: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
  }, []);

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
    navigate('/dashboard/edit-profile');
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

  const isAdmin = currentUser?.isAdmin === 1;

  const menuItems = [
    { key: 'app-config', label: '应用配置', icon: <LayoutOutlined />, path: '/dashboard/app-config' },
    ...(isAdmin
      ? [
          { key: 'manage-users', label: '管理用户', icon: <UserOutlined />, path: '/dashboard/manage-users' },
          { key: 'manage-groups', label: '管理应用分组', icon: <UsergroupAddOutlined />, path: '/dashboard/manage-groups' },
        ]
      : []),
    { key: 'edit-profile', label: '修改个人信息', icon: <EditOutlined />, path: '/dashboard/edit-profile' },
    { key: 'change-password', label: '修改密码', icon: <EditOutlined />, path: '/dashboard/change-password' },
  ];

  const currentPath = location.pathname;

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
          {menuItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-item ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
