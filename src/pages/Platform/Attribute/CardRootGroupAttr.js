import React, { Component, createRef } from 'react';
import { Row, Col, Input, Switch, Space, Tooltip, message } from 'antd';
import { trim, isEqual } from 'lodash';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { inject, observer } from 'mobx-react';
import $ from 'jquery';
import { listerDataiAttrScoll } from '@/utils/componentUtils';
import { formatPosition } from '@/utils/analysis';
import { Select, GroupInputNumber } from '@yl/datai-ui';
import styles from '@/styles/pages/attr.less';
import EllipsisMiddle from '@/components/commons/EllipsisMiddle';
import attrIcon from '@/assets/newIcon/RightSettingPanel/Attr.svg';
import attrHoverIcon from '@/assets/newIcon/RightSettingPanel/AttrActive.svg';
import datasetIcon from '@/assets/newIcon/RightSettingPanel/Dataset.svg';
import datasetHoverIcon from '@/assets/newIcon/RightSettingPanel/DatasetActive.svg';
import interactiveIcon from '@/assets/newIcon/RightSettingPanel/Events.svg';
import interactiveHoverIcon from '@/assets/newIcon/RightSettingPanel/EventsActive.svg';
import hocSetConfigProvider from './components/hocSetConfigProvider';
import Interactive from './components/Interactive';

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

@inject('editorStore', 'globalStore', 'comStore', 'mapStore', 'pageTreeStore', 'layerStore', 'ossStore')
@observer

/**
 * v8.11使用CardRootGroupAttr配置顶级组属性，不用生成instance，将overflow从_attr转移到styles
 */
class CardRootGroupAttr extends Component {
  // inputRef = createRef();

  state = {
    tabIndex: 0,
    ComItem: undefined,
    comName: '',
    createFlag: this.props.item.createFlag === 'undefined' ? true : this.props.item.createFlag, // 创建
    showFlag: this.props.item.showFlag === 'undefined' ? true : this.props.item.showFlag, // 显示,
    dragStatus: this.props.item?.styles?.dragStatus,
    overflow: this.props.item?.styles?.overflow ?? this.props.item?._attr?.overflow ?? 'visible',
  };

  componentDidMount() {
    // 滚动时关闭下拉面板
    document.querySelector('.yl-comp-basic-style')?.addEventListener('scroll', listerDataiAttrScoll);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { item } = nextProps;
    return {
      comName: item.name,
      ComItem: item,
      createFlag: item.createFlag === undefined ? true : item.createFlag,
      showFlag: item.showFlag === undefined ? true : item.showFlag,
      dragStatus: item?.styles?.dragStatus ?? false,
      // backdropFilter: item.styles.backdropFilter ?? 0,
      overflow: item?.styles?.overflow ?? item?._attr?.overflow ?? 'visible',
      // 切换组件选中时默认选中组件第一栏配置
      tabIndex: item.key === prevState.ComItem?.key ? prevState.tabIndex : 0,
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

  render() {
    const { isActive } = this;
    const { tabIndex, createFlag, showFlag, dragStatus, overflow } = this.state;

    let { comName } = this.state;

    const {
      globalStore: {
        screenConfig,
        updateScreenConfig, // v7.3 添加更新是否使用缓存数据
      },
      editorStore: { changeKeys, forceUpdateLayer },
      pageTreeStore,
      item,
    } = this.props;
    const [x, y] = formatPosition(item.styles.transform);
    if (comName !== item?.name) {
      comName = item?.name;
    }

    if (!item) {
      return <div />;
    }

    const currentScreenConfig = JSON.parse(JSON.stringify(screenConfig));
    currentScreenConfig.width = $('.screen-container').width();
    currentScreenConfig.height = $('.screen-container').height();
    if (item.layers && item.layers.length > 1) {
      // todo兼容没有zIndex
      const layerLen = item.layers.length;
      item.layers.forEach((layer, index) => {
        if (layer.instance && layer.instance?.compAttr) layer.instance.compAttr.zIndex = layerLen - index;
      });
    }

    // 如果是地图的基础容器，隐藏设置宽高的组件
    return (
      <div className={this.props.className || ''}>
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
        {tabIndex === 0 && item && (
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
                      onChange={(value) => {
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
                      onChange={(value) => {
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
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  位置
                </Col>
                <Col flex='213px' className={styles.fieldInput}>
                  <GroupInputNumber
                    fields={['x', 'y']}
                    value={{ x, y }}
                    onChange={(value, field) => {
                      const [innerX, innerY] = formatPosition(item.styles.transform);

                      const str = `translate(${field === 'x' ? value ?? innerX : innerX}px, ${
                        field === 'y' ? value ?? innerY : innerY
                      }px)`;
                      if (str === item.styles.transform) return;
                      window.executeCommand('updateAttr', item, 'transform', str);
                    }}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  尺寸
                </Col>
                <Col flex='213px' className={styles.colDouble}>
                  <GroupInputNumber
                    value={item.styles}
                    fields={['width', 'height']}
                    onChange={(value, field) => {
                      const conditionValue = Number.parseInt(item.styles[field]);
                      if (isEqual(conditionValue, value)) return;
                      window.executeCommand('updateAttr', item, field, `${value}px`);
                    }}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  容器超出
                </Col>
                <Col flex='213px'>
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
                <Col flex='213px'>
                  <Switch
                    checked={dragStatus}
                    size='small'
                    onChange={(value) => {
                      this.setState({
                        dragStatus: value,
                      });
                      window.executeCommand('updateAttr', item, 'dragStatus', value);
                    }}
                  />
                </Col>
              </Row>
              <Row className={styles.field}>
                <Col flex='auto' className={styles.fieldLabel}>
                  使用缓存数据
                  <Tooltip
                    placement='bottom'
                    title='可增加大屏使用缓存数据配置，默认不开启，缓存数据来自于页面操作访问过的数据接口，开启使用缓存数据后，页面默认使用后台的缓存数据，可解决接口断开后的页面预览'
                  >
                    <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                  </Tooltip>
                </Col>
                <Col flex='213px'>
                  <Switch
                    checked={screenConfig.dataType}
                    size='small'
                    onChange={(value) => {
                      updateScreenConfig(value ? 1 : 0, 'dataType');
                    }}
                  />
                </Col>
              </Row>
            </div>
          </div>
        )}
        {tabIndex === 2 ? (
          <div className='yl-comp-basic-style antd-dark '>
            <InteractiveS changeKeys={changeKeys} isMobile={false} />
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  }
}

export default CardRootGroupAttr;
