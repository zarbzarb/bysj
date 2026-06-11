import { Button, Modal, Space, Table, Radio, Progress, message, ConfigProvider, theme } from 'antd';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import useUpdateEffect from '@/hooks/useUpdateEffect';
import { getStatusFetch } from '@/services/apis/appPageApi';
import styles from './index.less';

const POLLING_SECONDS = 5000;

let modal = null;

export default (props) => {
  const { setImportCheckVisiable, noImportCloseDialog, dataSource, files, appId, parentId, shareCallback, importFunc } =
    props;
  const [detailVisiable, setDetailVisiable] = useState(false); // 重复项弹框显隐
  const [repeatScreenType, setRepeatScreenType] = useState(0); // 重复项弹框标题
  const [repeatInfoList, setRepeatInfoList] = useState([]); // 重复项弹框列表

  // 处理进度
  const [isUpload, setIsUpload] = useState(false); // 上否上传
  const [percent, setPercent] = useState(0); // 进度
  const keyRef = useRef(null); // 进度查询key
  const time = useRef(null); // 查询进度定时器
  /**
   * 重复导入资源类型名称
   * @param screenType
   * @returns
   */
  const getImportName = (screenType) => {
    let ret = '-';
    // eslint-disable-next-line default-case
    switch (screenType) {
      case 1: {
        ret = '页面';
        break;
      }
      case 2: {
        ret = '业务图层';
        break;
      }
      case 3: {
        ret = '自定义卡片';
        break;
      }
      case 4: {
        ret = '自定义组件';
        break;
      }
      case 7: {
        ret = '数据接口';
        break;
      }
      case 9: {
        ret = '数据源';
        break;
      }
      case 10: {
        ret = '应用子页面';
        break;
      }
    }
    return ret;
  };
  /**
   * 显示重复项弹框
   * @param record
   */
  const showRepeatDialog = (record) => {
    const { screenType, infoList } = record;
    setRepeatScreenType(screenType);
    setRepeatInfoList(infoList);
    setDetailVisiable(true);
  };
  /**
   * 重复导入资源列配置
   */
  const columns1 = [
    {
      title: '资源',
      dataIndex: 'screenType',
      key: 'screenType',
      render: (_, { screenType }) => getImportName(screenType),
    },
    {
      title: '总数',
      dataIndex: 'totalNum',
      key: 'totalNum',
    },
    {
      title: '重复项',
      dataIndex: 'repeatNum',
      key: 'repeatNum',
      render: (text, record) => <a onClick={() => showRepeatDialog(record)}>{text}</a>,
    },
    {
      title: '重复项导入方式',
      key: 'action',
      render: (_, record) => (
        // eslint-disable-next-line no-return-assign
        <Radio.Group onChange={(e) => (record.repeatHandleType = e.target.value)} defaultValue={1}>
          <Radio value={1}>覆盖导入</Radio>
          <Radio value={2} disabled={record.screenType === 7 || record.screenType === 9}>
            新建导入
          </Radio>
          <Radio value={3}>不导入</Radio>
        </Radio.Group>
      ),
    },
  ];
  /**
   * 重复项列配置
   */
  const columns2 = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '更新时间',
      dataIndex: 'gmtModified',
      key: 'gmtModified',
    },
  ];
  /**
   * 关闭上传弹框
   */
  const confirmClose = () => {
    Modal.confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂在到当前子应用
      title: '是否退出导入流程？',
      onOk(close) {
        close();
        setImportCheckVisiable(false);
        noImportCloseDialog(); // 调用父类的方法关闭弹框
      },
    });
  };

  const getStatus = useCallback(() => {
    time.current = setTimeout(() => {
      getStatusFetch({ key: keyRef.current })
        .then(({ data, success }) => {
          if (!success) return;
          try {
            data = JSON.parse(data);
          } catch {
            data = {};
          }
          setPercent(data.progress);
          if (data.status === 2) {
            //
            getStatus();
          }
          if (data.status === 1) {
            clearTimeout(time.current);
            message.warning(data.message);
            setTimeout(() => {
              // 避免刷新问题
              setImportCheckVisiable(false);
              noImportCloseDialog(); // 调用父类的方法关闭弹框
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, POLLING_SECONDS);
  }, [setPercent]);
  /**
   * 上传成功
   */
  useUpdateEffect(() => {
    if (Number(percent) === 100) {
      message.success('文件处理成功');
      setTimeout(() => {
        // 避免刷新问题
        setImportCheckVisiable(false);
        noImportCloseDialog(); // 调用父类的方法关闭弹框
      });
      shareCallback(); // 刷新列表
    }
  }, [percent]);

  useEffect(() => clearTimeout(time.current), []);

  /**
   *  重新上传
   * @param repeatHandleType
   */
  const selectImport = (repeatHandleType) => {
    // const formData = new FormData();
    // console.log('files', files);
    const originFileObjs = files.map((file) => {
      // formData.append('file', file.originFileObj);
      return file.originFileObj;
    });
    // formData.append('appId', appId); // 大屏导入需要指定领域分类
    // formData.append('parentId', parentId); // 大屏导入需要指定领域分类
    const handles = [];
    dataSource.forEach((item) => {
      if (!item.repeatHandleType) {
        item.repeatHandleType = 1; // 默认的覆盖导入赋值
      }
      const handle = {
        screenType: item.screenType,
        repeatHandleType: repeatHandleType === 4 ? item.repeatHandleType : repeatHandleType,
      };
      handles.push(handle);
    });
    // formData.append('handles', JSON.stringify(handles));
    modal = Modal.info({
      wrapClassName: 'yunli-modal-confirm',
      title: '请稍等',
      getContainer: () => document.querySelector('#app'), // 弹框挂在到当前子应用
      content: (
        <div style={{ textAlign: 'center' }}>
          <LoadingOutlined style={{ fontSize: '28px' }} />
        </div>
      ),
    });
    importFunc({
      file: originFileObjs[0],
      handles: JSON.stringify(handles),
      appId,
      parentId,
    })
      .then((res) => {
        if (+res.code === 200) {
          message.success('导入成功,后台开始处理文件');
          modal.destroy(); // 关闭弹框
          setIsUpload(true);
          keyRef.current = res.data.key;
          // eslint-disable-next-line promise/no-nesting
          getStatusFetch({ key: keyRef.current })
            .then(({ data, success }) => {
              if (!success) return;
              try {
                data = JSON.parse(data);
              } catch {
                data = {};
              }
              setPercent(data.progress);
              if (data.status === 2) {
                getStatus();
              }
              if (data.status === 1) {
                clearTimeout(time.current);
                message.warning(data.message);
                setTimeout(() => {
                  // 避免刷新问题
                  setImportCheckVisiable(false);
                  noImportCloseDialog(); // 调用父类的方法关闭弹框
                });
              }
            })
            .catch((error) => {
              console.error(error);
            });
        } else {
          message.error(res.message);
        }
      })
      .catch((error) => {
        setTimeout(() => {
          // 避免刷新问题
          setImportCheckVisiable(false);
          noImportCloseDialog(); // 调用父类的方法关闭弹框
        });
        shareCallback(); // 刷新列表
      });
  };

  const handleDownload = () => {
    Modal.confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂在到当前子应用
      title: '确定开始导入？',
      onOk(close) {
        close();
        selectImport(4);
      },
    });
  };

  return (
    <>
      <Modal
        title={isUpload ? '正在导入，请稍等' : '存在重复资源，请选择重复导入方式'}
        open={true}
        footer={null}
        width={630}
        maskClosable={false}
        onCancel={confirmClose}
        getContainer={() => document.querySelector('#app')}
        className={styles.visual_modal}
      >
        {isUpload ? (
          <Progress percent={percent} />
        ) : (
          <>
            <Table className={styles.repeatTable} columns={columns1} dataSource={dataSource} pagination={false} />
            <Space
              style={{
                marginTop: '24px',
                width: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div className='back-step-last'>
                <Button type='primary' onClick={() => setImportCheckVisiable(false)}>
                  返回上一步
                </Button>
              </div>
              <div className='down-btn'>
                <Button type='primary' onClick={handleDownload}>
                  导入
                </Button>
              </div>
            </Space>
          </>
        )}
      </Modal>
      {/* 重复项显示 */}
      <Modal
        title={`重复的${getImportName(repeatScreenType)}`}
        open={detailVisiable}
        footer={null}
        onCancel={() => setDetailVisiable(false)}
      >
        <Table columns={columns2} dataSource={repeatInfoList} />
      </Modal>
    </>
  );
};
