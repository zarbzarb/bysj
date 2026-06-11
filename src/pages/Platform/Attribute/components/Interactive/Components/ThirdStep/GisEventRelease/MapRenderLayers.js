import React, { useState } from 'react';
import { Row, Col, Select, Radio, Tooltip, Switch, Collapse } from 'antd';
import styles from './index.less';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { renderStyleList, variablesText } from '@/staticJson/MapBasic'; //初始化时需要的table需要的参数
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';
import { InputNumber, Color } from '@yl/datai-ui';

const { Panel } = Collapse;
const { Option } = Select;

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      isLocation = false, //是否地图定位
      isFilter = true, //是否地图互动(过滤)
      filterWay = 'all',
      isLabelRadio = false,
      isLabel = 0, //是否标注
      latExpression = 'data',
      labelVariable = undefined,
      renderLayerVariable = undefined,
      renderLayerExpression = 'data',
      selStyleType = 'selectStyle',
      isRadar = false,
      cycle = 2000,
      radarColor = 'rgba(100, 227, 249, 1.0)',
      renderLayerData = [],
    } = item.actionSettings;
    let label = isLabel;
    if (!isLabelRadio) {
      label = 0;
    }
    const mapOptions = [
      {
        label: '渲染图层和数据',
        mapValName: 'renderLayerData',
        value: renderLayerData,
        variable: renderLayerVariable,
        expression: renderLayerExpression,
        // eventType:circleQueryLayerType,
        eventType: '2',
        tipMsg: variablesText.renderTipMsg,
      },
      {
        label: '标注启用标识',
        mapValName: 'label',
        value: label,
        variable: labelVariable,
        expression: latExpression,
        eventType: isLabelRadio ? '2' : '1',
        tipMsg: variablesText.labelTipMsg,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};
const renderText =
  '将指定的数据以指定样式进行展示，其中必须包含layerCode/layerKey,dataId是对应图层默认配置指定key字段的数据,例：[{layerCode:"xxx",dataId:["337","83"]}],注:（1）将图层重置为标准样式，且过滤标注不生效，配置如[{layerCode:"xxx",dataId:[]}]（2）如果数据为空时，将图层数据置空，过滤效果有效，配置如[{layerCode:"xxx",dataId:[""]}]';
const MapZoomSet = ({ comp, parentIdx, actionIdx, idx, initEventType, mapType }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  item.actionSettings['initEventType'] = initEventType;
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    isLocation = false, //是否地图定位
    isFilter = true, //是否地图互动(过滤)
    filterWay = 'all',
    isLabelRadio = false,
    isLabel = false, //是否标注
    latExpression = 'data',
    labelVariable = undefined,
    renderLayerVariable = undefined,
    renderLayerExpression = 'data',
    selStyleType = 'selectStyle',
    isRadar = false,
    minRadius = mapType === 'Map3DFoundationPlan' ? 2000 : 0,
    maxRadius = mapType === 'Map3DFoundationPlan' ? 2000 : 40,
    cycle = 2000,
    radarColor = 'rgba(100, 227, 249, 1.0)',
    dataParams = [],
  } = querys;
  const filterMsg = `（1）过滤全部数据，则只渲染本次查询结果 （2）过滤所有查询的数据，则会渲染图层自有的数据和本次查询数据，会过滤掉之前的所有类型查询的数据 （3）过滤同类查询，是指每次查询会过滤掉相同类型的查询之前渲染的数据，不同类型的查询可以相互叠加，比如图层查询和范围查询`;

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      // item.actionSettings['dataParams'] = value;
      for (let data of value) {
        const idx = item.actionSettings['dataParams'].findIndex((v) => v.mapValName === data.mapValName);
        item.actionSettings['dataParams'][idx] = data;
      }
      setQuerys({ ...item.actionSettings });
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

  // 保存数据
  const onChange = (item) => {
    changeFieldValues('tableValues', item);
  };
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>请选择渲染图层和数据</span>
          {/* <Tooltip title={renderText}>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          参数
        </Col>
        <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <EditorParams
            editorType='get'
            initParams={dataParams?.slice(0, 1)}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
      </Row>
      <MapTable dataParams={dataParams?.slice(0, 1) || []}></MapTable>
      {/**设置变量值信息 */}
      {/* <VariableRef
        expression={renderLayerExpression}
        variable={renderLayerVariable}
        name={'renderLayerData'}
        updateField={changeFieldValues}
      /> */}

      <Row className={styles.field} align='middle' style={{ paddingTop: '10px' }}>
        <Col flex='auto' className={styles.fieldLabel}>
          渲染样式
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            defaultValue={selStyleType}
            placeholder='请选择渲染样式'
            onChange={(evt) => {
              changeFieldValues('selStyleType', evt);
            }}
          >
            {renderStyleList.map((item) => (
              <Option value={item.value}>{item.label}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Collapse onChange={(evt) => {}}>
        <Panel header={'互动配置'}>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-6'>过滤</span>
              <Tooltip title={filterMsg}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isFilter}
                onChange={(evt) => {
                  changeFieldValues('isFilter', evt);
                }}
              />
            </Col>
          </Row>
          {isFilter && (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                过滤方式
              </Col>
              <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <Radio.Group
                  onChange={(evt) => {
                    changeFieldValues('filterWay', evt.target.value);
                  }}
                  value={filterWay}
                >
                  <Radio className={styles.radioLable} value={'all'}>
                    全部数据
                  </Radio>
                  <Radio className={styles.radioLable} value={'query'}>
                    所有查询
                  </Radio>
                  <Radio className={styles.radioLable} value={'same'}>
                    同类查询
                  </Radio>
                </Radio.Group>
              </Col>
            </Row>
          )}
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              标注
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isLabel}
                onChange={(evt) => {
                  changeFieldValues('isLabel', evt);
                }}
              />
            </Col>
          </Row>
          {isLabel && (
            <div>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  <span className='margin-right-8'>启用类型</span>
                  <Tooltip title='直接启用表示直接启用标注。如数据驱动，参数里启用标识为0时标识启用，其他所有值表示不启用'>
                    <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
                  </Tooltip>
                </Col>
                <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <Radio.Group
                    onChange={(evt) => {
                      changeFieldValues('isLabelRadio', evt.target.value);
                    }}
                    value={isLabelRadio}
                  >
                    <Radio className={styles.radioLable} value={false}>
                      直接启用
                    </Radio>
                    <Radio className={styles.radioLable} value={true}>
                      数据驱动
                    </Radio>
                  </Radio.Group>
                </Col>
              </Row>
              {isLabel && isLabelRadio && (
                <>
                  <Row className={styles.field} align='middle'>
                    <Col flex='auto' className={styles.fieldLabel}>
                      参数
                    </Col>
                    <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                      <EditorParams
                        editorType='get'
                        initParams={dataParams?.slice(1, 2)}
                        comp={comp} // 当前组件
                        eventSetting={eventSettings[parentIdx]} // 当前事件
                        onOk={handleOk}
                      />
                    </Col>
                  </Row>
                  <MapTable dataParams={dataParams?.slice(1, 2) || []}></MapTable>
                </>
                // <VariableRef
                //   expression={latExpression}
                //   variable={labelVariable}
                //   name={'label'}
                //   updateField={changeFieldValues}
                // />
              )}
            </div>
          )}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>雷达波</span>
              <Tooltip title='雷达波特效暂时只对点图层有效'>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isRadar}
                onChange={(evt) => {
                  changeFieldValues('isRadar', evt);
                }}
              />
            </Col>
          </Row>
          {isRadar && (
            <div>
              {/* <Row className={styles.field}>
                <Col flex="auto" className={styles.fieldLabel}>
                  最小半径
                </Col>
                <Col
                  flex="206px"
                  className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  <InputNumber
                    min={0}
                    style={{ margin: '0 2px' }}
                    addonAfter="px"
                    value={minRadius}
                    formatter={(value) => `${value}px`}
                    parser={(value) => value.replace('px', '')}
                    onChange={(val) => {
                      changeFieldValues('minRadius', val);
                    }}
                  />
                </Col>
              </Row> */}
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  半径
                </Col>
                <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  {/* <InputNumber
                    min={0}
                    style={{ margin: '0 2px' }}
                    addonAfter='px'
                    value={maxRadius}
                    formatter={(value) => `${value}px`}
                    parser={(value) => value.replace('px', '')}
                    onChange={(val) => {
                      changeFieldValues('maxRadius', val);
                    }}
                  /> */}
                  <InputNumber
                    suffix='px'
                    min={0}
                    unit={1}
                    value={maxRadius}
                    onChange={(val) => {
                      changeFieldValues('maxRadius', val);
                    }}
                  />
                </Col>
              </Row>

              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  扩散时间
                </Col>
                <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  {/* <InputNumber
                    min={0}
                    style={{ margin: '0 2px' }}
                    value={cycle}
                    formatter={(value) => `${value}ms`}
                    parser={(value) => value.replace('ms', '')}
                    onChange={(val) => {
                      changeFieldValues('cycle', val);
                    }}
                  /> */}
                  <InputNumber
                    suffix='ms'
                    min={0}
                    unit={1}
                    value={cycle}
                    onChange={(val) => {
                      changeFieldValues('cycle', val);
                    }}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  颜色
                </Col>
                <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                  {/* <ColorPicker
                    value={radarColor}
                    onChange={(value) => {
                      changeFieldValues('radarColor', value);
                    }}
                  /> */}
                  <Color
                    value={radarColor}
                    onChange={(value) => {
                      changeFieldValues('radarColor', value);
                    }}
                  />
                </Col>
              </Row>
            </div>
          )}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>定位</span>
              <Tooltip title='目前只支持不开启数据优化'>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isLocation}
                onChange={(evt) => {
                  changeFieldValues('isLocation', evt);
                }}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>
    </div>
  );
};

export default MapZoomSet;
