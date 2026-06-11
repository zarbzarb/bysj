/*
 * @Author: lvbowen
 * @Date: 2022-04-28 14:54:07
 * @LastEditors: lvbowen
 * @LastEditTime: 2022-05-10 14:34:53
 * @Description: 分屏对比组件
 */
import React, { useState } from 'react';
import { Input, Row, Col, Radio, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import styles from './index.less';
import _ from 'lodash';
import LargeEdit from '@/components/commons/LargeEdit';
import VariableRefEsQuery from './VariableRefEsQuery';
import { updateGisEventSettings, gisInaterActiveCompatible } from './utils';
import EditorParams from '../../Common/EditorParams';
import { getInitParams } from './utils';
import { variablesText } from '@/staticJson/MapBasic';
import { getCurrentAction } from '../../../utils';

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      operationMethod = true,
      mainPosition = 'left',
      // 主屏图层
      mainVariable = undefined,
      mainVariableExp = 'data',
      mainDataType = 'default',
      mainLayerVal = [
        {
          layerCode: 'tianditu',
          zIndex: 2,
        },
      ],
      // 次屏图层
      secondVariable = undefined,
      secondVariableExp = 'data',
      secondDataType = 'default',
      secondLayerVal = [
        {
          layerCode: 'tianditu_img',
          zIndex: 2,
        },
        // {
        //   layerCode: 'tianditu_img_anno',
        //   zIndex: 3
        // }
      ],
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '主屏图层',
        mapValName: 'mainLayerVal',
        value: mainLayerVal,
        variable: mainVariable,
        expression: mainVariableExp,
        eventType: mainDataType != 'default' ? '2' : '1',
        tipMsg: variablesText.trackMsgTip,
      },
      {
        label: '次屏图层',
        mapValName: 'secondLayerVal',
        value: secondLayerVal,
        variable: secondVariable,
        expression: secondVariableExp,
        eventType: secondDataType != 'default' ? '2' : '1',
        tipMsg: variablesText.trackMsgTip,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const Index = ({ comp, parentIdx, actionIdx, idx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  let item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  const {
    operationMethod = true,
    mainPosition = 'left',
    // 主屏图层
    mainVariable = undefined,
    mainVariableExp = 'data',
    mainDataType = 'default',
    mainLayerVal = [
      {
        layerCode: 'tianditu',
        zIndex: 2,
      },
    ],
    // 次屏图层
    secondVariable = undefined,
    secondVariableExp = 'data',
    secondDataType = 'default',
    secondLayerVal = [
      {
        layerCode: 'tianditu_img',
        zIndex: 2,
      },
      // {
      //   layerCode: 'tianditu_img_anno',
      //   zIndex: 3
      // }
    ],
    dataParams = [],
  } = querys;

  // console.log('actionSettings==>', actionSettings, querys);
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

  const trackMsg = `在现有地图上添加指定的图层，只支持GIS内置的瓦片图层；变量结构：
    [{
      'layerCode':'tianditu',
      'zIndex': 2
      },
      {
      'layerCode':'tianditu_img',
      'zIndex': 3
    }]
    zIndex为图层的排序值，可以不填写，新增图层默认顺序为放置在底图之上，放在其他图层下面。`;

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          操作方式
        </Col>
        <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
          <Radio.Group
            onChange={(e) => {
              changeFieldValues('operationMethod', e.target.value);
            }}
            value={operationMethod}
          >
            <Radio className={styles.radioLable} value={true}>
              启动
            </Radio>
            <Radio className={styles.radioLable} value={false}>
              关闭
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {operationMethod && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              主屏位置
            </Col>
            <Col flex='214px' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
              <Radio.Group
                onChange={(e) => {
                  changeFieldValues('mainPosition', e.target.value);
                }}
                value={mainPosition}
              >
                <Radio value='left'>左侧</Radio>
                <Radio value='right'>右侧</Radio>
              </Radio.Group>
            </Col>
          </Row>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              主(次)屏图层
              {/* <Tooltip title={trackMsg}>
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
              <Radio.Group onChange={(e) => changeFieldValues('mainDataType', e.target.value)} value={mainDataType}>
                <Radio value={'default'}>默认值</Radio>
                <Radio value={'varible'}>引用变量</Radio>
              </Radio.Group>
            </Col> */}
          </Row>
          {/* {mainDataType === 'varible' ? (
            <VariableRefEsQuery
              label={'请选择变量'}
              variable={mainVariable}
              name={'mainVariable'}
              expression={mainVariableExp}
              updateField={changeFieldValues}
            />
          ) : (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <LargeEdit
                  value={mainLayerVal}
                  onChange={(evt) => {
                    changeFieldValues('mainLayerVal', evt);
                  }}
                />
              </Col>
            </Row>
          )} */}
          {/* <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              次屏图层
              <Tooltip title={trackMsg}>
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
              <Radio.Group onChange={(e) => changeFieldValues('secondDataType', e.target.value)} value={secondDataType}>
                <Radio value={'default'}>默认值</Radio>
                <Radio value={'varible'}>引用变量</Radio>
              </Radio.Group>
            </Col>
          </Row> */}
          {/* {secondDataType === 'varible' ? (
            <VariableRefEsQuery
              label={'请选择变量'}
              variable={secondVariable}
              name={'secondVariable'}
              expression={secondVariableExp}
              updateField={changeFieldValues}
            />
          ) : (
            <Row className={styles.field} align='middle'>
              <Col flex='auto' className={styles.fieldInput + ' ' + styles.antdFieldInput}>
                <LargeEdit
                  value={secondLayerVal}
                  onChange={(evt) => {
                    changeFieldValues('secondLayerVal', evt);
                  }}
                />
              </Col>
            </Row>
          )} */}
        </>
      )}
    </div>
  );
};

export default Index;
