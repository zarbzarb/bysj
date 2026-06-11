import _ from 'lodash';
import { Modal, message } from 'antd';
import { isAllowSort, getNowSelectInKey } from '@/utils/configPageUtils';
import { allowMapToGroup } from '@/Computed/Comp/ConditionComputed';
import { formatPosition, setCompTransform } from '@/utils/transformUtils';
import { copy, paste } from '@/utils/Clipboard';
import { isTextSelected } from '@/utils/utils';
import $ from 'jquery';

const { confirm } = Modal;
const getComponent = window.DataI.getComponentByKey;

// Ctrl+S 保存
export const addListenSaveHandler = (store) => {
  window.addEventListener('keydown', (evt) => {
    const { rootStore } = store;
    const { platform } = rootStore.GlobalStore;
    if (!evt.key) return;
    const key = evt.key.toLowerCase();
    if (((platform === 'Win' && evt.ctrlKey) || (platform === 'Mac' && evt.metaKey)) && key === 's') {
      evt.preventDefault();
      window.globalEventEmitter.emit('saveScreen');
    }
  });
};
// v7.7 修复弹窗只能弹窗一次bug
let isReadyToDel = true;
const addListenDelComponent = (evt, store) => {
  const { rootStore, changeKeys } = store;
  const { LayerStore } = rootStore;
  // 事件焦点在输入框或者输入文本上，并且焦点不在画布上，不执行删除操作
  if (
    ((evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'TEXTAREA') &&
      !$(evt.target).is('[data-type="console"]')) ||
    !isReadyToDel
  )
    return;

  isReadyToDel = false;

  // in case
  setTimeout(() => (isReadyToDel = true), 256);

  const keys = changeKeys;

  if (keys.length === 0) return;
  const waitRemoveComp = keys.map((element) => LayerStore.getComponentByCurrentLayerList(element));
  const titleStr = '确定删除子组件吗？';
  const delStr = `关联子组件：${waitRemoveComp
    .map((vl) => {
      return vl.compName || vl.name;
    })
    .join(',')}`;

  confirm({
    getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
    title: titleStr,
    content: delStr,
    className: 'del-notice-modal',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      // console.log('run');
      isReadyToDel = true;
      window.executeCommand('RemoveCompCommand', waitRemoveComp);
      store.forceUpdate();
    },
    onCancel() {
      isReadyToDel = true;
    },
  });
};

let delayTime;

// v7.9 修改刷新间隔1500为200
const delayUpdate = (store) => {
  // 设置当前页面更新
  const { rootStore } = store;
  const { setPageInfoStep } = rootStore.PageTreeStore;
  setPageInfoStep(1);
  clearTimeout(delayTime);
  delayTime = setTimeout(() => {
    store.forceUpdate();
  }, 200);
};

const moveLeft = (isCtrlDown, keys, store) => {
  keys.forEach((key) => {
    const com = getComponent(key);
    let { transform } = com.styles;
    transform = formatPosition(transform);
    transform[0] -= isCtrlDown ? 5 : 1;

    setCompTransform(com, transform[0], transform[1]);

    const selector = `[data-key='${key}']`;
    $(selector).css({
      transform: `translate(${transform[0]}px, ${transform[1]}px)`,
    });
  });
  delayUpdate(store);
};

const moveRight = (isCtrlDown, keys, store) => {
  keys.forEach((key) => {
    const com = getComponent(key);
    let { transform } = com.styles;
    transform = formatPosition(transform);
    transform[0] += isCtrlDown ? 5 : 1;
    setCompTransform(com, transform[0], transform[1]);
    const selector = `[data-key='${key}']`;
    $(selector).css({
      transform: `translate(${transform[0]}px, ${transform[1]}px)`,
    });
  });
  delayUpdate(store);
};

const moveTop = (isCtrlDown, keys, store) => {
  keys.forEach((key) => {
    const com = getComponent(key);
    let { transform } = com.styles;
    transform = formatPosition(transform);
    transform[1] -= isCtrlDown ? 5 : 1;
    setCompTransform(com, transform[0], transform[1]);
    const selector = `[data-key='${key}']`;
    $(selector).css({
      transform: `translate(${transform[0]}px, ${transform[1]}px)`,
    });
  });
  delayUpdate(store);
};

const moveBottom = (isCtrlDown, keys, store) => {
  keys.forEach((key) => {
    const com = getComponent(key);
    let { transform } = com.styles;
    transform = formatPosition(transform);
    transform[1] += isCtrlDown ? 5 : 1;
    setCompTransform(com, transform[0], transform[1]);
    const selector = `[data-key='${key}']`;
    $(selector).css({
      transform: `translate(${transform[0]}px, ${transform[1]}px)`,
    });
  });
  delayUpdate(store);
};

export const addListenConsoleKeyBoardEnter = (store) => {
  document.addEventListener('keydown', (evt) => {
    const { rootStore, changeKeys, editModeAnimeRunning, SetEditMode, isEditMap } = store;
    const { platform } = rootStore.GlobalStore;
    if (evt.shiftKey) {
      return;
    }
    const { key, ctrlKey, metaKey } = evt;
    // console.log('addListenConsoleKeyBoardEnter key', key);
    if (key === 'Backspace' || key === 'Delete') {
      // 判断删除功能
      // v8.5.0 地图编辑态禁止快捷键删除
      if (isEditMap) {
        return;
      }
      addListenDelComponent(evt, store);
    } else {
      const keys = changeKeys;
      if (keys.length === 0) return;
      if (document.activeElement.tagName === 'INPUT') {
        return;
      }
      if (((platform === 'Win' && ctrlKey) || (platform === 'Mac' && metaKey)) && key === 'e') {
        if (editModeAnimeRunning) return;
        // v8.5.0 地图编辑态禁止快捷键编辑
        if (isEditMap) {
          return;
        }
        SetEditMode(keys);
        window.executeCommand('clearStack');
      }

      const isCtrlDown = !!((platform === 'Win' && ctrlKey) || (platform === 'Mac' && metaKey));
      // v8.5.0 地图编辑态禁止快捷键移动
      if (isEditMap) {
        // evt.preventDefault();
        return;
      }
      switch (key) {
        case 'ArrowLeft': {
          moveLeft(isCtrlDown, keys, store);
          evt.preventDefault();
          break;
        }
        case 'ArrowUp': {
          moveTop(isCtrlDown, keys, store);
          evt.preventDefault();
          break;
        }
        case 'ArrowRight': {
          moveRight(isCtrlDown, keys, store);
          evt.preventDefault();
          break;
        }
        case 'ArrowDown': {
          moveBottom(isCtrlDown, keys, store);
          evt.preventDefault();
          break;
        }
        default:
      }
    }
  });
};

// Ctrl+Z 撤销
export const addListenUndoShortCutKey = (store) => {
  document.addEventListener('keydown', (evt) => {
    const { rootStore, isEditMap } = store;
    const { platform } = rootStore.GlobalStore;
    const key = evt.key?.toLowerCase();
    if ((platform === 'Win' && evt.ctrlKey) || (platform === 'Mac' && evt.metaKey)) {
      // v8.5.0 地图编辑态禁止快捷键撤销重做
      if (isEditMap) {
        return;
      }
      // Ctrl+Shift+Z 重做
      if (key === 'z' && evt.shiftKey) {
        window.executeCommand('redo');
        return;
      }
      if (key === 'z') {
        // Ctrl+Z 撤销
        window.executeCommand('undo');
        return;
      }
    }
  });
};

// v7.7 移动组件层级
export const MoveLayerExKeyMap = (store) => {
  document.addEventListener('keydown', (evt) => {
    let type;
    let parentKey;
    const { changeKeys, dynamicPanelEditComp, editModePaths, getEditComp, rootStore, isEditMap } = store;
    const { platform } = rootStore.GlobalStore;
    const editComp = getEditComp(editModePaths);
    // v8.5.0 地图编辑态禁止快捷键移动组件层级
    if (isEditMap) {
      return;
    }

    if (dynamicPanelEditComp) {
      type = 'dynamicPanel';
      parentKey = dynamicPanelEditComp;
    } else if (editComp && (editComp.type === 'DynamicPanel' || editComp.type === 'CollapsePanel')) {
      type = 'dynamicPanel';
      parentKey = editComp.key;
    }
    // console.log('keydown evt', evt);
    // console.log('evt.key', evt.key);
    if (!evt.key) return;
    const key = evt.key.toLowerCase();
    // console.log('key', key);
    // console.log('store.platform', store.platform);
    if ((platform === 'Win' && evt.ctrlKey) || (platform === 'Mac' && evt.metaKey)) {
      if (evt.shiftKey) {
        // console.log('evt.shiftKey', evt.shiftKey);
        if (key === '.' || key === '>') {
          evt.preventDefault();
          if (!isAllowSort(changeKeys, type, parentKey, 'ToTop')) return;
          window.executeCommand('SortCommand', changeKeys[0], type, parentKey, 'ToTop');
        } else if (key === ',' || key === '<') {
          evt.preventDefault();
          if (!isAllowSort(changeKeys, type, parentKey, 'ToBottom')) return;
          window.executeCommand('SortCommand', changeKeys[0], type, parentKey, 'ToBottom');
        }
      } else if (key === '.' || key === '>') {
        evt.preventDefault();
        if (!isAllowSort(changeKeys, type, parentKey, 'UpSeat')) return;
        window.executeCommand('SortCommand', changeKeys[0], type, parentKey, 'UpSeat');
      } else if (key === ',' || key === '<') {
        evt.preventDefault();
        if (!isAllowSort(changeKeys, type, parentKey, 'NextSeat')) return;
        window.executeCommand('SortCommand', changeKeys[0], type, parentKey, 'NextSeat');
      }
    }
  });
};

export const groupExKeyMap = (store) => {
  document.addEventListener('keydown', (evt) => {
    const { changeKeys, rootStore, isEditMap } = store;
    const { platform } = rootStore.GlobalStore;
    if (!evt.key) return;
    const key = evt.key.toLowerCase();
    if (((platform === 'Win' && evt.ctrlKey) || (platform === 'Mac' && evt.metaKey)) && key === 'g') {
      evt.stopPropagation();
      evt.preventDefault();
      // v8.5.0 地图编辑态禁止快捷键成组、解散组
      if (isEditMap) {
        return;
      }
      if (evt.shiftKey) {
        window.executeCommand('Bunching', changeKeys, 'dismiss');
      } else {
        window.executeCommand('Bunching', changeKeys, 'create');
      }
    }
  });
};

export const copyAndPasteExKeyMap = (store) => {
  document.addEventListener('copy', (evt) => {
    const { changeKeys, rootStore, isEditMap } = store;
    // v8.5.0 地图编辑态禁止快捷键复制
    if (isEditMap) {
      return;
    }
    // 选中文字
    if (
      $(evt.target).is('.attr *') ||
      isTextSelected() ||
      ((evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'TEXTAREA') &&
        !$(evt.target).is('[data-type="console"]'))
    ) {
      return;
    }
    if (changeKeys.length === 0) {
      message.warning('请选中需要复制的内容!');
      return;
    }
    evt.preventDefault();
    const compKeys = changeKeys;

    copy(rootStore.LayerStore, compKeys);
  });

  document.addEventListener('cut', (evt) => {
    const { changeKeys, rootStore, isEditMap } = store;
    const { LayerStore } = rootStore;
    // console.log('cut evt', evt);
    // v8.5.0 地图编辑态禁止快捷键剪切
    if (isEditMap) {
      return;
    }
    if (
      $(evt.target).is('.attr *') ||
      ((evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'TEXTAREA') &&
        !$(evt.target).is('[data-type="console"]'))
    ) {
      return;
    }
    if (changeKeys.length === 0) {
      message.warning('请选中需要剪切的内容!');
      return;
    }
    evt.preventDefault();
    const compKeys = changeKeys;
    // 不允许剪切地图组件
    if (!allowMapToGroup(compKeys)) {
      message.warning('不允许剪切地图组件!');
      return;
    }
    copy(LayerStore, compKeys, false);
    window.executeCommand(
      'RemoveCompCommand',
      compKeys.map((element) => LayerStore.getComponentByCurrentLayerList(element)),
    );
  });

  document.addEventListener('paste', (evt) => {
    console.log('paste');

    const { changeKeys, rootStore, isEditMap } = store;
    const { LayerStore, GlobalStore } = rootStore;
    const { mousePos } = GlobalStore;
    // v8.5.0 地图编辑态禁止快捷键粘贴
    if (isEditMap) {
      return;
    }
    if (
      (evt.target.nodeName === 'INPUT' || evt.target.nodeName === 'TEXTAREA') &&
      $('[data-type="console"]').find($(evt.target)).length <= 0
    ) {
      return;
    }
    const clipText = window.localStorage.getItem('copyReady');

    if (!clipText) {
      return;
    }

    evt.preventDefault();
    const compKeys = changeKeys;
    const nowSelectInKey = getNowSelectInKey(compKeys);
    const nowSelectInGroup = LayerStore.getComponentByCurrentLayerList(nowSelectInKey) ?? null;

    const [pasteToType, pasteInKey] = (() => {
      const firstSelect = LayerStore.getComponentByCurrentLayerList(compKeys[0]);
      let curPasteToType = null;
      if (compKeys.length === 1) {
        if (firstSelect?.isDragContainer) {
          curPasteToType = 'DragContainer';
        } else if (firstSelect.type === 'DynamicPanel' || firstSelect.type === 'CollapsePanel') {
          curPasteToType = 'dynamicPanel';
        } else if (firstSelect.type === '@yl/dataq-com-group-basic') {
          curPasteToType = 'group';
        }
        return [curPasteToType, firstSelect.key];
      }
      curPasteToType = nowSelectInGroup?.classType ?? null;
      return [curPasteToType, _.isNull(curPasteToType) ? null : nowSelectInKey];
    })();
    paste(store, [10, 10], pasteToType, pasteInKey, mousePos.isInScreen, false);
  });
};
