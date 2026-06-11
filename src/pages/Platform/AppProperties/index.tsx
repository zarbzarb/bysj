import React, { useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Switch, Tooltip, ConfigProvider, Select as AntdSelect, theme, Input } from 'antd';
import {
  GradationColor,
  ImageUpload,
  GroupInputNumber,
  InputNumber,
  Select,
  CustomCollapse,
  Color,
} from '@yl/datai-ui';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';

import { getImageUrl } from '@/utils/utils';

import attrIcon from '@/assets/newIcon/RightSettingPanel/Attr.svg';
import attrHoverIcon from '@/assets/newIcon/RightSettingPanel/AttrActive.svg';

import interactiveIcon from '@/assets/newIcon/RightSettingPanel/Events.svg';
import interactiveHoverIcon from '@/assets/newIcon/RightSettingPanel/EventsActive.svg';

import EventPanel from '@/pages/Platform/Attribute/components/EventsPanel';
import { EventsList } from '@/staticJson/PageEvent';

import shortUUID, { SUUID } from 'short-uuid';
import _ from 'lodash';
import FontManager from './components/FontManager';
import styles from './index.less';

const { Panel } = CustomCollapse;

const PanelCommonProps = {
  forceRender: true,
};

const scaleTypesData = [
  { label: '原尺寸', value: 'initSize' },
  { label: '全屏铺满', value: 'scale' },
  { label: '等比缩放宽度铺满', value: 'scaleWidth' },
  { label: '等比缩放高度铺满', value: 'scaleHeight' },
];

const AppProperties = ({ isShow = true }) => {
  const { globalStore, pageTreeStore, ossStore } = useStore();

  const { screenConfig, saveScreenConfig } = globalStore;
  const { imageEdit, ossPathInfo, getAllFilesAndVFolder } = ossStore;
  const {
    width,
    height,
    scale,
    screenBackgroundImage,
    title,
    favicon,
    loading,
    scrollbar,
    preLoadResources = [],
    dataType,
    mouseType = 1,
  } = screenConfig;
  let { screenBackground } = screenConfig;
  const [titleInputValue, setTitleInputValue] = useState(title || '');
  const [otherJSFieldList, setOtherJSFieldList] = useState([]);

  const onWidthChange = (value) => {
    saveScreenConfig(value, 'width');
  };

  const onHeightChange = (value) => {
    saveScreenConfig(value, 'height');
  };
  /**
   * 适配方式发生改变
   * @param value
   */
  const onScaleChange = (value) => {
    saveScreenConfig(value, 'scale');
  };

  /** 标题输入框发生改变 */
  const onTitleChange = (evt) => {
    const trimmedValue = evt.target.value.trim();
    setTitleInputValue(trimmedValue);
  };

  const onTitleBlur = (evt) => {
    const trimmedValue = evt.target.value.trim();
    saveScreenConfig(trimmedValue, 'title');
    document.title = trimmedValue ?? '面向数字孪生的低代码平台';
  };

  /**
   * 预加载资源发生改变
   * @param value
   */
  const onPreLoadResourcesChange = (value) => {
    saveScreenConfig(value || [], 'preLoadResources');
  };

  /**
   * 缓存数据
   * @param checked
   */
  const onDataTypeChange = (checked) => {
    saveScreenConfig(checked ? 1 : 0, 'dataType');
  };

  /**
   * 缓存数据
   * @param checked
   */
  const onMosueTypeChange = (checked) => {
    saveScreenConfig(checked ? 1 : 0, 'mouseType');
  };

  // 应用属性保存
  if (!screenBackground.includes('-')) {
    screenBackground = 'to bottom-#0d1117-#0d1117';
  }

  type PanelType = 'attr' | 'events';
  const [panelRouter, setPanelRouter] = useState<PanelType>('attr');

  const onSetPanel = useCallback(
    (label: PanelType) => (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      evt.preventDefault();
      evt.stopPropagation();
      setPanelRouter(label);
    },
    [],
  );

  const [isPreloadSelectOpen, setIsPreloadSelectOpen] = useState(false);

  useEffect(() => {
    if (!ossPathInfo.path) return;

    // eslint-disable-next-line no-unused-expressions
    isPreloadSelectOpen;

    getAllFilesAndVFolder('other')
      .then((res) => {
        if (res?.code !== '200') return;

        setOtherJSFieldList(
          res.data.files
            .filter(({ name }) => name.split('.').at(-1) === 'js')
            .map(({ name, url }) => ({ value: `/iocoss/${window.screenConfig.bucketName}/${url}`, label: name })),
        );
      })
      .catch(console.error);
  }, [getAllFilesAndVFolder, isPreloadSelectOpen, ossPathInfo.path]);

  const onSetEventsCollection = useCallback(
    (fn) => {
      const tmp = _.cloneDeep(pageTreeStore.getCurrentPageEvents);

      fn(tmp);

      window.executeCommand(
        'InteractionCommand',
        {
          isPage: true,
          setEventsCollection: pageTreeStore.setEventsCollection,
          eventSetings: pageTreeStore.getCurrentPageEvents,
        },
        tmp,
      );
    },
    [pageTreeStore.getCurrentPageEvents, pageTreeStore.setEventsCollection],
  );

  useEffect(() => {
    window.setPageEventsCollection = pageTreeStore.setEventsCollection;

    return () => {
      delete window.setPageEventsCollection;
    };
  }, [pageTreeStore.setEventsCollection]);

  return (
    <div
      className={`${styles.AppPropertiesContainer} yl-comp-basic-style antd-dark`}
      style={{ display: isShow ? 'block' : 'none' }}
    >
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: { colorPrimary: '#007693' },
          components: {
            Button: {
              colorBorder: '#1a72a6',
              colorBgContainer: 'rgba(20, 81, 122, 0.5)',
              borderRadius: 2,
            },
          },
        }}
        componentSize='small'
      >
        <div className={`yl-comp-basic-style ${panelRouter === 'attr' ? 'yl-comp-config' : ''}`}>
          <div className='yl-comp-tabs' style={{ backgroundColor: 'black' }}>
            <Tooltip title='样式'>
              <div onMouseDown={onSetPanel('attr')} className={`yl-comp-tab ${panelRouter === 'attr' ? 'active' : ''}`}>
                <img src={panelRouter === 'attr' ? attrHoverIcon : attrIcon} alt='样式' />
              </div>
            </Tooltip>

            <Tooltip title='交互'>
              <div
                onMouseDown={onSetPanel('events')}
                className={`yl-comp-tab ${panelRouter === 'events' ? 'active' : ''}`}
              >
                <img src={panelRouter === 'events' ? interactiveHoverIcon : interactiveIcon} alt='交互' />
              </div>
            </Tooltip>
          </div>

          {panelRouter === 'events' && (
            <EventPanel
              comp={{
                isPage: true,
                setEventsCollection: pageTreeStore.setEventsCollection,
                eventSetings: _.cloneDeep(pageTreeStore.getCurrentPageEvents),
              }}
              selectableEvents={EventsList}
              mountedEvents={pageTreeStore.getCurrentPageEvents ?? {}}
              onSetEventsCollection={onSetEventsCollection}
            />
          )}

          {panelRouter === 'attr' && (
            <>
              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>标题</div>
                <div className='yl-comp-field-content row'>
                  <Input
                    placeholder='请输入标题'
                    value={titleInputValue}
                    onChange={onTitleChange}
                    onBlur={onTitleBlur}
                  />
                </div>
              </div>

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>分辨率</div>
                <div className='yl-comp-field-content row'>
                  <GroupInputNumber
                    resultType='object'
                    fields={['width', 'height'] as const}
                    value={{ width, height }}
                    onChange={(val) => {
                      onWidthChange(val?.width ?? width);
                      onHeightChange(val?.height ?? height);
                    }}
                  />
                </div>
              </div>

              {!globalStore.isMobile && (
                <div className='yl-comp-text-field'>
                  <div className='yl-comp-field-label'>适配方式</div>
                  <div className='yl-comp-field-content row'>
                    <Select value={scale} onChange={onScaleChange} data={scaleTypesData} style={{ width: '100%' }} />
                  </div>
                </div>
              )}

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>背景色</div>
                <div className='yl-comp-field-content row'>
                  <GradationColor
                    data-field='screenBackground'
                    value={screenBackground || 'to bottom-#0d1117-#0d1117'}
                    onChange={(value, field) => {
                      saveScreenConfig(value, field);
                    }}
                  />
                </div>
              </div>

              <ImageUpload
                label='背景图'
                value={screenBackgroundImage}
                onChange={(url) => saveScreenConfig(url, 'screenBackgroundImage')}
              />

              <ImageUpload
                label='网页图标'
                // 使用 || 是因为空字符串的时候也是使用默认图片
                value={favicon || '/assets/datai/icons/favicon.ico'}
                onChange={(url) => {
                  saveScreenConfig(url || '/assets/datai/icons/favicon.ico', 'favicon');

                  const favDom = document.querySelector('#datai-favicon') as HTMLLinkElement;

                  if (favDom) favDom.href = getImageUrl(url || '/assets/datai/icons/favicon.ico');
                }}
              />

              <CustomCollapse>
                <Panel {...PanelCommonProps} key='loading' header='加载页设置'>
                  {/* 背景色 */}
                  <div className='yl-comp-text-field'>
                    <div className='yl-comp-field-label'>背景色</div>
                    <div className='yl-comp-field-content row'>
                      <Color
                        value={loading.backgroundColor}
                        onChange={(v) => {
                          saveScreenConfig(v, 'backgroundColor', ['loading']);
                        }}
                      />
                    </div>
                  </div>

                  {/* loading LOGO */}
                  <ImageUpload
                    label='logo'
                    value={loading.imgSrc}
                    onChange={(url) => saveScreenConfig(url, 'imgSrc', ['loading'])}
                  />
                </Panel>
              </CustomCollapse>

              {!globalStore.isMobile && (
                <>
                  {/* 8.11 预加载资源 */}
                  <CustomCollapse>
                    <Panel {...PanelCommonProps} key='preLoadResources' header='预加载资源'>
                      {/* 背景色 */}
                      <div className='yl-comp-text-field'>
                        <div className='yl-comp-field-label'>
                          选择文件
                          <Tooltip
                            placement='bottom'
                            title='应用加载时会预先加载该文件，资源可从资源管理其他分类下的js文件中选 (不支持 cjs, mjs... 后缀名)'
                          >
                            <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                          </Tooltip>
                        </div>
                        <div className='yl-comp-field-content row'>
                          <AntdSelect
                            className={styles.preLoadResourcesSelect}
                            mode='multiple'
                            open={isPreloadSelectOpen}
                            onDropdownVisibleChange={setIsPreloadSelectOpen}
                            showSearch={false}
                            value={preLoadResources}
                            onChange={onPreLoadResourcesChange}
                            options={otherJSFieldList}
                            popupClassName={styles.preLoadResourcesPopupClassName}
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </Panel>
                  </CustomCollapse>

                  <FontManager />
                </>
              )}

              <CustomCollapse>
                <Panel {...PanelCommonProps} key='scrollbar' header='滚动条样式'>
                  <div className='yl-comp-text-field'>
                    <div className='yl-comp-field-label'>尺寸</div>
                    <div className='yl-comp-field-content row'>
                      <InputNumber
                        style={{ width: '100%' }}
                        value={scrollbar.size}
                        min={0}
                        onChange={(v) => {
                          saveScreenConfig(v, 'size', ['scrollbar']);
                        }}
                      />
                    </div>
                  </div>
                  <div className='yl-comp-text-field'>
                    <div className='yl-comp-field-label'>颜色</div>
                    <div className='yl-comp-field-content row'>
                      <Color
                        value={scrollbar.bgColor}
                        onChange={(v) => {
                          saveScreenConfig(v, 'bgColor', ['scrollbar']);
                        }}
                      />
                    </div>
                  </div>
                </Panel>
              </CustomCollapse>

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>
                  使用缓存
                  <Tooltip
                    placement='bottom'
                    title='缓存数据来自于页面操作访问过的数据接口，开启使用缓存数据后，页面默认使用后台的缓存数据，可解决接口断开后的页面预览'
                  >
                    <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                  </Tooltip>
                </div>
                <div className='yl-comp-field-content row' style={{ width: '204px' }}>
                  <Switch checked={dataType} onChange={onDataTypeChange} />
                </div>
              </div>

              {!globalStore.isMobile && (
                <div className='yl-comp-text-field'>
                  <div className='yl-comp-field-label'>
                    鼠标显示手图标
                    <Tooltip
                      placement='bottom'
                      title='开启后鼠标移入设置交互的组件时，鼠标将显示成手图标，涉及如下交互事件：单击、双击、鼠标移入、鼠标移出事件的组件'
                    >
                      <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
                    </Tooltip>
                  </div>
                  <div className='yl-comp-field-content row' style={{ width: '204px' }}>
                    <Switch checked={mouseType} onChange={onMosueTypeChange} />
                  </div>
                </div>
              )}

              <div className='yl-comp-text-field'>
                <div className='yl-comp-field-label'>刷新停留在当前页面</div>
                <div className='yl-comp-field-content row' style={{ width: '204px' }}>
                  <Switch
                    checked={!loading.resetPageType}
                    onChange={(checked) => {
                      saveScreenConfig(!checked, 'resetPageType', ['loading']);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ConfigProvider>
    </div>
  );
};

export default observer(AppProperties);
