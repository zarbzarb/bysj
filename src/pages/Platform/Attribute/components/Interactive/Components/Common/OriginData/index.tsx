/**
 * 编辑参数：注入数据或者传数据出去
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Table, Modal, Row, Col, Select, Input, Tooltip } from 'antd';
import { cloneDeep } from 'lodash';
import shortId from 'short-uuid';
import { toJS } from 'mobx';
import classNames from 'classnames';
import { paramType } from '@/types/platform/attribute';
import { useStore } from '@/hooks';
import { getDataByKey } from '@/utils/dataStoreUtils';
import { passCurrentValueComps, compDataOptions } from '@/utils/common';
import successIcon from '@/assets/icon/success.png';
import StoreTree from '@/components/StoreTree';
import { QuestionCircleOutlined } from '@ant-design/icons';
import CompTree from '../../ThirdStep/components/CompTree';
import { getOriginalDataFields, groupDataItemOptions } from '../../ThirdStep/utils';

import {
  unDynamicComps,
  customOptinsComps,
  noDataSourceConfigComps,
  interactivelyPassInValue,
  getInitParam,
} from '../common';
import styles from './index.less';

// const { confirm } = Modal;

const getComponent = window.DataI.getComponentByKey;

type IProps = {
  initParams: paramType[]; // 参数列表数据
  // editorType?: string; // get-表示数据来源获取值，set-表示数据目标设置值
  // filterUpdateType?: number[]; // 过滤 updateType 列表
  onOk: (p: paramType[]) => void;
  className?: string;
  comp: any;
  eventSetting: any;
  // showVariableExpression?: boolean; // 是否显示变量表达式开关
  callFrom?: string;
  // layerKeys: any; // 图层key
  inputPlaceholder?: string;
};

const initUpdateTypeOptions = [
  { label: '手动输入', value: 1 },
  { label: '组件数据', value: 2 },
  { label: '变量', value: 3 },
];
// v8.5.1 添加选项
const selectedValueOptions = [
  { label: '当前选中值', value: 1 },
  { label: '默认数据', value: 0 },
];

const Index: React.FC<IProps> = (props) => {
  const {
    className,
    initParams,
    // paramOptions,
    onOk,
    comp,
    eventSetting,
    callFrom,
    inputPlaceholder,
  } = props;
  const { globalStore } = useStore();
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState([]); // 加这个 state 转一道是为了支持组件可以动态增加参数的情况
  const [saveParams, setSaveParams] = useState([]); // 记录弹框保存后的参数(最后结果)
  const [updateTypeOptions, setUpdateTypeOptions] = useState(initUpdateTypeOptions);
  // const [paramItemTreeData, setParamItemTreeData] = useState(paramOptions);

  const showEditorParams = async () => {
    setVisible(true);
  };

  // 获取组件、交互传入项数据项
  const _getCompDataItemOptions = (selectedComp: any, item: paramType) => {
    const v = selectedComp;
    let options = [];
    if (
      item.updateType === 4 && // 特殊事件
      eventSetting.eventType === 'clickLegend'
    ) {
      // 单击图例
      options = [{ label: '图例名称', value: 'value' }];
    } else if (customOptinsComps[v.type]) {
      // 如果特殊组件
      const myOptions = customOptinsComps[v.type];
      if (v.type === 'DatePicker') {
        // 时间选择器
        return v.props.isRangePicker ? myOptions[1] : myOptions[0];
      }
      return myOptions;
    } else if (callFrom === 'listenEvent' || v.type === 'Table') {
      options = compDataOptions(v.key, 'mapField'); // 监听事件使用 mapField, 方便复用更新数据交互设置数据项值逻辑
    } else {
      options = compDataOptions(v.key);
    }
    // console.log('options==>', options);
    return options;
  };

  const getCompDataItemOptions = (selectedComp, item, isInteraction = false) => {
    const options = _getCompDataItemOptions(selectedComp, item);
    // 点击图例和嵌套环形图，交互传入值，不展示接口数据字段
    const ignoreOriginalOptions =
      (isInteraction && eventSetting.eventType === 'clickLegend') ||
      (isInteraction && comp.englishName === 'ChartNestRing');
    if (ignoreOriginalOptions) return options;
    const originalOptions = getOriginalDataFields(selectedComp, toJS(globalStore.screenConfig));
    return [...options, ...originalOptions];
  };

  // 选择更新方式
  const updateTypeChange = (val: number, item: paramType) => {
    item.updateType = val;
    item.compKey = undefined;
    item.compDataItem = undefined;
    item.compDataItemOptions = [];
    item.variableKey = '';
    setParams([...params]);
  };

  // 手动输入
  const inputChange = (e: any, item: paramType) => {
    item.inputVal = e.target.value;
    setParams([...params]);
  };

  // 组件数据选择组件
  const changeRefComp = (val: string, item: paramType) => {
    item.compKey = val;
    const selectedComp = getComponent(val);
    const options = getCompDataItemOptions(selectedComp, item);
    item.compDataItemOptions = options;
    item.compDataItem = undefined;
    // v8.5.1 添加当前选中值选项；
    item.isSelected = 1;
    setParams([...params]);
  };

  // v8.5.1 选择是否当前选中值
  const compIsSelectedChange = (val: number, item: paramType) => {
    item.isSelected = val;
    setParams([...params]);
  };

  // 选择组件数据项
  const compDataItemChange = (val: string, item: paramType) => {
    item.compDataItem = val;
    setParams([...params]);
  };

  // 选择变量
  const changeVariable = (val: string, item: paramType) => {
    item.variableKey = val;
    setParams([...params]);
  };

  // 确定
  const okHandler = () => {
    // const empty = params.some((p) => !p.paramItemId);
    // if (empty) {
    //   return message.warning('参数项不能为空');
    // }
    setSaveParams([...params]);
    onOk(params);
    setVisible(false);
  };

  useEffect(() => {
    if (visible) {
      const dataParams = cloneDeep(initParams);
      if (dataParams.length > 0) {
        // eslint-disable-next-line unicorn/no-lonely-if
        if (dataParams[0].updateType === 2 && dataParams[0].compKey) {
          const selectedComp = getComponent(dataParams[0].compKey);
          // console.log(selectedComp, 'selectedComp');
          if (selectedComp) {
            const options = getCompDataItemOptions(selectedComp, dataParams[0]);
            dataParams[0].compDataItemOptions = options; // 刷新组件数据的选项列表
            const index = options.findIndex((item) => item.value === dataParams[0].compDataItem);
            if (index === -1) {
              dataParams[0].compDataItem = '';
            }
          } else {
            dataParams[0].compKey = undefined;
            dataParams[0].compDataItem = undefined;
            dataParams[0].compDataItemOptions = [];
          }
        }
      }
      setParams(dataParams);
    }
    setSaveParams([...initParams]);
  }, [visible]);

  const getPopupContainer = () => document.querySelector('.edit-container') as HTMLElement;
  const columns: any = [
    {
      title: () => {
        return (
          <>
            <span>
              数据来源
              {/* <Tooltip
                  placement='top'
                  color='#454141'
                  getPopupContainer={() => document.body}
                  overlayStyle={{ zIndex: 2001 }}
                  title={variablesText.mapDataType}
                >
                  <QuestionCircleOutlined style={{ fontSize: '14px', color: '#3fb5d2', padding: '0 4px' }} />
                </Tooltip> */}
            </span>
          </>
        );
      },
      width: 500,
      render: (text: string, item: paramType) => {
        const type = false;
        const { updateType } = item;
        // if (paramItemTreeData && item.paramItemId === 'all') {
        //   type = true;
        //   updateType = 3;
        // }
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
            <Col span={7}>
              <Select
                placeholder='请选择更新方式'
                getPopupContainer={getPopupContainer}
                style={{
                  width: 150,
                }}
                value={updateType}
                onChange={(val) => updateTypeChange(val, item)}
                options={initUpdateTypeOptions}
              />
            </Col>
            <Col span={17} style={{ left: 2 }}>
              {updateType === 1 && (
                <Input
                  placeholder={inputPlaceholder || '请输入更改数据'}
                  style={{ height: '100%' }}
                  value={item.inputVal}
                  onChange={(val) => inputChange(val, item)}
                />
              )}
              {updateType === 2 && (
                <Row>
                  <Col span={10}>
                    <CompTree
                      type={callFrom || 'compData'} // 不能选择图层和组
                      relation={item.compKey}
                      onTreeChange={(val: string) => changeRefComp(val, item)}
                      getPopupContainer={getPopupContainer}
                    />
                  </Col>
                  <Col span={14}>
                    {/* v8.5.1 添加是否当前选中值 只有获取值时需要选中值，set不需要 */}
                    {hasType ? (
                      <Select
                        placeholder=''
                        getPopupContainer={getPopupContainer}
                        style={{
                          marginLeft: 2,
                          width: 106,
                        }}
                        value={item.isSelected === undefined ? 1 : item.isSelected}
                        onChange={(val) => compIsSelectedChange(val, item)}
                        options={selectedValueOptions}
                      />
                    ) : null}
                    <Select
                      placeholder='请选择组件的数据'
                      getPopupContainer={getPopupContainer}
                      style={{
                        marginLeft: 2,
                        width: hasType ? 106 : 216,
                      }}
                      // dropdownStyle={{
                      //   maxHeight: 200,
                      // }}
                      value={item.compDataItem}
                      onChange={(val) => compDataItemChange(val, item)}
                      options={groupDataItemOptions(item.compDataItemOptions)}
                    />
                  </Col>
                </Row>
              )}
              {/* 变量 */}
              {updateType === 3 && (
                <>
                  <StoreTree
                    style={{
                      width: '95%',
                    }}
                    value={item.variableKey}
                    onChange={(val) => changeVariable(val, item)}
                    getPopupContainer={getPopupContainer}
                  />
                </>
              )}
              {/* {updateType === 4 && (
                <>
                  <Select
                    placeholder='请选择交互区域的值'
                    getPopupContainer={getPopupContainer}
                    style={{
                      width: '320px',
                    }}
                    // dropdownStyle={{
                    //   maxHeight: 200,
                    // }}
                    value={item.interactDataItem}
                    onChange={(val) => interactDataItemChange(val, item)}
                    options={groupDataItemOptions(item.interactDataItemOptions)}
                  />
                  {item.dataSwitch > 0 && editorType === 'get' ? (
                    <img
                      className={styles.switchIcon}
                      src={item.dataSwitch === 1 ? iconBtnWarn : iconBtnSuccess}
                      onClick={() => showDataSwitch(item)}
                      alt=''
                    />
                  ) : null}
                </>
              )} */}
            </Col>
          </Row>
        );
      },
    },
  ];

  const showSuccessIcon = useMemo(() => {
    return saveParams.some((item) => {
      let bool = false;
      if (item.updateType === 1 && item.inputVal) bool = true;
      if (item.updateType === 2 && item.compKey && item.compDataItem) bool = true;
      if (item.updateType === 3 && item.variableKey) bool = true;
      return bool;
    });
  }, [saveParams]);

  return (
    <div className={className}>
      <Button
        className={classNames(styles.editorParamsBtn, showSuccessIcon && styles.success)}
        type='primary'
        onClick={showEditorParams}
      >
        编辑参数
        {showSuccessIcon && <img className={styles.successIcon} src={successIcon} alt='suceess' />}
      </Button>

      {visible && (
        <Modal
          className='antd-dark'
          getContainer={getPopupContainer}
          maskClosable={false}
          keyboard={false}
          title='编辑参数'
          width={650}
          open={visible}
          onOk={okHandler}
          onCancel={() => setVisible(false)}
        >
          <Table
            className={styles.editorParamsTable}
            pagination={false}
            dataSource={params}
            columns={columns}
            scroll={params.length > 8 ? { y: 320 } : null}
            bordered
          />
        </Modal>
      )}
    </div>
  );
};

export default Index;
