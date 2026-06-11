import React, { useCallback, useEffect, useState } from 'react';
import {
  Row,
  Col,
  Form,
  Input,
  Tabs,
  // Button,
  Radio,
  Select,
  // message,
  // Table,
  // Tooltip,
  // Divider
} from 'antd';
import ParamsTable from './components/ParamsTable';
import _ from 'lodash';
import s from './index.less';
// const { TextArea } = Input;
const { TabPane } = Tabs;
const menuList = [
  {
    name: 'headers',
  },
  {
    name: 'queryParams',
  },
  {
    name: 'bodyParams',
  },
];
const SourceOptions = {
  5: '数据集',
  1: 'SQL配置',
  2: '系统自研',
  3: '外部',
  6: '外部API',
  7: '文件',
};

function Right(props) {
  const { currentApi } = props;
  const [form] = Form.useForm();
  // const [paramList, setParamList] = useState([]);
  const [activeKey, setActiveKey] = useState('headers');
  // 获取头部参数
  const [headers, setHeaders] = useState([]);
  // 获取get请求参数
  const [queryParams, setQueryParams] = useState([]);
  //获取 POST、PUT、PATCH请求参数
  const [contentType, setContentType] = useState(undefined);
  const [mode, setMode] = useState(undefined);
  const [bodyParamsList, setBodyParamsList] = useState([]);
  // 数据集 SQL

  const handleBodyParam = useCallback((bodyParams) => {
    let newContentType = bodyParams.contentType;
    let config = {};
    let newMode = undefined;
    let newBodyParamsList = [];
    if (!newContentType) {
      let keys = Object.keys(bodyParams);
      if (keys && keys.length > 0) {
        newContentType = keys[0];
      }
    }
    if (newContentType) {
      config = bodyParams[newContentType];
      // v7-10-0 按格式获取参数
      if (newContentType == 'row') {
        newBodyParamsList = config?.rowParam || [];
        newMode = config?.mode;
      } else {
        newBodyParamsList = Array.isArray(config) ? config : [];
      }
    }
    newBodyParamsList = newBodyParamsList.map((item) => {
      item.status = false; // 状态 默认为修改
      item.defaultValue = item.example; // 默认值
      return item;
    });
    setContentType(newContentType);
    setMode(newMode);
    setBodyParamsList(newBodyParamsList);
  }, []);

  useEffect(() => {
    if (!currentApi) return;
    try {
      let apiParam = JSON.parse(currentApi.param);
      if (!apiParam) {
        setHeaders([]);
        setQueryParams([]);
        setContentType(undefined);
        setMode(undefined);
        setBodyParamsList([]);
        return;
      }
      // let params = [];
      if (Array.isArray(apiParam)) {
        // params = apiParam;
        setBodyParamsList(apiParam);
      } else {
        // if (currentApi.method.toLocaleLowerCase() === 'get') {
        //   params = apiParam.queryParams || [];
        // }
        // if (currentApi.method.toLocaleLowerCase() === 'post') {
        //   params = apiParam.bodyParams?.row?.rowParam ?? [];
        // }
        let newHeaders = apiParam.headers || [];
        newHeaders = newHeaders.map((item) => {
          item.status = false; // 状态 默认为修改
          item.defaultValue = item.example; // 默认值
          return item;
        });
        let newQueryParams = apiParam.queryParams || [];
        newQueryParams = newQueryParams.map((item) => {
          item.status = false; // 状态 默认为修改
          item.defaultValue = item.example; // 默认值
          return item;
        });
        setHeaders(newHeaders);
        setQueryParams(newQueryParams);
        let newBodyParams = apiParam.bodyParams;
        if (newBodyParams) {
          handleBodyParam(newBodyParams);
        } else {
          setContentType(undefined);
          setMode(undefined);
          setBodyParamsList([]);
        }
      }
      // params = params.map((item) => {
      //   item.status = false; // 状态 默认为修改
      //   item.defaultValue = item.example; // 默认值
      //   return item;
      // });
      // currentApi.realParams = params;
    } catch (error) {
      console.error(error);
    }
    return () => {};
  }, [currentApi, handleBodyParam]);

  useEffect(() => {
    if (!currentApi) return;
    try {
      let apiParam = JSON.parse(currentApi.param);
      if (!apiParam) {
        return;
      }
      let params = [];
      bodyParamsList?.forEach((p) => {
        p.paramType = 'body';
        if (!p.id) p.id = p.name || p.key; // 兼容数据集等没有 id 属性的接口
      });
      queryParams?.forEach((p) => {
        p.paramType = 'query';
        if (!p.id) p.id = p.name || p.key;
      });
      headers?.forEach((p) => {
        p.paramType = 'header';
        if (!p.id) p.id = p.name || p.key;
      });
      if (Array.isArray(apiParam)) {
        params = bodyParamsList;
      } else {
        currentApi.headers = headers;
        if (currentApi.method.toLocaleLowerCase() === 'get') {
          params = queryParams || [];
        }
        if (currentApi.method.toLocaleLowerCase() === 'post') {
          params = bodyParamsList || [];
          if (queryParams && Array.isArray(queryParams)) {
            queryParams.forEach((item) => {
              item.queryFlag = true;
            });
            params.concat(queryParams);
          }
        }
      }
      // params = params.map((item) => {
      //   item.status = false; // 状态 默认为修改
      //   item.defaultValue = item.example; // 默认值
      //   return item;
      // });
      currentApi.realParams = params;
      currentApi.contentType = contentType;
    } catch (error) {
      console.error(error);
    }
    return () => {};
  }, [bodyParamsList, contentType, currentApi, headers, queryParams]);
  return (
    <div className={s.rightWrap}>
      {currentApi && (
        <Form form={form} layout='vertical'>
          <Row gutter={24}>
            <Col span={12} key={0}>
              <Form.Item label='接口名称:'>
                <Input disabled={true} value={currentApi.interfaceName} />
              </Form.Item>
            </Col>
            <Col span={12} key={1}>
              <Form.Item label='接口来源:'>
                <Input disabled={true} value={SourceOptions[currentApi.source] || ''} />
              </Form.Item>
            </Col>
            {currentApi.source == 6 && (
              <Col span={12} key={2}>
                <Form.Item label='数据源:'>
                  <Input disabled={true} value={currentApi.dsName} />
                </Form.Item>
              </Col>
            )}
            <Col span={12} key={3}>
              <Form.Item label='请求方式:'>
                <Input disabled={true} value={currentApi.method} />
              </Form.Item>
            </Col>
            <Col span={24} key={4}>
              <Form.Item label='接口地址:'>
                <Input disabled={true} value={currentApi.url} />
              </Form.Item>
            </Col>
          </Row>
          {/* <Form.Item label="所在分组">
            <Input
              disabled={true}
              value={currentApi.category || currentApi.categoryName}
            />
          </Form.Item> */}
          {currentApi.source == 1 || currentApi.source == 5 ? (
            <Form.Item style={{ marginBottom: 8 }} label='请求参数:' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
              <ParamsTable
                className={s.table}
                key={'ParamsTable1'}
                value={bodyParamsList}
                onChange={(value) => {
                  setBodyParamsList(value);
                }}
              />
            </Form.Item>
          ) : (
            <Form.Item style={{ marginBottom: 8 }} label='请求参数:' labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
              <Tabs
                activeKey={activeKey}
                // items={items}
                onChange={(key) => {
                  // console.log('key', key);
                  setActiveKey(key);
                }}
                className='media-select'
                type='card'
              >
                {menuList.map((menu) => (
                  <TabPane tab={menu.name} key={menu.name}>
                    {menu.name == 'headers' || menu.name == 'queryParams' ? (
                      <ParamsTable
                        className={s.table}
                        key={menu.name + '-ParamsTable'}
                        isHeader={menu.name == 'headers'}
                        value={menu.name == 'headers' ? headers : queryParams}
                        onChange={(value) => {
                          // console.log('value', value);
                          if (menu.name == 'headers') {
                            setHeaders(value);
                          } else {
                            setQueryParams(value);
                          }
                        }}
                      />
                    ) : (
                      <div>
                        <div className={s.radioGroup}>
                          <Radio.Group disabled value={contentType}>
                            <Radio value={'formData'}>form-data</Radio>
                            <Radio value={'xWwwFormUrlencoded'}>x-www-form-urlencoded</Radio>
                            <Radio value={'row'}>raw</Radio>
                          </Radio.Group>
                          {contentType == 'row' ? (
                            <Select disabled style={{ width: '100px' }} size='small' value={mode}>
                              <Select.Option value='json'>json</Select.Option>
                              <Select.Option value='text'>text</Select.Option>
                              <Select.Option value='xml'>xml</Select.Option>
                            </Select>
                          ) : null}
                        </div>
                        <ParamsTable
                          className={s.table}
                          key={menu.name + '-ParamsTable2'}
                          value={bodyParamsList}
                          onChange={(value) => {
                            setBodyParamsList(value);
                          }}
                        />
                      </div>
                    )}
                  </TabPane>
                ))}
              </Tabs>
            </Form.Item>
          )}
          {/* <Form.Item label="备注">
            <TextArea disabled={true} value={currentApi.remark} />
          </Form.Item> */}
        </Form>
      )}
    </div>
  );
}

export default Right;
