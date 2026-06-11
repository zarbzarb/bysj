import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, ConfigProvider, theme } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import styles from './index.less';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const navigate = useNavigate();

  // 生成 4 位随机验证码
  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptcha(code);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const onFinish = async (values: any) => {
    // 前端验证码初步校验
    if (values.captcha.toLowerCase() !== captcha.toLowerCase()) {
      message.error('验证码输入错误');
      generateCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sys/data/userInfo/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error('用户名或密码错误');
        } else {
          message.error('登录失败，请稍后重试');
        }
        generateCaptcha();
        return;
      }

      const data = await response.json();
      if (data.code === 200) {
        // 保存token到本地存储
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.data.userInfo));
        message.success('接入成功，欢迎进入数字孪生空间');
        navigate('/dashboard'); // 跳转到控制台
      } else {
        message.error(data.message || '身份验证失败，请检查密钥');
        generateCaptcha();
      }
    } catch (error) {
      message.error('网络错误，请稍后重试');
      generateCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: { colorPrimary: '#1677ff', borderRadius: 10 },
      }}
    >
      <div className={styles['auth-container']}>
        <div className={styles['auth-card']}>
          <header className={styles['auth-header']}>
            <h1 className={styles['auth-title']}>DIGITAL TWIN</h1>
            <p className={styles['auth-subtitle']}>面向数字孪生的低代码开发平台</p>
          </header>

          <Form name="login" onFinish={onFinish} layout="vertical" autoComplete="off">
            <Form.Item name="username" rules={[{ required: true, message: '请输入管理员账号' }]}>
              <Input 
                prefix={<UserOutlined className={styles['auth-input-icon']} />} 
                placeholder="用户名 / 开发者 ID" 
                className={styles['auth-input']} 
              />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入访问密钥' }]}>
              <Input.Password 
                prefix={<LockOutlined className={styles['auth-input-icon']} />} 
                placeholder="访问密钥" 
                className={styles['auth-input']} 
              />
            </Form.Item>

            <Form.Item name="captcha" rules={[{ required: true, message: '请输入验证码' }]}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Input
                  prefix={<SafetyCertificateOutlined className={styles['auth-input-icon']} />}
                  placeholder="验证码"
                  className={styles['auth-input']}
                />
                <div className={styles['captcha-box']} onClick={generateCaptcha}>
                  {captcha}
                </div>
              </div>
            </Form.Item>

            <Button type="primary" htmlType="submit" className={styles['auth-button']} loading={loading}>
              授权登录
            </Button>

            <footer className={styles['auth-footer']}>
              <Link to="/register">申请开发者访问权限</Link>
            </footer>
          </Form>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default Login;