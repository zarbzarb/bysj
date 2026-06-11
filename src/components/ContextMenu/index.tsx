import React, { useState, useMemo, useRef } from 'react';
import { observer } from 'mobx-react';
import { Menu, Item, Separator } from 'react-contexify';
import { message, Modal } from 'antd';
import _ from 'lodash';
import { allowLayerToGroup, allowMapToGroup, allowBasicLayerToGroup } from '@/Computed/Comp/ConditionComputed';
import { DelCompByKeys } from '@/EventHandlers/ContextMenuEvent';
import { isAllowSort, getNowSelectInKey } from '@/utils/configPageUtils';
import { copy, paste } from '@/utils/Clipboard';
import { useStore } from '@/hooks';
import CardUploadModal from './components/CardUploadModal';
import 'react-contexify/dist/ReactContexify.css';
import styles from './index.less';

const { confirm } = Modal;

const getComponent = window.DataI.getComponentByKey;

const MENU_ID = 'menu_id';
const ContextMenu = () => {
  // 上传卡片弹框是否可见
  const [uploadCardVisibale, setUploadCardVisibale] = useState(false);
  const { editorStore, globalStore, layerStore } = useStore();
  const hasDoneRef = useRef(false);

  const { changeKeys, dynamicPanelEditComp, editModePaths, getEditComp, isEditMap } = editorStore;
  const { bigScreenType, isMenuInScreen, hasParseContent } = globalStore;
  const { getComponentByCurrentLayerList } = layerStore;

  let compItem;
  let isGroup = false;

  const editComp = getEditComp(editModePaths);
  let type;
  let parentKey;
  if (dynamicPanelEditComp) {
    type = 'dynamicPanel';
    parentKey = dynamicPanelEditComp;
  } else if (editComp && (editComp.type === 'DynamicPanel' || editComp.type === 'CollapsePanel')) {
    // v8.17 新增折叠面板
    type = 'dynamicPanel';
    parentKey = editComp.key;
  }

  if (changeKeys.length === 1) {
    const item = getComponent(changeKeys[0]);
    compItem = item;
    if (item && item.classType === 'group') {
      isGroup = true;
    }
  }

  /**
   * 当前为动态面板编辑态
   */
  const isDynamicPanelEditMode = useMemo(() => {
    return editModePaths.length === 1 && !editModePaths[0].startsWith('group');
  }, [editModePaths]);
  /**
   * 成组
   * @returns
   */
  const createGroup = () => {
    // 是否支持地图组件成组
    // if (!allowMapToGroup(changeKeys)) {
    //   message.warning('不支持地图组件成组!');
    //   return;
    // }
    // 判断是否能成组 超过二级限制成组
    // let bool = allowToGroup(changeKeys);
    // if (!bool) {
    //   message.warning('目前仅支持二级组嵌套！');
    //   return;
    // }

    if (bigScreenType === 'layer' && !allowBasicLayerToGroup(changeKeys)) {
      message.warning('业务图层编辑器基础图层不支持组件成组!');
      return;
    }

    // if (bigScreenType !== 'card' && !allowLayerToGroup(changeKeys)) {
    //   message.warning('只支持同一图层的组件成组！');
    //   return;
    // }
    if (!allowLayerToGroup(changeKeys)) {
      message.warning('只支持同一图层的组件成组！');
      return;
    }
    window.executeCommand('Bunching', changeKeys, 'create');
  };
  /**
   * 取消组
   */
  const dismissGroup = () => {
    window.executeCommand('Bunching', changeKeys, 'dismiss');
  };
  /**
   * 删除组件
   */
  const removeCom = () => {
    if (changeKeys.length > 0) {
      const comp = getComponent(changeKeys[0]);
      if (['MapFoundationPlan', 'Map3DFoundationPlan', 'MapGlFoundationPlan'].includes(comp.englishName)) {
        confirm({
          getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
          title: '提示',
          content: '其他页面添加了地图效果删除后将不可用，是否确认删除？',
          onOk() {
            DelCompByKeys(editorStore, changeKeys, null);
          },
          onCancel() {
            console.log('Cancel');
          },
        });
      } else {
        DelCompByKeys(editorStore, changeKeys, null);
      }
    } else {
      console.warn('请选择要删除的组件!');
    }
  };
  /**
   * 进入编辑态
   */
  const editMode = () => {
    editorStore.SetEditMode(changeKeys);
    window.executeCommand('clearStack');
  };
  /**
   *组件解锁
   */
  const cancelLock = () => {
    if (changeKeys.length === 0) {
      message.warning('请选择组件!');
      return;
    }
    window.executeCommand('LockCommand', false, changeKeys);
  };
  /**
   * 组件锁定
   * @returns
   */
  const comLock = () => {
    if (changeKeys.length === 0) {
      message.warning('请选择组件!');
      return;
    }
    window.executeCommand('LockCommand', true, changeKeys);
  };
  /**
   * 组件隐藏
   */
  const comInvisible = () => {
    const waitInvisibleComp = changeKeys.map((key) => getComponent(key));
    window.executeCommand('VisibleCommand', waitInvisibleComp, 'invisible');
  };

  /**
   * 置顶
   * @returns
   */
  const ToTop = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'ToTop')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'ToTop');
  };
  /**
   * 置底
   * @returns
   */
  const ToBottom = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'ToBottom')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'ToBottom');
  };
  /**
   * 上移
   * @returns
   */
  const upSeat = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'UpSeat')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'UpSeat');
  };
  /**
   * 下移
   * @returns
   */
  const nextSeat = () => {
    if (!isAllowSort(changeKeys, type, parentKey, 'NextSeat')) return;
    const key = changeKeys[0];
    window.executeCommand('SortCommand', key, type, parentKey, 'NextSeat');
  };
  /**
   * 修改弹框状态
   */
  const toggleUploadCardVisible = () => {
    setUploadCardVisibale((preValue) => {
      return !preValue;
    });
  };
  /**
   * 上传卡片
   * @returns
   */
  const UploadCard = () => {
    if (!allowMapToGroup(changeKeys)) {
      message.warning('地图组件不能添加到卡片!');
      return;
    }
    if (changeKeys.length !== 1) {
      message.error('布局模板根节点需为单一组件或组！');
      return;
    }
    toggleUploadCardVisible();
  };

  /**
   * 复制操作
   * @returns
   */
  const crossScreenCopyHandler = () => {
    if (changeKeys.length === 0) {
      message.warning('请选中需要复制的内容!');
      return;
    }
    copy(layerStore, changeKeys);
  };
  /**
   * 剪切操作
   * @returns
   */
  const crossScreenCutHandler = () => {
    if (changeKeys.length === 0) {
      message.warning('请选中需要剪切的内容!');
      return;
    }
    const compKeys = changeKeys;
    // 不允许剪切地图组件
    if (!allowMapToGroup(compKeys)) {
      message.warning('不允许剪切地图组件!');
      return;
    }
    // 复制操作
    copy(layerStore, compKeys, false);
    // 删除操作
    // window.executeCommand('RemoveCompCommand', compKeys.map(getComponentByCurrentLayerList));
    window.executeCommand(
      'RemoveCompCommand',
      compKeys.map((item) => getComponentByCurrentLayerList(item)),
    );
  };
  // 粘贴操作
  const crossScreenPasteHandler = () => {
    const compKeys = changeKeys;
    const nowSelectInKey = getNowSelectInKey(compKeys);
    const nowSelectInGroup = getComponentByCurrentLayerList(nowSelectInKey) ?? null;
    // 粘贴组件类型、粘贴组件key
    const [pasteToType, pasteInKey] = (() => {
      const firstSelect = getComponentByCurrentLayerList(compKeys[0]);
      let curPasteToType = null;
      if (compKeys.length === 1) {
        if (firstSelect?.isDragContainer) {
          curPasteToType = 'DragContainer';
        } else if (firstSelect.type === 'DynamicPanel' || firstSelect.type === 'CollapsePanel') {
          // v8.17 新增折叠面板
          curPasteToType = 'dynamicPanel';
        } else if (firstSelect.type === '@yl/dataq-com-group-basic') {
          curPasteToType = 'group';
        }
        return [curPasteToType, firstSelect.key];
      }
      curPasteToType = nowSelectInGroup?.classType ?? null;
      return [curPasteToType, _.isNull(curPasteToType) ? null : nowSelectInKey];
    })();

    paste(editorStore, [10, 10], pasteToType, pasteInKey, isMenuInScreen, true);
  };

  const handleItemClick = (args) => {
    // 关闭菜单栏之后不响应
    if (!hasDoneRef.current) {
      hasDoneRef.current = true;
      const { id } = args;
      switch (id) {
        case 'createGroup': {
          createGroup();
          break;
        }
        case 'dismissGroup': {
          setTimeout(() => {
            dismissGroup();
          }, 200);
          break;
        }
        case 'removeCom': {
          removeCom();
          break;
        }
        case 'editMode': {
          editMode();
          break;
        }
        case 'comLock': {
          comLock();
          break;
        }
        case 'cancelLock': {
          cancelLock();
          break;
        }
        case 'upSeat': {
          upSeat();
          break;
        }
        case 'nextSeat': {
          nextSeat();
          break;
        }
        case 'ToTop': {
          ToTop();
          break;
        }
        case 'ToBottom': {
          ToBottom();
          break;
        }
        case 'comInvisible': {
          comInvisible();
          break;
        }
        case 'UploadCard': {
          UploadCard();
          break;
        }
        case 'crossScreenCopyHandler': {
          crossScreenCopyHandler();
          break;
        }
        case 'crossScreenCutHandler': {
          crossScreenCutHandler();
          break;
        }
        case 'crossScreenPasteHandler': {
          crossScreenPasteHandler();
          break;
        }
        default: {
          break;
        }
      }
    }
  };

  return (
    !isEditMap && (
      <>
        <CardUploadModal backFn={toggleUploadCardVisible} visible={uploadCardVisibale} />
        <Menu
          id={MENU_ID}
          className={styles.contextMenuWrap}
          onVisibilityChange={(isVisible) => {
            // console.log('onVisibilityChange', isVisible);
            if (isVisible) {
              hasDoneRef.current = false;
            }
          }}
        >
          {/* 是否可以显示成组和取消成组 */}
          {isDynamicPanelEditMode || compItem?.isCustomListChild ? null : (
            <>
              <Item id='createGroup' onClick={handleItemClick}>
                成组(Ctrl/Cmd+g)
              </Item>
              {isGroup && (
                <Item id='dismissGroup' onClick={handleItemClick}>
                  取消组(Ctrl/Cmd+Shift+g)
                </Item>
              )}
            </>
          )}
          {/* 删除组件 */}
          <Item id='removeCom' onClick={handleItemClick}>
            删除(Backspace)
          </Item>

          {isDynamicPanelEditMode ? null : (
            <>
              {changeKeys.length === 1 ? (
                <Item id='editMode' onClick={handleItemClick}>
                  编辑(Ctrl/Cmd+E)
                </Item>
              ) : null}
              <Item id='comLock' onClick={handleItemClick}>
                锁定
              </Item>
              <Item id='cancelLock' onClick={handleItemClick}>
                取消锁定
              </Item>
              <Separator />
            </>
          )}
          <Item id='upSeat' onClick={handleItemClick}>
            {'上移(Ctrl/Cmd+>)'}
          </Item>
          <Item id='nextSeat' onClick={handleItemClick}>
            {'下移(Ctrl/Cmd+<)'}
          </Item>
          <Item id='ToTop' onClick={handleItemClick}>
            {'置顶(Ctrl/Cmd+Shift+>)'}
          </Item>
          <Item id='ToBottom' onClick={handleItemClick}>
            {'置底(Ctrl/Cmd+Shift+<)'}
          </Item>

          {isDynamicPanelEditMode ? null : (
            <>
              <Item id='comInvisible' onClick={handleItemClick}>
                设为隐藏
              </Item>
              <Separator />
              <Item id='UploadCard' onClick={handleItemClick}>
                提交卡片
              </Item>
            </>
          )}

          <Item id='crossScreenCopyHandler' onClick={handleItemClick}>
            复制(Ctrl/Cmd+C)
          </Item>
          <Item id='crossScreenCutHandler' onClick={handleItemClick}>
            剪切(Ctrl/Cmd+X)
          </Item>
          <Item id='crossScreenPasteHandler' disabled={hasParseContent} onClick={handleItemClick}>
            粘贴(Ctrl/Cmd+V)
          </Item>
        </Menu>
      </>
    )
  );
};

export default observer(ContextMenu);
