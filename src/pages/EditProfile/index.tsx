import React, { useState, useEffect } from 'react';
import { Button, Input, Form, message } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { UPDATE_USER } from '@/services/apis/userApi';
import './index.less';

const EditProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setCurrentUser(user);
      form.setFieldsValue(user);
    }
  }, []);

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const params: any = {
        userId: currentUser?.userId?.toString() || currentUser?.id?.toString(),
        username: values.username,
        email: values.email,
        isAdmin: currentUser?.isAdmin,
      };
      const res = await UPDATE_USER(params);
      if (res.code === 200 || res.success) {
        message.success('个人信息修改成功');
        const updatedUser = { ...currentUser, username: values.username, email: values.email };
        setCurrentUser(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      } else {
        message.error(res.message || '个人信息修改失败');
      }
    } catch (error) {
      message.error('个人信息修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="content-section">
        <h3 className="section-title">修改个人信息</h3>
        <Form
          form={form}
          onFinish={handleUpdateProfile}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              placeholder="请输入用户名"
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input
              placeholder="请输入邮箱"
              prefix={<MailOutlined />}
            />
          </Form.Item>
          <Form.Item className="button-group">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ color: '#fff' }}
            >
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default EditProfile;
