import React, { Fragment, useEffect } from 'react';
import { Input, Row, Col, Tooltip, TreeSelect, Button, Radio } from 'antd';
import { QuestionCircleOutlined, PlusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import _ from 'lodash';
import ListenVariableCondition from './ListenVariableCondition';
import styles from './index.less';

const { TreeNode } = TreeSelect;

const compatible = (variables) => {
  variables.forEach((variable) => {
    if (!variable.conditionType) {
      variable.conditionType = 1;
      variable.conditions = [];
    }
  });
};

const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled value={variableGroup.key} title={variableGroup.name} key={idx}>
        {variableGroup.children &&
          variableGroup.children.map((variable, id) => {
            return <TreeNode value={variable.key} title={variable.name} key={id} />;
          })}
      </TreeNode>
    );
  });
};

const Index = ({ idx: index, refresh, comp, agIdx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let item = eventSettings[index];
  let currentGroup = item.groups[agIdx];
  // type 预留用于后期的组件本身引用复值
  const {
    variables = [
      {
        variableKey: undefined,
        expression: 'data',
        timeStamp: Date.now(),
        conditionType: 1, // 条件类型:  1 变量表达式 2 组件条件
        conditions: [],
      },
    ],
    variableKey,
    expression,
  } = currentGroup;
  // 兼容历史设置的监听变量没有条件设置
  compatible(variables);

  const updateEventSettings = () => {
    try {
      comp.eventSetings[index] = { ...comp.eventSetings[index], ..._.pick(item, ['groups']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      item = eventSettings[index];
      currentGroup = eventSettings[index].groups[agIdx];
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    // 兼容老数据
    if (variableKey !== undefined) {
      variables[0].variableKey = variableKey;
      delete item.variableKey;
    }
    if (expression !== undefined) {
      variables[0].expression = expression;
      delete item.expression;
    }

    if (currentGroup.variables === undefined) {
      currentGroup.variables = variables;
    }
    // 修复先打开监听变量交互，后创建变量再去配置监听变量场景会报错问题
    updateEventSettings();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blurHandler = (evt, idx) => {
    updateEventSettings(); // 在下方修改前先把 comp 和 item 更新到最新值（因为其他地方会更新 eventSetings）
    currentGroup.variables[idx].variableKey = evt;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const setExpression = (evt, idx) => {
    updateEventSettings();
    currentGroup.variables[idx].expression = evt.target.value;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const addListenItem = () => {
    updateEventSettings();
    currentGroup.variables.push({
      variableKey: undefined,
      expression: 'data',
      timeStamp: Date.now(),
      conditionType: 1, // 条件类型:  1 变量表达式 2 组件条件
      conditions: [],
    });
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const delListenItem = (idx) => {
    updateEventSettings();
    currentGroup.variables.splice(idx, 1);
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const changeConditionType = (evt, idx) => {
    updateEventSettings();
    currentGroup.variables[idx].conditionType = evt.target.value;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const saveConditions = (conditions, idx) => {
    updateEventSettings();
    currentGroup.variables[idx].conditions = conditions;
    window.executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  return (
    <>
      <div className={styles.listenListWrap}>
        {variables.map((variable, idx) => {
          return (
            <div key={variable.timeStamp} className={styles.listenContainer}>
              <Row>
                <Col span={16}>监听变量{idx + 1}</Col>
                <Col
                  span={8}
                  className={styles.delListenItemBtn}
                  onClick={() => {
                    delListenItem(idx);
                  }}
                >
                  <DeleteOutlined />
                </Col>
              </Row>

              <Row className={styles.listenValueRow}>
                <Col className={styles.label} span={7}>
                  变量
                </Col>
                <Col span={14}>
                  <TreeSelect
                    allowClear
                    showSearch
                    placeholder='请选择关联变量'
                    treeNodeFilterProp='title'
                    value={variable.variableKey}
                    onChange={(evt) => {
                      blurHandler(evt, idx);
                    }}
                    showCheckedStrategy='TreeSelect.SHOW_ALL'
                    className='yl-comp-field-content row'
                  >
                    {renderNode(window.dataStore)}
                  </TreeSelect>
                </Col>
              </Row>

              <Row className={styles.listenValueRow}>
                <Col className={styles.label} span={7}>
                  条件类型
                </Col>
                <Col span={17}>
                  <Radio.Group onChange={(evt) => changeConditionType(evt, idx)} value={variable.conditionType}>
                    <Radio className={styles.radioLable} value={1}>
                      变量表达式
                    </Radio>
                    <Radio className={styles.radioLable} value={2}>
                      组件数据
                    </Radio>
                  </Radio.Group>
                </Col>
              </Row>

              {variable.conditionType === 1 && (
                <Row className={styles.listenValueRow}>
                  <Col className={styles.label} span={7}>
                    监听条件
                    <Tooltip title='对当前变量进行监听，并满足条件执行，表达式默认依赖变量值data，例：data.age>18'>
                      <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                    </Tooltip>
                  </Col>
                  <Col span={14}>
                    <Input
                      defaultValue={variable.expression}
                      onBlur={(evt) => {
                        setExpression(evt, idx);
                      }}
                    />
                  </Col>
                </Row>
              )}

              {variable.conditionType === 2 && (
                <ListenVariableCondition
                  item={variable}
                  saveConditions={(conditions) => saveConditions(conditions, idx)}
                  options={{
                    label: '参数', // 配置项名称
                    text: '编辑参数', // 按钮文字
                  }}
                />
              )}
            </div>
          );
        })}

        <Button className={styles.listenItemAddBtn} onClick={addListenItem} icon={<PlusCircleOutlined />} block>
          添加监听变量
        </Button>
      </div>
    </>
  );
};

export default Index;
