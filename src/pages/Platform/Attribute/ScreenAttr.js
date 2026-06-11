import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import '@/styles/pages/attr.less';
import $ from 'jquery';
import { Switch, Tooltip, Row, Col } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import settingIcon from '@/assets/newIcon/设置.png';
import settingHoverIcon from '@/assets/newIcon/设置启用.png';
import interactiveIcon from '@/assets/newIcon/交互.png';
import interactiveHoverIcon from '@/assets/newIcon/交互启用.png';
import { RangeInput, Select, Input, DropPanel, Tabs, GradationColor, GroupInputNumber } from '@yl/datai-ui';
import ColorPicker from '@/components/ColorPicker';
import CustomUploadImage from '@/components/commons/CustomUploadImage';

import styles from './AntdAttr.less';

const scaleTypesData = [
  { label: '原尺寸', value: 'initSize' },
  { label: '全屏铺满', value: 'scale' },
  { label: '等比缩放宽度铺满', value: 'scaleWidth' },
  { label: '等比缩放高度铺满', value: 'scaleHeight' },
];

const dataIcon = {
  setting: {
    icon: settingIcon,
    hoverIcon: settingHoverIcon,
  },
  interactive: {
    icon: interactiveIcon,
    hoverIcon: interactiveHoverIcon,
  },
};
@inject('editorStore', 'globalStore')
@observer
export default class ScreenAttr extends Component {
  state = {
    tabIndex: 0,
    fonts: [],
    fontTabIndex: 0,
    font: { fontName: '', url: '' },
    // mockKey: '',
    // activeKey: ['mock'],
  };

  componentDidMount() {
    const time = setInterval(() => {
      const {
        globalStore: { screenConfig },
        editorStore: { screenConfigLoaded },
      } = this.props;
      if (screenConfigLoaded) {
        clearInterval(time);
        this.setState({
          fonts: screenConfig.fonts,
        });
      }
    }, 300);
  }

  renderTypeFace = (fonts) => {
    const el = $('#screen-type-face');
    el.remove();
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'screen-type-face';

    style.innerHTML = fonts
      .map((item) => {
        return `
                @font-face {
                    font-family: ${item.fontName}; /*这里是说明调用来的字体名字*/
                    src: url('${item.url}'); /*这里是字体文件路径*/
                }
            `;
      })
      .join('');
    document.querySelectorAll('head').item(0).append(style);
    // let importFontFamilyList = JSON.parse(JSON.stringify(fonts)).map((item) => {
    //   return {
    //     label: item.fontName,
    //     value: item.fontName
    //   };
    // });
  };

  changeTab = (i) => {
    this.setState({ tabIndex: i });
  };

  changeAttr = () => {};

  changeTransform = () => {};

  isActive = (i) => {
    const { tabIndex } = this.state;
    return i === tabIndex ? 'active' : undefined;
  };

  plusHandler = () => {
    const {
      globalStore: { updateScreenConfig },
    } = this.props;
    const { fonts } = this.state;
    const font = JSON.parse(JSON.stringify(this.state.font));
    fonts.push(font);
    this.setState({
      fonts,
      fontTabIndex: fonts.length - 1,
    });
    updateScreenConfig(fonts, 'fonts');
  };

  delHandler = (targetIndex) => {
    const {
      globalStore: { updateScreenConfig },
    } = this.props;
    const { fonts, fontTabIndex } = this.state;
    if (fonts.length === 0) return;
    fonts.splice(targetIndex, 1);
    let index = fontTabIndex;
    if (targetIndex <= fontTabIndex) {
      index = fontTabIndex > 0 ? fontTabIndex - 1 : 0;
    }
    this.setState({
      fonts,
      fontTabIndex: index,
    });
    updateScreenConfig(fonts, 'fonts');
  };

  setDataTabIndex = (fontTabIndex) => {
    this.setState({
      fontTabIndex,
    });
  };

  changeScreenConfig = (value, field, index) => {
    const {
      globalStore: { updateScreenConfig },
    } = this.props;
    const { fonts } = this.state;
    index == undefined ? (fonts[field] = value) : (fonts[index][field] = value);
    this.setState(
      {
        fonts,
      },
      () => {
        updateScreenConfig(fonts);
      },
    );
  };

  // genExtra() {
  //   const {
  //     editorStore: { updateUseMock },
  //   } = this.props;
  //   return (
  //     <Switch
  //       checked={this.props.globalStore.screenConfig.useMock}
  //       onClick={(checked, event) => {
  //         event.stopPropagation();
  //       }}
  //       onChange={(checked) => {
  //         updateUseMock(checked);
  //         if (checked) {
  //           this.setState({
  //             mockKey: 'mock',
  //             activeKey: ['mock'],
  //           });
  //         } else {
  //           this.setState({
  //             mockKey: '',
  //             activeKey: ['mock'],
  //           });
  //         }
  //       }}
  //     ></Switch>
  //   );
  // }
  // 兼容老屏
  compatible = (screenConfig) => {
    if (!screenConfig.loading) {
      screenConfig.loading = {
        backgroundColor: '#040C1F',
        imgSrc: '/assets/datai/icons/loading.png',
      };
    }
  };

  render() {
    const {
      globalStore: { screenConfig, updateScreenConfig, bigScreenType },
      editorStore: { forceUpdate },
    } = this.props;
    const { isActive } = this;
    const { fonts, fontTabIndex, tabIndex } = this.state;
    const fontNames = fonts.map((vl, i) => {
      return `字体${1 + i}`;
    });
    const whichMode = screenConfig.isPC ? 'pc' : screenConfig.isResponsive ? 'responsive' : 'screen';
    this.renderTypeFace(fonts);
    const collapseCommonProps = {
      expandIconPosition: 'right',
      ghost: true,
      collapsible: 'disabled',
    };
    const collapsible = () => {
      if (screenConfig.useMock) {
        delete collapseCommonProps.collapsible;
      } else {
        collapseCommonProps.collapsible = 'disabled';
      }
    };
    collapsible();
    this.compatible(screenConfig);
    return (
      <div className={`${this.props.className} yl-comp-basic-style antd-dark` || 'yl-comp-basic-style'}>
        <div className='yl-comp-tabs '>
          <div
            className={`yl-comp-tab ${isActive(0)}`}
            onClick={() => {
              this.changeTab(0);
            }}
          >
            <img title='样式' src={isActive(0) ? dataIcon.setting.hoverIcon : dataIcon.setting.icon} alt='样式' />
          </div>
          <div
            className={`yl-comp-tab ${isActive(1)}`}
            onClick={() => {
              this.changeTab(1);
            }}
          >
            <img
              title='交互'
              src={isActive(1) ? dataIcon.interactive.hoverIcon : dataIcon.interactive.icon}
              alt='交互'
            />
          </div>
        </div>
        {tabIndex === 0 && (
          <div className='yl-comp-config'>
            {/* v6.18 取消卡片编辑器的页面尺寸、背景色设置，默认进来没有背景色和页面尺寸 */}
            {(() => {
              let configItems = null;
              switch (whichMode) {
                case 'screen': {
                  configItems = window.pageTypes !== 'card' && (
                    <div className='yl-comp-text-field'>
                      <div className='yl-comp-field-label'>页面尺寸</div>
                      <div className='yl-comp-field-content row'>
                        <GroupInputNumber
                          fields={['width', 'height']}
                          value={screenConfig}
                          onChange={(value, field) => {
                            updateScreenConfig(value ?? 1, field);
                          }}
                        />
                      </div>
                    </div>
                  );
                  break;
                }

                default: {
                  break;
                }
              }
              return configItems;
            })()}
            {window.pageTypes !== 'card' && (
              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>透明度</div>
                <div className='yl-comp-field-content row'>
                  <RangeInput
                    max={1}
                    unit={0.01}
                    data-field='opacity'
                    onChange={updateScreenConfig}
                    value={screenConfig.opacity}
                  />
                </div>
              </div>
            )}

            {(() => {
              let configItems = null;
              switch (whichMode) {
                case 'screen': {
                  configItems = (
                    <div className='yl-comp-text-field'>
                      <div className='yl-comp-field-label'>显示比例</div>
                      <div className='yl-comp-field-content row'>
                        <Select
                          data-field='scale'
                          onChange={updateScreenConfig}
                          value={screenConfig.scale}
                          data={scaleTypesData}
                        />
                      </div>
                    </div>
                  );
                  break;
                }
                default: {
                  configItems = (
                    <div className='yl-comp-text-field'>
                      <div className='yl-comp-field-label'>显示比例</div>
                      <div className='yl-comp-field-content row'>
                        <Select
                          data-field='scale'
                          onChange={updateScreenConfig}
                          value={screenConfig.scale}
                          data={scaleTypesData}
                        />
                      </div>
                    </div>
                  );
                }
              }
              if (window.pageTypes !== 'card') {
                return configItems;
              }
            })()}
            {window.pageTypes !== 'card' && (
              <div>
                <div className='yl-comp-text-field comp-drop-panel'>
                  <DropPanel title='外部字体'>
                    <div className='yl-comp-text-field'>
                      <Tabs
                        onChange={this.setDataTabIndex}
                        tabIndex={fontTabIndex}
                        tabs={fontNames}
                        plusHandler={this.plusHandler}
                        delHandler={this.delHandler}
                        plusState={true}
                        delState={true}
                      >
                        {fonts.map((font, indx) => (
                          <div key={indx}>
                            <div className='yl-comp-text-field'>
                              <div className='yl-comp-field-label'>字体名称</div>
                              <div className='yl-comp-field-content row'>
                                <Input
                                  onChange={(value) =>
                                    this.changeScreenConfig(value.target ? value.target.value : value, 'fontName', indx)
                                  }
                                  value={font.fontName}
                                />
                              </div>
                            </div>
                            <div className='yl-comp-text-field'>
                              <div className='yl-comp-field-label'>字体路径</div>
                              <div className='yl-comp-field-content row'>
                                <Input
                                  onChange={(value) =>
                                    this.changeScreenConfig(value.target ? value.target.value : value, 'url', indx)
                                  }
                                  value={font.url}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </Tabs>
                    </div>
                  </DropPanel>
                </div>

                <div className='yl-comp-text-field'>
                  <div className='yl-comp-field-label'>标题</div>
                  <div className='yl-comp-field-content row'>
                    <Input
                      data-field='title'
                      type='text'
                      value={screenConfig.title}
                      onChange={(value) => {
                        if (!value) {
                          value = '面向数字孪生的低代码平台';
                        }
                        updateScreenConfig(value, 'title');
                        document.title = value ?? '面向数字孪生的低代码平台';
                      }}
                    />
                  </div>
                </div>

                <div className='yl-comp-text-field'>
                  <div className='yl-comp-field-label'>网页图标</div>
                  <div className='yl-comp-field-content row'>
                    <Input data-field='favicon' value={screenConfig.favicon} onChange={updateScreenConfig} />
                  </div>
                </div>
              </div>
            )}
            {/* v6.18 取消卡片编辑器的页面尺寸、背景色设置，默认进来没有背景色和页面尺寸 */}
            {window.pageTypes !== 'card' && (
              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>背景色</div>
                <div className='yl-comp-field-content row'>
                  <GradationColor
                    data-field='screenBackground'
                    value={screenConfig.screenBackground ? screenConfig.screenBackground : 'to bottom-#0d1117-#0d1117'}
                    onChange={(value, field) => {
                      updateScreenConfig(value, field);
                      // forceUpdate();
                    }}
                  />
                </div>
              </div>
            )}
            <div className='yl-comp-text-field'>
              <div className='yl-comp-field-label'>
                使用缓存数据
                <Tooltip
                  placement='bottom'
                  title='可增加大屏使用缓存数据配置，默认不开启，缓存数据来自于页面操作访问过的数据接口，开启使用缓存数据后，页面默认使用后台的缓存数据，可解决接口断开后的页面预览'
                >
                  <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                </Tooltip>
              </div>
              <div className='yl-comp-field-content row'>
                <Switch
                  checked={screenConfig.dataType}
                  size='small'
                  onChange={(value) => {
                    updateScreenConfig(value ? 1 : 0, 'dataType');
                  }}
                />
              </div>
            </div>
            {bigScreenType === 'page' && (
              <div className={styles.demo}>
                <div className='yl-comp-text-field comp-drop-panel'>
                  <DropPanel title='加载页设置'>
                    <Row className={styles.field}>
                      <Col flex='auto' className={styles.fieldLabel}>
                        背景色
                      </Col>
                      <Col flex='206px' className={styles.fieldInput}>
                        <ColorPicker
                          value={screenConfig.loading.backgroundColor}
                          onChange={(v) => {
                            updateScreenConfig(v, 'backgroundColor', ['loading']);
                          }}
                        />
                      </Col>
                    </Row>
                    <CustomUploadImage
                      styles={styles}
                      label='logo'
                      el={{ classType: 'antd', changeImageFlag: true }}
                      value={screenConfig.loading.imgSrc}
                      field='imgSrc'
                      updateField={(attr, url) => {
                        updateScreenConfig(url, 'imgSrc', ['loading']);
                      }}
                    />
                  </DropPanel>
                </div>
              </div>
            )}
            {/* <Wrap className="yl-comp-text-field">
              {window.pageTypes != 'card' && (
                <Collapse
                  {...collapseCommonProps}
                  className={styles.demo}
                  activeKey={this.state.activeKey}
                  onChange={(e) => {
                    this.setState({
                      activeKey: e
                    });
                  }}>
                  <Panel
                    key={this.state.mockKey}
                    header="启用mock数据"
                    extra={this.genExtra()}>
                    <Row key="setting" className={styles.field}>
                      <Col flex="auto" className={styles.fieldLabel}>
                        配置页面
                      </Col>
                      <Col flex="206px" className={styles.fieldInput}>
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="停用"
                          checked={screenConfig.screenUseMock}
                          onChange={(v) => {
                            if (!v && !screenConfig.previewUseMock) {
                              updateUseMock(false);
                              this.setState({
                                mockKey: '',
                                activeKey: ['mock']
                              });
                            }
                            updateScreenUseMock(v);
                          }}
                        />
                      </Col>
                    </Row>
                    <Row key="setting" className={styles.field}>
                      <Col flex="auto" className={styles.fieldLabel}>
                        预览页面
                      </Col>
                      <Col flex="206px" className={styles.fieldInput}>
                        <Switch
                          checkedChildren="启用"
                          unCheckedChildren="停用"
                          checked={screenConfig.previewUseMock}
                          onChange={(v) => {
                            if (!v && !screenConfig.screenUseMock) {
                              updateUseMock(false);
                              this.setState({
                                mockKey: '',
                                activeKey: ['mock']
                              });
                            }
                            updatePreviewUseMock(v);
                          }}
                        />
                      </Col>
                    </Row>
                  </Panel>
                </Collapse>
              )}
            </Wrap> */}
          </div>
        )}
      </div>
    );
  }
}
