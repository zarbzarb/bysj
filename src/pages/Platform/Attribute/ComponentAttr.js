import React, { Component } from 'react';
import { toJS } from 'mobx';
import { Row, Col, Input, Typography, Switch, Space, message, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { trim } from 'lodash';
import { inject, observer } from 'mobx-react';
import $ from 'jquery';
import { listerDataiAttrScoll, findTopParent } from '@/utils/componentUtils';
import { setMapLayer, getMapLayer } from '@/utils/configPageUtils';
import { chartCompTemplatesMap } from '@/staticJson/CompTemplates';
import { Select, InputNumber } from '@yl/datai-ui';
import { Store } from '@/store/index';
import styles from '@/styles/pages/attr.less';

import attrIcon from '@/assets/newIcon/RightSettingPanel/Attr.svg';
import attrHoverIcon from '@/assets/newIcon/RightSettingPanel/AttrActive.svg';
import datasetIcon from '@/assets/newIcon/RightSettingPanel/Dataset.svg';
import datasetHoverIcon from '@/assets/newIcon/RightSettingPanel/DatasetActive.svg';
import interactiveIcon from '@/assets/newIcon/RightSettingPanel/Events.svg';
import interactiveHoverIcon from '@/assets/newIcon/RightSettingPanel/EventsActive.svg';

import EllipsisMiddle from '@/components/commons/EllipsisMiddle';
import templateManager from '@/theme/TemplateManager';
import TemplateSelectModifier from '@/components/TemplateSelectModifier';
import BasicRect from './BasicRect';
import ChartCodeSettings from './components/ChartCodeSettings';
import DataSource from '../DataSource/DataSourceList';
import hocSetConfigProvider from './components/hocSetConfigProvider';
import Interactive from './components/Interactive';
import TempList from '../TempList';
import DataI from '@/utils/global-api';
import ErrorBoundary from '@/components/ErrorBoundary';

const { ossStore, compLibStore } = Store;

const overflowTypes = [
  {
    label: '超出隐藏',
    value: 'hidden',
  },
  {
    label: '滚动',
    value: 'scroll',
  },
  {
    label: '超出滚动',
    value: 'auto',
  },
  {
    label: '超出显示',
    value: 'visible',
  },
];

const InteractiveS = hocSetConfigProvider(Interactive);

const { Text } = Typography;
const dataIcon = {
  setting: {
    icon: attrIcon,
    hoverIcon: attrHoverIcon,
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

@inject('editorStore', 'globalStore', 'comStore', 'mapStore', 'pageTreeStore', 'layerStore', 'ossStore', 'compLibStore')
@observer
class ComponentAttr extends Component {
  // inputRef = createRef();

  state = {
    tabIndex: 0,
    ComItem: undefined,
    comName: '',
    createFlag: this.props.item.createFlag === 'undefined' ? true : this.props.item.createFlag, // 创建
    showFlag: this.props.item.showFlag === 'undefined' ? true : this.props.item.showFlag, // 显示,
    dragStatus: this.props.item?.styles.dragStatus,
    isTop: this.props.item?.styles.isTop ?? false,
    zIndex: this.props.item?.styles.zIndex ?? 999,
    overflow: this.props.item?.styles?.overflow ?? this.props.item?._attr?.overflow ?? 'visible',
    comQueue: compLibStore.comQueue,
    map2dChild: compLibStore.map2dLayers,
    mapGlChild: compLibStore.mapGlLayers,
    map3dChild: compLibStore.map3dLayers,
    count: 0,
    shouldTop: this.props.item.classType === 'group',
  };

  componentDidMount() {
    // 滚动时关闭下拉面板
    document.querySelector('.yl-comp-basic-style')?.addEventListener('scroll', listerDataiAttrScoll);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { item } = nextProps;

    let shouldTop = false;
    if (item.classType === 'group') {
      shouldTop = true;
      const parents = findTopParent(item);
      if (parents.length > 0) {
        shouldTop = false;
      }
    }

    return {
      comName: item.name,
      ComItem: item,
      createFlag: item.createFlag === undefined ? true : item.createFlag,
      showFlag: item.showFlag === undefined ? true : item.showFlag,
      dragStatus: item.styles.dragStatus ?? false,
      isTop: item.styles.isTop ?? false,
      zIndex: item.styles.zIndex ?? 999,
      overflow: item?.styles?.overflow ?? item?._attr?.overflow ?? 'visible',
      // 切换组件选中时默认选中组件第一栏配置
      tabIndex: item.key === prevState.ComItem?.key ? prevState.tabIndex : 0,
      shouldTop: shouldTop,
    };
  }

  componentWillUnmount() {
    document.querySelector('.yl-comp-basic-style')?.removeEventListener('scroll', listerDataiAttrScoll);
    // const { item, editorStore, pageTreeStore } = this.props;
    // const { forceUpdateLayer } = editorStore;
    // const { comName } = this.state;

    // if (this.inputRef.current.input) {
    //   const { value } = this.inputRef.current.input;
    //   console.log('输入框的值是:', value);
    //   if (comName !== value) {
    //     if (!value) {
    //       message.error('组件名称不能为空!');
    //       return;
    //     }
    //     item.name = value;
    //     this.setState({ comName: value });
    //     forceUpdateLayer();
    //     pageTreeStore.setPageInfoStep(1);
    //   }
    // }
  }

  changeTab = (i) => {
    this.setState({ tabIndex: i });
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
    const { comQueue } = this.state;
    list.forEach((vl, i) => {
      const comItem = comQueue[vl.componentCode] || comQueue[vl.englishName];
      addCom(comItem, changeKeys[0]);
    });

    const layer = this.props.item.layers[0];
    if (layer) {
      this.props.mapStore.showLayer(layer);
    }
  };

  // copyLayer = (item, index) => {
  //   const {
  //     mapStore: { copyLayer },
  //   } = this.props;
  //   const { comQueue } = this.state;
  //   const comItem = comQueue[item.componentCode] || comQueue[item.type];
  //   copyLayer(comItem, index, item);
  // };

  // v8.5.0 改拷贝为复制子图层
  copyLayer = (item, mapType) => {
    // console.log('copyLayer item', item);
    const {
      globalStore: { bigScreenId, bigScreenType },
    } = this.props;
    setMapLayer(item, mapType, bigScreenId, bigScreenType);
  };

  // v8.5.0 新增粘贴地图子组件
  pasteLayer = async (mapType) => {
    const {
      mapStore: { pasteLayer },
      globalStore: { bigScreenId, bigScreenType },
      ossStore: { ossPathInfo },
    } = this.props;
    const item = await getMapLayer(mapType, bigScreenId, bigScreenType, ossPathInfo);
    if (item) {
      const { comQueue } = this.state;
      const comItem = comQueue[item.componentCode] || comQueue[item.type];
      pasteLayer(comItem, item);
    }
  };

  editLayer = (item, index, value) => {
    this.props.mapStore.editLayer(item, index, value);
  };

  delLayer = (item, index) => {
    // 先隐藏子组件面板
    this.props.mapStore.backMapAttr();

    setTimeout(() => {
      this.props.mapStore.delLayer(index);
    }, 0);
  };

  showLayer = (item) => {
    if (item.instance || item._layerType === 'visualTemplateLayer') {
      this.props.mapStore.showLayer(item);
      if (item.clickIconIndex === -1) {
        this.props.mapStore.backMapAttr(item);
      }
      return;
    }
  };

  showImage = (CompInstance, compAttr, url, imgUrl) => {
    if (url === 'addUrl') {
      ossStore.setImageSize(CompInstance, imgUrl);
    } else {
      ossStore.showImage(true, CompInstance, compAttr, url);
    }
  };

  uploadImage = (file, CompInstance, compAttr) => {
    ossStore.uploadImage(file, CompInstance, compAttr, 'backgroundUrl');
  };

  // 地图子组件的显示隐藏
  toggleVisible = (item) => {
    let { visible } = item.instance;
    if (item.instance.visible === undefined) {
      visible = true;
    }
    window.executeCommand('MapLayersCommand', item, item, {
      type: 'visible',
      visible,
    });
  };

  layerUp = (item, index) => {
    const {
      editorStore: { changeKeys },
      pageTreeStore: { getSelectedComp },
    } = this.props;
    const key = toJS(changeKeys)[0];
    const parentItem = getSelectedComp(key);
    if (index > 0) {
      parentItem.layers.splice(index, 1);
      parentItem.layers.splice(index - 1, 0, item);
      // this.updateZIndex(parentItem.layers);
      this.updateZIndex(parentItem.layers, index);
      this.updateZIndex(parentItem.layers, index - 1);
    }
  };

  layerDown = (item, index) => {
    const {
      editorStore: { changeKeys },
      pageTreeStore: { getSelectedComp },
    } = this.props;
    const key = toJS(changeKeys)[0];
    const parentItem = getSelectedComp(key);
    if (index < parentItem.layers.length - 1) {
      parentItem.layers.splice(index, 1);
      parentItem.layers.splice(index + 1, 0, item);
      // this.updateZIndex(parentItem.layers);
      this.updateZIndex(parentItem.layers, index);
      this.updateZIndex(parentItem.layers, index + 1);
    }
  };

  updateZIndex = (layers, index) => {
    const { pageTreeStore } = this.props;
    const { count } = this.state;
    // console.log(layers[index].compName, index, '111111111111111111');
    if (!layers[index]) return;
    layers[index].instance.mergeAttr({
      zIndex: index,
    });

    // const layerLen = layers.length;
    // layers.forEach((layer, zIndex) => {

    //   layer.instance.mergeAttr({
    //     zIndex: layerLen - zIndex, // zIndex越大在越上面
    //   });
    // });
    // v8.2添加页面状态修改
    // console.log('updateZIndex');
    pageTreeStore.setPageInfoStep(1);
    this.setState({ count: count + 1 });
  };

  // 8.13: 地图子组件支持拖拽调整顺序
  handleDrop = (dragIndex, targetIndex) => {
    const {
      item,
      layerStore: { activeLayerId },
      pageTreeStore,
    } = this.props;
    const { count } = this.state;
    const isReferenceMap = item.compType === 'referenceMap'; // 引用地图
    let startIndex;
    const sortLayers = isReferenceMap
      ? item.layers?.filter((v, i) => {
          if (startIndex === undefined && v.layerId === activeLayerId) {
            startIndex = i;
          }
          return v.layerId === activeLayerId;
        }) || []
      : item.layers;
    if (isReferenceMap) {
      sortLayers.splice(targetIndex, 0, sortLayers.splice(dragIndex, 1)[0]);
      item.layers.splice(startIndex, sortLayers.length, ...sortLayers);
    } else {
      item.layers.splice(targetIndex, 0, item.layers.splice(dragIndex, 1)[0]);
    }
    pageTreeStore.setPageInfoStep(1);
    this.setState({ count: count + 1 });
  };

  render() {
    const { isActive } = this;
    const {
      tabIndex,
      createFlag,
      showFlag,
      dragStatus,
      shouldTop,
      isTop,
      zIndex,
      overflow,
      map2dChild,
      mapGlChild,
      map3dChild,
    } = this.state;

    let { comName } = this.state;

    const {
      globalStore: {
        screenConfig,
        isMobile,
        updateScreenConfig, // v7.3 添加更新是否使用缓存数据
      },
      editorStore: { changeKeys, editModePaths, updateCss, renderAttrCount, forceUpdateLayer },
      pageTreeStore,
      layerStore: { activeLayerId },
      compLibStore: { showTempListByAttr },
      item,
    } = this.props;
    if (comName !== item?.name) {
      comName = item?.name;
    }

    // // v7.3 区分顶级组
    // const { isCardRoot = false } = this.props;

    const pageType = GetQueryString('type');

    let key = toJS(changeKeys)[0];
    if (editModePaths?.length > 0) {
      key = editModePaths.at(-1);
    }

    if (!item) {
      return <div />;
    }
    const isReferenceMap = item.compType === 'referenceMap'; // 引用地图

    const CompInstance = item.instance;
    const currentScreenConfig = JSON.parse(JSON.stringify(screenConfig));
    currentScreenConfig.width = $('.screen-container').width();
    currentScreenConfig.height = $('.screen-container').height();
    if (CompInstance) CompInstance.screenConfig = currentScreenConfig;
    if (item.layers && item.layers.length > 1) {
      // todo兼容没有zIndex
      const layerLen = item.layers.length;
      item.layers.forEach((layer, index) => {
        if (layer.instance && layer.instance?.compAttr) layer.instance.compAttr.zIndex = layerLen - index;
      });
    }

    let sortLayers = [];
    sortLayers = isReferenceMap ? item.layers?.filter((v) => v.layerId === activeLayerId) || [] : item.layers;

    const childMap = sortLayers || [];
    // 隐藏重复宽高尺寸设置
    let className;
    // 如果是组
    if (item.classType === 'group') {
      className = 'hide-repeat-rect group ';
    } else if (item.classType === 'com') {
      className = 'hide-repeat-rect com';
      if (
        item.englishName === 'MapFoundationPlan' ||
        item.englishName === 'MapGlFoundationPlan' ||
        item.englishName === 'Map3DFoundationPlan'
      ) {
        className = '';
      }
    }

    // 如果是地图的基础容器，隐藏设置宽高的组件
    return (
      <div className={this.props.className || ''} style={{ overflow: showTempListByAttr ? 'visible' : 'hidden' }}>
        {/* 组件模板列表 */}
        {showTempListByAttr && <TempList className='temp-list-attr' type='attr' item={item} />}
        <div className='yl-comp-tabs '>
          <div
            className={`yl-comp-tab  ${isActive(0)}`}
            onClick={() => {
              this.changeTab(0);
            }}
          >
            <img title='样式' src={isActive(0) ? dataIcon.setting.hoverIcon : dataIcon.setting.icon} alt='样式' />
          </div>
          {item.classType === 'com' || item.classType === 'group' ? (
            <>
              {CompInstance && !CompInstance.dataSourceHidden && (
                <div
                  className={`yl-comp-tab ${isActive(1)}`}
                  onClick={() => {
                    this.changeTab(1);
                  }}
                >
                  <img title='数据' src={isActive(1) ? dataIcon.data.hoverIcon : dataIcon.data.icon} alt='数据' />
                </div>
              )}
              <div
                className={`yl-comp-tab ${isActive(2)}`}
                onClick={() => {
                  this.changeTab(2);
                }}
              >
                <img
                  title='交互'
                  src={isActive(2) ? dataIcon.interactive.hoverIcon : dataIcon.interactive.icon}
                  alt='交互'
                />
              </div>
            </>
          ) : null}
        </div>

        {tabIndex === 0 && item && CompInstance && (
          <div className='yl-comp-basic-style antd-dark '>
            <div>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  <Space>
                    初始创建
                    <Switch
                      size='small'
                      disabled={item.compType === 'referenceMap'}
                      checked={createFlag}
                      onChange={(value, field) => {
                        if (value) {
                          item.showFlag = showFlag; // 确保两个属性同时出现
                        } else {
                          item.showFlag = false;
                          this.setState({ showFlag: false });
                        }
                        item.createFlag = value;
                        this.setState({ createFlag: value });
                        forceUpdateLayer();
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
                <Col flex='auto' className={styles.fieldLabel}>
                  <Space>
                    初始显示
                    <Switch
                      size='small'
                      disabled={item.compType === 'referenceMap'}
                      checked={showFlag}
                      onChange={(value, field) => {
                        if (createFlag) {
                          item.createFlag = true; // 确保两个属性同时出现
                        } else {
                          return;
                        }
                        item.showFlag = value;
                        this.setState({ showFlag: value });
                        forceUpdateLayer();
                        pageTreeStore.setPageInfoStep(1);
                      }}
                    />
                  </Space>
                </Col>
              </Row>

              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  key
                </Col>
                <Col flex='213px' style={{ paddingRight: '13px' }}>
                  <EllipsisMiddle suffixCount={8}>{item.key}</EllipsisMiddle>
                  {/* <Text style={{ width: '200px' }} ellipsis={true} copyable={{ text: item.key }}>
                    {item.key}
                  </Text> */}
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  名字
                </Col>
                <Col flex='213px' style={{ paddingRight: '13px' }}>
                  <Input
                    // ref={this.inputRef}
                    style={{ height: '22px' }}
                    disabled={isReferenceMap}
                    value={comName}
                    onChange={(evt) => {
                      const name = trim(evt.target.value);
                      if (!name) {
                        message.error('组件名称不能为空!');
                        return;
                      }
                      item.name = name;
                      this.setState({ comName: name });
                      forceUpdateLayer();
                      pageTreeStore.setPageInfoStep(1);
                    }}
                    // defaultValue={comName}
                    // onBlur={(evt) => {
                    //   const name = trim(evt.target.value);
                    //   if (comName !== name) {
                    //     if (!name) {
                    //       message.error('组件名称不能为空!');
                    //       return;
                    //     }
                    //     item.name = name;
                    //     this.setState({ comName: name });
                    //     forceUpdateLayer();
                    //     pageTreeStore.setPageInfoStep(1);
                    //   }
                    // }}
                  />
                </Col>
              </Row>
              <BasicRect item={item} isReferenceMap={isReferenceMap} />

              <TemplateSelectModifier comp={item} />

              {item.type === '@yl/dataq-com-group-basic' ? (
                <>
                  <Row className={styles.field}>
                    <Col flex='auto' className={styles.fieldLabel}>
                      容器超出
                    </Col>
                    <Col flex='213px' style={{ paddingRight: '13px' }}>
                      <Select
                        value={overflow}
                        onChange={(value) => {
                          this.setState({
                            overflow: value,
                          });

                          window.executeCommand('updateAttr', item, 'overflow', value);
                        }}
                        data={overflowTypes}
                      />
                    </Col>
                  </Row>
                  <Row className={styles.field}>
                    <Col flex='auto' className={styles.fieldLabel}>
                      开启拖拽
                    </Col>
                    <Col flex='213px' style={{ paddingRight: '13px' }}>
                      <Switch
                        checked={dragStatus}
                        size='small'
                        onChange={(value) => {
                          // item.styles.dragStatus = value;
                          // forceUpdate();
                          this.setState({
                            dragStatus: value,
                          });
                          window.executeCommand('updateAttr', item, 'dragStatus', value);
                        }}
                      />
                    </Col>
                  </Row>

                  {shouldTop && pageType === 'page' && (
                    <>
                      <Row className={styles.field}>
                        <Col flex='auto' className={styles.fieldLabel}>
                          置顶显示
                          <Tooltip placement='bottom' title='开启后组将在最顶层显示，不再根据组件列表的顺序显示'>
                            <QuestionCircleOutlined style={{ color: '#3fb5d2', marginLeft: '8px' }} />
                          </Tooltip>
                        </Col>
                        <Col flex='213px'>
                          <Switch
                            checked={isTop}
                            size='small'
                            onChange={(value) => {
                              this.setState({
                                isTop: value,
                              });
                              window.executeCommand('updateAttr', item, 'isTop', value);
                              if (item.styles.zIndex === undefined) {
                                item.styles.zIndex = 999;
                              }

                              // 组置顶时，组内子组不需要置顶
                              if (value) {
                                DataI.each(item.childComList, (com) => {
                                  if (com.classType === 'group') {
                                    com.styles.isTop = false;
                                  }
                                });
                              }
                            }}
                          />
                        </Col>
                      </Row>

                      {isTop && (
                        <Row className={styles.field}>
                          <Col flex='auto' className={styles.fieldLabel}>
                            层级
                            <Tooltip
                              placement='bottom'
                              title='如存在多个组开启置顶显示，可通过层级配置项决定上下顺序,层级越大越靠上,最小值为10'
                            >
                              <QuestionCircleOutlined style={{ color: '#3fb5d2', marginLeft: '8px' }} />
                            </Tooltip>
                          </Col>
                          <Col flex='213px' style={{ paddingRight: '13px' }}>
                            <InputNumber
                              suffix={false}
                              min={10}
                              value={zIndex}
                              onChange={(value) => {
                                this.setState({
                                  zIndex: value,
                                });
                                window.executeCommand('updateAttr', item, 'zIndex', value);
                              }}
                            />
                          </Col>
                        </Row>
                      )}
                    </>
                  )}
                </>
              ) : null}

              <ErrorBoundary
                onError={(error, errInfo) => {
                  console.error(`组件${item.key}配置面板发生错误`, error, errInfo);
                }}
                fallback={(() => (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '50px',
                    }}
                  >
                    组件属性配置面板发生异常!
                  </div>
                ))()}
              >
                <div className={className}>
                  <item.CssPage
                    /**
                     * 使用 renderAttrCount 的问题： 导致当前状态被销毁，变成原始状态，
                     * 目前已发现问题，评分组件折叠面板，上传图片后的展开状态被重置成初始状态
                     */
                    // key={renderAttrCount} // 变化的 key 会导致组件销毁再重建
                    key={item.key}
                    map2dOptions={map2dChild}
                    mapGlOptions={mapGlChild}
                    map3dOptions={map3dChild}
                    childLayers={childMap}
                    copyLayer={this.copyLayer}
                    pasteLayer={this.pasteLayer}
                    editLayer={this.editLayer}
                    addLayers={this.addLayers}
                    delLayer={this.delLayer}
                    changeLayer={this.showLayer}
                    uploadImage={this.uploadImage}
                    selectImage={this.showImage}
                    toggleVisible={this.toggleVisible}
                    layerUp={this.layerUp}
                    layerDown={this.layerDown}
                    data={item}
                    iocStorageUrl={window.iocStorageUrl}
                    CompInstance={CompInstance}
                    updateCss={updateCss}
                    onDrop={this.handleDrop}
                  />

                  {item.instance.chart && <ChartCodeSettings item={item} />}
                </div>
              </ErrorBoundary>
            </div>
          </div>
        )}

        {tabIndex === 1 && item && CompInstance && CompInstance.config && (
          <div className='yl-comp-basic-style antd-dark '>
            <DataSource
              // renderAttrCount 会造成拖拽组件时 DataSource组件重新挂载，重新触发动态数据源请求
              key={CompInstance.key}
              comName={item.refComName}
              CompInstance={CompInstance}
              data={item}
            />
          </div>
        )}

        {tabIndex === 2 ? (
          <div className='yl-comp-basic-style antd-dark '>
            <InteractiveS changeKeys={changeKeys} isMobile={isMobile} />
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  }
}

export default ComponentAttr;
