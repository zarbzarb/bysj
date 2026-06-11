import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Tooltip, InputNumber, Collapse, Divider } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import { QuestionCircleOutlined } from '@ant-design/icons';
import VariableRefEsQuery from './VariableRefEsQuery';
import LargeEdit from '@/components/commons/LargeEdit';
import { Color } from '@yl/datai-ui';
import DataI from '@/utils/global-api/core';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
const { Option } = Select;
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { variablesText } from '@/staticJson/MapBasic';
import { getCurrentAction } from '../../../utils';

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      heatLineType = 'default',
      heatLineVal = [
        { key: '101', count: 100 },
        { key: '201', count: 200 },
        { key: '301', count: 300 },
      ],
      heatLineVariable = '',
      heatLineVariableExp = 'data',
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '热力线数据',
        mapValName: 'heatLineVal',
        value: heatLineVal,
        variable: heatLineVariable,
        expression: heatLineVariableExp,
        eventType: heatLineType != 'default' ? '2' : '1',
        tipMsg: variablesText.heatLineTip,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapHeatLine = ({ comp, parentIdx, actionIdx, idx, mapKey }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const [layerListArr, setLayerListArr] = useState([]);

  const {
    heatLineType = 'default',
    heatLineVal = [
      { key: '101', count: 100 },
      { key: '201', count: 200 },
      { key: '301', count: 300 },
    ],
    heatLineVariable = '',
    heatLineVariableExp = 'data',
    heatLineLayer = '',

    highLineColor = 'rgba( 248, 231 , 28 , 1 )',
    lowLineColor = 'rgba( 208, 2 , 27 , 1 )',
    heatLineWidth = 2,
    dataParams = [],
  } = querys;

  const dataTypeOpts = [
    { label: '默认值', value: 'default' },
    { label: '引用变量', value: 'refer' },
    //{ label: '地图数据', value: 'map' }
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
  useEffect(() => {
    getLayerInfo();
  }, []);

  const getLayerInfo = () => {
    let polylineArr = [];
    let mapCom = DataI.getComList(mapKey);
    let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
    foundationPlan?.layers?.forEach((v) => {
      if (v.englishName == 'BasePolylineLayer' || v.englishName == 'BasePolylineLayer3D') {
        polylineArr.push({
          label: v.name,
          //value: v.instance.compAttr.relation_layer_code
          value: v.key,
        });
      }
    });
    setLayerListArr(polylineArr);
  };

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
  let heatLineMsg = `使用此功能需要启用图层默认配置中“指定key字段”;数据结构为：
  [
    {key:'线id',count:100},
    {key:'线id',count:200}
  ]
  其中key为对应线数据的唯一值，count为热力数据`;

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          选择图层
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={heatLineLayer}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('heatLineLayer', evt);
            }}
          >
            {layerListArr.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          渲染数据
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
      </Row>

      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          渲染数据
          <Tooltip title={heatLineMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={heatLineType}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('heatLineType', evt);
            }}
          >
            {dataTypeOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row> */}
      {/* {heatLineType == 'default' && (
        <Row className={styles.field} align='middle'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <LargeEdit
                value={heatLineVal}
                onChange={(evt) => {
                  changeFieldValues('heatLineVal', evt);
                }}
              />
            </Col>
          </Row>
        </Row>
      )} */}
      {/* {heatLineType == 'refer' && (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={heatLineVariable}
          name={'heatLineVariable'}
          expression={heatLineVariableExp}
          updateField={changeFieldValues}
        />
      )} */}

      <div style={{ fontSize: '14px', paddingLeft: '28px', marginTop: '5px' }}>热力线样式</div>
      <Divider style={{ margin: '2px 0 5px 0' }} />

      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          高热度颜色
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Color
            value={highLineColor}
            onChange={(value) => {
              changeFieldValues('highLineColor', value);
            }}
          />
        </Col>
      </Row>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          低热度颜色
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Color
            value={lowLineColor}
            onChange={(value) => {
              changeFieldValues('lowLineColor', value);
            }}
          />
        </Col>
      </Row>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          线宽
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <InputNumber
            min={0}
            style={{ margin: '0 2px' }}
            addonAfter=''
            value={heatLineWidth}
            formatter={(value) => `${value}px`}
            parser={(value) => value.replace('px', '')}
            onChange={(val) => {
              handleHeatLineChange(val, 'heatLineWidth');
            }}
          />
        </Col>
      </Row>

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapHeatLine;
