import React from 'react';
import { Collapse } from 'antd';
// import AnimateInOrOut from './AnimateInOrOut';
// import QuoteTable from '@/components/QuoteTable';
import {
  // FolderViewOutlined,
  DeleteOutlined,
  // EditOutlined
} from '@ant-design/icons';
import { gisEventType } from '@/staticJson/AnimationComponentsList';
import _ from 'lodash';
import styles from './index.less';
import GisMapSet from './GisMapSet';
import MapZoomSet from './MapZoomSet';
import MapCutSet from './MapCutSet';
import MapQuery from './MapQuery';
import MapEsQuery from './MapEsQuery';
import MapStateGet from './MapStateGet';
import MapRenderLayers from './MapRenderLayers';
import MapClickSet from './MapClickSet';
import MapCircleQuery from './MapCircleQuery';
import MapTrackPlayback from './MapTrackPlayback';
import MapRoutePath from './MapRoutePath';
import MapHeatLine from './MapHeatLine';
import MapSetPoint from './MapSetPoint';
import MapShow from './MapShow';
import MapSplitScreen from './MapSplitScreen';
import MapSwipCompare from './MapSwipCompare';
import MapParticleEffects from './MapParticleEffects';
import MapDynamicWater from './MapDynamicWater';
import MapMeasure from './MapMeasure';
import MapDraw from './MapDraw';
import MapSpaceQuery from './MapSpaceQuery';
// v6.19新增绘制线
import MapDrawLine from './MapDrawLine';
import MapFlyAnimate from './MapFlyAnimate';
import MapAnimationPoint from './MapAnimationPoint';
import MapDataSplitRender from './MapDataSplitRender';
import MapLookAt from './MapLookAt';
import { getCurrentAction } from '../../../utils';

const { Panel } = Collapse;
/**
 *
 * @param {*} forceRender 刷新父组件
 * @param {*} actions mapAction
 * @param {*} item action
 * @param {*} type action.actionType
 * @param {*} idx action在mapAction的顺序
 * @param {*} parentItem 最外层action
 * @returns
 */
const Action = ({
  forceRender,
  // actions,
  item,
  type,
  idx,
  parentItem,
  comp,
  parentIdx,
  actionIdx,
  mapLayers,
}) => {
  // console.log('actions', actions);
  // console.log('item', item);
  // console.log('type', type);
  // console.log('parentItem', parentItem);
  /**
   * 获取type对应的action值
   */
  const action = gisEventType.find((action) => action.value == type) || {};
  /**
   * 删除交互
   */
  const delHandler = () => {
    const eventSettings = _.cloneDeep(comp.eventSetings);
    const gisAction = getCurrentAction(eventSettings, parentIdx, actionIdx);
    const actions = gisAction.actionSettings.mapAction;
    actions.splice(idx, 1);
    window.executeCommand('InteractionCommand', comp, eventSettings);
    forceRender(true);
  };
  /**
   * 交互类型面板头部
   */
  const ActionHead = (props) => {
    const { action } = props;
    return (
      <div
        onClick={(evt) => {
          if (evt.target.tagName.toLocaleLowerCase() == 'span') {
            return;
          }
          evt.stopPropagation();
        }}
      >
        <span
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          {action.name}
        </span>
        <span
          className={styles.rightOptions}
          onClick={(evt) => {
            evt.stopPropagation();
          }}
        >
          <DeleteOutlined title='删除' onClick={delHandler} />
        </span>
      </div>
    );
  };
  const props = {
    // action: action, // type对应的action值
    // refresh: forceRender, // 刷新父组件
    item, // action
    mapType: parentItem.actionSettings.mapType, // 外层
    mapKey: parentItem.actionSettings.mapKey,
    comp,
    parentIdx,
    actionIdx,
    idx,
    compKey: parentItem.compKey,
    mapLayers,
    // initEventType: parentItem.initEventType // eventSeting 事件
  };
  return (
    <div>
      <Collapse
        onChange={(evt) => {
          const eventSettings = _.cloneDeep(comp.eventSetings);
          const gisAction = getCurrentAction(eventSettings, parentIdx, actionIdx);
          const actions = gisAction.actionSettings.mapAction;
          actions[idx].isActive = evt.length > 0;
          window.executeCommand('InteractionCommand', comp, eventSettings);
        }}
        // 添加事件动作默认打开最后一个动作面板(打开当前添加的动作面板)
        // parentItem.isActive用于控制 删除、修改名称时关闭面板
        // defaultActiveKey={[actions[idx].isActive ? idx : -1]}>
        defaultActiveKey={item.isActive ? [idx] : []}
      >
        <Panel className={styles.actionHeader} header={<ActionHead action={action} />} key={idx}>
          {/* 定位 */}
          {type === 'mapLocationEvent' && <GisMapSet {...props} />}
          {/* 缩放 */}
          {type === 'mapZoomEvent' && <MapZoomSet {...props} />}
          {/* 切换底图 */}
          {type === 'mapCutEvent' && <MapCutSet {...props} />}
          {/* 查询 */}
          {type === 'mapQuery' && <MapQuery {...props} />}
          {/* 全局查询 */}
          {type === 'mapEsQuery' && <MapEsQuery {...props} />}
          {/* 图层渲染 */}
          {type === 'mapRenderLayers' && <MapRenderLayers {...props} initEventType={parentItem.initEventType} />}
          {/* 获取中心点位 */}
          {type === 'mapGetCenter' && <MapStateGet {...props} type='center' />}
          {/* 获取比例尺 */}
          {type === 'mapGetZoom' && <MapStateGet {...props} type='zoom' />}
          {/* 触发点击 */}
          {type === 'mapSetClick' && <MapClickSet {...props} />}
          {/* 周边查询 */}
          {type === 'mapCircleQuery' && <MapCircleQuery {...props} />}
          {/* 轨迹播放 */}
          {type === 'mapTrackPlayback' && <MapTrackPlayback {...props} />}
          {/* 轨迹飞线 */}
          {type === 'mapRoutePath' && <MapRoutePath {...props} />}
          {/* 热力线渲染 */}
          {type === 'mapHeatLine' && <MapHeatLine {...props} />}
          {/* 地图选点 */}
          {type === 'mapSetPoint' && <MapSetPoint {...props} />}
          {/* 测量 */}
          {type === 'mapMeasure' && <MapMeasure {...props} />}
          {/* 绘制区域 */}
          {type === 'mapDraw' && <MapDraw {...props} />}
          {/* 空间查询 */}
          {type === 'mapSpaceQuery' && <MapSpaceQuery {...props} />}
          {/* 图层显隐 */}
          {type === 'mapShow' && <MapShow {...props} />}
          {/* 分屏对比 */}
          {type === 'mapSplitScreen' && <MapSplitScreen {...props} />}
          {/* 卷帘分析 */}
          {type === 'mapSwipCompare' && <MapSwipCompare {...props} />}
          {/* 粒子特效 */}
          {type === 'mapParticleEffects' && <MapParticleEffects {...props} />}
          {/* 水位升降 */}
          {type === 'mapDynamicWater' && <MapDynamicWater {...props} />}
          {/* v6.19绘制线 */}
          {type === 'mapDrawLine' && <MapDrawLine {...props} />}
          {/* v8.10.0 相机飞行 */}
          {type === 'mapFlyAnimate' && <MapFlyAnimate {...props} />}
          {/* 雷达波 */}
          {type === 'mapAnimationPoint' && <MapAnimationPoint {...props} />}
          {/* 图层数据设置 */}
          {type === 'mapDataSplitRender' && <MapDataSplitRender {...props} />}
          {/* 绕点旋转 */}
          {type === 'mapLookAt' && <MapLookAt {...props} />}
        </Panel>
      </Collapse>
    </div>
  );
};
export default Action;
