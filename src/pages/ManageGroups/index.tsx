import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Form, message, Pagination } from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { GET_GROUP_LIST, CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP } from '@/services/apis/groupApi';
import './index.less';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  return timeStr.split('T')[0] || '-';
};

interface Group {
  id?: string | number;
  name: string;
  screenCount?: number;
  createdAt?: string;
  createTime?: string;
}

const ManageGroups: React.FC = () => {
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [filteredList, setFilteredList] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
    loadGroupList();
  }, []);

  useEffect(() => {
    filterGroupList();
  }, [searchName, groupList]);

  const loadGroupList = async () => {
    try {
      const res = await GET_GROUP_LIST();
      if (res.code === 200 || res.success) {
        setGroupList(res.data || []);
        setFilteredList(res.data || []);
      } else {
        setGroupList([]);
        setFilteredList([]);
      }
    } catch (error) {
      console.error('加载分组列表失败', error);
      setGroupList([]);
      setFilteredList([]);
    }
  };

  const filterGroupList = () => {
    let filtered = [...groupList];

    if (searchName) {
      filtered = filtered.filter((group) =>
        group.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    filterGroupList();
  };

  const handleReset = () => {
    setSearchName('');
  };

  const handleCreateGroup = async (values: any) => {
    try {
      const params: any = {
        name: values.name,
        userId: currentUser?.userId?.toString() || currentUser?.id?.toString(),
      };
      const res = await CREATE_GROUP(params);
      if (res.code === 200 || res.success) {
        message.success('分组创建成功');
        setShowCreateModal(false);
        form.resetFields();
        loadGroupList();
      } else {
        message.error(res.message || '分组创建失败');
      }
    } catch (error) {
      message.error('分组创建失败');
    }
  };

  const handleEditGroup = async (values: any) => {
    try {
      const params: any = {
        id: editingGroup?.id?.toString(),
        name: values.name,
      };
      const res = await UPDATE_GROUP(params);
      if (res.code === 200 || res.success) {
        message.success('分组更新成功');
        setShowEditModal(false);
        editForm.resetFields();
        loadGroupList();
      } else {
        message.error(res.message || '分组更新失败');
      }
    } catch (error) {
      message.error('分组更新失败');
    }
  };

  const handleOpenEditModal = (group: Group) => {
    setEditingGroup(group);
    editForm.setFieldsValue(group);
    setShowEditModal(true);
  };

  const handleRefresh = () => {
    message.info('正在刷新数据...');
    setTimeout(() => {
      loadGroupList();
      message.success('数据刷新成功');
    }, 500);
  };

  const handleDeleteGroup = (group: Group) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该分组吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const params: any = {
            id: group.id?.toString(),
          };
          const res = await DELETE_GROUP(params);
          if (res.code === 200 || res.success) {
            message.success('分组删除成功');
            loadGroupList();
          } else {
            message.error(res.message || '分组删除失败');
          }
        } catch (error) {
          message.error('分组删除失败');
        }
      },
    });
  };

  const paginatedData = filteredList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="manage-groups-container">
      <div className="toolbar">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowCreateModal(true)}
          style={{ color: '#fff' }}
        >
          创建分组
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新
        </Button>
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </div>

      <div className="search-bar">
        <Input
          placeholder="请输入分组名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
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
              <th>分组名称</th>
              <th>大屏数量</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((group) => (
              <tr key={group.id}>
                <td>{group.name}</td>
                <td>{group.screenCount || 0}</td>
                <td>{formatTime(group.createdAt || group.createTime)}</td>
                <td>
                  <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenEditModal(group)}>
                    编辑
                  </Button>
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteGroup(group)}>
                    删除
                  </Button>
                </td>
              </tr>
            ))}
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
        title="创建分组"
        visible={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          form.resetFields();
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={form} onFinish={handleCreateGroup} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
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
        title="编辑分组"
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          editForm.resetFields();
        }}
        footer={null}
        wrapClassName="dashboard-wrapper-modal"
      >
        <Form form={editForm} onFinish={handleEditGroup} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" />
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

export default ManageGroups;
