import React, { useState } from 'react';
import { InputNumber, Row, Col, Select, Radio, Tooltip, Switch, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Color } from '@yl/datai-ui';
import { variablesText } from '@/staticJson/MapBasic';
import _ from 'lodash';
// 数据存储到变量
import VariableRefQuery from './VariableRefQuery';
// 引用变量
import VariableRefEsQuery from './VariableRefEsQuery';
// 设置清除变量
import VariableMonitor from './VariableMonitor';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import MapTable from './MapTable';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';

// const { TextArea } = Input;
const { Option } = Select;

const paramOptions = [
  {
    label: 'all',
    value: 'all',
  },

  {
    label: 'coordinates',
    value: 'coordinates',
  },
  // {
  //   label: 'radius',
  //   value: 'radius',
  // },
  {
    label: 'length',
    value: 'length',
  },
  {
    label: 'area',
    value: 'area',
  },
];

const drawType = [
  {
    type: 'Circle',
    label: '圆形区域',
  },
  {
    type: 'Rectangle',
    label: '矩形区域',
  },
  {
    type: 'Polygon',
    label: '多边形区域',
  },
];

// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    // 区域类型
    drawTypeSw = 'default',
    drawTypeVal = '圆形区域',
    drawTypeVariable = '',
    drawTypeVariableExp = 'data',

    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    borderColorVariable = '', // 边框颜色引用变量
    borderColorVariableExp = 'data', // 边框颜色引用变量表达式

    borderWidthSw = 'default', // 边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    borderWidthVariable = '', // 边框宽度引用变量
    borderWidthVariableExp = 'data', // 边框宽度引用变量表达式

    // 区域颜色
    backgroundSw = 'default',
    background = 'rgba(255,255,255,.65)',
    backgroundVariable = '',
    backgroundVariableExp = 'data',

    //
    isRes = true, // 是否返回数据
    queryDrawVariable = undefined, // 保存数据变量
    // 删除折线id
    deleteDrawVariable,
    dataParams = [],
    saveParams = [],
  } = item.actionSettings;
  if (dataParams.length === 0) {
    const mapOptions = [
      {
        label: '区域类型',
        mapValName: 'drawTypeVal',
        value: drawTypeVal,
        variable: drawTypeVariable,
        expression: drawTypeVariableExp,
        eventType: '2',
        tipMsg: variablesText.drawTipType,
      },
      {
        label: '边框颜色',
        mapValName: 'borderColorVal',
        value: borderColorVal,
        variable: borderColorVariable,
        expression: borderColorVariableExp,
        eventType: '2',
        tipMsg: variablesText.drawTipBorderColor,
      },
      {
        label: '边框线宽',
        mapValName: 'borderWidthVal',
        value: borderWidthVal,
        variable: borderWidthVariable,
        expression: borderWidthVariableExp,
        eventType: '2',
        tipMsg: variablesText.drawTipBorderWidth,
      },
      {
        label: '区域颜色',
        mapValName: 'background',
        value: background,
        variable: backgroundVariable,
        expression: backgroundVariableExp,
        eventType: '2',
        tipMsg: variablesText.drawTiBackground,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }

  if (drawTypeSw === 'default') {
    item.actionSettings.dataParams[0].eventType = '2';
    item.actionSettings.dataParams[0].updateType = 1;
    item.actionSettings.dataParams[0].inputVal = drawType.find((v) => v.type === drawTypeVal)?.label || '圆形区域';
    item.actionSettings.dataParams[1].eventType = '2';
    item.actionSettings.dataParams[1].updateType = 1;
    item.actionSettings.dataParams[1].inputVal = borderColorVal;
    item.actionSettings.dataParams[2].eventType = '2';
    item.actionSettings.dataParams[2].updateType = 1;
    item.actionSettings.dataParams[2].inputVal = borderWidthVal;
    item.actionSettings.dataParams[3].eventType = '2';
    item.actionSettings.dataParams[3].updateType = 1;
    item.actionSettings.dataParams[3].inputVal = background;
    item.actionSettings.drawTypeSw = 'varible';
  }

  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'queryDrawVariable',
        value: 'all',
        variable: queryDrawVariable,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

const MapDraw = ({ comp, parentIdx, actionIdx, idx, mapType }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    // 区域类型
    drawTypeSw = 'default',
    drawTypeVal = 'Circle',
    drawTypeVariable = '',
    drawTypeVariableExp = 'data',

    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    borderColorVariable = '', // 边框颜色引用变量
    borderColorVariableExp = 'data', // 边框颜色引用变量表达式

    borderWidthSw = 'default', // 边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    borderWidthVariable = '', // 边框宽度引用变量
    borderWidthVariableExp = 'data', // 边框宽度引用变量表达式

    // 区域颜色
    backgroundSw = 'default',
    background = 'rgba(255,255,255,.65)',
    backgroundVariable = '',
    backgroundVariableExp = 'data',

    //
    isRes = true, // 是否返回数据
    queryDrawVariable, // 保存数据变量
    // 删除折线id
    deleteDrawVariable,
    dataParams = [],
    saveParams = [],
  } = querys;

  // 保存编辑参数
  const handleOk = (value, editorType) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType !== '') {
      let type = editorType === 'get' ? 'dataParams' : 'saveParams';
      item.actionSettings[type] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };
  // 修改对应配置
  const changeFieldValues = (path, value) => {
    const isUpdate = gisInaterActiveCompatible(item, path, value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType !== '') {
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

  const TooltipCircle =
    '圆形区域返回值:{coordinates: [116.40474273971459, 39.88957851877437, 1000],radius:500,type:"circle"}; 矩形和多边形区域返回值：{coordinates: [[116.41657434303343, 39.93337515133109, 1000],[116.40474273971459, 39.88957851877437, 1000],[116.35350885391898, 39.90924839972355,1000],[116.34027332784443, 39.93254757913646,1000]], type:"polygon"}';
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>参数</span>
          {/* <Tooltip title='格式：区域类型，例："圆形区域"'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <EditorParams
            editorType='get'
            initParams={dataParams}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk}
          />
        </Col>
        {/* <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('drawTypeSw', evt.target.value);
            }}
            value={drawTypeSw}
          >
            <Radio className={styles.radioLable} value='default'>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value='varible'>
              数据驱动
            </Radio>
          </Radio.Group>
        </Col> */}
      </Row>
      <Row className={styles.field} align='middle'>
        <MapTable dataParams={item.actionSettings.dataParams || []}></MapTable>
      </Row>
      {/* {drawTypeSw == 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel}></Col>
          <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
            <Select
              onChange={(value) => {
                changeFieldValues('drawTypeVal', value);
              }}
              value={drawTypeVal}
            >
              {drawType.map((vl) => {
                return (
                  <Option value={vl.type} key={vl.label}>
                    {vl.label}
                  </Option>
                );
              })}
            </Select>
          </Col>
        </Row>
      ) : (
        <>
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
        </>
      )} */}

      {/* {drawTypeSw == 'default' && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>边框颜色</span>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Color
                value={borderColorVal}
                onChange={(v) => {
                  changeFieldValues('borderColorVal', v);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>边框线宽</span>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <InputNumber
                value={borderWidthVal}
                min={0}
                step={1}
                onChange={(value) => {
                  changeFieldValues('borderWidthVal', value);
                }}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>区域颜色</span>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Color
                value={background}
                onChange={(v) => {
                  changeFieldValues('background', v);
                }}
              />
            </Col>
          </Row>
        </>
      )} */}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          是否返回数据
        </Col>
        <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Switch
            checked={isRes}
            onChange={(evt) => {
              changeFieldValues('isRes', evt);
            }}
          />
        </Col>
      </Row>
      {/* 数据存储到变量  查看变量结构 查看结果*/}
      {isRes && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              <span className='margin-right-8'>数据存储到</span>
            </Col>
            <Col flex='206px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <EditorParams
                filterUpdateType={[2, 3]}
                editorType='setOther'
                initParams={saveParams}
                paramOptions={paramOptions}
                comp={comp} // 当前组件
                eventSetting={eventSettings[parentIdx]} // 当前事件
                onOk={handleOk}
                showVariableExpression={false}
                action={action}
              />
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <MapTable dataParams={saveParams || []}></MapTable>
          </Row>
          {/* <VariableRefQuery
            variable={queryDrawVariable}
            name={'queryDrawVariable'}
            updateField={changeFieldValues}
            isGetFeature={false}
          /> */}
          {/* <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              查看变量结构
            </Col>
            <Col flex='186px' className={styles.fieldInput}>
              <Tooltip title={TooltipCircle}>
                <Button>查看</Button>
              </Tooltip>
            </Col>
          </Row> */}
        </>
      )}
      {/* 设置清除变量 */}
      <VariableMonitor variable={deleteDrawVariable} name={'deleteDrawVariable'} updateField={changeFieldValues} />
    </div>
  );
};

export default MapDraw;
