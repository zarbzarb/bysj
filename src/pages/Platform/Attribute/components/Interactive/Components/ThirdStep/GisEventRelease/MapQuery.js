import React, { useState, useMemo } from 'react';
import {
  Input,
  Row,
  Col,
  Select,
  Radio,
  Tooltip,
  Switch,
  // Table,
  Collapse,
  Popover,
} from 'antd';
import styles from './index.less';
import { produce } from 'immer';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import VariableRef from './VariableRef';
import VariableRefQuery from './VariableRefQuery';
import EditInput from './EditInput';
import { tableValue, variablesText, mapBaseLayerType } from '@/staticJson/MapBasic'; //初始化时需要的table需要的参数
import SortTree from '@/components/StoreTree'; //选择变量变量
import { getRelateMapLayers } from '@/utils/gisCommonUtils';
import DataI from '@/utils/global-api/core';
import { gisInaterActiveCompatible, updateGisEventSettings } from './utils';
import { getCurrentAction } from '../../../utils';
import MapTable from './MapTable';

const { Option } = Select;
const { TextArea } = Input;
const { Panel } = Collapse;

import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    isVariable = false,
    expression = 'data',
    variable = undefined,
    queryApiVariable = undefined, //保存数据变量
    isLabelRadio = false,
    latExpression = 'data',
    labelVariable = undefined,
    filter,
    label,
    dataParams = [],
    saveParams = [],
  } = item.actionSettings;
  if (dataParams.length === 0) {
    const mapOptions = [
      {
        label: '查询条件',
        mapValName: 'filter',
        value: filter,
        variable,
        expression,
        eventType: isVariable ? '2' : '1',
        tipMsg: variablesText.queryTipMsg,
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

  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'queryApiVariable',
        value: 'all',
        variable: queryApiVariable,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

const MapQuerySet = ({ comp, parentIdx, actionIdx, idx, mapKey }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    layerType = undefined, //图层
    isType = false, //是否返回几何
    isLocation = false, //是否地图定位
    isFilter = true, //是否地图互动(过滤)
    filterWay = 'all',
    isLabelRadio = false,
    isLabel = false, //是否标注
    dataParams = [],
    saveParams = [],
  } = querys;
  const filterMsg = `（1）过滤全部数据，则只渲染本次查询结果 （2）过滤所有查询的数据，则会渲染图层自有的数据和本次查询数据，会过滤掉之前的所有类型查询的数据 （3）过滤同类查询，是指每次查询会过滤掉相同类型的查询之前渲染的数据，不同类型的查询可以相互叠加，比如图层查询和范围查询`;

  // 保存编辑参数
  const handleOk = (value, editorType) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      let type = editorType == 'get' ? 'dataParams' : 'saveParams';
      if (type === 'saveParams') {
        item.actionSettings[type] = value;
      }
      if (type === 'dataParams') {
        for (let data of value) {
          const idx = item.actionSettings[type].findIndex((v) => v.mapValName === data.mapValName);
          item.actionSettings[type][idx] = data;
        }
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

  //获取地图对应的图层数据
  const mapQueryList = useMemo(() => {
    let arrTmp = getRelateMapLayers(mapKey);
    console.log('arrTmp***', arrTmp);
    return arrTmp;
  }, [window.componentList]);

  const getLayerCode = (layerTypes) => {
    let code;
    let mapCom = DataI.getComList(mapKey);
    let foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
    foundationPlan?.layers?.forEach((v) => {
      if (mapBaseLayerType.includes(v.type)) {
        if (v.key == layerTypes) {
          code = v.instance.compAttr.relation_layer_code;
        }
      }
    });
    item.actionSettings['layerCode'] = code;
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
          选择图层
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Select
            style={{ width: '100%' }}
            defaultValue={layerType}
            placeholder='请选择图层'
            onChange={(evt) => {
              getLayerCode(evt);
              changeFieldValues('layerType', evt);
            }}
          >
            {mapQueryList.map((item) => (
              <Option value={item.key}>{item.name}</Option>
            ))}
          </Select>
        </Col>
      </Row>
      {layerType != undefined && (
        <div>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>查询条件</span>
              {/* <Tooltip title="格式：sql语句，如模糊查询：name like '%水%'或 name = '北京市' and value > '1'">
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip> */}
            </Col>
            <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <EditorParams
                editorType='get'
                initParams={dataParams.slice(0, 1)}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
              />
            </Col>
          </Row>

          <MapTable dataParams={dataParams?.slice(0, 1) || []}></MapTable>
          {/* <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>查询条件</span>
              <Tooltip title="格式：sql语句，如模糊查询：name like '%水%'或 name = '北京市' and value > '1'">
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
              </Tooltip>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(evt) => {
                  changeFieldValues('isVariable', evt.target.value);
                }}
                value={isVariable}
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
          {isVariable && (
            <VariableRef expression={expression} variable={variable} name={'filter'} updateField={changeFieldValues} />
          )}
          {!isVariable && (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldLabel}>
                <TextArea
                  placeholder='请输入'
                  style={{ width: 280 }}
                  autoSize={{ maxRows: 6, minRows: 5 }}
                  defaultValue={filter}
                  onChange={(evt) => {
                    changeFieldValues('filter', evt.target.value);
                  }}
                />
              </Col>
            </Row>
          )} */}

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              是否返回几何
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Switch
                checked={isType}
                onChange={(evt) => {
                  changeFieldValues('isType', evt);
                }}
              />
            </Col>
          </Row>

          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>数据存储到</span>
            </Col>
            <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <EditorParams
                filterUpdateType={[2, 3]}
                editorType='setQuery'
                initParams={saveParams}
                // paramOptions={paramOptions}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
                showVariableExpression={false}
                layerKeys={{ mapKey, layerCode: [layerType], layerType: undefined }}
                action={action}
              />
            </Col>
          </Row>

          <MapTable dataParams={saveParams || []} editorType='post'></MapTable>

          {/* <VariableRefQuery
            variable={queryApiVariable}
            filter={filter}
            isType={isType}
            layerCode={layerCode}
            name={'queryApiVariable'}
            updateField={changeFieldValues}
          /> */}

          <Collapse onChange={(evt) => {}}>
            <Panel header={'互动配置'}>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  定位
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
                <Row className={styles.field} align='middle'>
                  <Col flex='auto' className={styles.fieldLabel}>
                    <span className='margin-right-8'>启用类型</span>
                    {/* <Tooltip title='直接启用表示直接启用标注。如数据驱动，参数里启用标识为0时标识启用，其他所有值表示不启用'>
                      <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
                    </Tooltip> */}
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
              )}
              {isLabel && isLabelRadio && (
                <>
                  <Row className={styles.field} align='middle'>
                    <Col flex='auto' className={styles.fieldLabel}>
                      参数
                    </Col>
                    <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                      <EditorParams
                        editorType='get'
                        initParams={dataParams.slice(1, 2)}
                        comp={comp} // 当前组件
                        eventSetting={eventSettings[parentIdx]} // 当前事件
                        onOk={handleOk}
                      />
                    </Col>
                  </Row>
                  <MapTable dataParams={dataParams?.slice(1, 2) || []}></MapTable>
                </>
              )}

              {/* {isLabelRadio && (
                <VariableRef
                  expression={latExpression}
                  variable={labelVariable}
                  name={'label'}
                  updateField={changeFieldValues}
                />
              )} */}
            </Panel>
          </Collapse>
        </div>
      )}
    </div>
  );
};

export default MapQuerySet;
