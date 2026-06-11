import React, { useCallback, useEffect, useRef } from 'react';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import { Tabs, Button, Modal, Tooltip } from 'antd';
import { useStore } from '@/hooks';
import './index.less';
import CloseDisabledIcon from '@/assets/svg/CloseDisabled.svg';
import TabMoreCloseIcon from '@/assets/icon/tab-more-close.png';

const { confirm } = Modal;
const PageTabs = () => {
  const { pageTabsStore, pageTreeStore, layerStore, serviceStore } = useStore();
  const { pageDic, pageKeyList, selectedKey, setSelectedTab, deleteTab /* , getNextPage */ } = pageTabsStore;
  const { setSelectedPageIds, getPageInfo, removePageInfo, pageStateMap, pageInitStateMap, isCloseAble } =
    pageTreeStore;

  // const iSNeedGetNextPageRef = useRef(false);
  // const callBackFn = () => {
  //   iSNeedGetNextPageRef.current = true;
  // };
  // /**
  //  * 鼠标移动触发获取下一页
  //  */
  // const mouseMoveFn = () => {
  //   if (iSNeedGetNextPageRef.current) {
  //     iSNeedGetNextPageRef.current = false;
  //     getNextPage(selectedKey);
  //   }
  // };
  /**
   * 切换tab
   * @param key
   */
  const onTabsChange = (key) => {
    setSelectedTab(key);
    // setSelectedTab(key, callBackFn);
    setSelectedPageIds([key]);
  };

  /**
   * 关闭tab保存页面
   * @param targetKey
   * @param cb
   */
  const saveForClose = useCallback(
    (targetKey: string, cb?: (approve: boolean) => void) => {
      if (targetKey && getPageInfo(targetKey)) {
        const pageInfo = getPageInfo(targetKey);
        const step = pageStateMap[targetKey] ?? 0;
        const initStep = pageInitStateMap[targetKey] ?? 0;
        let { componentList, pageConfig, mapComponentList } = pageInfo;
        const { activeLayerId } = pageConfig.layerConfig;
        // 当前选中页面，获取实时值
        if (targetKey === selectedKey) {
          componentList = layerStore.comList;
        }
        componentList = toJS(componentList);
        pageConfig = toJS(pageConfig);
        mapComponentList = toJS(mapComponentList);
        let modalRef;
        const footer = (
          <div className='ant-modal-confirm-btns'>
            <Button
              onClick={() => {
                if (modalRef) {
                  modalRef.destroy();
                }
                console.log('取消');
                if (cb) {
                  cb(false);
                }
              }}
            >
              取消
            </Button>
            <Button
              type='primary'
              onClick={() => {
                if (modalRef) {
                  modalRef.destroy();
                }
                const data = {
                  componentList,
                  mapComponentList,
                  pageConfig,
                };
                const callbackFun = () => {
                  if (cb) {
                    cb(true);
                  }
                };
                serviceStore.saveAppPageApi(data, activeLayerId, targetKey, true, callbackFun);
              }}
            >
              保存
            </Button>
            <Button
              onClick={() => {
                if (modalRef) {
                  modalRef.destroy();
                }
                removePageInfo(targetKey);
                if (cb) {
                  cb(true);
                }
              }}
            >
              不保存
            </Button>
          </div>
        );

        if (step === initStep) {
          console.log('无需保存！');
          if (cb) {
            cb(true);
          }
        } else {
          const titleStr = '提示';
          const contentStr = `是否保存对“${pageDic[targetKey]?.name}”的更改`;
          modalRef = confirm({
            getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
            title: titleStr,
            content: contentStr,
            className: 'del-notice-modal',
            okText: '保存',
            cancelText: '不保存',
            footer,
            zIndex: 9999,
          });
        }
      } else {
        console.log('当前页面无数据');
        if (cb) {
          cb(true);
        }
      }
    },
    [
      getPageInfo,
      layerStore.comList,
      pageDic,
      pageInitStateMap,
      pageStateMap,
      removePageInfo,
      selectedKey,
      serviceStore,
    ],
  );
  /**
   * 删除tab
   * @param targetKey
   * @param action
   */
  const onTabsEdit = (targetKey, action) => {
    console.log(targetKey);

    if (action === 'remove') {
      const cb = (approve: boolean) => {
        console.log('approve', approve);
        if (!approve) {
          return;
        }
        deleteTab(targetKey);
        // deleteTab(targetKey, callBackFn);
      };
      saveForClose(targetKey, cb);
    }
  };

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    // 在这里编写浏览器或标签页关闭时需要执行的代码
    e.preventDefault();
    e.returnValue = '确定要关闭应用吗？';
    return '确定要关闭应用吗？';
  }, []);

  useEffect(() => {
    // console.log('isCloseAble', isCloseAble);
    if (!isCloseAble) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    return () => {
      if (!isCloseAble) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [handleBeforeUnload, isCloseAble]);

  const onMouseDownForTabs = useCallback(
    (evt: React.MouseEvent, id: string) => {
      if (pageKeyList.length === 1 || evt.button !== 1) return;

      evt.preventDefault();

      if ((pageStateMap[id] ?? 0) === (pageInitStateMap[id] ?? 0)) {
        deleteTab(id);
        // deleteTab(id, callBackFn);
      } else {
        saveForClose(id, (approve) => {
          if (!approve) return;

          deleteTab(id);
          // deleteTab(id, callBackFn);
        });
      }
    },
    [deleteTab, pageInitStateMap, pageKeyList.length, pageStateMap, saveForClose],
  );

  return pageKeyList.length > 0 ? (
    <Tabs
      type='editable-card'
      className='custom-page-tabs'
      hideAdd
      onChange={onTabsChange}
      activeKey={selectedKey}
      onEdit={onTabsEdit}
      // onMouseMove={mouseMoveFn}
      items={pageKeyList.map((id) => {
        return {
          label: (
            <div className='title-container' onMouseDown={(evt) => onMouseDownForTabs(evt, id)}>
              <Tooltip title={pageDic[id]?.name} placement='bottom'>
                <span className='title-tip-text'>{pageDic[id]?.name}</span>
              </Tooltip>

              {pageKeyList.length === 1 &&
                ((pageStateMap[id] ?? 0) === (pageInitStateMap[id] ?? 0) ? (
                  <img src={CloseDisabledIcon} alt='Close' style={{ marginRight: '-103.px' }} />
                ) : (
                  <div className='yellow-circle' />
                ))}
            </div>
          ),
          key: id,
          children: null,
          closable: !(pageKeyList.length === 1),
          disabled: pageKeyList.length === 1,
          closeIcon:
            (pageStateMap[id] ?? 0) === (pageInitStateMap[id] ?? 0) ? (
              <div className='close-icon-tab-outer'>
                <img src={TabMoreCloseIcon} alt='Close' className='close-icon-tab' />
              </div>
            ) : (
              <div className='yellow-circle-outer'>
                {(pageStateMap[id] ?? 0) !== (pageInitStateMap[id] ?? 0) && <div className='yellow-circle' />}

                <img src={TabMoreCloseIcon} alt='Close' className='close-icon-tab' />
              </div>
            ),
        };
      })}
    />
  ) : null;
};

export default observer(PageTabs);
