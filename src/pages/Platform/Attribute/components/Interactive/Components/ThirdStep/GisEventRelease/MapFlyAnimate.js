import React, { useState, useMemo } from 'react';
import { Row, Col, Radio, Select } from 'antd';

import { InputNumber } from '@yl/datai-ui';

import _ from 'lodash';
import { variablesText } from '@/staticJson/MapBasic';

import EditorParams from '../../Common/EditorParams';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';
import styles from './index.less';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';

// v8.3 兼容旧屏
const compatible = (item, mapType) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      isLongVar = false,
      isLatVar = false,
      long,
      longVariableExp = 'data',
      longVariable,
      lat,
      latVariableExp = 'data',
      latVariable,
      zoom,
      isZoomVar = false,
      zoomVariableExp = 'data',
      zoomVariable,
      pitch,
      pitchVariable,
      pitchVariableExp = 'data',
      rotation,
      rotationVariable,
      rotationVariableExp = 'data',
    } = item.actionSettings;
    let mapOptions = [
      {
        label: '经度',
        mapValName: 'lon',
        variable: longVariable,
        expression: longVariableExp,
        value: long,
        eventType: isLongVar ? '2' : '1',
        //   tipMsg: variablesText.mapFlyAnimate,
      },
      {
        label: '纬度',
        mapValName: 'lat',
        variable: latVariable,
        expression: latVariableExp,
        value: lat,
        eventType: isLatVar ? '2' : '1',
        // tipMsg: variablesText.mapFlyAnimate,
      },
      {
        label: '缩放级别',
        mapValName: 'zoom',
        expression: zoomVariableExp,
        variable: zoomVariable,
        value: zoom,
        eventType: isZoomVar ? '2' : '1',
        tipMsg: variablesText.zoomTipMsg,
      },
    ];

    if (mapType === 'Map3DFoundationPlan') {
      pitch, rotation;
      mapOptions.push(
        {
          label: '俯仰角',
          mapValName: 'pitch',
          variable: pitchVariable,
          expression: pitchVariableExp,
          value: pitch,
          tipMsg: variablesText.pitchTipMsg,
        },
        {
          label: '水平角',
          mapValName: 'rotation',
          expression: rotationVariableExp,
          variable: rotationVariable,
          value: rotation,
          tipMsg: variablesText.rotationTipMsg,
        },
      );
    }

    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapFlyAnimate = ({ parentIdx, actionIdx, idx, comp }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  const { mapType } = action.actionSettings;
  compatible(item, mapType); // 兼容旧屏
  const [centerZooms, setCenterZooms] = useState(item.actionSettings);
  const {
    locationMode = false,
    // isLongVar = false,
    // isLatVar = false,
    // long,
    // longVariableExp = 'data',
    // longVariable,
    // lat,
    // latVariableExp = 'data',
    // latVariable,
    // locationMode = false,

    // zoom,
    // isZoomVar = false,
    // zoomVariableExp = 'data',
    // zoomVariable,
    dataParams = [],
    animateTypeVal = 'none',
    animateTimeVal,
  } = centerZooms;

  const animateType = useMemo(() => {
    let animates = [
      {
        value: 'none',
        label: '无',
      },
      {
        value: 'translation',
        label: '平移',
      },
    ];

    if (mapType === 'Map3DFoundationPlan') {
      animates = [
        {
          value: 'none',
          label: '无',
        },
        {
          value: 'LINEAR_NONE',
          label: '平移',
        },
        {
          value: 'SINUSOIDAL_IN',
          label: '正弦曲线',
        },
      ];
    }
    return animates;
  }, []);

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    // 删除报错问题

    // console.log(value, 'ssssssss', item);
    if (item !== undefined && item.actionType !== '') {
      item.actionSettings.dataParams = value;
      setCenterZooms({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    if (!isUpdate) return;
    console.log('changeFieldValues****', comp, item, path, value);
    if (item !== undefined && item.actionType !== '') {
      item.actionSettings[path] = value;
      setCenterZooms({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          定位方式
        </Col>
        <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('locationMode', evt.target.value);
            }}
            value={locationMode}
          >
            <Radio className={styles.radioLable} value={false}>
              手动配置
            </Radio>
            {/* {mapType !== 'Map3DFoundationPlan' && ( */}
            <Radio className={styles.radioLable} value={true}>
              默认位置
            </Radio>
            {/* )} */}
          </Radio.Group>
        </Col>
      </Row>

      {/* {!locationMode && ( 
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              经度
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isLongVar', evt.target.value);
                }}
                value={isLongVar}
              >
                <Radio className={styles.radioLable} value={false}>
                  默认值
                </Radio>
                <Radio className={styles.radioLable} value={true}>
                  引用变量
                </Radio>
              </Radio.Group>
            </Col>
          </Row>
          {isLongVar ? (
            <VariableRefEsQuery
              expression={longVariableExp}
              variable={longVariable}
              name='longVariable'
              updateField={changeFieldValues}
            />
          ) : (
            <Row className={styles.field}>
              <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel} />
              <Col className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <InputNumber
                  placeholder='请输入经度，如116'
                  value={long}
                  step={1}
                  onChange={(value) => {
                    changeFieldValues('long', value);
                  }}
                />
              </Col>
            </Row>
          )}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              纬度
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isLatVar', evt.target.value);
                }}
                value={isLatVar}
              >
                <Radio className={styles.radioLable} value={false}>
                  默认值
                </Radio>
                <Radio className={styles.radioLable} value={true}>
                  引用变量
                </Radio>
              </Radio.Group>
            </Col>
          </Row>

          {isLatVar ? (
            <VariableRefEsQuery
              expression={latVariableExp}
              variable={latVariable}
              name='latVariable'
              updateField={changeFieldValues}
            />
          ) : (
            <Row className={styles.field}>
              <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel} />
              <Col className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                <InputNumber
                  placeholder='请输入纬度，如39'
                  value={lat}
                  step={1}
                  onChange={(value) => {
                    changeFieldValues('lat', value);
                  }}
                />
              </Col>
            </Row>
          )}
        </>
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}>
            参数
          </Col>
          <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <EditorParams
              editorType='get'
              initParams={dataParams}
              comp={comp} // 当前组件
              eventSetting={eventSettings[parentIdx]} // 当前事件
              onOk={handleOk}
            />
          </Col>
        </Row>
      )} */}
      {!locationMode && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              参数
            </Col>
            <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <EditorParams
                editorType='get'
                initParams={dataParams}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <MapTable dataParams={dataParams || []}></MapTable>
          </Row>
        </>
      )}

      {/* <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          缩放级别
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('isZoomVar', evt.target.value);
            }}
            value={isZoomVar}
          >
            <Radio className={styles.radioLable} value={false}>
              默认值
            </Radio>
            <Radio className={styles.radioLable} value={true}>
              引用变量
            </Radio>
          </Radio.Group>
        </Col>
      </Row>

      {isZoomVar ? (
        <VariableRefEsQuery
          label='请选择变量'
          variable={zoomVariable}
          name='zoomVariable'
          expression={zoomVariableExp}
          updateField={changeFieldValues}
        />
      ) : (
        <Row className={styles.field}>
          <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel} />
          <Col className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <InputNumber
              max={18}
              min={1}
              value={zoom}
              onChange={(value) => {
                changeFieldValues('zoom', value);
              }}
              placeholder='填写范围: 1-18'
            />
          </Col>
        </Row>
      )} */}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          定位动画
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Select
            onChange={(value) => {
              changeFieldValues('animateTypeVal', value);
            }}
            value={animateTypeVal}
            options={animateType}
          />
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          动画时间
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <InputNumber
            suffix='ms'
            value={animateTimeVal}
            min={0}
            step={1}
            onChange={(value) => {
              changeFieldValues('animateTimeVal', value);
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default MapFlyAnimate;
