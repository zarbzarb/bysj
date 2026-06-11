import React, { useState } from 'react';
import { Row, Col, Radio, Select, Tooltip, Collapse } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import { QuestionCircleOutlined } from '@ant-design/icons';
import VariableRefEsQuery from './VariableRefEsQuery';
import LargeEdit from '@/components/commons/LargeEdit';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { variablesText } from '@/staticJson/MapBasic';
import { getCurrentAction } from '../../../utils';

const { Option } = Select;

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      swipDirect = 'horizontal',
      leftLayerType = 'default',
      leftLayerVal = [
        {
          layerCode: 'tianditu',
          zIndex: 2,
        },
      ],
      leftLayerVariable = '',
      leftLayerVariableExp = 'data',
      rightLayerType = 'default',
      rightLayerVal = [
        {
          layerCode: 'tianditu_img',
          zIndex: 2,
        },
      ],
      rightLayerVariable = '',
      rightLayerVariableExp = 'data',
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '主屏图层',
        mapValName: 'leftLayerVal',
        value: leftLayerVal,
        variable: leftLayerVariable,
        expression: leftLayerVariableExp,
        eventType: leftLayerType != 'default' ? '2' : '1',
        tipMsg: variablesText.swipMsgTip,
      },
      {
        label: '次屏图层',
        mapValName: 'rightLayerVal',
        value: rightLayerVal,
        variable: rightLayerVariable,
        expression: rightLayerVariableExp,
        eventType: rightLayerType != 'default' ? '2' : '1',
        tipMsg: variablesText.swipMsgTip,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapSwipCompare = ({ comp, parentIdx, actionIdx, idx, mapType }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);

  const {
    swipDirect = 'horizontal',
    leftLayerType = 'default',
    leftLayerVal = [
      {
        layerCode: 'tianditu',
        zIndex: 2,
      },
    ],
    leftLayerVariable = '',
    leftLayerVariableExp = 'data',
    rightLayerType = 'default',
    rightLayerVal = [
      {
        layerCode: 'tianditu_img',
        zIndex: 2,
      },
    ],
    rightLayerVariable = '',
    rightLayerVariableExp = 'data',
    dataParams = [],
  } = querys;

  const directionOpts = [
    { label: '水平对比', value: 'horizontal' },
    { label: '垂直对比', value: 'vertical' },
    { label: '关闭', value: 'close' },
  ];

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings['dataParams'] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  // 三维卷帘不支持垂直对比
  if (mapType.indexOf('Map3DFoundationPlan') > -1) {
    directionOpts.splice(1, 1);
  }

  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings[path] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  const handleHeatLineChange = (val, field) => {
    changeFieldValues(field, val);
  };

  const onClose = () => {
    setVisible(false);
  };
  let swipMsg = `二维引擎只支持GIS内置的瓦片图层左右放置，三维引擎支持瓦片和倾斜摄影图层（设置layerKey），矢量图层即使设置了左右也无效；变量结构：
  [{
    'layerCode':'tianditu', 
    'zIndex':2
    },   
    {   
    'layerCode':'tianditu_img',   
    'zIndex': 5   
  }]
  zIndex为图层的排序值，可以不填写，新增图层默认顺序为放置在底图之上，放在其他图层下面；已经存在的图层使用现有排序`;

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          操作方式
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={swipDirect}
            placeholder='请选择'
            onChange={(evt) => {
              changeFieldValues('swipDirect', evt);
            }}
          >
            {directionOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {swipDirect != 'close' && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              主(次)屏图层
              {/* <Tooltip title={swipMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip> */}
            </Col>
            <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <EditorParams
                editorType='get'
                initParams={dataParams}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
            {/* <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('leftLayerType', evt.target.value);
                }}
                value={leftLayerType}
              >
                <Radio className={styles.radioLable} value={'default'}>
                  默认值
                </Radio>
                <Radio className={styles.radioLable} value={'varible'}>
                  引用变量
                </Radio>
              </Radio.Group>
            </Col> */}
          </Row>
          {/* {leftLayerType == 'default' ? (
            <Row className={styles.field} align='middle'>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <LargeEdit
                    value={leftLayerVal}
                    onChange={(evt) => {
                      changeFieldValues('leftLayerVal', evt);
                    }}
                  />
                </Col>
              </Row>
            </Row>
          ) : (
            <VariableRefEsQuery
              label={'请选择变量'}
              variable={leftLayerVariable}
              name={'leftLayerVariable'}
              expression={leftLayerVariableExp}
              updateField={changeFieldValues}
            />
          )} */}

          {/* <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              右侧图层
              <Tooltip title={swipMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <EditorParams
                editorType='get'
                initParams={dataParams}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('rightLayerType', evt.target.value);
                }}
                value={rightLayerType}
              >
                <Radio className={styles.radioLable} value={'default'}>
                  默认值
                </Radio>
                <Radio className={styles.radioLable} value={'varible'}>
                  引用变量
                </Radio>
              </Radio.Group>
            </Col>
          </Row> */}
          {/* {rightLayerType == 'default' ? (
            <Row className={styles.field} align='middle'>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <LargeEdit
                    value={rightLayerVal}
                    onChange={(evt) => {
                      changeFieldValues('rightLayerVal', evt);
                    }}
                  />
                </Col>
              </Row>
            </Row>
          ) : (
            <VariableRefEsQuery
              label={'请选择变量'}
              variable={rightLayerVariable}
              name={'rightLayerVariable'}
              expression={rightLayerVariableExp}
              updateField={changeFieldValues}
            />
          )} */}
        </>
      )}

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapSwipCompare;
