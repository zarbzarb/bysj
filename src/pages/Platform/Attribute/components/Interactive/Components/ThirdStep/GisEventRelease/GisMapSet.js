import React, { useState } from 'react';
import { /* Input, */ Row, Col, Radio } from 'antd';
import _ from 'lodash';
// import StoreTree from '@/components/StoreTree';
import styles from './index.less';
// import VariableRef from './VariableRef';
import EditorParams from '../../Common/EditorParams';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';

const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      isLongitude = false,
      isLat = false,
      longitude,
      lat,
      expression = 'data',
      variable,
      latExpression = 'data',
      latVariable,
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '经度',
        mapValName: 'longitude',
        variable,
        expression,
        value: longitude,
        eventType: isLongitude ? '2' : '1',
      },
      {
        label: '纬度',
        mapValName: 'lat',
        expression: latExpression,
        variable: latVariable,
        value: lat,
        eventType: isLat ? '2' : '1',
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const Index = ({ comp, parentIdx, actionIdx, idx }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [location, setLocation] = useState(item.actionSettings);
  const {
    // // name,
    // // value,
    // isLongitude = false,
    // isLat = false,
    // longitude = undefined,
    // lat = undefined,
    // expression = 'data',
    // variable = undefined,
    // latExpression = 'data',
    // latVariable = undefined,
    locationMode = false,
    dataParams = [],
  } = location;

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    // 删除报错问题

    console.log(value, 'ssssssss', item);
    if (item !== undefined && item.actionType !== '') {
      item.actionSettings.dataParams = value;
      setLocation({ ...item.actionSettings });
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
    // 删除报错问题
    if (item !== undefined && item.actionType !== '') {
      item.actionSettings[path] = value;
      setLocation({ ...item.actionSettings });
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
              默认中心点
            </Radio>
            {/* )} */}
          </Radio.Group>
        </Col>
      </Row>

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
          <MapTable dataParams={dataParams || []}></MapTable>
        </>
      )}

      {/* {!locationMode && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              经度
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isLongitude', evt.target.value);
                }}
                value={isLongitude}
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

          {isLongitude && (
            <VariableRef
              expression={expression}
              variable={variable}
              name={'longitude'}
              updateField={changeFieldValues}
            />
          )}


          {!isLongitude && (
            <Row className={styles.field}>
              <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel}></Col>
              <Col className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Input
                  defaultValue={longitude}
                  onBlur={(evt) => {
                    changeFieldValues('longitude', evt.target.value);
                  }}
                  placeholder='请输入经度，如116'
                />
              </Col>
            </Row>
          )}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              纬度
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isLat', evt.target.value);
                }}
                value={isLat}
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

          {isLat && (
            <VariableRef
              expression={latExpression}
              variable={latVariable}
              name={'lat'}
              updateField={changeFieldValues}
            />
          )}

          {!isLat && (
            <Row className={styles.field}>
              <Col style={{ flex: '0.8 0 auto' }} className={styles.fieldLabel}></Col>
              <Col className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Input
                  defaultValue={lat}
                  onBlur={(evt) => {
                    changeFieldValues('lat', evt.target.value);
                  }}
                  placeholder='请输入纬度，如39'
                />
              </Col>
            </Row>
          )}
        </>
      )} */}
    </div>
  );
};

export default Index;
