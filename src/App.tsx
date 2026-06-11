import React, { useEffect, useState } from 'react';
import { ConfigProvider } from 'antd';
import { Provider } from 'mobx-react';
import dayjs from 'dayjs';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import './App.less';
import '@/styles/edit.less';
import '@/styles/index.less';
import '@yl/datai-visual-component-library/es/css/dataiDesign.css';
import 'dayjs/locale/zh-cn';
import { clearShareSessionStorage } from '@/utils/BrowserUtils';
import { initial } from '@/utils/GlobalVariable';
import DUI, { getStoresContext } from '@yl/datai-ui';
import EventEmitter from '@/utils/eventBus';
import zhCN from 'antd/locale/zh_CN';
import Platform from './pages/Platform';
import Preview from './pages/Preview';
import { Login, Register } from './pages/Auth';
import DashboardLayout from './layout/DashboardLayout';
import AppConfig from './pages/AppConfig';
import ManageUsers from './pages/ManageUsers';
import ManageGroups from './pages/ManageGroups';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import { Store as stores, storeContext } from './store/index';
import '@/common/Command/index';

dayjs.locale('zh-cn');

getStoresContext(storeContext as any);

window.DUI = DUI;
window.dataqUi = DUI;
Object.keys(window.DUI).forEach((c) => {
  window[c] = window.DUI[c];
});

const checkAuth = () => {
  const token = localStorage.getItem('token');
  const userInfo = localStorage.getItem('userInfo');
  return !!(token && userInfo);
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!checkAuth()) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const isPreviewPath = location.pathname.startsWith('/preview/');

  useEffect(() => {
    if (sessionStorage.share && !isPreviewPath) {
      clearShareSessionStorage();
      window.location.href = '/';
    }
    window.globalEventEmitter = EventEmitter;
    initial();
  }, [isPreviewPath]);

  return (
    <Provider {...stores}>
      <ConfigProvider locale={zhCN}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="app-config" />} />
            <Route path="app-config" element={<AppConfig />} />
            <Route path="manage-users" element={<ManageUsers />} />
            <Route path="manage-groups" element={<ManageGroups />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
          <Route
            path="/platform"
            element={
              <ProtectedRoute>
                <Platform />
              </ProtectedRoute>
            }
          />
          <Route path="/preview/:screenId" element={<Preview />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </ConfigProvider>
    </Provider>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;