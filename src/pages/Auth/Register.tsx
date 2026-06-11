import React, { useState, useRef } from 'react';
import { Form, Input, Button, message, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styles from './index.less'; 

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sys/data/userInfo/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          email: values.email,
          nickname: values.username, // 使用用户名作为昵称
        }),
      });

      if (!response.ok) {
        message.error('注册失败，请稍后重试');
        return;
      }

      const data = await response.json();
      if (data.code === 200) {
        message.success('注册成功！请返回登录页进行登录');
        // 清空表单
        formRef.current?.resetFields();
      } else {
        message.error(data.message || '注册失败，请稍后重试');
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
        },
      }}
    >
      <div className={styles['auth-container']}>
        {/* 背景装饰光点，保持与登录页一致 */}
        <div style={{
          position: 'absolute',
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(22,119,255,0.05) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
        }} />

        <div className={styles['auth-card']}>
          <header className={styles['auth-header']}>
            <h1 className={styles['auth-title']}>CREATE ACCOUNT</h1>
            <p className={styles['auth-subtitle']}>加入数字孪生低代码平台</p>
          </header>

          <Form
            ref={formRef}
            name="register_form"
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            {/* 用户名 */}
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请设置您的开发者 ID' }]}
            >
              <Input
                prefix={<UserOutlined className={styles['auth-input-icon']} />}
                placeholder="开发者 ID / 用户名"
                className={styles['auth-input']}
              />
            </Form.Item>

            {/* 邮箱 */}
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱格式' }
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles['auth-input-icon']} />}
                placeholder="工作邮箱"
                className={styles['auth-input']}
              />
            </Form.Item>

            {/* 密码 */}
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请设置访问密钥' }]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles['auth-input-icon']} />}
                placeholder="设置访问密钥 (密码)"
                className={styles['auth-input']}
              />
            </Form.Item>

            {/* 确认密码 */}
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密钥以确认' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密钥不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles['auth-input-icon']} />}
                placeholder="重复访问密钥"
                className={styles['auth-input']}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles['auth-button']}
                loading={loading}
              >
                立即申请开发者权限
              </Button>
            </Form.Item>

            <footer className={styles['auth-footer']}>
              <Link to="/login">已有开发者账号？返回登录</Link>
            </footer>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Register;