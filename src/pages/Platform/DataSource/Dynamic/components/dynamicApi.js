import React, { useEffect, useState, useCallback, useRef } from 'react';
import { inject, observer } from 'mobx-react';
import { Tabs, message, Button, Modal, ConfigProvider, theme } from 'antd';
import { isPlainObject } from 'lodash';
import classnames from 'classnames';
import { GetQueryString } from '@/utils/BrowserUtils';
import { postInterfaceCategory, addApiRelated, getSourceApiInfo } from '@/services/apis/dataManage';
import { CloseOutlined } from '@ant-design/icons';
import { TriggerRequest } from '@/TriggerAction/DataQueray';
import { useStore } from '@/hooks';
import { Left, Right } from './DataSource';
import { getResultMetadata } from '../../utils';
import s from '../index.less';

const DynamicApi = (props) => {
  const {
    versionStore: { apiVersion },
    globalStore,
  } = useStore();
  const { updateDynamicData, dynamic, visible: apiVisiable, onClose: toggleApiVisiable } = props;

  const [category, setCategory] = useState([]);
  const [field, setField] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [currentApi, setCurrentApi] = useState(null);
  const apiEntitiesRef = useRef({}); // 接口实体信息

  const pageId = GetQueryString('id');
  const pageType = GetQueryString('type');

  // 刷新接口信息，并保存到 apiEntitiesRef 中
  const refreshApiInfo = useCallback(async (code) => {
    try {
      const res = await getSourceApiInfo({
        iocInterfaceCode: code,
      });
      if (res.data) {
        apiEntitiesRef.current = {
          ...apiEntitiesRef.current,
          [code]: res.data,
        };
      }
    } catch (error) {
      console.warn(error.message);
    }
  }, []);

  const deepMapToCode = useCallback((data) => {
    if (Array.isArray(data)) {
      data.forEach((child, idx) => {
        child.code = child.id;
        child.children && deepMapToCode(child.children);
      });
    }
  }, []);

  useEffect(() => {
    if (field.length === 0 && apiVisiable) {
      postInterfaceCategory()
        .then(({ data, success, message: msg }) => {
          if (!success) {
            return message.error(msg);
          }
          deepMapToCode(data);
          const topLevelData = [
            {
              category: '全部',
              code: '0',
              children: data,
            },
          ];
          setCategory(data);
          setField(topLevelData);
          setSelectedKeys(['0']);
        })
        .catch((error) => {
          console.error(error, '分类请求出错');
        });
    }
  }, [deepMapToCode, apiVisiable, field]);

  useEffect(() => {
    // 每次打开弹窗的时候，根据需要回显已经选择过动态接口
    if (apiVisiable && field.length > 0 && dynamic.source.id && (!currentApi || currentApi.id !== dynamic.source.id)) {
      const { id: sourceId, params } = dynamic.source;
      const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
      const selectedApi = dynamicApis.find((api) => api.id === sourceId);
      if (selectedApi) {
        try {
          // console.log({ selectedApi }, { params });
          const { apiInfo } = selectedApi;
          const apiParam = JSON.parse(apiInfo.param);
          // console.log(apiInfo.param);
          if (apiParam) {
            if (Array.isArray(apiParam)) {
              apiParam.forEach((v) => {
                const found = params.find((p) => p.name === v.name && p.paramType === 'body');
                if (found) {
                  v.example = found.example;
                }
              });
            } else {
              if (apiParam.headers) {
                apiParam.headers.forEach((v) => {
                  const found = params.find((p) => p.key === v.key && p.paramType === 'header');
                  if (found) {
                    v.value = found.value;
                  }
                });
              }

              if (apiParam.queryParams) {
                apiParam.queryParams.forEach((v) => {
                  const found = params.find((p) => p.name === v.name && p.paramType === 'query');
                  if (found) {
                    v.example = found.example;
                  }
                });
              }

              if (apiParam.bodyParams) {
                const { contentType } = apiParam.bodyParams;
                if (contentType && apiParam.bodyParams[contentType]) {
                  const bodyParams =
                    contentType === 'row'
                      ? apiParam.bodyParams[contentType].rowParam
                      : apiParam.bodyParams[contentType];
                  bodyParams.forEach((v) => {
                    const found = params.find((p) => p.name === v.name && p.paramType === 'body');
                    if (found) {
                      v.example = found.example;
                    }
                  });
                }
              }
            }
            apiInfo.param = JSON.stringify(apiParam);
            // console.log(apiInfo.param);
          }

          setCurrentApi(apiInfo);
          refreshApiInfo(apiInfo.interfaceCode);
        } catch (error) {
          console.error(error);
        }
      }
    }
  }, [apiVisiable, dynamic, field, refreshApiInfo]);

  const toggleVisible = () => apiVisiable && toggleApiVisiable();

  const chooseApi = () => {
    toggleVisible();
    if (!currentApi) {
      return;
    }

    // 如果更新接口信息成功，使用最新的接口信息
    const latestCurrentApi = apiEntitiesRef.current[currentApi.interfaceCode] || currentApi;

    // v8.6 新增返回数据字段描述信息
    currentApi.resultMetadata = getResultMetadata(latestCurrentApi);

    const apiInfo = {
      id: currentApi.id,
      interfaceName: currentApi.interfaceName,
      url: currentApi.url,
      params: currentApi.realParams || [], // 参数列表
      contentType: currentApi.contentType, // v7-10-0 添加参数contentType
      headers: currentApi.headers || [], // 表头参数
      apiInfo: currentApi,
    };
    if (dynamic.requireType) {
      updateDynamicData({ curApiInfo: currentApi });
      globalStore.updateDynamicApis(apiInfo);
    } else {
      TriggerRequest(
        {
          apiInfo: apiInfo.apiInfo,
          headers: apiInfo.headers,
          paramList: apiInfo.params, // 选择接口时使用接口的配置参数
          contentType: apiInfo.contentType, // v7-10-0 添加参数contentType
        },
        (data) => {
          if (data?.code === '403') {
            if (window.DataI.isConfigPage()) {
              message.warning(`${currentApi.interfaceName}接口已被禁用`);
            }
            return;
          }

          if (!Array.isArray(data) && !dynamic.requireType) {
            if (window.DataI.isConfigPage()) {
              message.warning(`${currentApi.interfaceName}接口数据不符合规范!`);
            }
            return;
          }

          // 全局存储选择过的api
          globalStore.updateDynamicApis(apiInfo);
          if (dynamic.requireType) {
            return updateDynamicData({ curApiInfo: apiInfo.apiInfo });
          }

          const setting = {
            ...dynamic,
            source: {
              ...dynamic.source,
              id: apiInfo.id,
              params: [...apiInfo.params, ...apiInfo.headers],
            },
            dimensionMap: dynamic.dimensionMap.map((dims) => {
              dims.row = [];
              return dims;
            }),
          };
          updateDynamicData(data, setting);
        },
      );
    }

    // const type = GetQueryString('type');
    addApiRelated({
      interfaceCode: currentApi.interfaceCode, // 换成不变的code
      // pageId: pageId, // 保存引用关系都用不变的id
      pageId: pageType === 'card' ? window.screenConfig.pageId : pageId, // 卡片用的短id存的接口引用关系
      apiId: currentApi.id, // 通过id保存引用关系兼容项目现场没有升级大屏
      ver: apiVersion,
    })
      .then(({ success, data, message: msg }) => {
        // if (!success) return;
        // message.success('关联成功');
        // getRApiList();
      })
      .catch((error) => error);
  };

  return (
    <ConfigProvider
      componentSize='small'
      theme={{
        algorithm: theme.darkAlgorithm, // 暗色主题
      }}
    >
      <Modal
        open={apiVisiable}
        width={1300}
        closable={false}
        onClose={toggleVisible}
        style={{
          transform: 'translateX(0px)',
        }}
        okText='选择'
        onOk={chooseApi}
        onCancel={toggleVisible}
        className={`${classnames('antd-dark', s.wrap)} settings-modal`}
      >
        <Tabs
          defaultActiveKey='0'
          tabBarExtraContent={
            <Button
              icon={<CloseOutlined />}
              size='small'
              type='primary'
              title='关闭'
              style={{ width: '40px' }}
              onClick={toggleVisible}
            />
          }
        >
          <Tabs tab='数据源配置' key='2' className={classnames(s.tabPanel)}>
            <div className={s.leftWrap1}>
              <Left
                data={category}
                setSelectedKeys={setSelectedKeys}
                selectedKeys={selectedKeys}
                setCurrentApi={setCurrentApi}
                refreshApiInfo={refreshApiInfo}
              />
            </div>
            <div className={s.rightWrap}>
              <Right
                pageId={pageId}
                categoryId={selectedKeys[0] === '0' ? '' : selectedKeys[0]}
                currentApi={currentApi}
              />
            </div>
          </Tabs>
        </Tabs>
      </Modal>
    </ConfigProvider>
  );
};
export default observer(DynamicApi);
