/**
 * 地图子组件的属性面板
 */
import React, { Component } from 'react';
import { toJS } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Input, Row, Col, Space, Switch, message } from 'antd';
import { trim } from 'lodash';
import { Store } from '@/store/index';
import '@/styles/pages/attr.less';
import settingIcon from '@/assets/newIcon/设置.png';
import settingHoverIcon from '@/assets/newIcon/设置启用.png';
import datasetIcon from '@/assets/newIcon/数据.png';
import datasetHoverIcon from '@/assets/newIcon/数据启用.png';
import interactiveIcon from '@/assets/newIcon/交互.png';
import interactiveHoverIcon from '@/assets/newIcon/交互启用.png';
import { listerDataiAttrScoll } from '@/utils/componentUtils';
import ModalVariable from '@/pages/Platform/Attribute/components/Interactive/Components/ThirdStep/VariableSettings/ModalVariable';
import BaseLayerDataSource from '../MapDataSource/BaseLayerDataSource';
import MaskLayerDataSource from '../MapDataSource/MaskLayerDataSource';
import ThreedModelDataSource from '../MapDataSource/ThreedModelDataSource';
import MapHotDataSource from '../MapDataSource/MapHotDataSource';
import MapInterpolationDataSource from '../MapDataSource/MapInterpolationDataSource';
import MapContourDataSource from '../MapDataSource/MapContourDataSource';
import VariableRef from '../MapDataSource/VariableRef';
import fieldstyles from '../MapDataSource/index.less';
import Interactive from './components/Interactive';
import DataSource from '../DataSource/DataSourceList';
import hocSetConfigProvider from './components/hocSetConfigProvider';
import BaseMapDataSource from '../MapDataSource/BaseMapDataSource';

const { compLibStore } = Store;
const InteractiveS = hocSetConfigProvider(Interactive);

const dataIcon = {
  setting: {
    icon: settingIcon,
    hoverIcon: settingHoverIcon,
  },
  data: {
    icon: datasetIcon,
    hoverIcon: datasetHoverIcon,
  },
  interactive: {
    icon: interactiveIcon,
    hoverIcon: interactiveHoverIcon,
  },
};

@inject('comStore', 'controlStore', 'ossStore', 'editorStore', 'mapStore', 'pageTreeStore')
@observer
export default class LevelAttr extends Component {
  state = {
    tabIndex: 0,
    CompInstance: undefined,
    ComItem: {},
    variablePath: '',
    variableCode: '',
    variableModal: false,
    count: 0,
    createFlag: true, // 创建
    showFlag: true, // 显示
  };

  componentDidMount() {
    const {
      mapStore: { layerItem },
    } = this.props;
    const { instance } = layerItem;
    this.setState({
      ComItem: layerItem,
      CompInstance: instance,
      createFlag: typeof layerItem.createFlag === 'undefined' ? true : layerItem.createFlag,
      showFlag: typeof layerItem.showFlag === 'undefined' ? true : layerItem.showFlag,
    });
    // 滚动时关闭下拉面板
    document.querySelector('.yl-comp-basic-style')?.addEventListener('scroll', listerDataiAttrScoll);
  }

  componentWillUnmount() {
    document.querySelector('.yl-comp-basic-style')?.removeEventListener('scroll', listerDataiAttrScoll);
  }

  changeTab = (i) => {
    this.setState({ tabIndex: i });
  };

  toggleVariableModal = (val = false, path = '') => {
    const { CompInstance } = this.state;
    const { changeAttr, compAttr } = CompInstance;
    const fields = path.split('.');
    let code = '';
    if (fields.length === 0) {
      this.setState({
        variableModal: val,
      });
      return;
    }
    code = fields.length > 1 ? compAttr[fields[0]][fields[1]] : compAttr[fields[0]];
    this.setState({
      variablePath: path,
      variableCode: code,
      variableModal: val,
    });
  };

  changeEditorCode = (val) => {
    const { CompInstance, variablePath } = this.state;
    const { updateAttr, compAttr } = CompInstance;

    const fields = variablePath.split('.');
    const code = '';
    if (fields.length > 1) {
      compAttr[fields[0]][fields[1]] = val;
    } else {
      compAttr[fields[0]] = val;
    }
    updateAttr(compAttr);
  };

  isActive = (i) => {
    const { tabIndex } = this.state;
    return i === tabIndex ? 'active' : '';
  };

  addLayers = (list) => {
    const {
      editorStore: { changeKeys },
      comStore: { addCom },
    } = this.props;
    // const {
    //   controlStore: { comQueue },
    // } = this.props;
    const { comQueue } = compLibStore;
    list.forEach((vl, i) => {
      const comItem = comQueue[vl.name] || comQueue[vl.comName];
      addCom(comItem, changeKeys[0]);
    });
  };

  replaceName = (item, nameString) => {};

  delLayer = (item, index) => {};

  showLayer = (item) => {};

  showImage = (CompInstance, compAttr, field) => {
    this.props.ossStore.showImage(true, CompInstance, compAttr, field);
  };

  uploadImage = (file, CompInstance, compAttr) => {
    this.props.ossStore.uploadImage(file, CompInstance, compAttr, 'backgroundUrl');
  };

  changeVarValue = (value, field, prefix) => {
    const { CompInstance } = this.state;
    const { updateAttr, compAttr } = CompInstance || {};
    let attrField = prefix;
    attrField = field.includes('variable') ? `${attrField}Variable` : `${attrField}Expression`;
    compAttr[attrField] = value;
    CompInstance.updateAttr(compAttr);
    this.setState((prevState) => ({ count: prevState.count + 1 }));
    // this.setState({ count: this.state.count + 1 });
  };

  render() {
    const { isActive } = this;
    const {
      tabIndex,
      CompInstance,
      ComItem,
      compAttr: compAttrState,
      variableModal,
      variableCode,
      createFlag,
      showFlag,
    } = this.state;
    // console.log('CompInstance****', CompInstance, ComItem);
    const {
      editorStore: { updateCss, renderAttrCount, backMapAttrs, forceUpdate, forceUpdateLayer, getMapChildLayer },
      mapStore: { layerItem },
      pageTreeStore,
    } = this.props;
    // const {
    //   controlStore: { map2dLayers: map2dChild },
    // } = this.props;
    const { map2dLayers: map2dChild } = compLibStore;
    const data = toJS(layerItem);
    // console.log(data, layerItem, ComItem, '-----------------');
    // let configs = data._config;
    const childMap = getMapChildLayer() || [];

    if (data.layerCode && data.layerType && data.url) {
      // 显示孪生底板子组件的子图层配置，因为配置一样只有初始创建初始显示项，所以统一处理
      return (
        <div className={this.props.className || ''}>
          <div className='yl-comp-tabs '>
            <div
              className={`yl-comp-tab ${isActive(0)}`}
              onClick={() => {
                this.changeTab(0);
              }}
            >
              <img title='样式' alt='' src={isActive(0) ? dataIcon.setting.hoverIcon : dataIcon.setting.icon} />
            </div>
            <div
              className={`yl-comp-tab ${isActive(2)}`}
              onClick={() => {
                this.changeTab(2);
              }}
            >
              <img title='交互' alt='' src={isActive(2) ? dataIcon.interactive.hoverIcon : dataIcon.interactive.icon} />
            </div>
          </div>
          <div className='yl-comp-info-detail antd-dark'>
            <div className='yl-comp-info-title row'>
              <div onClick={backMapAttrs} className='flex child-layer-title'>
                {ComItem.name}
              </div>
              {/* <div className='flex'>作者：{ComItem.author || '--'}</div> */}
            </div>
            <div className='yl-comp-info-version'>
              <span>v{ComItem.version}</span> |<span style={{ userSelect: 'all' }}> {ComItem.key} </span>
            </div>
            <div className='yl-comp-info-version' style={{ display: 'block' }}>
              <Row>
                <Col flex='auto'>
                  <Space>
                    初始创建
                    <Switch
                      size='small'
                      checked={createFlag}
                      onChange={(value, field) => {
                        if (!value) {
                          ComItem.showFlag = false;
                          this.setState({ showFlag: false });
                        } else {
                          ComItem.showFlag = showFlag; // 确保两个属性同时出现
                        }
                        ComItem.createFlag = value;
                        this.setState({ createFlag: value });
                        // forceUpdateLayer();
                        // pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
                <Col flex='auto'>
                  <Space>
                    初始显示
                    <Switch
                      size='small'
                      checked={showFlag}
                      onChange={(value, field) => {
                        if (!createFlag) {
                          return;
                        }
                        ComItem.createFlag = true; // 确保两个属性同时出现

                        ComItem.showFlag = value;
                        this.setState({ showFlag: value });
                        // forceUpdateLayer();
                        // pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      );
    }

    // 引用变量组件props
    const varProps = {
      styles: fieldstyles,
      changeValue: (value, field) => {
        this.changeVarValue(value, field, 'color');
      },
      config: {
        _variable: CompInstance?.compAttr.colorVariable,
        _expression: CompInstance?.compAttr.colorExpression,
      },
      variableTip: `变量格式如下：[{
          "label": "色系1",
          "num": 0,
          "color": "#006837"
        },{
          "label": "色系2",
          "num": 50,
          "color": "#d9ef8b"
        },{
          "label": "色系3",
          "num": 100,
          "color": "#a50026"
        }]`,
    };

    return (
      <div className={this.props.className || ''}>
        <div className='yl-comp-tabs '>
          <div
            className={`yl-comp-tab ${isActive(0)}`}
            onClick={() => {
              this.changeTab(0);
            }}
          >
            <img title='样式' alt='' src={isActive(0) ? dataIcon.setting.hoverIcon : dataIcon.setting.icon} />
          </div>
          {CompInstance && !CompInstance.dataSourceHidden && (
            <div
              className={`yl-comp-tab ${isActive(1)}`}
              onClick={() => {
                this.changeTab(1);
              }}
            >
              <img title='数据' alt='' src={isActive(1) ? dataIcon.data.hoverIcon : dataIcon.data.icon} />
            </div>
          )}
          {![
            'BasePointLayer',
            'BasePolylineLayer',
            'BasePolygonLayer',
            'MaskLayer',
            'MapContour',
            'MapHotmap',
            'BasePointLayer3D',
            'BasePolylineLayer3D',
            'BasePolygonLayer3D',
            'Map3DTilesetLayer',
            'Map3DContour',
            'Map3DHeatMapLayer',
            'Map3DBuildingLayer', // v8.10.0 白模图层取消交互面板
            'Map3DGeoFencing',
            'MapGlBasePointLayer',
            'MapGlBasePolylineLayer',
            'MapGLBasePolygonLayer',
            'MapGLPlateLayer', // v8.3新增GL板块图
            'MapGlHeatMapNew', // v8.10.0 热力图取消交互面板
            'MapGlBuildingLayerNew', // v8.10.0 白模图层取消交互面板
            'MapGlGeoFencing', // v8.10.0 取消交互面板
            'MapGlMaskLayer', // v8.10.0 取消交互面板
            'MapGlRainbowLine', // v8.10.0 取消交互面板
            'MapGlRegionPlate', // v8.10.0 取消交互面板
            'MapGlFlyLine', // v8.10.0 取消交互面板
            'BaseGifLayer3D',
            'BaseGifLayer2D',
            'MapGaudOnline', // v8.13.0 在线底图取消交互面板
            'MapGlBasicLayerNew', // v8.13.0 取消交互面板
            'Map3DBasicLayer', // v8.13.0 取消交互面板
          ].includes(data.englishName) && (
            <div
              className={`yl-comp-tab ${isActive(2)}`}
              onClick={() => {
                this.changeTab(2);
              }}
            >
              <img title='交互' alt='' src={isActive(2) ? dataIcon.interactive.hoverIcon : dataIcon.interactive.icon} />
            </div>
          )}
        </div>

        {ComItem ? (
          // ['MapContour', 'Map3DContour'].includes(data.englishName) ? (
          //   <div className='yl-comp-config' style={{ paddingTop: 10 }}>
          //     <div className='yl-comp-text-field row'>
          //       <div className='yl-comp-field-label' style={{ minWidth: 110 }}>
          //         组件key
          //       </div>
          //       <div className='yl-comp-text-field' style={{ padding: 0, lineHeight: '24px' }}>
          //         {ComItem.key}
          //       </div>
          //     </div>
          //     <div className='yl-comp-text-field row'>
          //       <div className='yl-comp-field-label' style={{ minWidth: 110 }}>
          //         名字
          //       </div>
          //       <div className='yl-comp-text-field' style={{ padding: 0 }}>
          //         <Input
          //           style={{ height: '24px', marginRight: '13px' }}
          //           value={ComItem.name}
          //           onChange={(evt) => {
          //             const comName = trim(evt.target.value);
          //             if (!comName) {
          //               message.error('组件名称不能为空!');
          //               return;
          //             }
          //             ComItem.name = comName;
          //             pageTreeStore.setPageInfoStep(1);
          //             forceUpdate();
          //           }}
          //         />
          //       </div>
          //     </div>
          //   </div>
          // ) : (
          <div className='yl-comp-info-detail antd-dark'>
            <div className='yl-comp-info-title row'>
              <div
                onClick={() => {
                  backMapAttrs(ComItem);
                }}
                className='flex child-layer-title'
              >
                {ComItem.name}
              </div>
              <div className='flex'>作者：{ComItem.author || '--'}</div>
            </div>
            <div className='yl-comp-info-version'>
              <span>v{ComItem.version}</span> | <span style={{ userSelect: 'all' }}> {ComItem.key} </span>
            </div>
            <div className='yl-comp-info-version' style={{ display: 'block' }}>
              <Row>
                <Col flex='auto'>
                  <Space>
                    初始创建
                    <Switch
                      size='small'
                      checked={createFlag}
                      onChange={(value, field) => {
                        if (!value) {
                          ComItem.showFlag = false;
                          this.setState({ showFlag: false });
                        } else {
                          ComItem.showFlag = showFlag; // 确保两个属性同时出现
                        }
                        ComItem.createFlag = value;
                        this.setState({ createFlag: value });
                        forceUpdateLayer();
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
                <Col flex='auto'>
                  <Space>
                    初始显示
                    <Switch
                      size='small'
                      checked={showFlag}
                      onChange={(value, field) => {
                        if (!createFlag) {
                          return;
                        }
                        ComItem.createFlag = true; // 确保两个属性同时出现

                        ComItem.showFlag = value;
                        this.setState({ showFlag: value });
                        forceUpdateLayer();
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
              </Row>
            </div>
          </div>
        ) : null}
        {!ComItem?.layerType && (
          <div className='yl-comp-basic-style'>
            {tabIndex === 0 && ComItem && CompInstance && (
              <ComItem.CssPage
                // key={renderAttrCount}
                key={data.key}
                map2dOptions={map2dChild}
                childLayers={childMap}
                addLayers={this.addLayers}
                selectImage={this.showImage}
                uploadImage={this.uploadImage}
                data={data}
                iocStorageUrl={window.iocStorageUrl}
                CompInstance={CompInstance}
                updateCss={updateCss}
                toggleVariableModal={this.toggleVariableModal}
              >
                <VariableRef {...varProps} />
              </ComItem.CssPage>
            )}
            {tabIndex === 1 &&
              ComItem &&
              CompInstance &&
              ([
                'BasePointLayer',
                'BasePointLayer3D',
                'BasePolylineLayer',
                'BasePolylineLayer3D',
                'BasePolygonLayer',
                'BasePolygonLayer3D',
                'MapGlBasePointLayer',
                'MapGlBasePolylineLayer',
                'MapGLBasePolygonLayer',
                'MapGLPlateLayer', // v8.3新增GL板块图
                'BaseGifLayer3D',
                'BaseGifLayer2D',
              ].includes(data.englishName) ? (
                <BaseLayerDataSource key={CompInstance.key} CompInstance={CompInstance} data={data} />
              ) : ['MaskLayer'].includes(data.englishName) ? (
                <MaskLayerDataSource key={CompInstance.key} CompInstance={CompInstance} data={data} />
              ) : ['Map3DTilesetLayer', 'Map3DThreedLayer', 'Map3DBuildingLayer'].includes(data.englishName) ? (
                <ThreedModelDataSource key={CompInstance.key} CompInstance={CompInstance} data={data} />
              ) : ['MapHotmap', 'Map3DHeatMapLayer', 'Map3DPointPolymerization', 'Map2DPointPolymerization'].includes(
                  data.englishName,
                ) ? (
                <MapHotDataSource
                  key={CompInstance.key}
                  CompInstance={CompInstance}
                  data={data}
                  dataSourceIndex={undefined}
                />
              ) : ['MapInterpolation', 'Map3DInterpolationLayer'].includes(data.englishName) ? (
                <MapInterpolationDataSource
                  key={CompInstance.key}
                  CompInstance={CompInstance}
                  data={data}
                  dataSourceIndex={undefined}
                />
              ) : [
                  'MapGlGeoFencingNew',
                  'Map3DGeoFencing',
                  'MapGlBuildingLayerNew', // v8.10.0 新增GL白模图层
                  'MapGlHeatMapNew', // v8.10.0 新增GL热力图
                ].includes(data.englishName) ? (
                <BaseMapDataSource
                  key={CompInstance.key}
                  CompInstance={CompInstance}
                  data={data}
                  dataSourceIndex={undefined}
                />
              ) : ['MapContour', 'Map3DContour'].includes(data.englishName) ? (
                <MapContourDataSource
                  key={CompInstance.key}
                  CompInstance={CompInstance}
                  data={data}
                  dataSourceIndex={undefined}
                />
              ) : (
                <DataSource key={CompInstance.key} CompInstance={CompInstance} data={data} />
              ))}
            {tabIndex === 2 && ComItem && <InteractiveS changeKeys={[ComItem.key]} isMobile={false} />}

            <ModalVariable
              code={variableCode}
              visiable={variableModal}
              onOk={(value) => {
                this.changeEditorCode(value);
                this.toggleVariableModal();
              }}
              onCancel={() => {
                this.toggleVariableModal();
              }}
            />
          </div>
        )}
      </div>
    );
  }
}
