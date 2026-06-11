import React, { useState, useEffect } from 'react';
import { Button, Input, Form, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { CHANGE_PASSWORD } from '@/services/apis/userApi';
import './index.less';

const ChangePassword: React.FC = () => {
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setCurrentUser(JSON.parse(userInfo));
    }
  }, []);

  const handleChangePassword = async (values: any) => {
    setLoading(true);
    try {
      const params: any = {
        userId: currentUser?.userId?.toString() || currentUser?.id?.toString(),
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      };
      const res = await CHANGE_PASSWORD(params);
      if (res.code === 200 || res.success) {
        message.success('密码修改成功');
        form.resetFields();
      } else {
        message.error(res.message || '密码修改失败');
      }
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="content-section">
        <h3 className="section-title">修改密码</h3>
        <Form
          form={form}
          onFinish={handleChangePassword}
          layout="vertical"
        >
          <Form.Item
            name="oldPassword"
            label="旧密码"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password
              placeholder="请输入旧密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' }
            ]}
          >
            <Input.Password
              placeholder="请输入新密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>
          <Form.Item className="button-group">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ color: '#fff' }}
            >
              修改密码
            </Button>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ChangePassword;
