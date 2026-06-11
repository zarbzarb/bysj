import { Breadcrumb, Tooltip, Spin, message, Modal, Button } from 'antd';
import React, { useEffect, useRef, useCallback, useState } from 'react';

import { handlePrint } from '@/components/html2canvas';

import { bunchFn } from '@/components/ContextMenu/Operation';
import { observer } from 'mobx-react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';
import DatasetAndRelationshipsIcon from '@/assets/newIcon/TopKitBar/DatasetAndRelationships.svg';
import HooksIcon from '@/assets/newIcon/TopKitBar/Hooks.svg';
import SavePerLayerIcon from '@/assets/newIcon/TopKitBar/SavePerLayer.svg';
import SavePerPageIcon from '@/assets/newIcon/TopKitBar/SavePerPage.svg';
import PreviewPerPageIcon from '@/assets/newIcon/TopKitBar/PreviewPerPage.svg';
import PreviewAllIcon from '@/assets/newIcon/TopKitBar/PreviewAll.svg';
import PublishIcon from '@/assets/newIcon/TopKitBar/Publish.svg';
import OssSource from '../OssSource';
import LeftTopMenu from '../LeftTopMenu';
import SelectVersion from './components/SelectVersion';
import ReleaseModal from './components/ReleaseModal';

import styles from './styles.less';

const { confirm } = Modal;

const Footer = (props: any) => {
  const { modalRef, saveAllEditingPages, list, callbackFun } = props;
  const [loading, setLoading] = useState(false);
  const modalRefCurrent = modalRef.current;
  return (
    <div className='ant-modal-confirm-btns'>
      <Button
        onClick={() => {
          modalRefCurrent && modalRefCurrent.destroy();
        }}
      >
        取消
      </Button>
      <Button
        type='primary'
        loading={loading}
        onClick={() => {
          // 保存所有未保存的页面
          setLoading(true);
          saveAllEditingPages(list, (status: string) => {
            if (status === 'success') {
              modalRefCurrent && modalRefCurrent.destroy();
              callbackFun();
            }
            setLoading(false);
          });
        }}
      >
        保存
      </Button>
      <Button
        onClick={() => {
          modalRefCurrent && modalRefCurrent.destroy();
          callbackFun();
        }}
      >
        不保存
      </Button>
    </div>
  );
};

const ManagerControl = (props) => {
  const { saveScreen, saveLayer, pagePreview, preview, goToHook, savePreviewImg } = props;

  const { layerStore, globalStore, editorStore, controlStore, pageTreeStore, pageTabsStore } = useStore();
  const { changeKeys, setChangeKeys, changeComponents, editModePaths, setEditModePath, saveMapInfo } = editorStore;
  const { bigScreenType, isApp, bigScreenId } = globalStore;
  const { DataDialog, dataVisible, toggleDataVisible, IsDataStoreModify } = controlStore;
  const { /* selectedItem, */ getEditingPages, saveAllEditingPages } = pageTreeStore;
  const { selectedKey } = pageTabsStore;
  const cancelFlagRef = useRef(false);
  const modalRef = useRef(null);

  const [releaseVisible, setReleaseVisible] = useState(false);

  const currentLayer = layerStore.layers.find((l) => l.layerId === layerStore.activeLayerId);
  const layerSaveTitle = `只保存当前页面图层的配置内容，当前页面图层为：${currentLayer?.layerName || ''}`;
  const screenSaveTitle =
    bigScreenType === 'card'
      ? '全屏保存'
      : isApp
      ? '保存当前页面'
      : `保存所有页面图层的配置内容，共${layerStore.layers.length}个页面图层`;

  const editInfoName = window.titleName;
  const currentEditModePaths = JSON.parse(JSON.stringify(editModePaths));
  if (bigScreenType !== 'card') {
    currentEditModePaths.unshift(editInfoName);
  }

  /**
   * 卡片自动成组
   */
  const addGroup = useCallback(() => {
    const keys = [];
    for (const item of window.componentList) {
      keys.push(item.key);
    }
    setChangeKeys(keys);
    const item = bunchFn(layerStore, {}, bigScreenType, changeKeys);
    if (item && item.key) {
      changeComponents([item.key]);
    }
  }, [bigScreenType, changeComponents, changeKeys, layerStore, setChangeKeys]);

  // 判断业务图层编辑器是否允许保存
  const allowLayerSave = useCallback(() => {
    if (bigScreenType !== 'layer') {
      return true;
    }
    const filterMap = new Set(['MapFoundationPlan', 'MapGlFoundationPlan', 'Map3DFoundationPlan']);
    const filterComp = new Set([
      'MapFoundationPlan',
      'MapGlFoundationPlan',
      'Map3DFoundationPlan',
      'LayerTree',
      'LayerLegend',
      'RegionSelect',
    ]);
    const filterComp1 = new Set([
      'MapFoundationPlan',
      'MapGlFoundationPlan',
      'Map3DFoundationPlan',
      'MapGaudOnline',
      'MapGlBasicLayer',
      'MapGlBasicLayerNew',
      'Map3DBasicLayer',
    ]);
    // 获取基础图层及其组件
    const basicLayer = layerStore.layers.find((v) => v.layerName === '基础图层');
    const basicComs = layerStore.comList.filter((v) => v.layerId === basicLayer.layerId);
    // 判断基础图层只允许放入一个地图组件
    const maps = basicComs.filter((com) => filterMap.has(com.englishName));
    if (maps.length > 1) {
      message.warning('图层编辑器基础图层只允许放入一个地图组件!');
      return false;
    }
    // 判断基础图层
    if (basicComs.length > 0) {
      if (
        basicComs.some(
          (com) =>
            ![
              '@yl/datai-com-map-foundationPlan',
              '@yl/datai-com-map-gl-FoundationPlan',
              '@yl/datai-com-map-3D-FoundationPlan',
              'LayerTree',
              'LayerLegend',
              'RegionSelect',
            ].includes(com.type),
        )
      ) {
        message.warning('图层编辑器基础图层不允许放入地图和地图交互(图层图例、图层树、网格选择)以外的组件!');
        return false;
      }

      // 判断地图以及地图交互组件
      const mapCom = basicComs.find((com) => filterComp1.has(com.englishName));
      if (mapCom) {
        const layers = mapCom.layers || [];
        if (layers.length > 2) {
          message.warning('地图组件不允许有2个以上子组件!');
          return false;
        }
        if (layers.length === 2 && layers[0].type === layers[1].type) {
          message.warning('地图组件的子组件不能都为底图!');
          return false;
        }
      }
    }

    // 获取搜素图层组件
    const otherLayerComs = layerStore.comList.filter((com) => com.layerName === '搜索图层');
    // 判断搜索图层
    if (
      otherLayerComs.some((com) => (com.classType === 'antd' || com.classType === 'com') && filterComp.has(com.type))
    ) {
      message.warning('搜索图层不允许出现地图交互组件(图层图例、图层树、网格选择)!');
      return false;
    }

    return true;
  }, [bigScreenType, layerStore.comList, layerStore.layers]);

  // 判断组件是否允许保存
  // const allowCompNameSave = useCallback(() => {
  //   let isAllowSave = true;
  //   window.DataI.each(layerStore.comList, (com) => {
  //     if (!(com.name || com.compName)) {
  //       isAllowSave = false;
  //       message.error(`组件-${com.key}-名称不能为空!`);
  //     }
  //   });
  //   return isAllowSave;
  // }, [layerStore.comList]);
  /**
   * 全屏保存
   */

  // 全屏保存
  const saveScreenIn = useCallback(() => {
    // if (!allowCompNameSave()) return;
    const dom: HTMLElement = document.querySelector('.manager-loading');
    const saveScreenHandler = () => {
      dom && (dom.style.display = 'flex');
      // v8.5.0 保存当前地图设置
      saveMapInfo(true);
      saveScreen(() => {
        dom && (dom.style.display = 'none');
      });
    };
    if (bigScreenType === 'card') {
      dom && (dom.style.display = 'flex');
      if (
        window.componentList.length > 1 || // 没有顶级组
        (window.componentList.length === 1 && window.componentList[0].classType !== 'group') // 避免每次保存卡片的时候都成组
      ) {
        addGroup();
      }

      // 自动成组会更改DOM结构,异步处理截图操作
      if (!isApp) {
        setTimeout(() => {
          const handlePrintHandle = handlePrint('[data-type="console"]'); // 接截取画布
          // let handlePrintHandle = handlePrint('[data-type="console"] .group'); // 卡片取最外层的组
          // if (!handlePrintHandle) {
          //   handlePrintHandle = handlePrint('[data-type="console"]'); // 避免找不到组直接截取画布
          // }
          handlePrintHandle
            ?.then((base64) => {
              savePreviewImg(base64);
            })
            .catch(() => {
              console.error('获取预览图失败');
            });
        });
      }
      // v8.5.0 保存当前地图设置
      saveMapInfo(true);
      saveScreen(() => {
        dom && (dom.style.display = 'none');
      });
    } else {
      if (!allowLayerSave()) return;
      confirm({
        getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
        title: `确定保存当前页面所有页面图层中的配置吗？如果有其他用户在协作开发，有可能覆盖对方的配置，目前共${layerStore.layers.length}个页面图层`,
        content: '',
        className: 'del-notice-modal',
        okText: '确定',
        cancelText: '取消',
        // destroyOnClose: true,
        onOk() {
          cancelFlagRef.current = false;
          saveScreenHandler();
        },
        onCancel() {
          cancelFlagRef.current = true;
        },
        afterClose() {
          if (isApp) {
            return;
          }
          if (!cancelFlagRef.current) {
            const handlePrintHandle = handlePrint('[data-type="console"]');
            handlePrintHandle
              ?.then((base64) => {
                savePreviewImg(base64);
              })
              .catch(() => {
                console.error('获取预览图失败');
              });
          }
        },
      });
    }
  }, [
    bigScreenType,
    saveMapInfo,
    saveScreen,
    isApp,
    addGroup,
    savePreviewImg,
    allowLayerSave,
    // allowCompNameSave,
    layerStore.layers.length,
  ]);

  /**
   * 单图层保存
   * @returns
   */
  const saveLayerIn = () => {
    // if (!allowCompNameSave()) return;
    if (!allowLayerSave()) return;
    const dom: HTMLElement = document.querySelector('.manager-loading');
    dom.style.display = 'flex';
    // v8.5.0 保存当前地图设置
    saveMapInfo(true);
    saveLayer(() => {
      dom.style.display = 'none';
    });
  };

  /**
   * 标题面包屑导航跳转
   * @param e
   * @returns
   */
  const changeEditModePaths = (e) => {
    const currentPath = e.target.dataset.path;
    const newEditModePath = JSON.parse(JSON.stringify(editModePaths));
    if (newEditModePath.at(-1) === currentPath) return;
    const index = newEditModePath.indexOf(currentPath);
    const len = newEditModePath.length;
    newEditModePath.splice(index + 1, len - index);
    if (newEditModePath.length === 0) {
      saveMapInfo(false);
    }
    setEditModePath(newEditModePath);
    window.executeCommand('clearStack');
  };

  /**
   *  v8.5: 切换版本或者点击发布弹提示是否保存
   */
  const saveForVersion = (type: string, cb?: () => void) => {
    const list = getEditingPages();
    const callbackFun = () => {
      if (type === '1') {
        // 切换版本
        cb && cb();
      } else if (type === '2') {
        // 发布版本
        setReleaseVisible(true);
      }
    };
    if (list?.length > 0 || IsDataStoreModify) {
      const titleStr = '提示';
      const contentStr = '存在未保存的页面或变量修改，是否保存该版本';
      modalRef.current = confirm({
        getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
        title: titleStr,
        content: contentStr,
        className: 'del-notice-modal',
        okText: '保存',
        cancelText: '不保存',
        footer: (
          <Footer modalRef={modalRef} list={list} callbackFun={callbackFun} saveAllEditingPages={saveAllEditingPages} />
        ),
        zIndex: 9999,
      });
    } else {
      // console.log('无需保存！');
      callbackFun();
    }
  };

  useEffect(() => {
    if (!window.globalEventEmitter) return;
    window.globalEventEmitter.on('saveScreen', saveScreenIn);
    return () => {};
  }, []);

  const breadcrumbItems = currentEditModePaths.map((path) => {
    const comp = layerStore.getComponent(path);
    return {
      key: path,
      title: (
        <>
          <a data-path={path} onClick={changeEditModePaths}>
            {comp ? (comp.name ? comp.name : comp.compName) : path}
          </a>
          {comp ? (
            <Tooltip title={`key:${path}`}>
              <QuestionCircleOutlined
                className='margin-left-8 margin-right-6'
                style={{
                  color: 'rgb(63, 181, 210)',
                  fontSize: '14px',
                }}
              />
            </Tooltip>
          ) : null}
        </>
      ),
    };
  });

  return (
    <>
      <div className='control-console row'>
        <LeftTopMenu />
        <div className='flex block'>
          <div className='screen-name center' style={{ margin: '0 auto' }}>
            {currentEditModePaths.length > 1 ? <Breadcrumb items={breadcrumbItems} /> : editInfoName}
          </div>
        </div>

        <div className='block right'>
          <ul className={styles.topKitBar}>
            <Tooltip title='数据及关联关系'>
              <li
                onClick={() => {
                  toggleDataVisible();
                }}
              >
                <img alt='数据及关联关系' src={DatasetAndRelationshipsIcon} />
              </li>
            </Tooltip>

            {/* oss资源管理 */}
            <OssSource />

            {/* hook脚本 */}
            {bigScreenType !== 'card' && bigScreenType !== 'layer' && (
              <Tooltip title='hook脚本'>
                <li
                  onClick={() => {
                    // if (!selectedItem || selectedItem.type === 0) {
                    //   message.warning('请先打开页面再编辑hook');
                    //   return;
                    // }
                    // goToHook(selectedItem.appPageId);
                    goToHook(selectedKey);
                  }}
                >
                  <img alt='hook脚本' src={HooksIcon} />
                </li>
              </Tooltip>
            )}

            <div
              style={{ backgroundColor: 'rgba(0, 142, 159, 1)', width: 1, height: 22, marginLeft: 18, marginRight: 20 }}
            />

            {bigScreenType === 'page' && (
              <div className={styles.versionSelect}>
                <SelectVersion onChange={(cb) => saveForVersion('1', cb)} appId={bigScreenId} />
              </div>
            )}

            {bigScreenType !== 'card' && (
              <Tooltip title={layerSaveTitle}>
                <li onClick={saveLayerIn}>
                  <img alt={layerSaveTitle} src={SavePerLayerIcon} />
                </li>
              </Tooltip>
            )}

            <Tooltip title={screenSaveTitle}>
              <li onClick={saveScreenIn}>
                <img alt={screenSaveTitle} src={SavePerPageIcon} />
              </li>
            </Tooltip>

            {bigScreenType === 'page' && (
              <Tooltip title='预览页面'>
                <li
                  onClick={() => {
                    // if (!selectedItem || selectedItem.type === 0) {
                    //   message.warning('请选择页面预览!');
                    //   return;
                    // }
                    // pagePreview(selectedItem.appPageId);
                    pagePreview(selectedKey);
                  }}
                >
                  <img alt='预览页面' src={PreviewPerPageIcon} />
                </li>
              </Tooltip>
            )}

            <Tooltip title='预览应用'>
              <li onClick={preview}>
                <img alt='预览应用' src={PreviewAllIcon} />
              </li>
            </Tooltip>

            {bigScreenType === 'page' && (
              <Tooltip title='发布应用'>
                <li
                  onClick={() => {
                    saveForVersion('2');
                  }}
                >
                  <img alt='发布应用' src={PublishIcon} />
                </li>
              </Tooltip>
            )}
          </ul>
        </div>
      </div>

      <div className='manager-loading' style={{ display: 'none' }}>
        <Spin size='large' />
      </div>
      {dataVisible && <DataDialog dataVisible={dataVisible} toggleDataVisible={toggleDataVisible} />}
      {releaseVisible && (
        <ReleaseModal visible={releaseVisible} appId={bigScreenId} onClose={() => setReleaseVisible(false)} />
      )}
    </>
  );
};

export default observer(ManagerControl);
