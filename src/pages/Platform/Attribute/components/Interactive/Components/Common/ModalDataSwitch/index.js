import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Button, Tooltip, Row, Col, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import Edit from '@/components/commons/Edit';
import LargeEdit from '@/components/commons/LargeEdit';
import MapField from '@/pages/Platform/DataSource/MapField';
import { babelTransform2 } from '@/utils/utils';
import { getDataByKey } from '@/utils/dataStoreUtils';
import styles from './index.less';

const trackMsg = `
请将旧数据格式转换为新数据格式交互才可以正常使用，新数据格式如下：
[{
  "dictValue": "市级",
  "planLevel": "3",
  "region": "2101",
  "num": 2
},
{
  "dictValue": "区级",
  "planLevel": "4",
  "region": "13",
  "num": 1
},
{
  "dictValue": "国家级",
  "planLevel": "1",
  "region": "00",
  "num": 5
},
{
  "dictValue": "省级",
  "planLevel": "2",
  "region": "210104",
  "num": 1
}]
`;

const Index = (props) => {
  const { param, visible, onCancel, onOk, comp } = props;
  const defaultData = useRef(); // 变量或者默认值初始数据
  const [value, setValue] = useState(param.dataSwitchContent.code);
  const [testResult, setTestResult] = useState();
  const [data, setData] = useState(); // 代码执行完的结果数据
  const [isTest, setIsTest] = useState(false);
  const [count, setCount] = useState(0);

  const config = useMemo(() => {
    let obj;
    if (comp.classType === 'antd' && comp.dataset) {
      obj = comp.dataset;
    }
    if (comp.classType === 'com' && comp.instance?.config) {
      obj = comp.instance.config;
    }
    if (obj) {
      const clone = _.cloneDeep(obj);
      if (param.dataSwitchContent.dimensionMap?.length) {
        clone.dynamic.dimensionMap = param.dataSwitchContent.dimensionMap;
      }
      return clone;
    }
    return obj;
  }, [comp, param]);

  useEffect(() => {
    if (config.category === 'json') {
      defaultData.current = config.defaultValue;
    } else if (config._source === 'json') {
      defaultData.current = dataset._data || dataset._mockData;
    } else if (config.category === 'variableRef' || config._source === 'variableRef') {
      const variable = config.variable || config._variable;
      defaultData.current = getDataByKey(variable);
    }
    const result = parseCode();
    if (Array.isArray(result)) {
      setData(result);
    } else {
      setData();
    }
  }, [config]);

  const valueChangeHandler = (codeValue) => {
    setValue(codeValue);
  };

  const okHandler = () => {
    // if (!isTest) {
    //   return message.warning('请先测试返回值');
    // }
    try {
      const result = parseCode();
      param.dataSwitch = Array.isArray(result) ? 2 : 1;
      param.dataSwitchContent.code = value;
      onOk(data, param, config.dynamic);
    } catch (error) {
      console.error(error);
    }
  };

  const parseCode = () => {
    let expression = value;
    if (!expression.includes('return')) {
      expression = `return ${expression}`;
    }
    try {
      const result = babelTransform2(expression, defaultData.current);
      if (result === undefined) {
        message.error('JavaScript语法错误，请检查代码格式!');
        return;
      }
      return result;
    } catch {
      message.error('代码表达式解析错误，请检查');
    }
  };

  const handleTest = () => {
    const result = parseCode();
    if (Array.isArray(result)) {
      setData(result);
    } else {
      setData();
    }
    if (!isTest) {
      setIsTest(true);
    }
    setTestResult(result);
  };

  const updateDynamicData = (data, setting, notUpdate) => {
    param.dataSwitchContent.dimensionMap = setting.dimensionMap;
    config.dynamic.dimensionMap = setting.dimensionMap;
    setCount((c) => c + 1);
  };

  const titleNode = (
    <div>
      数据格式转换
      <Tooltip title={trackMsg} placement='bottom' getPopupContainer={(triggerNode) => triggerNode.parentNode}>
        <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', marginLeft: 5 }} />
      </Tooltip>
    </div>
  );

  return (
    <Modal
      className={styles.modalDataSwitch}
      getContainer={false}
      title={titleNode}
      width={600}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button type='primary' onClick={okHandler}>
          确定
        </Button>,
      ]}
    >
      <div className='margin-bottom-16'>
        <div>1.默认全局变量：$（jQuery）, moment , _ （lodasdh），以return方式返回结果</div>
        <div>2.当前修改的原值以data的参数形式传递进来</div>
      </div>
      <Edit code={value} changeValue={valueChangeHandler} />
      <Row className={styles.field} align='middle'>
        <Col span={5} className={styles.col}>
          查看变量结构
        </Col>
        <Col span={7} className={styles.col}>
          <Button type='primary' ghost onClick={handleTest} style={{ marginRight: '12px' }}>
            测试返回值
          </Button>
        </Col>
        <Col span={4}>
          {isTest && (
            <Tooltip
              destroyTooltipOnHide={true}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              placement='topRight'
              title={
                <div style={{ width: '240px' }}>
                  <LargeEdit language={'json'} value={testResult} fullScreenVisible={false} />
                </div>
              }
            >
              <span style={{ marginLeft: 10 }}>查看结果</span>
            </Tooltip>
          )}
        </Col>
      </Row>
      {/* 属性映射 */}
      {config && <MapField config={config} dataset={data} updateDynamicData={updateDynamicData} />}
    </Modal>
  );
};

export default Index;
