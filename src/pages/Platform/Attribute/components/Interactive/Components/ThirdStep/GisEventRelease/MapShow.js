import React, { useState, useMemo } from 'react';
import { Row, Col, Radio, Select, Tooltip, Button, TreeSelect } from 'antd';
import LargeEdit from '@/components/commons/LargeEdit';
import DataI from '@/utils/global-api/core';
import { variablesText } from '@/staticJson/MapBasic';
import _, { isArray } from 'lodash';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import { updateGisEventSettings, gisInaterActiveCompatible, getInitParams } from './utils';
import EditorParams from '../../Common/EditorParams';
import MapTable from './MapTable';
import { getCurrentAction } from '../../../utils';
import styles from './index.less';

const { Option } = Select;
const visibleOpts = [
  {
    label: '显示',
    value: '0',
  },
  {
    label: '隐藏',
    value: '1',
  },
  {
    label: '切换',
    value: '2',
  },
];
const mapEnglistNameArr = [
  'BasePointLayer',
  'BasePolylineLayer',
  'BasePolygonLayer',
  'MapPointPolymerization',
  'MapBreathBubbleLayer',
  'MapInterpolation',
  'MapHotmap',
  'MaskLayer',
  'MapContour',
  'MapFlyList',
  // 'MapGaudOnline'
];
const map3DEnglistNameArr = [
  'BasePointLayer3D',
  'BasePolylineLayer3D',
  'BasePolygonLayer3D',
  'Map3DInterpolationLayer',
  'Map3DHeatMapLayer',
  'Map3DContour',
];

// v8.5.0 新增GL地图子图层支持图层显隐
const mapGLEnglistNameArr = [
  'MapGlBasicLayerNew',
  'MapGlBasePointLayer',
  'MapGlBasePolylineLayer',
  'MapGLBasePolygonLayer',
  'MapGLPlateLayer',
  // MapGlSceneController, // 不支持显隐
  'MapGlBuildingLayerNew', // 支持显隐
  'MapGlCircle',
  // 'MapGlCylinder', // 创建6s
  // 'MapGlDynamicsPoint',
  'MapGlFlyLine',
  // 'MapGlGeoFencing',
  'MapGlHeatMap',
  'MapGlHeatMapNew',
  'MapGlInfoWindow',
  'MapGlLineHeat',
  // 'MapGlPathPlanning',
  'MapGlRegionLine',
  'MapGlRegionMask',
  'MapGlRegionPlate',
  // 'MapGlRegionHeat', // 创建7s
  'MapGlRainbowLine',
  'MapGlBubbleFlyLine',
  'MapGlCubeMaps',
  'MapGlStaticSign',
  'MapGlMaskLayer',
];

// v8.3 兼容旧屏
const compatible = (item) => {
  if (item.actionSettings.dataParams === undefined || item.actionSettings.dataParams?.length === 0) {
    const {
      isVariable = false,
      layerType = [], // 图层
      mapShowExpression = 'data',
      mapShowVariable = '',
    } = item.actionSettings;
    const mapOptions = [
      {
        label: '图层标识',
        mapValName: 'layerType',
        value: layerType,
        variable: mapShowVariable,
        expression: mapShowExpression,
        // eventType: layerCodeSw != 'default' ? '2' : '1',
        eventType: '2',
        tipMsg: variablesText.showTipMsg,
      },
    ];
    item.actionSettings.dataParams = getInitParams(mapOptions); // 设置初始默认值
  }
};

const MapShow = ({ comp, parentIdx, actionIdx, idx, mapType, mapKey, mapLayers }) => {
  const eventSettings = _.cloneDeep(comp.eventSetings);
  const action = getCurrentAction(eventSettings, parentIdx, actionIdx);
  const item = action.actionSettings.mapAction[idx];
  compatible(item); // 兼容旧屏
  const [querys, setQuerys] = useState(item.actionSettings);
  // const [testResult, setTestResult] = useState([]); // 数据变量初始化是数组
  // const [treeLayers, setTreeLayers] = useState([]);
  const {
    isVariable = false, // 是否数据驱动
    layerType = [], // 图层
    visibleStatus = '0', //
    dataParams = [],
  } = querys;

  // 保存编辑参数
  const handleOk = (value) => {
    const isUpdate = gisInaterActiveCompatible(item, 'dataParams', value);
    if (!isUpdate) return;
    if (item != undefined && item.actionType != '') {
      item.actionSettings.dataParams = value;
      setQuerys({ ...item.actionSettings });
      updateGisEventSettings(comp, eventSettings, {
        parentIdx,
        actionIdx,
        idx,
        item,
      });
    }
  };

  // 获取地图对应的图层数据
  // const mapQueryList = useMemo(() => {
  //   let loadLayerType,
  //     variableDatas = [];
  //   const variableData = []; // 存放图层树
  //   const codes = [];
  //   // 支持显隐操作的地图
  //   const EnglistNameArr =
  //     mapType === 'Map3DFoundationPlan'
  //       ? map3DEnglistNameArr
  //       : mapType === 'MapGlFoundationPlan'
  //       ? mapGLEnglistNameArr
  //       : mapEnglistNameArr; // REVIEW liuming 需要替换地图子组件查找的方式
  //   // 获取地图
  //   const mapCom = DataI.getComList(mapKey);
  //   const foundationPlan = mapCom.length > 0 ? mapCom[0] : {};
  //   // 获取地图子图层支持显隐操作的图层存入codes
  //   foundationPlan?.layers?.forEach((v) => {
  //     if (EnglistNameArr.includes(v.englishName)) {
  //       // arrTmp.push(v);
  //       codes.push({
  //         title: v.name,
  //         value: v.key,
  //         // type: v.englishName
  //       });
  //     }
  //   });
  //   // 地图是否动态加载
  //   if (
  //     foundationPlan.englishName === 'MapFoundationPlan' ||
  //     foundationPlan.englishName === 'Map3DFoundationPlan' ||
  //     foundationPlan.englishName === 'MapGlFoundationPlan'
  //   ) {
  //     // 是否动态加载
  //     loadLayerType = foundationPlan.instance?.compAttr.loadLayer;
  //   }

  //   // 遍历组件列表
  //   const loop = (trees) => {
  //     if (!trees || trees.length === 0) return;
  //     trees.forEach((um) => {
  //       // 判断是否图层树
  //       if (um.type === 'LayerTree') {
  //         const treeData = um.props.layerTree;
  //         // 遍历图层树
  //         const LayerTreeLoop = (td) => {
  //           if (!td || td.length === 0) return;
  //           td.forEach((om) => {
  //             const { key, children, title, layerKey } = om;
  //             if (key.includes('@com') || layerKey?.includes('@com')) {
  //               variableData.push({
  //                 title,
  //                 value: layerKey,
  //               });
  //             }
  //             // 递归遍历子集合
  //             LayerTreeLoop(children);
  //           });
  //         };
  //         LayerTreeLoop(treeData);
  //       }
  //       // 判断是否组
  //       if (um.classType === 'group') {
  //         loop(um.childComList);
  //       }
  //     });
  //   };
  //   loop(window.componentList);

  //   // 动态加载合并
  //   variableDatas = loadLayerType ? variableData.concat(codes) : codes;
  //   // setTestResult(variableDatas);
  //   // setTreeLayers(variableData);
  //   // 添加地图引擎
  //   const layerListArrTmp = [];
  //   layerListArrTmp.unshift({
  //     title: '地图引擎',
  //     value: '地图引擎',
  //     selectable: false,
  //     children: variableDatas,
  //   });
  //   console.log(layerListArrTmp, 'ssnnnnnnnnnnnn');
  //   return layerListArrTmp;
  // }, [mapKey, mapType, window.componentList]);

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
  return (
    <div>
      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          选择图层
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            onChange={(evt) => {
              changeFieldValues('isVariable', evt.target.value);
            }}
            value={isVariable}
          >
            <Radio className={styles.radioLable} value={false}>
              勾选
            </Radio>
            <Radio className={styles.radioLable} value={true}>
              数据驱动
            </Radio>
          </Radio.Group>
        </Col>
      </Row>
      {/** 数据驱动 设置变量值信息 */}
      {isVariable && (
        <>
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
          <Row className={styles.field} align='middle'>
            <MapTable dataParams={item.actionSettings.dataParams || []}></MapTable>
          </Row>
        </>
        // <VariableRef
        //   expression={mapShowExpression}
        //   variable={mapShowVariable}
        //   name={'mapShow'}
        //   updateField={changeFieldValues}
        // />
      )}

      {/** 勾选 设置默认值信息 */}
      {!isVariable && (
        <Row className={styles.field} align='middle'>
          <Col flex='auto' className={styles.fieldLabel} />
          <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
            <TreeSelect
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              multiple
              treeCheckable
              treeDefaultExpandAll
              maxTagCount={2}
              style={{ width: '100%' }}
              value={isArray(mapLayers) && mapLayers.length > 0 ? layerType : []}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder='请选择图层'
              onChange={(evt) => {
                console.log('evt*', evt);
                changeFieldValues('layerType', evt);
              }}
              treeData={mapLayers}
              showArrow
            />
          </Col>
        </Row>
      )}

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          操作类型
        </Col>
        <Col flex='206px' className={`${styles.fieldInput} ${styles.antdFieldInput}`}>
          <Radio.Group
            options={visibleOpts}
            onChange={(evt) => {
              changeFieldValues('visibleStatus', evt.target.value);
            }}
            value={visibleStatus}
            optionType='button'
          />
        </Col>
      </Row>

      <Row className={styles.field} align='middle'>
        <Col flex='auto' className={styles.fieldLabel}>
          查看图层码
        </Col>
        <Col flex='206px' className={styles.fieldInput}>
          <Tooltip
            autoAdjustOverflow={true}
            destroyTooltipOnHide={true}
            placement='bottom'
            title={
              <div style={{ width: '240px' }}>
                <LargeEdit value={layerType} />
              </div>
            }
          >
            <Button>查看</Button>
          </Tooltip>
        </Col>
      </Row>
    </div>
  );
};

export default MapShow;
