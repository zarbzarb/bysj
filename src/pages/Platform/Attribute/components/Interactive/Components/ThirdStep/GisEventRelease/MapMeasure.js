import React, { useState } from 'react';
import { Row, Col, Select, TreeSelect, Tooltip, InputNumber, Collapse, Switch, Button } from 'antd';
import _ from 'lodash';
import { measureType2D, measureType3D } from '@/staticJson/MapBasic';
// import ColorPicker from '@/components/ColorPicker';
import FontProps from '@/components/AntdLibs/component/FontProps';
// import VariableRefQuery from './VariableRefQuery';
import { gisInaterActiveCompatible, updateGisEventSettings, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import styles from './index.less';
import { Color } from '@yl/datai-ui';
import { getCurrentAction } from '../../../utils';

const { TreeNode } = TreeSelect;
const { Option } = Select;
const { Panel } = Collapse;

const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode key={variable.key} value={variable.key} title={variable.name} />;
          })}
      </TreeNode>
    );
  });
};

const paramOptions = [
  {
    label: 'all',
    value: 'all',
  },
  {
    label: 'length',
    value: 'value',
  },
  {
    label: 'area',
    value: 'area',
  },
];
// v8.3 兼容旧屏
const compatible = (item) => {
  const { variableVal = '', saveParams = [] } = item.actionSettings;
  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: 'all',
        paramItemId: 'all',
        mapValName: 'variableVal',
        value: 'all',
        variable: variableVal,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  }
};

const MapMeasure = ({ comp, parentIdx, actionIdx, idx, mapType }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item);
  // const [visible, setVisible] = useState(false);
  const [querys, setQuerys] = useState(item.actionSettings);
  const fontStyleList = [
    { label: '标准', value: 'normal' },
    { label: '斜体', value: 'italic' },
  ];
  if (!querys.textStyle) {
    querys.textStyle = {
      color: {
        isGradient: false,
        color: '#fff',
        gradient: 'linear-gradient(0deg, #fff 0%, #2B86C5 100%)',
      },
      fontFamily: 'Microsoft Yahei',
      fontSize: '14px',
      fontStyle: 'normal',
      fontWeight: 'normal',
      lineHeight: '16px',
      textAlign: 'left',
      borderWidth: 0,
      background: 'rgba(0,0,0, .65)',
      border: 'rgba(255,255,255,1)',
    };
  }
  const {
    type = mapType === 'Map3DFoundationPlan' ? 'length' : 'LineString',
    // variableVal = '',
    isClear = false,
    borderColor = '#F90', // 边框颜色
    borderWidth = 1, // 边框宽度
    background = 'rgba(255,255,255,.65)', // 填充色
    textStyle,
    isRes = false,
    saveParams = [],
  } = querys;

  // 测量类型
  const measureArr = mapType === 'Map3DFoundationPlan' ? measureType3D : measureType2D;
  const measureType = mapType === 'Map3DFoundationPlan';

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

  const changeFieldValues = (path, value) => {
    if (item && item.actionType !== '') {
      const isUpdate = gisInaterActiveCompatible(item, path, value);
      if (!isUpdate) return;
      if (path.includes('.')) {
        path = path.split('.');
        item.actionSettings.textStyle[path[1]] = value;
      } else {
        item.actionSettings[path] = value;
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

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          清除测量效果
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Switch
            checked={isClear}
            onChange={(evt) => {
              changeFieldValues('isClear', evt);
            }}
          />
        </Col>
      </Row>
      {!isClear && (
        <>
          <Row className={styles.field} align='middle'>
            <Col flex='auto' className={styles.fieldLabel}>
              测量方式
            </Col>
            <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
              <Select
                onChange={(value) => {
                  changeFieldValues('type', value);
                }}
                value={type}
              >
                {measureArr.map((vl) => {
                  return (
                    <Option value={vl.type} key={vl.label}>
                      {vl.label}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>
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
          {/* 数据存储到变量  查看变量结构 查看结果 */}
          {isRes && (
            <>
              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  <span className='margin-right-8'>数据存储到</span>
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

              <Row className={styles.field} align='middle'>
                <Col flex='auto' className={styles.fieldLabel}>
                  查看变量结构
                </Col>
                <Col flex='206px' className={styles.fieldInput}>
                  <Tooltip
                    title={
                      !measureType
                        ? '{coordinates: [[103.696379196374053, 36.713014740981002], [103.696491092907678, 36.713015966498631],[103.696944765388778, 36.712660510577543]],value: 3000,section_value: [1000, 2000]}'
                        : '{coordinates: [[103.696379196374053, 36.713014740981002,100], [103.696491092907678, 36.713015966498631, 100],[103.696944765388778, 36.712660510577543, 100]],value: 3000'
                    }
                  >
                    <Button>查看</Button>
                  </Tooltip>
                </Col>
              </Row>
            </>
          )}

          <Collapse onChange={() => {}}>
            <Panel header='测量样式'>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  线颜色
                </Col>
                <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                  <Color
                    value={borderColor}
                    onChange={(value) => {
                      changeFieldValues('borderColor', value);
                    }}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  线宽
                </Col>
                <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                  <InputNumber
                    min={0}
                    style={{ margin: '0 2px' }}
                    addonAfter='px'
                    value={borderWidth}
                    // formatter={(value) => `${value}px`}
                    parser={(value) => value.replace('px', '').replace('p', '').replace('x', '')}
                    onChange={(val) => {
                      changeFieldValues('borderWidth', val);
                    }}
                  />
                </Col>
              </Row>

              {(type == 'Polygon' || type == 'area-s' || type == 'area') && (
                <Row className={styles.field}>
                  <Col flex='auto' className={styles.fieldLabel}>
                    区域颜色
                  </Col>
                  <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                    <Color
                      value={background}
                      onChange={(value) => {
                        changeFieldValues('background', value);
                      }}
                    />
                  </Col>
                </Row>
              )}

              <Collapse onChange={() => {}}>
                <Panel header='文字样式'>
                  <FontProps
                    path='textStyle'
                    tableType={measureType ? 'map3D' : ''}
                    extendColor
                    styles={styles}
                    value={textStyle}
                    updateField={changeFieldValues}
                  />
                  {/* <TextStyleProps
                    path={'textStyle'}
                    styles={styles}
                    value={_.get(textStyle, 'textStyle')}
                    updateField={changeFieldValues}
                  /> */}
                  {!measureType && (
                    <>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          字体行高
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <InputNumber
                            min={0}
                            style={{ margin: '0 2px' }}
                            addonAfter='px'
                            value={textStyle.lineHeight}
                            // formatter={(value) => `${value}px`}
                            parser={(value) => value.replace('px', '').replace('p', '').replace('x', '')}
                            onChange={(val) => {
                              console.log(val, 'ppppp');
                              changeFieldValues('textStyle.lineHeight', val);
                            }}
                          />
                        </Col>
                      </Row>
                      <Row className={styles.field} align='middle'>
                        <Col flex='auto' className={styles.fieldLabel}>
                          斜体
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <Select
                            onChange={(val) => {
                              changeFieldValues('textStyle.fontStyle', val);
                            }}
                            value={textStyle.fontStyle}
                          >
                            {fontStyleList.map((vl) => {
                              return (
                                <Option value={vl.value} key={vl.label}>
                                  {vl.label}
                                </Option>
                              );
                            })}
                          </Select>
                        </Col>
                      </Row>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          边框
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <Color
                            value={textStyle.border}
                            onChange={(value) => {
                              changeFieldValues('textStyle.border', value);
                            }}
                          />
                        </Col>
                      </Row>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          边框宽度
                        </Col>
                        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                          <InputNumber
                            min={0}
                            style={{ margin: '0 2px' }}
                            addonAfter='px'
                            value={textStyle.borderWidth}
                            // formatter={(value) => `${value}px`}
                            parser={(value) => value.replace('px', '').replace('p', '').replace('x', '')}
                            onChange={(val) => {
                              changeFieldValues('textStyle.borderWidth', val);
                            }}
                          />
                        </Col>
                      </Row>
                    </>
                  )}

                  <Row className={styles.field}>
                    <Col flex='auto' className={styles.fieldLabel}>
                      填充
                    </Col>
                    <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
                      <Color
                        value={textStyle.background}
                        onChange={(value) => {
                          changeFieldValues('textStyle.background', value);
                        }}
                      />
                    </Col>
                  </Row>
                </Panel>
              </Collapse>
            </Panel>
          </Collapse>
        </>
      )}

      {/* <DataManage visible={visible} onClose={onClose} /> */}
    </div>
  );
};

export default MapMeasure;
