import React, { useState } from 'react';
import { InputNumber, Row, Col, Radio, Tooltip, Switch, Button } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Color } from '@yl/datai-ui';
import { variablesText } from '@/staticJson/MapBasic';
import _ from 'lodash';
import styles from './index.less';
// // 数据存储到变量
// import VariableRefQuery from './VariableRefQuery';
// // 引用变量
// import VariableRefEsQuery from './VariableRefEsQuery';
// 设置清除变量
import VariableMonitor from './VariableMonitor';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getCurrentAction } from '../../../utils';

const paramOptions = [
  {
    label: 'all',
    value: 'all',
  },
];
// v8.3 兼容旧屏
const compatible = (item) => {
  const {
    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    borderColorVariable = '', // 边框颜色引用变量
    borderColorVariableExp = 'data', // 边框颜色引用变量表达式

    borderWidthSw = 'default', // 边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    borderWidthVariable = '', // 边框宽度引用变量
    borderWidthVariableExp = 'data', // 边框宽度引用变量表达式
    //
    // isRes = true, // 是否返回数据
    queryLineVariable, // 保存数据变量
    // 删除折线id
    // deleteLineVariable = undefined,
    saveParams = [],
    dataParams = [],
  } = item.actionSettings;
  if (dataParams.length === 0) {
    const mapOptions = [
      {
        label: '边框颜色',
        mapValName: 'borderColorVal',
        value: borderColorVal,
        variable: borderColorVariable,
        expression: borderColorVariableExp,
        eventType: borderColorSw !== 'default' ? '2' : '1',
        tipMsg: variablesText.drawTipBorderColor,
      },
      {
        label: '边框线宽',
        mapValName: 'borderWidthVal',
        value: borderWidthVal,
        variable: borderWidthVariable,
        expression: borderWidthVariableExp,
        eventType: borderWidthSw !== 'default' ? '2' : '1',
        tipMsg: variablesText.drawTipBorderWidth,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'queryLineVariable',
        value: 'all',
        variable: queryLineVariable,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

// const { TextArea } = Input;
// const { Option } = Select;
const MapDrawLine = ({ comp, parentIdx, actionIdx, idx }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    borderColorSw = 'default', // 边框颜色类型
    borderColorVal = 'rgba(0,255,255,1)', // 边框颜色填写值
    // borderColorVariable = '', // 边框颜色引用变量
    // borderColorVariableExp = 'data', // 边框颜色引用变量表达式

    borderWidthSw = 'default', // 边框宽度类型
    borderWidthVal = 5, // 边框宽度填写值
    // borderWidthVariable = '', // 边框宽度引用变量
    // borderWidthVariableExp = 'data', // 边框宽度引用变量表达式
    //
    isRes = true, // 是否返回数据
    // queryLineVariable, // 保存数据变量
    // 删除折线id
    deleteLineVariable,
    dataParams = [],
    saveParams = [],
  } = querys;

  // 保存编辑参数
  const handleOk = (value, editorType) => {
    if (item && item.actionType !== '') {
      const paramType = editorType === 'get' ? 'dataParams' : 'saveParams';
      const isUpdate = gisInaterActiveCompatible(item, paramType, value);
      if (!isUpdate) return;
      item.actionSettings[paramType] = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  // 查看结果
  // const handleTestCallback = (callback) => {};
  // const getExpDataByKey = (variable, expression) => {
  //   let data = getDataByKey(variable);
  //   //const fn = new Function('data', 'expression');
  //   let fn = new Function('data', `return ${expression}`);
  //   return fn(data);
  // };
  // 修改对应配置
  const changeFieldValues = (path, value) => {
    if (item && item.actionType !== '') {
      const isUpdate = gisInaterActiveCompatible(item, path, value);
      if (!isUpdate) return;
      item.actionSettings[path] = value;
      console.log('querys', querys);
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
          <span className='margin-right-8'>边框颜色</span>
          {/* <Tooltip title='格式：边框颜色，例："rgba(0,255,255,1)"'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('borderColorSw', evt.target.value);
            }}
            value={borderColorSw}
          >
            <Radio className={styles.radioLable} value='default'>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value='varible'>
              数据驱动
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {borderColorSw === 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel} />
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <Color
              value={borderColorVal}
              onChange={(v) => {
                changeFieldValues('borderColorVal', v);
              }}
            />
          </Col>
        </Row>
      ) : (
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
        // <VariableRefEsQuery
        //   label={'请选择变量'}
        //   variable={borderColorVariable}
        //   name={'borderColorVariable'}
        //   expression={borderColorVariableExp}
        //   previewResult={true}
        //   updateField={changeFieldValues}
        // />
      )}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-8'>边框线宽</span>
          {/* <Tooltip title='格式：边框线宽，例："5"'>
            <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2' }} />
          </Tooltip> */}
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('borderWidthSw', evt.target.value);
            }}
            value={borderWidthSw}
          >
            <Radio className={styles.radioLable} value='default'>
              填写值
            </Radio>
            <Radio className={styles.radioLable} value='varible'>
              数据驱动
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {borderWidthSw === 'default' ? (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel} />
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
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
      ) : (
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
        // <VariableRefEsQuery
        //   label={'请选择变量'}
        //   variable={borderWidthVariable}
        //   previewResult={true}
        //   name={'borderWidthVariable'}
        //   expression={borderWidthVariableExp}
        //   updateField={changeFieldValues}
        // />
      )}
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          是否返回数据
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
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
              <span className='margin-right-4'>数据存储到</span>
              <Tooltip title={variablesText.routePathTip}>
                <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', marginLeft: 4 }} />
              </Tooltip>
            </Col>
            <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
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
          {/* <VariableRefQuery
            variable={queryLineVariable}
            name={'queryLineVariable'}
            updateField={changeFieldValues}
            isGetFeature={false}
          />
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              查看变量结构
            </Col>
            <Col flex='186px' className={styles.fieldInput}>
              <Tooltip
                title={
                  '数据结构：{coordinates: [[116.41657434303343, 39.93337515133109, 1000],[116.40474273971459, 39.88957851877437, 1000],[116.35350885391898, 39.90924839972355,1000],[116.34027332784443, 39.93254757913646,1000]]}'
                }
              >
                <Button>查看</Button>
              </Tooltip>
            </Col>
          </Row> */}
        </>
      )}
      {/* 设置清除变量 */}
      <VariableMonitor variable={deleteLineVariable} name='deleteLineVariable' updateField={changeFieldValues} />
    </div>
  );
};

export default MapDrawLine;
