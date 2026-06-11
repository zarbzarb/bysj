import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form, Button, Modal, Upload, message, Progress } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { APP_PAGE_IMPORT, importAppPage, getStatusFetch } from '@/services/apis/appPageApi';
import useUpdateEffect from '@/hooks/useUpdateEffect';
import { setSpaceIdHeader } from '@/utils/BrowserUtils';
import { useStore } from '@/hooks';
import styles from './index.less';
import ImportCheck from './importCheck';

const FormItem = Form.Item;

const POLLING_SECONDS = 5000;

export default (props) => {
  const { appId, parentId, setImportVisible, shareCallback } = props;
  const { versionStore } = useStore();

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const [importCheckVisiable, setImportCheckVisiable] = useState(false); // 覆盖导入弹框显隐
  const [dataSource, setDataSource] = useState([]); // 覆盖导入的重复详情
  const [importFiles, setImportFiles] = useState([]); // 文件需要传入到覆盖导入弹框

  // 增加处理进度
  const [isUpload, setIsUpload] = useState(false);
  const [percent, setPercent] = useState(0);
  const keyRef = useRef(null);
  const time = useRef(null);

  /**
   * 获取进度
   */
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
            getStatus();
          }
          if (data.status === 1) {
            clearTimeout(time.current);
            message.warning(data.message);
            setTimeout(() => {
              // 避免刷新问题
              setImportVisible(false); // 关闭弹框
            });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }, POLLING_SECONDS);
  }, [setPercent]);

  useUpdateEffect(() => {
    if (Number(percent) === 100) {
      message.success('文件处理成功');
      setTimeout(() => {
        // 避免刷新问题
        setImportVisible(false); // 关闭弹框
      });
      shareCallback(); // 刷新大屏列表
    }
  }, [percent]);

  useEffect(() => clearTimeout(time.current), []);

  /**
   * 关闭页面，包装给ImportCheck
   */
  const noImportCloseDialog = () => {
    // modal.destroy();
    setImportVisible(false); // 关闭弹框
  };

  return (
    <>
      <Modal
        title='导入页面'
        className={styles.visual_modal}
        open={true}
        getContainer={() => document.querySelector('#app')}
        onCancel={() => setImportVisible(false)}
        footer={null}
        maskClosable={false}
      >
        <Form form={form}>
          <FormItem label='导入数据文件：'>
            <div>
              <Upload
                action={APP_PAGE_IMPORT}
                listType='picture'
                data={{
                  appId,
                  parentId,
                  version: versionStore.apiVersion,
                }}
                fileList={fileList}
                onChange={({ file, fileList: fileList1 }) => {
                  setIsUpload(false);
                  if (file.status === 'removed') {
                    setFileList([]);
                    return;
                  }
                  const { response } = file;
                  if (response) {
                    const { data: data1, code } = response;
                    if (
                      (typeof data1 === 'boolean' && data1) ||
                      (typeof data1 === 'object' && data1.dataImportResult)
                    ) {
                      const { success: suc, message: msg } = response;
                      if (suc) {
                        if (typeof data1 === 'boolean' && data1) {
                          message.success('导入成功');
                          setTimeout(() => {
                            // 避免刷新问题
                            setImportVisible(false); // 关闭弹框
                          });
                          shareCallback(); // 刷新大屏列表
                        } else {
                          message.success('导入成功,后台开始处理文件');
                          setIsUpload(true);
                          keyRef.current = data1.key;
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
                                  setImportVisible(false); // 关闭弹框
                                });
                              }
                            })
                            .catch((error) => {
                              console.error(error);
                            });
                        }
                      } else {
                        message.error(msg);
                      }
                    } else if (+code === 500) {
                      // 新旧版本数据文件错误提示
                      const { message: msg } = response;
                      message.error(msg);
                    } else {
                      // 有重复
                      const { repeatResultDTOS } = data1;
                      setImportFiles(fileList1);
                      setDataSource(repeatResultDTOS);
                      setImportCheckVisiable(true);
                    }
                  }
                  setFileList(fileList1);
                }}
                headers={{
                  ...setSpaceIdHeader().headers,
                }}
                accept='application/x-zip-compressed'
                maxCount={1}
              >
                {(!fileList || fileList.length === 0) && (
                  <Button size='middle' className='upload-button' icon={<UploadOutlined style={{ color: '#fff' }} />}>
                    点击上传
                  </Button>
                )}
              </Upload>
              {isUpload && (
                <FormItem label='处理进度'>
                  <Progress percent={percent} />
                </FormItem>
              )}
            </div>
          </FormItem>
        </Form>
      </Modal>
      {importCheckVisiable && (
        <ImportCheck
          setImportCheckVisiable={setImportCheckVisiable}
          noImportCloseDialog={noImportCloseDialog}
          dataSource={dataSource}
          files={importFiles}
          appId={appId}
          parentId={parentId}
          shareCallback={shareCallback}
          importFunc={importAppPage}
        />
      )}
    </>
  );
};
