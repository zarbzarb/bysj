import React, { useState } from 'react';
import { Col, Row, Input, Modal, Button, message } from 'antd';
import { useStore } from '@/hooks';
import { PlusOutlined } from '@ant-design/icons';
import FileImg from '@/pages/Platform/ImageEdit/images/file.png';

const FontUpload = (props) => {
  const { ossStore } = useStore();
  const { font, styles, success, onChange } = props;
  const [fontName, setFontName] = useState(font.fontName);
  const [fontUrl, setFontUrl] = useState(font.fontUrl);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClickUpload, setIsClickUpload] = useState(false);

  const handleImageChange = (e) => {
    if (!fontName) {
      return message.warning('请输入字体名称才能上传字体!');
    }
    const file = e.target.files[0];
    ossStore
      .uploadFont(file, fontName)
      .then((result) => {
        console.log('上传成功', result);
        setFontUrl(result.url);
        success(result);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onFontNameChange = (evt) => {
    const trimmedValue = evt.target.value.trim();
    setFontName(trimmedValue);

    // 同步修改tab上的名称
    font.fontName = trimmedValue;
    onChange(font);
  };

  // 校验字体是否重名
  const verifyName = () => {
    if (window.fontFamilyList.some((f) => f.label === fontName)) {
      message.warning('字体名称重复!');
      return false;
    }
    return true;
  };

  return (
    <>
      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>字体名称</div>
        <div className='yl-comp-field-content row'>
          <Input
            placeholder='请输入字体名称'
            disabled={Boolean(font.fontUrl)}
            value={fontName}
            onChange={onFontNameChange}
          />
        </div>
      </div>

      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>字体文件</div>
        <div className='yl-comp-field-content row' />
      </div>

      <div className='yl-comp-text-field'>
        <div className='yl-comp-field-label'>
          <a
            onClick={(e) => {
              e.preventDefault();
              if (font.fontUrl || verifyName()) {
                setIsClickUpload(false);
                showModal();
              }
            }}
          >
            免责声明
          </a>
        </div>
        <div className='yl-comp-field-content row'>
          <div
            style={{
              width: '192px',
              height: '120px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              marginTop: '3px',
              background: '#1d2126',
              border: '1px solid #000',
              fontSize: '14px',
              color: '#fff',
            }}
          >
            {fontUrl ? (
              <img alt='' style={{ width: '75px', height: '75px' }} src={FileImg} />
            ) : (
              <>
                <p
                  onClick={() => {
                    if (verifyName()) {
                      setIsClickUpload(true);
                      showModal();
                    }
                  }}
                >
                  <PlusOutlined style={{ fontSize: '30px' }} />
                </p>
                <p>请上传小于10MB的字体文件,只支持ttf、otf两种格式</p>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        title='免责声明'
        open={isModalOpen}
        keyboard={false}
        maskClosable={false}
        onCancel={handleCancel}
        getContainer={false}
        footer={
          <>
            <Button onClick={handleCancel}>取消</Button>
            {!font.fontUrl && isClickUpload && (
              <Button type='primary' onClick={handleOk}>
                <input
                  id='font_upload'
                  style={{ display: 'none' }}
                  type='file'
                  accept='.ttf,.otf'
                  onChange={handleImageChange}
                />
                <label style={{ cursor: 'pointer' }} htmlFor='font_upload'>
                  我同意
                </label>
              </Button>
            )}
          </>
        }
      >
        <div className={styles.copyright}>
          <p>
            本网站（以下简称“本站”）是一个数据可视化平台，旨在为广大用户提供相关网络服务。在使用本站提供的服务前，请您仔细阅读本免责声明。一旦您使用本站的服务，即表示您已经阅读、理解并同意本声明的所有条款。
          </p>
          <p>
            1.本站用户自行上传的字体不受本站控制。用户应该自行判断是否存在版权问题，本站对用户上传的字体不负任何责任。
          </p>
          <p>
            2.
            本站保留随时修改、更新本声明的权利。用户在使用本站服务前，应该仔细阅读最新的免责声明以及其他相关协议和条款。
          </p>
          <p>3. 本站尊重知识产权，所有字体均来源于网络，如有侵权，请及时告知本站，本站将及时删除相关内容。</p>
          <p>
            4.
            本站保留随时修改、暂停或终止服务的权利，无需事先通知用户，对于因服务暂停或终止而产生的任何损失，本站均不承担任何责任。
          </p>
          <p>
            5.
            本站使用条款的解释、执行和争议的解决均适用中华人民共和国法律。如用户与本站发生争议，双方应尽量通过协商解决，协商不成的，任何一方均有权向有管辖权的人民法院提起诉讼。
          </p>
        </div>
      </Modal>
    </>
  );
};

export default FontUpload;
