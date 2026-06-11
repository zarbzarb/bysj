/**
 * 发布版本弹框组件
 */
import React, { FC, useState, useEffect, useRef } from 'react';
import { Modal, Form, Input, Switch, Space, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import DarkAlgorithm from '@/common/DarkAlgorithm';
import { useStore } from '@/hooks';
import { compareVersion } from '@/utils/utils';

const { TextArea } = Input;

type IProps = {
  visible: boolean;
  appId: string;
  onClose: () => void;
};

// 自动增加 0.0.1 个版本
const autoVersion = (version: string | undefined) => {
  if (version) {
    const arr = version.split('.');
    arr[2] = String(Number(arr[2]) + 1);
    return arr.join('.');
  }
  return '0.0.1';
};

const ReleaseModal: FC<IProps> = (props) => {
  const { visible, onClose, appId } = props;
  const { versionStore } = useStore();
  const { versionList, currentVersion, releaseVersion, currentVersionDetail } = versionStore;

  const [form] = Form.useForm();

  const [initialValues, setInitialValues] = useState<any>({
    version: currentVersion === 'dev' ? autoVersion(versionList[1]?.version) : currentVersion,
    versionDescription: undefined,
    isMajorVersion: false,
  });

  useEffect(() => {
    // 编辑版本回显表单
    if (currentVersion !== 'dev') {
      const { version, isMajorVersion, versionDescription } = currentVersionDetail;
      form.setFieldsValue({
        version,
        versionDescription,
        isMajorVersion,
      });
    }
  }, []);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (versionList?.length > 1) {
          const nowMax = versionList[1].version;
          if (currentVersion === 'dev' && compareVersion(values.version, nowMax) !== 1) {
            return message.error('版本号必须高于已发布版本');
          }
        }
        if (values.isMajorVersion === undefined) values.isMajorVersion = false;
        const params = {
          ...values,
          appId,
          operationType: currentVersion === 'dev' ? 'ADD' : 'UPDATE',
        };
        // 请求版本发布接口
        releaseVersion(params, () => {
          form.resetFields();
          onClose && onClose();
        });
      })
      .catch((error) => {
        console.log('表单校验失败:', error);
      });
  };

  return (
    <DarkAlgorithm>
      <Modal
        title='发布版本'
        className='release-modal'
        getContainer={false}
        open={visible}
        onCancel={onClose}
        onOk={handleOk}
      >
        <Form form={form} layout='vertical' name='releaseForm' initialValues={initialValues}>
          <Form.Item
            name='version'
            label='版本号'
            rules={[
              { required: true, message: '请输入版本号' },
              { pattern: /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/, message: '版本号格式不对，每项最多三位数' },
            ]}
          >
            <Input
              addonBefore='V'
              placeholder='请输入版本号，格式如1.0.0, 最大版本号999.999.999'
              disabled={currentVersion && currentVersion !== 'dev'}
            />
          </Form.Item>
          <Form.Item name='versionDescription' label='版本描述'>
            <TextArea rows={4} placeholder='请输入版本描述' />
          </Form.Item>
          <Form.Item>
            <Space>
              指定为主版本
              <Form.Item name='isMajorVersion' valuePropName='checked' noStyle>
                <Switch />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
        <div style={{ marginTop: 24 }}>
          <InfoCircleOutlined /> 应用发布时仅备份存当前版本应用配置和hook，不备份媒体资源、图层、接口
        </div>
      </Modal>
    </DarkAlgorithm>
  );
};

export default ReleaseModal;
