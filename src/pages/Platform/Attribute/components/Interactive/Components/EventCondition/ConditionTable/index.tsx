import React, { useEffect, useMemo, useState } from 'react';
import { Col, Input, message, Row, Select, Table } from 'antd';
import { toJS } from 'mobx';
import { useMemoizedFn } from 'ahooks';
import shortId from 'short-uuid';
import DataI from '@/utils//global-api';
import iconBtnAdd from '@/assets/newIcon/dataSource/btn_add.png';
import iconBtnDel from '@/assets/newIcon/dataSource/btn_delete.png';
import { cloneDeep, isEqual } from 'lodash';
import { passCurrentValueComps, compDataOptions } from '@/utils/common';
import { useStore } from '@/hooks';
import { getOriginalDataFields, groupDataItemOptions } from '../../ThirdStep/utils';
import styles from './index.less';
import CompTree from '../../ComTree';

const getComponent = window.DataI.getComponentByKey;

type RuleType = {
  /**
   * 规则key
   */
  key: string;
  /**
   * 选择的组件key
   */
  compKey: string;
  /**
   * 是否当前选中值 1：当前选中值， 0：默认数据
   */
  isSelected: number;
  /**
   * 组件选中的数据项
   */
  compDataItem: string;
  /**
   * 条件
   */
  operator: 'include' | 'exclude' | '==' | '!==' | '>' | '<' | '>=' | '<=';
  /**
   * 组件的数据项列表
   */
  compDataItemOptions: any[];
  /**
   * 输入参数
   */
  value: string;
};

const conditionOptions = [
  { label: '包含', value: 'include' },
  { label: '不包含', value: 'exclude' },
  { label: '等于', value: '==' },
  { label: '不等于', value: '!=' },
  { label: '大于', value: '>' },
  { label: '小于', value: '<' },
  { label: '大于等于', value: '>=' },
  { label: '小于等于', value: '<=' },
];

// v8.5.1 添加选项
const selectedValueOptions = [
  { label: '当前选中值', value: 1 },
  { label: '默认数据', value: 0 },
];

// 需要特殊处理的显示自定义数据项的组件
export const customOptinsComps = {
  RadioTabs: [
    { label: '名称', value: 'label' },
    { label: '值', value: 'value' },
  ],
  Input: [{ label: '选中值', value: 'value' }],
  NewInput: [{ label: '选中值', value: 'value' }],
  TreeList: [{ label: '选中值', value: 'value' }],
  TreeSelect: [{ label: '选中值', value: 'value' }],
  DatePicker: [
    [{ label: '选中时间', value: 'value' }],
    [
      { label: '开始时间', value: 'startTime' },
      { label: '结束时间', value: 'endTime' },
    ],
  ],
};

export const initialRule: RuleType = {
  key: shortId.generate(),
  // 选择的组件
  compKey: undefined,
  // 是否当前选中值
  isSelected: 1,
  // 组件选中的数据项
  compDataItem: undefined,
  compDataItemOptions: [],
  // 条件
  operator: undefined,
  // 输入参数
  value: '',
};

const ConditionTable = ({ conditionKey, rules, onChange }) => {
  const { globalStore } = useStore();
  const [params, setParams] = useState<RuleType[]>(rules); // 默认有一条空的

  // 获取组件项数据项
  const _getCompDataItemOptions = (selectedComp: any) => {
    const v = selectedComp;
    let options = [];
    if (customOptinsComps[v.type]) {
      // 如果特殊组件
      const myOptions = customOptinsComps[v.type];
      if (v.type === 'DatePicker') {
        // 时间选择器
        return v.props.isRangePicker ? myOptions[1] : myOptions[0];
      }
      return myOptions;
    }
    options = v.type === 'Table' ? compDataOptions(v.key, 'mapField') : compDataOptions(v.key);
    // console.log('options==>', options);
    return options;
  };

  const getCompDataItemOptions = useMemoizedFn((selectedComp) => {
    const options = _getCompDataItemOptions(selectedComp) || [];
    let originalOptions = getOriginalDataFields(selectedComp, toJS(globalStore.screenConfig));

    if (options.every((opt) => opt.sourceType === 'array')) {
      originalOptions = originalOptions.map((opt) => ({ ...opt, sourceType: 'array' }));
    }

    return [...options, ...originalOptions];
  });

  // 选择组件
  const changeRefComp = (val: string, item: RuleType) => {
    console.log(val, item, 'val----item');
    item.compKey = val;
    // v8.5.1修options获取，加上需要特殊处理的显示自定义数据项的组件
    const selectedComp = getComponent(val);
    const options = getCompDataItemOptions(selectedComp);
    item.compDataItemOptions = options;
    item.compDataItem = undefined;
    // v8.5.1 添加当前选中值选项；
    item.isSelected = 1;
    onChange(conditionKey, params);
  };

  // 组件改变了数据源，数据项会发生变化，在点击数据项下拉框时进行刷新
  const refreshOptions = (item) => {
    if (!item.compKey) return;
    const selectedComp = getComponent(item.compKey);
    const options = getCompDataItemOptions(selectedComp);
    if (isEqual(item.compDataItemOptions, options)) return;
    item.compDataItem = undefined;
    item.compDataItemOptions = options;
    onChange(conditionKey, params);
  };

  // v8.5.1 选择是否当前选中值
  const compIsSelectedChange = (val, item) => {
    item.isSelected = val;
    onChange(conditionKey, params);
  };

  // 选择组件数据
  const compDataItemChange = (val, item) => {
    item.compDataItem = val;
    onChange(conditionKey, params);
  };

  // 选择操作符
  const operatorChange = (val, item) => {
    item.operator = val;
    onChange(conditionKey, params);
  };

  // 输入值改变
  const valueChange = (val, item) => {
    item.value = val.target.value;
    onChange(conditionKey, params);
  };

  // 增加规则
  const addRule = () => {
    console.log(params);

    const validate = params.some((rule) => !rule.compKey || !rule.operator || !rule.compDataItem);
    if (validate) return message.warning('请先完成当前规则!');

    const rule = cloneDeep(initialRule);
    rule.key = shortId.generate();
    onChange(conditionKey, [...params, rule]);
  };

  // 删除规则
  const removeRule = (text, item, i) => {
    if (params.length === 1) {
      return message.warning('条件最少需要一条规则!');
    }

    onChange(
      conditionKey,
      params.filter((p) => p.key !== item.key),
    );
  };

  useEffect(() => {
    if (isEqual(params, rules)) return;
    setParams(rules);

    return () => {};
  }, [rules]);

  const columns = [
    {
      title: '请选择组件属性',
      width: 400,
      render: (text, item: RuleType, i) => {
        // v8.5.1 添加是否显示当前选中值选项判断条件
        let hasType = false;
        if (item.compKey) {
          const selectedComp = getComponent(item.compKey);
          if (selectedComp) {
            hasType = passCurrentValueComps.has(selectedComp.type);
          }
        }
        return (
          <Row>
            <Col span={10}>
              <CompTree
                relation={item.compKey}
                onTreeChange={(val) => changeRefComp(val, item)}
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
              />
            </Col>
            <Col span={14}>
              {/* v8.5.1 添加是否当前选中值 */}
              {hasType && (
                <Select
                  placeholder=''
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  style={{
                    marginLeft: 2,
                    width: 95,
                  }}
                  value={item.isSelected === undefined ? 1 : item.isSelected}
                  onChange={(val) => compIsSelectedChange(val, item)}
                  options={selectedValueOptions}
                />
              )}
              <Select
                placeholder='请选择组件的数据'
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                style={{
                  marginLeft: 2,
                  width: hasType ? 95 : 195,
                }}
                value={item.compDataItem}
                onChange={(val) => compDataItemChange(val, item)}
                options={groupDataItemOptions(item.compDataItemOptions)}
                onFocus={() => refreshOptions(item)}
              />
              {/* {item.dataSwitch > 0 ? (
            <img
              className={styles.switchIcon}
              src={item.dataSwitch === 1 ? iconBtnWarn : iconBtnSuccess}
              onClick={() => showDataSwitch(item)}
              alt=''
            />
          ) : null} */}
            </Col>
          </Row>
        );
      },
    },
    {
      title: '条件',
      width: 200,
      render: (text, item, i) => {
        // 组件数据项是数组类型的只需要 包含和不包含两个条件
        let options = conditionOptions;
        if (item.compDataItemOptions.every((opt) => opt.sourceType === 'array')) {
          options = conditionOptions.slice(0, 2);
        }
        return (
          <Row>
            <Col span={24}>
              <Select
                placeholder='请选择'
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                style={{
                  width: '100%',
                }}
                value={item.operator}
                onChange={(val) => operatorChange(val, item)}
                options={options}
              />
            </Col>
          </Row>
        );
      },
    },
    {
      title: '参数',
      width: 300,
      render: (text, item, i) => {
        return (
          <Row>
            <Col span={24} style={{ padding: '0 2px', height: '30px' }}>
              <Input
                placeholder='请输入更改数据'
                style={{ height: '100%' }}
                value={item.value}
                onChange={(val) => valueChange(val, item)}
              />
            </Col>
          </Row>
        );
      },
    },
    {
      title: '操作',
      width: 100,
      render: (text, item, i) => {
        return (
          <Row>
            <Col span={12} className={styles.operationIcon}>
              <img
                src={iconBtnAdd}
                alt='增加'
                onClick={() => {
                  addRule();
                }}
              />
            </Col>
            <Col span={12} className={styles.operationIcon}>
              <img
                src={iconBtnDel}
                alt='删除'
                onClick={() => {
                  removeRule(text, item, i);
                }}
              />
            </Col>
          </Row>
        );
      },
    },
  ];
  return (
    <Table className={styles.editorParamsTable} pagination={false} dataSource={params} columns={columns} bordered />
  );
};

export default ConditionTable;
