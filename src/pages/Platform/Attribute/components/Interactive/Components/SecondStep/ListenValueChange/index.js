import React, { Fragment, useMemo } from 'react';
import { Input, Row, Col, Tooltip, Select, TreeSelect, Radio } from 'antd';
// import StoreTree from '@/components/StoreTree';
import { QuestionCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';

const { Option } = Select;
const { TreeNode } = TreeSelect;
// 展示变量数据源树
const renderNode = (children = []) => {
  return children.map((variableGroup, idx) => {
    return (
      <TreeNode disabled={variableGroup.children} value={variableGroup.key} title={variableGroup.name}>
        {variableGroup.children &&
          variableGroup.children.map((variable, index) => {
            return <TreeNode value={variable.key} title={variable.name} />;
          })}
      </TreeNode>
    );
  });
};

const Index = ({ idx, refresh, comp, agIdx }) => {
  let eventSettings = _.cloneDeep(comp.eventSetings);
  let event = eventSettings[idx];
  let currentGroup = event.groups[agIdx];
  // type 预留用于后期的组件本身引用复值
  const { expression = 'data', variable = '', strategy = 'all' } = currentGroup;
  const updateEventSettings = () => {
    try {
      comp.eventSetings[idx] = { ...comp.eventSetings[idx], ..._.omit(event, ['actions']) };
      eventSettings = _.cloneDeep(comp.eventSetings);
      event = eventSettings[idx];
      currentGroup = event.groups[agIdx];
    } catch (error) {
      console.error(error);
    }
  };
  /**
   * 设置表达式
   * @param {*} evt
   */
  const setExpression = (evt) => {
    updateEventSettings();
    // event.expression = evt.target.value;
    currentGroup.expression = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };
  /**
   * 设置变量字段key值
   * @param {*} value
   */
  const changeSelectValue = (value) => {
    updateEventSettings();
    // event.variable = value; // 选中值存到变量字段统一
    currentGroup.variable = value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const changeStrategy = (evt) => {
    updateEventSettings();
    // event.strategy = evt.target.value; // 图层树和树形选择器有此属性
    currentGroup.strategy = evt.target.value;
    executeCommand('InteractionCommand', comp, eventSettings);
    refresh();
  };

  const title = useMemo(() => {
    let ret = '';
    const { type } = comp;

    switch (type) {
      case 'RadioTabs': // 多按钮
        ret = '存的字符串类型,数据源选项的value';
        break;

      case 'Input': // 输入框
        ret = '存的字符串类型';
        break;

      case 'ColorPicker': // 颜色选择器
        ret = '存的字符串类型，参考数据源';
        break;

      case 'CheckBox': // 复选框
        ret = '存的数组类型,数据源选项的value组成';
        break;

      case 'DatePicker': // 时间选择器
        ret = '存的字符串类型,例如:2022-08-01 12:00:00 或 ["2022-08-01 00:00:00","2022-08-01 23:59:59"]';
        break;

      case 'Select': // 下拉选择器
        ret = '存的字符串类型,数据源选项的value';
        break;

      case 'TreeSelect': // 树形选择器
        ret = '存的数组类型,数据源选项的id组成,仅父节点不包括children的id';
        break;

      case 'TreeList': // 树形列表
        ret = '存的数组类型,数据源选项的key组成,例如:["520100"]';
        break;

      case 'LayerSelect': // 页面选择
        ret = '存的字符串类型,包括页面导航和数据源选项的code,例如:"0:0,page11"';
        break;

      case 'RegionSelect': // 网格选择
        ret = '存的字符串类型,数据源选项的adcode';
        break;

      case 'LayerTree': // 图层树
        ret =
          '存的数组类型,数据源选项组成,例如:[{"key": "1508989972227559424","name": "图层图例-330-面","layerUid": "1508989972227559424","layerKey": "@com_nYiW1Lg574yNsReuwj423R","layerCode": "cim_platform_20220108164107267694186323509248"}]';
        break;

      case 'Radio': // 单选框
        ret = '存的数值类型,数据源选项的value';
        break;
      case '@yl/datai-com-time-line': // 时间轴
        ret = '存的对象类型,为数据源选项,例如:{"label": "周一","value": "Monday"}';
        break;
      case '@yl/datai-com-text-tabs-select': // 选择面板
        ret = '传出选中状态的选项名称，如有多个同时选中则用逗号分隔';
        break;
      case '@yl/datai-com-dynamic-wordcloud': // 动态词云
        ret = '存的对象类型,为数据源选项,例如:{"name": "abc","type": 0, "value": 10}';
        break;
    }
    return ret;
  }, [comp]);

  return (
    <>
      <div className={styles.listenContainer}>
        {/* tab切换组值改变交互配置选择框 */}
        {comp.type == '@yl/datai-com-text-tabs-group' ? (
          <Row className={styles.listenValueRow}>
            <Col className={styles.label} span={24}>
              <Select
                onChange={(value) => {
                  // 选中项索引(根据索引判断是否执行交互)
                  event.index = value;
                }}
                placeholder='请选中对应的选项'
                value={event.index}
                style={{ width: '100%' }}
              >
                {comp.instance._data.map((data, idx) => {
                  return (
                    <Option value={idx} key={idx}>
                      {data.text}
                    </Option>
                  );
                })}
              </Select>
            </Col>
          </Row>
        ) : (
          <>
            {comp.type === 'TreeSelect' && (
              <Row className={styles.listenValueRow}>
                <Col className={styles.label} span={9}>
                  全选保存范围
                </Col>
                <Col span={15}>
                  <Radio.Group onChange={changeStrategy} value={strategy}>
                    <Radio className={styles.radioLable} style={{ fontSize: '12px' }} value='all'>
                      父子节点
                    </Radio>
                    <Radio className={styles.radioLable} style={{ fontSize: '12px' }} value='parent'>
                      仅父节点
                    </Radio>
                  </Radio.Group>
                </Col>
              </Row>
            )}
            <Row className={styles.listenValueRow}>
              {comp.type === 'Input' ? (
                <Col className={styles.label} span={9}>
                  填写数据存到
                  <Tooltip title={title}>
                    <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                  </Tooltip>
                </Col>
              ) : (
                <Col className={styles.label} span={9}>
                  数据存储到
                  <Tooltip title={title}>
                    <Tooltip title='存的字符串类型'>
                      <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                    </Tooltip>
                  </Tooltip>
                </Col>
              )}
              <Col span={15}>
                <TreeSelect
                  suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
                  allowClear
                  showSearch
                  placeholder='请选择'
                  showCheckedStrategy='TreeSelect.SHOW_ALL'
                  className='yl-comp-field-content row'
                  treeNodeFilterProp='title'
                  onChange={changeSelectValue}
                  value={variable}
                >
                  {renderNode(window.dataStore)}
                </TreeSelect>
              </Col>
            </Row>
            <Row className={styles.listenValueRow}>
              <Col className={styles.label} span={9}>
                选中表达式
                <Tooltip title='对当前选中的值进行监听，并满足条件执行，表达式默认依赖变量值data，例：data.age>18'>
                  <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                </Tooltip>
              </Col>
              <Col span={15}>
                <Input defaultValue={expression} onBlur={setExpression} />
              </Col>
            </Row>
          </>
        )}
      </div>
    </>
  );
};

export default Index;
