import React, { Fragment, useState, useEffect, useMemo } from 'react';
import { Row, Col, Select, Button, message, TreeSelect } from 'antd';
import { getMapTreeComs } from '@/utils/gisCommonUtils';
import _ from 'lodash';
import { useStore } from '@/hooks';
import SelectOpenIcon from '@/assets/svg/selectOpen.svg';
import styles from './index.less';
import SelectAction from './SelectAction';
import ActionStep from './ThirdStep';
import SelectPage from '../components/SelectPage';
import { getCurrentAction, setCurrentAction } from '../../../utils';
// const { Panel } = Collapse;

// 兼容旧屏
const compatible = (item, selectedKey) => {
  if (item.actionSettings.appPageId === undefined) {
    item.actionSettings.appPageId = selectedKey;
  }
};

/**
 *
 * @param {*} item action
 * @param {*} refresh 刷新父组件
 * @param {*} initEventType 事件类型
 * @returns
 */
const Index = ({ initEventType, comp, parentIdx, idx }) => {
  const {
    pageTabsStore: { selectedKey },
    pageTreeStore: { pageInfoMap, actionPageInfoMap },
    globalStore: { bigScreenType },
  } = useStore();
  compatible(getCurrentAction(comp.eventSetings, parentIdx, idx), selectedKey); // 兼容旧屏
  let eventSettings = _.cloneDeep(comp.eventSetings);
  const item = getCurrentAction(eventSettings, parentIdx, idx);
  item.initEventType = initEventType;
  item.compKey = comp.key;
  const [count, setCount] = useState(0);
  // 地图交互配置
  // const [actionSettings, setActionSettings] = useState(item.actionSettings);
  const { actionSettings } = item;
  // 刷新组件
  const comRefresh = () => {
    setCount(count + 1);
  };

  const { mapKey, mapAction = [], mapType, appPageId } = actionSettings;

  // 是否选中地图，选中之后，才可以显示添加按钮
  const [isMapKey, setIsMapKey] = useState(false);

  const getComList = () => {
    let comList = [];
    if (appPageId === selectedKey || !appPageId) {
      // 当前页
      comList = window.componentList || [];
    } else {
      // 跨页面
      if (pageInfoMap[appPageId]) {
        // 如果左侧页面加载过，则用它的，因为可以拿到增删改最新的组件信息
        comList = pageInfoMap[appPageId]?.componentList || [];
      } else if (actionPageInfoMap[appPageId]) {
        // 否则则用自己请求到的
        comList = actionPageInfoMap[appPageId]?.componentList || [];
      }
    }
    return comList;
  };

  const mapTreeComponents = useMemo(() => {
    const result = getMapTreeComs(getComList());
    return result;
  }, [appPageId, actionPageInfoMap[appPageId]]);

  const mapLayers = useMemo(() => {
    let layers = [];
    mapTreeComponents.forEach((item) => {
      if (item.value === mapKey) {
        layers = item.layers;
      }
    });
    return layers;
  }, [mapKey, mapTreeComponents]);

  /**
   * 缓存数据，获取所有基础地图，做为地图选项，
   */
  /* const mapComponents = useMemo(() => {
    let arrTmp = [];
    window.componentList.forEach((item, index) => {
      if (
        item.englishName == 'MapFoundationPlan' ||
        item.englishName == 'Map3DFoundationPlan' ||
        item.englishName == 'MapGlFoundationPlan'
      ) {
        let obj = {
          label: item.name || item.compName, // 组件名称
          value: item.key, // 组件key值
          // idx: index, // 组件在列表中的顺序
          type: item.englishName // 组件英文名
        };
        arrTmp.push(obj);
      }
    });
    return arrTmp;
  }, []); */
  /** 监听地图交互列表，交互列表大于0个，默认地图已选择 */
  useEffect(() => {
    if (mapAction.length > 0) {
      setIsMapKey(true);
    }
  }, [mapAction]);

  const updateEventSettings = () => {
    try {
      setCurrentAction(comp.eventSetings, parentIdx, idx, item);
      eventSettings = _.cloneDeep(comp.eventSetings);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * 选择页面
   * @param {*} val
   */
  const handlePageTreeChange = (val, type) => {
    item.actionSettings.appPageId = val;
    if (type !== 'init') {
      item.actionSettings.mapKey = ''; // 切换页面重置操作的组件
      window.executeCommand('InteractionCommand', comp, eventSettings);
    }
    updateEventSettings();
    comRefresh();
  };

  /**
   * 选中地图
   * @param {*} value  地图组件key值
   * @param {*} option 地图选项列表
   * @returns
   */
  // const changeEventMapKey = (value, option) => {
  const changeEventMapKey = (value, label, extra) => {
    setIsMapKey(true);
    item.actionSettings.mapKey = value;
    item.actionSettings.eventKey = 'gitEventType';
    // item.actionSettings.mapType = option.type
    item.actionSettings.mapType = extra?.triggerNode?.props?.type;
    item.isActive = true; // 用于控制添加一个新动作时打开当前动作面板
    // 交互为空，默认添加一个交互
    if (mapAction.length === 0) {
      mapAction.push({
        actionType: '',
        // isActive: true
      });
    }
    item.actionSettings.layerCodeAll = getAllLayerCode(value);
    item.actionSettings.layerKeyAll = getAllLayerKey(value);
    updateEventSettings();
    executeCommand('InteractionCommand', comp, eventSettings);
    comRefresh(); // 保存事件后不能切换地图
  };
  /**
   * 获取组件对应所有layer的relation_layer_code
   * @param {*} comkey 地图组件key
   * @returns
   */
  const getAllLayerCode = (comkey) => {
    // console.log('getAllLayerCode', comkey);
    const code = [];
    const mapEnglishNameArr = new Set([
      'BasePointLayer',
      'BasePolylineLayer',
      'BasePolygonLayer',
      'BasePointLayer3D',
      'BasePolylineLayer3D',
      'BasePolygonLayer3D',
    ]);
    const foundationPlan = window.componentList.find((item) => {
      return item.key == comkey;
    });
    foundationPlan?.layers?.forEach((v) => {
      if (mapEnglishNameArr.has(v.englishName)) {
        code.push(v.instance.compAttr.relation_layer_code);
      }
    });
    return code;
    // changeFieldValues('layerCodeAll', code);
  };
  /**
   * 获取组件对应所有layer的key
   * @param {*} comkey 地图组件key
   * @returns
   */
  const getAllLayerKey = (comkey) => {
    // console.log('getAllLayerCode', comkey);
    const code = [];
    const mapEnglishNameArr = new Set([
      'BasePointLayer',
      'BasePolylineLayer',
      'BasePolygonLayer',
      'BasePointLayer3D',
      'BasePolylineLayer3D',
      'BasePolygonLayer3D',
    ]);
    const foundationPlan = window.componentList.find((item) => {
      return item.key == comkey;
    });
    foundationPlan?.layers?.forEach((v) => {
      if (mapEnglishNameArr.has(v.englishName)) {
        code.push(v.key);
      }
    });
    return code;
  };
  /**
   * 添加交互事件
   * @returns
   */
  const addAction = () => {
    if (mapAction.length == 9) {
      // 最多9个交互事件
      message.warning('不可添加交互事件，请删除交互事件再添加');
      return;
    }
    const emptyActionState =
      mapAction.findIndex((action) => action.actionType == '' || action.actionType == undefined) > -1;
    if (emptyActionState) {
      message.warning('请先完善空地图交互事件配置！');
      return;
    }
    mapAction.push({
      actionType: '',
    });

    executeCommand('InteractionCommand', comp, eventSettings);
    comRefresh();
  };
  /**
   * 添加互动按钮
   * @param {*} param0
   * @returns
   */
  const AddButton = ({ callback }) => {
    return (
      <Button type='primary' onClick={callback} className={styles.addAction}>
        添加互动
      </Button>
    );
  };
  return (
    <>
      {/* 选择地图 */}
      <div className={styles.eventReleaseContainer}>
        {/* 选择页面 */}
        {bigScreenType === 'page' && <SelectPage appPageId={appPageId} handlePageTreeChange={handlePageTreeChange} />}
        <Row className={styles.eventReleaseValueRow}>
          <Col className={styles.label} span={7}>
            选择地图
          </Col>
          <Col span={17}>
            <TreeSelect
              suffixIcon={<img style={{ width: '15px' }} src={SelectOpenIcon} alt='select icon' />}
              style={{ width: '100%' }}
              value={mapKey}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              treeData={mapTreeComponents}
              placeholder='请选择地图'
              onChange={changeEventMapKey}
            />
          </Col>
        </Row>
      </div>
      {/* 地图交互列表 */}
      {mapAction.map((child, actionIdx) =>
        child.actionType ? (
          // 交互类型对应配置
          <ActionStep
            idx={actionIdx} // 地图动作索引
            actions={mapAction}
            type={child.actionType}
            forceRender={comRefresh}
            item={child}
            key={idx}
            parentItem={item}
            comp={comp}
            parentIdx={parentIdx} // 事件索引
            actionIdx={idx} // 动作索引
            mapLayers={mapLayers}
          />
        ) : (
          // 选择交互类型
          <SelectAction
            mapType={mapType}
            actions={mapAction}
            item={child}
            refresh={comRefresh}
            comp={comp}
            parentIdx={parentIdx} // 事件索引
            actionIdx={idx} // 动作索引
            idx={actionIdx}
            key={actionIdx}
          />
        ),
      )}

      {isMapKey && <AddButton callback={addAction} />}
    </>
  );
};

export default Index;
