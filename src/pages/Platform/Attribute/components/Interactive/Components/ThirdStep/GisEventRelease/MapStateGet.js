import React, { useState } from 'react';
import { Row, Col, Tooltip } from 'antd';

import _ from 'lodash';
// import add from '@/assets/newIcon/add.png';
import { QuestionCircleOutlined } from '@ant-design/icons';
// import LargeEdit from '@/components/commons/LargeEdit';
// import DataManage, { toggleDataVisible } from '@/pages/Platform/DataManage';
// import DataI from '@/utils/global-api/core';
// import { useStore } from '@/hooks';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import MapTable from './MapTable';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';

// const { TreeNode } = TreeSelect;
// const { Option } = Select;
// const renderNode = (children = []) => {
//   return children.map((variableGroup, idx) => {
//     return (
//       <TreeNode key={variableGroup.key} disabled value={variableGroup.key} title={variableGroup.name}>
//         {variableGroup.children &&
//           variableGroup.children.map((variable, index) => {
//             return <TreeNode key={variable.key} value={variable.key} title={variable.name}></TreeNode>;
//           })}
//       </TreeNode>
//     );
//   });
// };

// const zoomMapList = [
//   '1:295829355',
//   '1:147914677',
//   '1:73957338',
//   '1:36978669',
//   '1:18489334',
//   '1:9244667',
//   '1:4622333',
//   '1:2311166',
//   '1:1155583',
//   '1:577791',
//   '1:288895',
//   '1:144447',
//   '1:72223',
//   '1:36111',
//   '1:18055',
//   '1:9027',
//   '1:4513',
//   '1:2256',
//   '1:1128',
//   '1:564',
// ];
// v8.6.0 新增参数选项
const centerParamOptions = [
  {
    label: '中心点位',
    value: 'coordinates',
  },
];
const zoomParamOptions = [
  {
    label: '比例尺',
    value: 'coordinates',
  },
];
// v8.3 兼容旧屏
const compatible = (item, type) => {
  const { saveParams = [], centerVariable = '', zoomVariable = '' } = item.actionSettings;
  if (saveParams.length === 0) {
    const mapOptions = [
      {
        label: type === 'center' ? '中心点位' : '比例尺',
        paramItemId: 'coordinates',
        mapValName: 'variableVal',
        value: 'coordinates',
        variable: type === 'center' ? centerVariable : zoomVariable,
        expression: 'data',
        eventType: '2',
        // tipMsg: variablesText.queryTipMsg,
      },
    ];
    item.actionSettings.saveParams = getInitParams(mapOptions);
  } else if (saveParams[0]) {
    saveParams[0].paramName = type === 'center' ? '中心点位' : '比例尺'; // 兼容有些旧屏 paramName 是英文字段问题
  }
};

const MapStateGet = ({ comp, parentIdx, actionIdx, idx, mapKey, type }) => {
  // const {
  //   controlStore: { toggleDataVisible },
  // } = useStore();

  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx]; // v8.6.0地图交互
  compatible(item, type);
  // const [testResult, setTestResult] = useState([]);
  const [querys, setQuerys] = useState(item.actionSettings);

  const {
    // name,
    // value,
    // centerVariable = '',
    // zoomVariable = '',
    // expression = 'data',
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

  // const changeFieldValues = (path, value) => {
  //   const isUpdate = gisInaterActiveCompatible(item, path, value);
  //   if (!isUpdate) return;
  //   if (item != undefined && item.actionType != '') {
  //     item.actionSettings[path] = value;
  //     setQuerys({ ...item.actionSettings });
  //     updateGisEventSettings(comp, eventSettings, {
  //       parentIdx,
  //       actionIdx,
  //       idx,
  //       item,
  //     });
  //   }
  // };

  // const onShowState = () => {
  //   const mapCom = DataI.getComList(mapKey);
  //   const foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
  //   const customMapObj = foundationPlan.instance;
  //   if (type === 'center') {
  //     const extent = customMapObj.compAttr.extent;
  //     const { longitude, latitude } = extent;
  //     let centerVariableData = [longitude, latitude - 0];
  //     setTestResult(centerVariableData);
  //   } else if (type == 'zoom') {
  //     let zoom = customMapObj.compAttr.zoom;
  //     let { value: zoomVal } = zoom;
  //     let zoomVariableData = zoomMapList[Number(zoomVal) - 1];
  //     setTestResult(zoomVariableData);
  //   }
  // };

  // let variableVal = type == 'center' ? centerVariable : zoomVariable;
  // let variableField = type == 'center' ? 'centerVariable' : 'zoomVariable';

  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          <span className='margin-right-4'>数据存储到</span>
          <Tooltip placement='right' title={type === 'center' ? '[105.5,30.59]' : '数据格式如：1:2311166'}>
            <QuestionCircleOutlined
              style={{
                fontSize: '14px',
                color: '#3fb5d2',
                marginLeft: 4,
              }}
            />
          </Tooltip>
        </Col>
        <Col flex='214px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <EditorParams
            filterUpdateType={[2, 3]} // 传值方式 组件数据 变量
            editorType='setOther'
            initParams={saveParams} // 编辑参数
            paramOptions={type === 'center' ? centerParamOptions : zoomParamOptions}
            comp={comp} // 当前组件
            eventSetting={eventSettings[parentIdx]} // 当前事件
            onOk={handleOk} // 确定
            showVariableExpression={false}
            action={action} // 交互
          />
        </Col>
      </Row>
      <MapTable dataParams={saveParams || []}></MapTable>
    </div>
  );
};

export default MapStateGet;
