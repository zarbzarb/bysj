/*
 * @Author: lvbowen
 * @Date: 2022-05-23 10:33:40
 * @LastEditors: lvbowen
 * @LastEditTime: 2022-06-01 11:32:09
 * @Description:粒子特效, 效果见：http://172.26.30.146:31800/#/js_3dapi?menu=reservoirflood
 */
import React, { useState, useEffect } from 'react';
import { Row, Col, Radio, Select, Tooltip, Input, InputNumber, Collapse } from 'antd';
import styles from './index.less';
import _ from 'lodash';
import ColorPicker from '@/components/ColorPicker';
import VariableRefEsQuery from './VariableRefEsQuery';
import LargeEdit from '@/components/commons/LargeEdit';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
import { getCurrentAction } from '../../../utils';

const { Option } = Select;
const { Panel } = Collapse;

const dataTypeOpts = [
  { label: '默认值', value: 'default' },
  { label: '引用变量', value: 'varible' },
];

const MapParticleEffects = ({ comp, parentIdx, actionIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  const [querys, setQuerys] = useState(item.actionSettings);

  const {
    posDataType = 'default',
    positionVal = {
      lon: 103.273298,
      lat: 36.058203,
      height: 1610,
      scale: 1.5,
      show: 1,
    },
    positionVariable = undefined,
    positionVariableExp = 'data',
    lonMapField = 'lon',
    latMapField = 'lat',
    heightMapField = 'height',
    scaleMapField = 'scale',
    showMapField = 'show',
    initStartColor = 'rgba(224,255,255,0.3)',
    initEndColor = 'rgba(255,255,255,0.0)',
    initStartScale = 2,
    initEndScale = 4,
    minimumParticleLife = 1.1,
    maximumParticleLife = 3.1,
    minimumSpeed = 4.0, // 设置以米/秒为单位的最小界限，超过该最小界限，随机选择粒子的实际速度。
    maximumSpeed = 16.0, // 设置以米/秒为单位的最大界限，超过该最大界限，随机选择粒子的实际速度。
    emissionRate = 200.0, // 每秒要发射的粒子数。
    lifetime = 8.0,
    transX = 2, // X轴方向上的偏离距离（单位：米）
    gravity = -15, //重力因子
    maxHeight = 2000, // 超出该高度后不显示粒子效果
    directionNorth = 101.5, // x轴 ：北向，y轴：东向，z轴：上方向
    directionEast = 113.6,
    directionUp = 84.2,
  } = querys;

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

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          位置数据
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            value={posDataType}
            placeholder='请选择类型'
            onChange={(evt) => {
              changeFieldValues('posDataType', evt);
            }}
          >
            {dataTypeOpts.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          字段
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span style={{ fontSize: 12 }}>映射</span>
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span style={{ fontSize: 12 }}>状态</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          lon
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={lonMapField}
            onChange={(e) => {
              changeFieldValues('lonMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span style={{ fontSize: 12 }}>可选</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          lat
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={latMapField}
            onChange={(e) => {
              changeFieldValues('lonMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>可选</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          height
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={heightMapField}
            onChange={(e) => {
              changeFieldValues('lonMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>可选</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          scale
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={scaleMapField}
            onChange={(e) => {
              changeFieldValues('lonMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>可选</span>
        </Col>
      </Row>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          show
        </Col>
        <Col flex='156px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Input
            style={{ width: 150 }}
            placeholder=''
            value={showMapField}
            onChange={(e) => {
              changeFieldValues('lonMapField', e.target.value);
            }}
          />
        </Col>
        <Col flex='50px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <span>可选</span>
        </Col>
      </Row>
      {posDataType === 'varible' ? (
        <VariableRefEsQuery
          label={'请选择变量'}
          variable={positionVariable}
          name={'positionVariable'}
          expression={positionVariableExp}
          updateField={changeFieldValues}
        />
      ) : (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <LargeEdit
              value={positionVal}
              onChange={(evt) => {
                changeFieldValues('positionVal', evt);
              }}
            />
          </Col>
        </Row>
      )}
      <Collapse expandIconPosition='right' className={styles.mapActionCollapse}>
        <Panel key='style' header='粒子特效样式'>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子产生时颜色
            </Col>
            <Col flex='190px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <ColorPicker
                value={initStartColor}
                onChange={(evt) => {
                  changeFieldValues('initStartColor', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子消失时颜色
            </Col>
            <Col flex='190px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <ColorPicker
                value={initEndColor}
                onChange={(evt) => {
                  changeFieldValues('initEndColor', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子产生时比例
            </Col>
            <Col flex='190px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={initStartScale}
                onChange={(evt) => {
                  changeFieldValues('initStartScale', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子消失时比例
            </Col>
            <Col flex='190px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={initEndScale}
                onChange={(evt) => {
                  changeFieldValues('initEndScale', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子显示最短时间
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={minimumParticleLife}
                onChange={(evt) => {
                  changeFieldValues('minimumParticleLife', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              秒
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子显示最长时间
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={maximumParticleLife}
                onChange={(evt) => {
                  changeFieldValues('maximumParticleLife', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              秒
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子最小速度
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={minimumSpeed}
                onChange={(evt) => {
                  changeFieldValues('minimumSpeed', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              米/秒
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              粒子最大速度
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={maximumSpeed}
                onChange={(evt) => {
                  changeFieldValues('maximumSpeed', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              米/秒
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              每次发射的粒子数
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={emissionRate}
                onChange={(evt) => {
                  changeFieldValues('emissionRate', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              个
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              发射间隔
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={lifetime}
                onChange={(evt) => {
                  changeFieldValues('lifetime', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              秒
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              水平方向偏移
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={transX}
                onChange={(evt) => {
                  changeFieldValues('transX', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              米
            </Col>
          </Row>
          <Collapse expandIconPosition='right' className={styles.mapActionCollapse}>
            <Panel key='pos' header='粒子发射方向' className={styles.bgcolorPanel}>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  北向夹角
                </Col>
                <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <InputNumber
                    value={directionNorth}
                    onChange={(evt) => {
                      changeFieldValues('directionNorth', evt);
                    }}
                  />
                </Col>
                <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  度
                </Col>
              </Row>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  东向夹角
                </Col>
                <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <InputNumber
                    value={directionEast}
                    onChange={(evt) => {
                      changeFieldValues('directionEast', evt);
                    }}
                  />
                </Col>
                <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  度
                </Col>
              </Row>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  上方向夹角
                </Col>
                <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <InputNumber
                    value={directionUp}
                    onChange={(evt) => {
                      changeFieldValues('directionUp', evt);
                    }}
                  />
                </Col>
                <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  度
                </Col>
              </Row>
            </Panel>
          </Collapse>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              重力因子
            </Col>
            <Col flex='186px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={gravity}
                onChange={(evt) => {
                  changeFieldValues('gravity', evt);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              最大显示高度
            </Col>
            <Col flex='140px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={maxHeight}
                onChange={(evt) => {
                  changeFieldValues('maxHeight', evt);
                }}
              />
            </Col>
            <Col flex='46px' style={{ fontSize: 12 }} className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              米
            </Col>
          </Row>
        </Panel>
      </Collapse>
    </div>
  );
};

export default MapParticleEffects;
