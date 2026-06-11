import React, { useState, useEffect } from 'react';
import { Button, Select, Input, Modal, Form, message, Pagination, Tooltip } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GET_SCREEN_LIST, CREATE_SCREEN, UPDATE_SCREEN, DELETE_SCREEN } from '@/services/apis/screenApi';
import { GET_GROUP_LIST } from '@/services/apis/groupApi';
import './index.less';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  return timeStr.split('T')[0] || '-';
};

const { Option } = Select;

interface Screen {
  screenId?: string;
  id?: string;
  name: string;
  config?: string;
  createTime?: string;
  updateTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

const AppConfig: React.FC = () => {
  const navigate = useNavigate();
  const [searchCategory, setSearchCategory] = useState('');
  const [searchName, setSearchName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [screenList, setScreenList] = useState<Screen[]>([]);
  const [filteredList, setFilteredList] = useState<Screen[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groupList, setGroupList] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [editingScreen, setEditingScreen] = useState<Screen | null>(null);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setCurrentUser(user);
      loadScreenList(user);
    } else {
      loadScreenList(null);
    }
    loadGroupList();
  }, []);

  useEffect(() => {
    filterScreenList();
  }, [searchCategory, searchName, screenList]);

  const loadScreenList = async (user = currentUser) => {
    try {
      const params: any = {};
      const userId = user?.userId || user?.id;
      if (userId) {
        params.userId = userId.toString();
      }
      const res = await GET_SCREEN_LIST(params);
      if (res.code === 200 || res.success) {
        const data = res.data || [];
        setScreenList(data);
        setFilteredList(data);
      } else {
        setScreenList([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('获取大屏列表失败', error);
      setScreenList([]);
      setFilteredList([]);
    }
  };

  const loadGroupList = async () => {
    try {
      const res = await GET_GROUP_LIST();
      if (res.code === 200 || res.success) {
        const data = res.data || [];
        setGroupList(data.map((item: any) => ({
          id: item.id?.toString() || item.groupId?.toString() || '',
          name: item.name || '',
        })));
      } else {
        setGroupList([]);
      }
    } catch (error) {
      console.error('获取分组列表失败', error);
      setGroupList([]);
    }
  };

  const filterScreenList = () => {
    let filtered = [...screenList];

    if (searchCategory) {
      filtered = filtered.filter((screen) => {
        const isConfigured = screen.config && screen.config.trim() !== '';
        if (searchCategory === '已配置') return isConfigured;
        if (searchCategory === '未配置') return !isConfigured;
        return true;
      });
    }

    if (searchName) {
      filtered = filtered.filter((screen) =>
        screen.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    filterScreenList();
  };

  const handleReset = () => {
    setSearchCategory('');
    setSearchName('');
  };

  const handleEnterScreen = (screen: Screen) => {
    const screenId = screen.screenId || screen.id;
    navigate(`/platform?id=${screenId}&type=page`);
  };

  const handleCreateScreen = async (values: any) => {
    try {
      const params: any = { name: values.name };
      const userId = currentUser?.userId || currentUser?.id;
      if (userId) {
        params.userId = userId.toString();
      }
      if (values.groupId) {
        params.groupId = values.groupId;
      }
      const res = await CREATE_SCREEN(params);
      if (res.code === 200 || res.success) {
        message.success('大屏创建成功');
        setShowCreateModal(false);
        form.resetFields();
        loadScreenList(currentUser);
      } else {
        message.error(res.message || '大屏创建失败');
      }
    } catch (error) {
      message.error('大屏创建失败');
    }
  };

  const handleRefresh = () => {
    message.info('正在刷新数据...');
    setTimeout(() => {
      loadScreenList();
      message.success('数据刷新成功');
    }, 500);
  };

  const handleEditScreen = (screen: Screen) => {
    setEditingScreen(screen);
    setShowEditModal(true);
    editForm.setFieldsValue({
      name: screen.name,
      groupId: (screen as any).groupId?.toString() || undefined,
    });
  };

  const handleSaveEdit = async (values: any) => {
    try {
      if (!editingScreen) return;
      const params: any = {
        id: editingScreen.screenId || editingScreen.id,
        name: values.name,
      };
      if (values.groupId) {
        params.groupId = values.groupId;
      }
      const res = await UPDATE_SCREEN(params);
      if (res.code === 200 || res.success) {
        message.success('大屏修改成功');
        setShowEditModal(false);
        setEditingScreen(null);
        loadScreenList(currentUser);
      } else {
        message.error(res.message || '大屏修改失败');
      }
    } catch (error) {
      message.error('大屏修改失败');
    }
  };

  const handlePreviewScreen = (screen: Screen) => {
    const screenId = screen.screenId || screen.id;
    window.open(`/preview/${screenId}?type=page`, '_blank');
  };

  const handleShareScreen = async (screen: Screen) => {
    const screenId = screen.screenId || screen.id;
    try {
      const response = await fetch(`/api/datai/big-screen/share/${screenId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.shareUrl) {
          let shareUrl = data.data.shareUrl;
          shareUrl = shareUrl.replace(/https?:\/\/[^/]+/, window.location.origin);
          await navigator.clipboard.writeText(shareUrl);
          message.success('分享链接已复制到剪贴板');
        } else {
          message.error(data.message || '生成分享链接失败');
        }
      } else {
        message.error('生成分享链接失败');
      }
    } catch (error) {
      console.error('分享失败:', error);
      message.error('分享失败，请稍后重试');
    }
  };

  const handleDeleteScreen = (screen: Screen) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该大屏吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const screenId = screen.screenId || screen.id;
          const res = await DELETE_SCREEN(screenId, {});
          if (res.code === 200 || res.success) {
            message.success('大屏删除成功');
            loadScreenList(currentUser);
          } else {
            message.error(res.message || '大屏删除失败');
          }
        } catch (error) {
          message.error('大屏删除失败');
        }
      },
    });
  };

  const paginatedData = filteredList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="app-config-container">
      <div className="toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)} style={{ color: '#fff' }}>
          创建大屏
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
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
        <span className="platform-label">PC端</span>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
        <Button onClick={handleReset}>重置</Button>
      </div>

      <div className="screen-grid">
        {paginatedData.map((screen) => {
          const screenId = screen.screenId || screen.id;
          const isConfigured = screen.config && screen.config.trim() !== '';
          return (
            <div
              key={screenId}
              className={`screen-card ${isConfigured ? 'configured' : 'not-configured'}`}
            >
              <div className="screen-header">
                <span className="screen-name">{screen.name}</span>
              </div>
              <div className="screen-thumbnail">
                <span className="thumbnail-text">{isConfigured ? '已配置' : '未配置'}</span>
              </div>
              <div className="screen-info">
                <span className="screen-time">{formatTime(screen.updatedAt || screen.createdAt || screen.updateTime || screen.createTime)}</span>
              </div>
              <div className="screen-actions">
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditScreen(screen);
                    }}
                  />
                </Tooltip>
                <Tooltip title="预览">
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewScreen(screen);
                    }}
                  />
                </Tooltip>
                <Tooltip title="分享">
                  <Button
                    type="text"
                    icon={<ShareAltOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareScreen(screen);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScreen(screen);
                    }}
                  />
                </Tooltip>
                <Tooltip title="配置">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEnterScreen(screen);
                    }}
                  />
                </Tooltip>
              </div>
            </div>
          );
        })}
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
        title="创建大屏"
        visible={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={form} onFinish={handleCreateScreen} layout="vertical">
          <Form.Item
            name="name"
            label="大屏名称"
            rules={[{ required: true, message: '请输入大屏名称' }]}
          >
            <Input placeholder="请输入大屏名称" />
          </Form.Item>
          <Form.Item
            name="groupId"
            label="大屏分组"
            rules={[{ required: true, message: '请选择大屏分组' }]}
          >
            <Select placeholder="请选择大屏分组" allowClear>
              {groupList.map((group) => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ color: '#fff' }}>确定</Button>
            <Button onClick={() => {
              setShowCreateModal(false);
              form.resetFields();
            }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑大屏"
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          editForm.resetFields();
          setEditingScreen(null);
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={editForm} onFinish={handleSaveEdit} layout="vertical">
          <Form.Item
            name="name"
            label="大屏名称"
            rules={[{ required: true, message: '请输入大屏名称' }]}
          >
            <Input placeholder="请输入大屏名称" />
          </Form.Item>
          <Form.Item
            name="groupId"
            label="大屏分组"
            rules={[{ required: true, message: '请选择大屏分组' }]}
          >
            <Select placeholder="请选择大屏分组" allowClear>
              {groupList.map((group) => (
                <Option key={group.id} value={group.id}>
                  {group.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ color: '#fff' }}>确定</Button>
            <Button onClick={() => {
              setShowEditModal(false);
              editForm.resetFields();
              setEditingScreen(null);
            }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AppConfig;
