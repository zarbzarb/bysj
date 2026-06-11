import React, { useState, useEffect } from 'react';
import { Row, Col, Select, Tooltip, Radio, Collapse, Divider } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import { QuestionCircleOutlined } from '@ant-design/icons';
import DataI from '@/utils/global-api/core';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { variablesText } from '@/staticJson/MapBasic';
import { getCurrentAction } from '../../../utils';
import { InputNumber, Color } from '@yl/datai-ui';

const { Option } = Select;
// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      routePathType = 'refer',
      routePathVal = [
        [
          [116.3884131, 39.9068394],
          [116.3892487, 39.9068682],
          [116.3895836, 39.9068629],
          [116.3898012, 39.9068393],
          [116.3902089, 39.9068064],
          [116.3906166, 39.9067776],
          [116.3907265, 39.9067735],
          [116.3916144, 39.9067879],
          [116.3918727, 39.9068157],
          [116.3922796, 39.906864],
          [116.3926846, 39.9069196],
          [116.393177, 39.9069818],
          [116.3940825, 39.9070069],
        ],
      ],
      routePathVariable = '',
      routePathVariableExp = 'data',
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '轨迹数据',
        mapValName: 'routePathVal',
        value: routePathVal,
        variable: routePathVariable,
        expression: routePathVariableExp,
        eventType: routePathType == 'map' ? '2' : '1',
        tipMsg: variablesText.routePathTip,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};
const MapRoutePath = ({ comp, parentIdx, actionIdx, idx, mapType, mapKey }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [testResult, setTestResult] = useState([]);
  const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const [layerListArr, setLayerListArr] = useState([]);
  const {
    routePathType = 'refer',
    routePathVal = [
      [
        [116.3884131, 39.9068394],
        [116.3892487, 39.9068682],
        [116.3895836, 39.9068629],
        [116.3898012, 39.9068393],
        [116.3902089, 39.9068064],
        [116.3906166, 39.9067776],
        [116.3907265, 39.9067735],
        [116.3916144, 39.9067879],
        [116.3918727, 39.9068157],
        [116.3922796, 39.906864],
        [116.3926846, 39.9069196],
        [116.393177, 39.9069818],
        [116.3940825, 39.9070069],
      ],
    ],
    routePathVariable = '',
    routePathVariableExp = 'data',
    routePathLayer = '',

    routePathLineColor = '#FC3',
    routePathLineWidth = 2,
    routePathLineLength = 30,
    routePathSpeed = 500,
    routePathMultiple = 1,
    routePathDuration = 1000,
    dataParams = [],
  } = querys;

  const dataTypeOpts = [
    { label: '默认值', value: 'default' },
    { label: '引用变量', value: 'refer' },
    { label: '地图数据', value: 'map' },
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
          value: v.instance.compAttr.relation_layer_code,
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

  const handleTrackPlayPathTypeChange = (e) => {
    changeFieldValues('trackPlayPathType', e.target.value);
  };

  const handleRoutePathChange = (val, field) => {
    changeFieldValues(field, val);
  };

  const onClose = () => {
    setVisible(false);
  };
  let trackMsg = `例[
    [
      [116.3884131, 39.9068394],
      [116.3892487, 39.9068682],
      [116.3895836, 39.9068629],
      [116.3898012, 39.9068393],
      [116.3902089, 39.9068064],
      [116.3906166, 39.9067776],
      [116.3907265, 39.9067735],
      [116.3916144, 39.9067879],
      [116.3918727, 39.9068157],
      [116.3922796, 39.906864],
      [116.3926846, 39.9069196],
      [116.393177, 39.9069818],
      [116.3940825, 39.9070069]
    ]
  ]`;
  let map3dTypeFlag = mapType.indexOf('3D') > -1;

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          轨迹数据
          <Tooltip title={trackMsg}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip>
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          {/* <Select
            style={{ width: '100%' }}
            value={routePathType}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('routePathType', evt);
            }}
          >
            {dataTypeOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select> */}
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('routePathType', evt.target.value);
            }}
            value={routePathType}
          >
            <Radio value={'map'}>地图数据</Radio>
            <Radio value={'refer'}>其他数据</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {routePathType == 'refer' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            参数
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
        // <Row className={styles.field} align='middle'>
        //   <Row className={styles.field} align='middle'>
        //     <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
        //       <LargeEdit
        //         value={routePathVal}
        //         onChange={(evt) => {
        //           changeFieldValues('routePathVal', evt);
        //         }}
        //       />
        //     </Col>
        //   </Row>
        // </Row>
      )}
      {/* {routePathType == 'refer' && (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={routePathVariable}
          name={'routePathVariable'}
          expression={routePathVariableExp}
          updateField={changeFieldValues}
        />
      )} */}
      {routePathType == 'map' && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            选择图层
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Select
              style={{ width: '100%' }}
              value={routePathLayer}
              placeholder='请选择类型'
              onChange={(evt) => {
                changeFieldValues('routePathLayer', evt);
              }}
            >
              {layerListArr.map((item) => (
                <Option value={item.value}>{item.label}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      )}
      <div style={{ fontSize: '14px', paddingLeft: '10px', marginTop: '5px' }}>轨迹样式</div>
      <Divider style={{ margin: '2px 0 5px 0' }} />
      {/* <Collapse onChange={() => {}}>
        <Panel header={'轨迹样式'}> */}
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          颜色
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Color
            value={routePathLineColor}
            onChange={(value) => {
              changeFieldValues('routePathLineColor', value);
            }}
          />
        </Col>
      </Row>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          线宽
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          {/* <InputNumber
            min={0}
            style={{ margin: '0 2px' }}
            addonAfter=''
            value={routePathLineWidth}
            formatter={(value) => `${value}px`}
            parser={(value) => value.replace('px', '').replace('p', '').replace('x', '')}
            onChange={(val) => {
              handleRoutePathChange(val, 'routePathLineWidth');
            }}
          /> */}
          <InputNumber
            suffix='px'
            min={0}
            unit={1}
            value={routePathLineWidth}
            onChange={(val) => {
              handleRoutePathChange(val, 'routePathLineWidth');
            }}
          />
        </Col>
      </Row>
      <Row className={styles.field}>
        <Col flex='auto' className={styles.fieldLabel}>
          线长比例
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          {/* <InputNumber
            min={0}
            style={{ margin: '0 2px' }}
            value={routePathLineLength}
            formatter={(value) => `${value}%`}
            parser={(value) => value.replace('%', '')}
            onChange={(val) => {
              handleRoutePathChange(val, 'routePathLineLength');
            }}
          /> */}
          <InputNumber
            suffix='%'
            min={0}
            unit={1}
            value={routePathLineLength}
            onChange={(val) => {
              handleRoutePathChange(val, 'routePathLineLength');
            }}
          />
        </Col>
      </Row>
      {map3dTypeFlag ? (
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            间隔
          </Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            {/* <InputNumber
              min={0}
              style={{ margin: '0 2px' }}
              value={routePathDuration}
              formatter={(value) => `${value}ms`}
              parser={(value) => value.replace('ms', '').replace('m', '').replace('s', '')}
              onChange={(val) => {
                handleRoutePathChange(val, 'routePathDuration');
              }}
            /> */}
            <InputNumber
              suffix='ms'
              min={0}
              unit={1}
              value={routePathDuration}
              onChange={(val) => {
                handleRoutePathChange(val, 'routePathDuration');
              }}
            />
          </Col>
        </Row>
      ) : (
        <>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              速度
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              {/* <InputNumber
                min={0}
                style={{ margin: '0 2px' }}
                value={routePathSpeed}
                formatter={(value) => `${value}m/s`}
                parser={(value) =>
                  value.replace('m/s', '').replace('m/', '').replace('/s', '').replace('m', '').replace('s', '')
                }
                onChange={(val) => {
                  handleRoutePathChange(val, 'routePathSpeed');
                }}
              /> */}
              <InputNumber
                suffix='m/s'
                min={0}
                unit={1}
                value={routePathSpeed}
                onChange={(val) => {
                  handleRoutePathChange(val, 'routePathSpeed');
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field}>
            <Col flex='auto' className={styles.fieldLabel}>
              切割精度
              <Tooltip title={'飞线切割精度。数值越大飞线越平滑，性能损耗也越大。'}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              {/* <InputNumber
                min={0}
                style={{ margin: '0 2px' }}
                value={routePathMultiple}
                onChange={(val) => {
                  handleRoutePathChange(val, 'routePathMultiple');
                }}
              /> */}
              <InputNumber
                suffix=' '
                min={0}
                unit={1}
                value={routePathMultiple}
                onChange={(val) => {
                  handleRoutePathChange(val, 'routePathMultiple');
                }}
              />
            </Col>
          </Row>
        </>
      )}

      {/*   </Panel>
      </Collapse> */}

      {/* <DataManage visible={visible} onClose={onClose} type={'1'} /> */}
    </div>
  );
};

export default MapRoutePath;
