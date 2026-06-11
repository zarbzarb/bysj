import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Tooltip, Form, Button, Radio, Switch, Spin, message } from 'antd';
import { Input, InputNumber } from '@yl/datai-ui';
import { strToJson } from '@/utils/utils';
import { getSourceApiInfo, getRelatedApiList, getIdbyUid, getAipInterfaceFilter } from '@/services/apis/dataManage';
import { produce } from 'immer';
import StoreTree from '@/components/StoreTree';
import { GetQueryString } from '@/utils/BrowserUtils';
import { executeAjax } from '@/TriggerAction/DataQueray';
import LargeEdit from '@/components/commons/LargeEdit';
import add from '@/assets/newIcon/add.png';

import { useStore } from '@/hooks';
import _, { isPlainObject } from 'lodash';
import { getCurrentAction, setCurrentAction } from '@/pages/Platform/Attribute/components/Interactive/utils';
import VariableRef from './components/VariableRef';
import EditApiSelect from './components/EditApiSelect';
import DataMapTable from './components/DataMapTable';
import ParamsTable from './components/ParamsTable';
import styles from './index.less';

const FormItem = Form.Item;

function QuoteTable(props) {
  const {
    controlStore: { toggleDataVisible },
    versionStore: { apiVersion },
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [paramListLoading, setParamListLoading] = useState(false);

  const [status, setStatus] = useState(0);

  const [testResult, setTestResult] = useState();

  const { comp, parentIdx, idx } = props;

  const { activeIdx } = comp.eventSetings[parentIdx];

  const curDataset = comp.dataset;

  let eventSettings = _.cloneDeep(comp.eventSetings);

  const data = useRef(getCurrentAction(eventSettings, parentIdx, idx));
  let actionSettings = useMemo(() => {
    return getCurrentAction(eventSettings, parentIdx, idx)?.actionSettings || {};
  }, [eventSettings, idx, parentIdx]);

  const [form] = Form.useForm();

  const [initState, setInitState] = useState(true);

  const [currentApi, setCurrentApi] = useState(actionSettings.apiInfo || {});

  const [isRemovedApi, setIsRemovedApi] = useState(false);

  /**
   * 显示接口是否被删除，按照原先代码逻辑应该用的是isRemovedApi，正常情况应该是选了接口文案就应该是接口名称，但是isRemovedApi在选中接口
   * 的时候，值没有赋上去，别的地方也用到了这个，怕对别的功能有影响，文案的显示单独用isRemovedApi来控制
   */

  const headers = useRef(actionSettings.headers);

  const contentTypeRef = useRef(actionSettings.contentType);

  const [paramList, setParamList] = useState(actionSettings.paramList || []);

  const [paramListApi, setParamListApi] = useState([]);

  const [isValue, setIsValue] = useState(actionSettings.isLoop || false);

  const [ms, setMs] = useState(actionSettings.apiMs || 5);

  const [isRadio, setIsRadio] = useState(actionSettings.isRadio || false);

  const [msVariable, setMsVariable] = useState(actionSettings.msVariable || '');

  const [msExpression, setMsExpression] = useState(actionSettings.msExpression || 'data');

  const [resultList, setResultList] = useState(actionSettings.dataMapList || []);

  const [relatedApiList, setRelatedApiList] = useState([]);

  const { setFieldsValue, getFieldsValue, resetFields } = form;

  const pageId = GetQueryString('id');
  const [speId, setSpeId] = useState(pageId);

  useEffect(() => {
    if (initState) {
      setFieldsValue(actionSettings);
      setInitState(false);
    }
    return () => {};
  }, [actionSettings, initState, setFieldsValue]);

  useEffect(() => {
    data.current = getCurrentAction(eventSettings, parentIdx, idx);
    actionSettings = data.current?.actionSettings;

    if (actionSettings.apiInfo) {
      setInitState(true);
    } else {
      resetFields();
    }
  }, [activeIdx]);

  const updateEventSettings = () => {
    try {
      const curEventSettings = _.cloneDeep(comp.eventSetings);

      setCurrentAction(curEventSettings, parentIdx, idx, _.cloneDeep(data.current));
      eventSettings = curEventSettings;
    } catch (error) {
      console.error(error);
    }
  };

  const formChangeHandler = useCallback((changedFields, allFields) => {
    // console.log('getFieldsValue()', getFieldsValue());
    // console.log('data.current.actionSettings', data.current.actionSettings);
    data.current.actionSettings = { ...data.current.actionSettings, ...getFieldsValue() };
    data.current.actionSettings.headers = headers.current;
    data.current.actionSettings.contentType = contentTypeRef.current;

    // console.log('data.current', data.current);
    updateEventSettings();

    if (_.isEqual(comp.eventSetings, eventSettings)) return;
    window.executeCommand('InteractionCommand', comp, eventSettings);
  });

  /**
   * 点击测试按钮
   */
  const testAjaxHandler = () => {
    setStatus(1);
    setTestResult();
    try {
      const dataQuery = data.current.actionSettings;
      const { apiInfo } = dataQuery;
      executeAjax(dataQuery, window.screenConfig, (result) => {
        if (result?.code === '403') {
          if (window.DataI.isConfigPage()) {
            message.warning(`${apiInfo.interfaceName}接口已被禁用`);
          }
          return;
        }
        setStatus(2);
        setTestResult(result);
      });
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 获取api列表
   */
  const getApiList = () => {
    const apiInfo = currentApi;
    if (apiInfo.interfaceCode) {
      setParamListLoading(true);
      getSourceApiInfo({
        iocInterfaceCode: apiInfo.interfaceCode,
      })
        .then((sourceApiInfo) => {
          setParamListLoading(false);
          if (!sourceApiInfo.success) return;
          let {
            data: { result },
          } = sourceApiInfo;
          result = strToJson(result, []);
          setParamListApi(result);
        })
        .catch((error) => {
          setParamListLoading(false);
        });
    }
  };

  /**
   * 修改轮询间隔引用变量
   */
  const changeFieldValues = (path, value) => {
    // console.log('changeFieldValues path', path);
    // console.log('changeFieldValues value', value);
    data.current.actionSettings[path] = value;

    const { msVariable, msExpression } = data.current.actionSettings;
    setMsVariable(msVariable);
    setMsExpression(msExpression);

    testAjaxHandler();

    // console.log('data.current', data.current);
    updateEventSettings();

    if (_.isEqual(comp.eventSetings, eventSettings)) return;
    window.executeCommand('InteractionCommand', comp, eventSettings);
  };

  /**
   *
   * @param {*} oldList 请求里的参数
   * @param {*} newList 接口返回的参数
   * @returns
   */
  const produceParamList = (oldList, newList) => {
    const newV = produce(newList, (draft) => {
      draft.forEach((element, index) => {
        const param = oldList.find((item) => item.name === element.name && item.type === element.type);

        if (param) {
          draft[index] =
            param.isRefer || param.status
              ? {
                  ...param,

                  defaultValue: draft[index].example,
                  status: !(draft[index].example === param.example),
                }
              : {
                  ...param,

                  example: draft[index].example,
                  defaultValue: draft[index].example,
                };
        } else {
          draft[index].status = false;
          draft[index].isRefer = false;
          draft[index].defaultValue = draft[index].example;
        }
      });
    });
    return newV;
  };

  /**
   * 切换api接口
   */
  const onChangeApi = (apiInfo) => {
    // console.log('apiInfo1', apiInfo);
    if (apiInfo?.apiInfo) {
      apiInfo = apiInfo.apiInfo;
    }
    setIsRemovedApi(false);

    const isChangeApi = apiInfo.interfaceCode !== currentApi.interfaceCode;
    setCurrentApi(apiInfo);
    // console.log('apiInfo', apiInfo);
    // console.log('apiInfo.configStatus', apiInfo.configStatus);
    if (apiInfo.interfaceCode && !apiInfo.configStatus) {
      setParamListLoading(true);
      getSourceApiInfo({
        iocInterfaceCode: apiInfo.interfaceCode,
      })
        .then((sourceApiInfo) => {
          setParamListLoading(false);
          if (!sourceApiInfo.success) return;
          let {
            data: { param, result, method },
          } = sourceApiInfo;
          param = strToJson(param);
          result = strToJson(result, []);
          let paramsList = param;
          if (param && !Array.isArray(param)) {
            headers.current = param.headers || [];
            if (method.toLocaleLowerCase() === 'get') {
              paramsList = param.queryParams || [];
            }
            if (method.toLocaleLowerCase() === 'post') {
              const bodyParams = param?.bodyParams || {};
              let config = {};
              let { contentType } = bodyParams;
              if (!contentType) {
                const keys = Object.keys(bodyParams);
                if (keys && keys.length > 0) {
                  contentType = keys[0];
                }
              }

              contentTypeRef.current = contentType;
              if (contentType) {
                config = bodyParams[contentType];
                if (contentType === 'row') {
                  paramsList = config?.rowParam || [];
                } else {
                  paramsList = Array.isArray(config) ? config : [];
                }
              } else {
                paramsList = [];
              }

              if (param.queryParams) {
                const querys = param.queryParams;
                querys.forEach((item) => {
                  item.queryFlag = true;
                });
                paramsList = [...paramsList, ...querys];
              }
            }
          }

          if (paramsList) {
            paramsList = isChangeApi
              ? paramsList.map((item) => {
                  item.status = false;
                  item.defaultValue = item.example;
                  return item;
                })
              : produceParamList(paramList, paramsList);
          }

          setParamList(paramsList);
          setResultList(result);
          const obj = {
            ...getFieldsValue(),
            apiInfo,
            result,
            paramList: paramsList,
            isLoop: isValue,
            apiMs: ms,
            isRadio,
          };

          setFieldsValue({
            ...obj,
          });
          formChangeHandler();
        })
        .catch((error) => {
          setParamListLoading(false);
        });
    } else {
      setParamListLoading(true);
      getAipInterfaceFilter({
        interfaceCode: apiInfo.interfaceCode,
        pageId: speId,
      })
        .then(({ success, data, message: msg }) => {
          setParamListLoading(false);
          if (!success) return;
          const { paramsJson } = data;
          if (!paramsJson) {
            return;
          }
          let paramsList = JSON.parse(paramsJson);

          if (!isChangeApi && paramsList) {
            paramsList = produceParamList(paramList, paramsList);
          }
          setParamList(paramsList);
          const obj = {
            ...getFieldsValue(),
            apiInfo,
            result: [],
            paramList: paramsList,
            isLoop: isValue,
            apiMs: ms,
            isRadio,
          };

          setFieldsValue({
            ...obj,
          });
          formChangeHandler();
        })
        .catch((error) => {
          setParamListLoading(false);
        });
    }
  };

  /**
   * 设置关联接口api列表
   * 刷新重新获取参数
   */
  const getRApiList = useCallback(
    (apiInfo) => {
      // console.log('getRApiList, apiInfo', apiInfo);

      getRelatedApiList({
        pageId,
        ver: apiVersion,
      })
        .then(({ success, data }) => {
          if (!success) return;
          const type = GetQueryString('type');
          if (data.length === 0 && type === 'card') {
            getIdbyUid({
              sysCardId: pageId,
            })
              .then(({ success, data }) => {
                if (!success) return;
                setSpeId(data.id);
                getRelatedApiList({
                  pageId: data.id,
                  ver: apiVersion,
                })
                  .then(({ success, data }) => {
                    if (!success) return;
                    setRelatedApiList((apis) =>
                      apis.filter((api) =>
                        data.some((v) => {
                          const res =
                            v.interfaceCode === api.interfaceCode || v.interfaceCode === api.apiInfo?.interfaceCode;
                          if (res) {
                            if (api.apiInfo) {
                              api.apiInfo.configStatus = v.configStatus;
                            } else {
                              api.configStatus = v.configStatus;
                            }
                          }
                          return res;
                        }),
                      ),
                    );
                    if (!!apiInfo && Object.keys(apiInfo).length > 0) {
                      if (data.length > 0) {
                        const selectedAPI = data.find((v) => v.interfaceCode === apiInfo.interfaceCode);
                        if (!!selectedAPI && Object.keys(selectedAPI).length > 0) {
                        } else {
                          setIsRemovedApi(true);
                        }
                      } else {
                        setIsRemovedApi(true);
                      }
                    }
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              })
              .catch((error) => {
                console.error(error);
              });
          } else {
            setRelatedApiList((apis) =>
              apis.filter((api) =>
                data.some((v) => {
                  const res = v.interfaceCode === api.interfaceCode || v.interfaceCode === api.apiInfo?.interfaceCode;
                  if (res) {
                    if (api.apiInfo) {
                      api.apiInfo.configStatus = v.configStatus;
                    } else {
                      api.configStatus = v.configStatus;
                    }
                  }
                  return res;
                }),
              ),
            );
            if (!!apiInfo && Object.keys(apiInfo).length > 0) {
              if (data.length > 0) {
                const selectedAPI = data.find((v) => v.interfaceCode === apiInfo.interfaceCode);
                if (!!selectedAPI && Object.keys(selectedAPI).length > 0) {
                } else {
                  setIsRemovedApi(true);
                }
              } else {
                setIsRemovedApi(true);
              }
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
    [pageId, apiVersion],
  );

  const updateDynamicData = (setting) => {
    onChangeApi(setting?.curApiInfo);
  };

  useEffect(() => {
    getRApiList(currentApi);
  }, [getRApiList]);

  useEffect(() => {
    setLoading(false);

    const dynamicApis = (window.screenConfig.dynamicApis || []).filter((api) => isPlainObject(api));
    const currentApis = dynamicApis.find((api) => api.interfaceCode === currentApi?.interfaceCode);
    let apis = _.cloneDeep(dynamicApis);
    apis = apis.filter((v) => !v.isIndicator).splice(0, 6);
    if (currentApis) {
      const temp = apis.find((api) => api.interfaceCode === currentApis.interfaceCode);
      if (!temp) {
        apis.unshift(currentApis);
      }
    }
    if (currentApi && JSON.stringify(currentApi) !== '{}' && !currentApis) {
      apis.push(currentApi);
    }

    const res = new Map();
    apis = apis.filter(
      (v) =>
        !res.has(v.interfaceCode || v.apiInfo?.interfaceCode) &&
        res.set(v.interfaceCode || v.apiInfo?.interfaceCode, 1),
    );
    setRelatedApiList(apis);
  }, [currentApi]);

  const formData = [
    {
      id: 'apiInfo',
      render: () => (
        <EditApiSelect
          relatedApiList={relatedApiList}
          isRemovedApi={isRemovedApi}
          onChangeApi={onChangeApi}
          config={curDataset}
          updateDynamicData={updateDynamicData}
        />
      ),
    },

    {
      label: '',
      id: 'paramList',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;

        return (
          <Spin spinning={paramListLoading}>
            <FormItem
              style={{ marginBottom: 8 }}
              key='paramList'
              label=''
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              name='paramList'
              initialValue={paramList}
            >
              <ParamsTable onChange={(value) => {}} />
            </FormItem>
          </Spin>
        );
      },
    },

    {
      label: '',
      id: 'variableExpression',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        return (
          <FormItem
            style={{ marginBottom: 8 }}
            key='variableExpression'
            colon={false}
            label={<span className={styles.subtitle}>结果表达式</span>}
            name='variableExpression'
          >
            <Input defaultValue='data.data' placeholder='默认为data.data' autocomplete='off' />
          </FormItem>
        );
      },
    },

    {
      label: '',
      id: 'variable',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        return (
          <div style={{ display: 'flex', width: '322px' }}>
            <FormItem
              style={{ marginBottom: 8, width: '100%' }}
              key='variable'
              colon={false}
              label={<span className={styles.subtitle}>数据存储到</span>}
              name='variable'
            >
              <StoreTree />
            </FormItem>
            <a
              style={{ marginLeft: '5px', marginTop: '5px' }}
              onClick={(value) => {
                toggleDataVisible();
              }}
            >
              <img src={add} alt='' />
            </a>
          </div>
        );
      },
    },

    {
      label: '',
      id: 'isLoop',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        return (
          <FormItem
            style={{ marginBottom: 8 }}
            key='isLoop'
            colon={false}
            label={<span className={styles.subtitle}>轮询</span>}
            name='isLoop'
          >
            <Switch
              checked={isValue}
              onChange={(val) => {
                setIsValue(val);
              }}
            />
          </FormItem>
        );
      },
    },

    {
      label: '',
      id: 'isRadio',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        if (actionSettings.isLoop) {
          return (
            <FormItem
              style={{ marginBottom: 8 }}
              key='isRadio'
              colon={false}
              label={<span className={styles.subtitle}>轮询间隔</span>}
              name='isRadio'
            >
              <Radio.Group
                onChange={(evt) => {
                  actionSettings.isRadio = evt.target.value;
                  setIsRadio(evt.target.value);
                }}
                value={isRadio}
                defaultValue={false}
              >
                <Radio className={styles.radioLable} value={false}>
                  默认值
                </Radio>
                <Radio className={styles.radioLable} value={true}>
                  引用变量
                </Radio>
              </Radio.Group>
            </FormItem>
          );
        }
        return null;
      },
    },

    {
      label: '',
      id: 'apiMs',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        if (actionSettings.isLoop) {
          if (!actionSettings.isRadio) {
            return (
              <FormItem style={{ marginBottom: 8 }} key='apiMs' colon={false} name='apiMs'>
                <InputNumber
                  suffix='s'
                  min={1}
                  defaultValue={5}
                  value={ms}
                  onChange={(val) => {
                    actionSettings.apiMs = val;
                    setMs(val);
                    testAjaxHandler();
                    changeFieldValues('apiMs', val);
                  }}
                />
              </FormItem>
            );
          }
          return (
            <FormItem style={{ marginBottom: 8 }} key='apiMs' colon={false} name='apiMs'>
              <VariableRef
                expression={msExpression}
                variable={msVariable}
                name='zoom'
                updateField={changeFieldValues}
                paddingRight='0px'
              />
              {/* <div style={{ marginLeft: 40 }}>1234</div> */}
            </FormItem>
          );
        }
        return null;
      },
    },

    {
      label: '',
      id: 'dataMapList',
      shouldUpdate: (prevValues, curValues) => prevValues.apiInfo !== curValues.apiInfo,
      options: {
        noStyle: true,
      },
      render: () => {
        const { apiInfo, apiAlias } = getFieldsValue();
        if (!apiInfo || isRemovedApi) return null;
        return (
          <FormItem
            key='dataMapList'
            style={{ marginBottom: 8 }}
            labelCol={{ span: 24 }}
            initialValue={[]}
            wrapperCol={{ span: 24 }}
            name='dataMapList'
          >
            <DataMapTable callBack={() => null} item={data} resultList={paramListApi} getApiList={getApiList} />
          </FormItem>
        );
      },
    },
  ];

  return (
    <>
      <Spin spinning={loading}>
        <Form onFieldsChange={formChangeHandler} form={form} component='div' className={styles.wrap}>
          {formData.map(({ id, label, render, shouldUpdate, options = {} }) =>
            shouldUpdate ? (
              <FormItem {...options} key={id} shouldUpdate={shouldUpdate}>
                {(...arg) => render(...arg)}
              </FormItem>
            ) : (
              <FormItem
                name={id}
                label={label}
                shouldUpdate={shouldUpdate}
                {...options}
                key={id}
                style={{ marginBottom: 8 }}
              >
                {render()}
              </FormItem>
            ),
          )}

          {isRemovedApi ? null : (
            <FormItem>
              <Button
                className={styles.btnTestReturnValue}
                type='primary'
                ghost
                onClick={testAjaxHandler}
                style={{ marginRight: '12px' }}
              >
                测试接口返回值
              </Button>
              {status === 1 && <span>编译中</span>}
              {status === 2 && testResult && (
                <Tooltip
                  destroyTooltipOnHide={true}
                  overlayClassName={styles.dataShowTooltip}
                  placement='topLeft'
                  getPopupContainer={() => document.body}
                  title={
                    <div style={{ width: '240px' }}>
                      <LargeEdit language='json' value={testResult} />
                    </div>
                  }
                >
                  <span>查看结果</span>
                </Tooltip>
              )}
            </FormItem>
          )}
        </Form>
      </Spin>
    </>
  );
}

export default QuoteTable;
