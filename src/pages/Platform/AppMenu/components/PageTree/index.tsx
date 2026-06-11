import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useContextMenu } from 'react-contexify';
import { toJS } from 'mobx';
import { message, Button, Input, Tooltip, Tree } from 'antd';
import { CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import addFolderIcon from '@/assets/icon/PageTree/addFolderIcon.png';
import addPageIcon from '@/assets/icon/PageTree/addPageIcon.png';
import folderIcon from '@/assets/icon/PageTree/folder.png';
import pageIcon from '@/assets/icon/PageTree/page.png';
import mainIcon from '@/assets/icon/PageTree/mainPage.png';
import { useStore } from '@/hooks';
import { PageItem, PageState, PageType } from '@/store/pageTree';
import importPageIcon from '@/assets/icon/PageTree/importPageIcon.png';
import arrowExpandedIcon from '@/assets/icon/PageTree/arrowExpanded.png';
import arrowCloseIcon from '@/assets/icon/PageTree/arrowClose.png';
import styles from './index.less';
import ImportPage from './importPage';

function filterNode(node, filterFunc) {
  const children = node.children || [];
  const filteredChildren = [];

  for (const child of children) {
    const filteredChild = filterNode(child, filterFunc);
    if (filteredChild) {
      filteredChildren.push(filteredChild);
    }
  }

  const shouldIncludeNode = filterFunc(node);

  if (shouldIncludeNode || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }

  return null;
}
// filterTree函数接受一个树和一个过滤条件函数，返回一个搜索树
function filterTree(rootNodes, filterFunc) {
  const filteredRootNodes = [];

  for (const rootNode of rootNodes) {
    const filteredRootNode = filterNode(rootNode, filterFunc);
    if (filteredRootNode) {
      filteredRootNodes.push(filteredRootNode);
    }
  }

  return filteredRootNodes;
}

/**
 * 遍历树查找key并进行操作
 * @param data
 * @param key
 * @param callback
 * @returns
 */
const loopTree: (
  data: PageItem[],
  key: string,
  callback: (node: PageItem, i: number, page: PageItem[]) => void,
) => any = (data, key, callback) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].appPageId === key) {
      return callback(data[i], i, data);
    }
    if (data[i].children) {
      loopTree(data[i].children, key, callback);
    }
  }
  return false;
};

/**
 * 页面树节点标题
 */
const TreeTitle = observer(({ item }) => {
  const [value, setValue] = useState(item.name);
  const [editing, setEditing] = useState(item.state);
  const { pageTreeStore } = useStore();
  const { saveRename } = pageTreeStore;
  useEffect(() => {
    if (editing !== item.state) {
      setEditing(item.state);
    }
  }, [item.state, editing]);
  return editing === PageState.unnamed ? (
    <span style={{ display: 'flex', width: '100%' }}>
      <Input
        className={styles.nameInput}
        value={value}
        onClick={(e) => e.stopPropagation()}
        onSelect={(e) => e.stopPropagation()}
        onPressEnter={(e) => {
          e.stopPropagation();
          item.name = value;
          item.state = PageState.named;
          saveRename(item);
        }}
        onChange={(e) => {
          e.stopPropagation();
          setValue(e.target.value);
        }}
      />
      {/* 确认按钮 */}
      <Tooltip title='确认'>
        <Button
          type='primary'
          shape='circle'
          icon={<CheckCircleOutlined />}
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            item.name = value;
            item.state = PageState.named;
            saveRename(item);
          }}
        />
      </Tooltip>
      {/* 取消按钮 */}
      <Tooltip title='取消'>
        <Button
          type='primary'
          shape='circle'
          icon={<CloseCircleOutlined />}
          size='small'
          onClick={(e) => {
            e.stopPropagation();
            item.state = PageState.named;
          }}
        />
      </Tooltip>
    </span>
  ) : (
    <span>{item.name}</span>
  );
});

const PageTree = () => {
  const { pageTreeStore, pageTabsStore, globalStore, editorStore } = useStore();
  const { bigScreenId } = globalStore;
  const {
    loadPageTree,
    pageTree,
    selectedPageIds,
    addItem,
    updatePageList,
    setSelectedItem,
    setSelectedPageIds,
    selectedItem,
  } = pageTreeStore;
  const { addTab /* getNextPage, selectedKey */ } = pageTabsStore;
  const { editModePaths } = editorStore;
  // 是否搜索状态
  const [keyWord, setKeyWord] = useState('');
  const [searchTree, setSearchTree] = useState(pageTree);

  // 导入页面弹框
  const [importVisible, setImportVisible] = useState(false);
  const parentIdRef = useRef('0');

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

  // 页面树 选中、展开
  // const [defaultExpandedKeys, setDefaultExpandedKeys] = useState(toJS(selectedPageIds) || []);
  const [expandedKeys, setExpandedKeys] = useState(toJS(selectedPageIds) || []);
  // const [selectedKeys, setSelectedKeys] = useState([]);
  /**
   *显示右键菜单
   */
  const { show } = useContextMenu({
    id: 'page_menu_id',
  });
  const showPageMenu = (event) => {
    // event.preventDefault();
    // console.log('showPageMenu', show);
    show({ event });
  };
  const openImportModal = () => {
    let parentId = '0';
    if (selectedItem) {
      // 选中文件夹
      if (selectedItem.type === PageType.folder && selectedItem.level === 5) {
        message.info('列表层级限制到5级！');
        return;
      }
      // 选中页面
      if (selectedItem.type === PageType.page && selectedItem.level > 5) {
        message.info('列表层级限制到5级！');
        return;
      }
      // 如果有选择
      parentId = selectedItem.type === PageType.folder ? selectedItem.id : selectedItem.parentId;
    }
    parentIdRef.current = parentId;
    setImportVisible(true);
  };
  /**
   * 导入更新页面列表
   */
  const shareCallback = useCallback(() => {
    loadPageTree(bigScreenId);
  }, [loadPageTree, bigScreenId]);
  /**
   * 新建文件夹
   */
  const createFolder = useCallback(() => {
    addItem(PageType.folder, bigScreenId);
  }, [addItem, bigScreenId]);
  /**
   * 新建页面
   */
  const createPage = useCallback(() => {
    addItem(PageType.page, bigScreenId);
  }, [addItem, bigScreenId]);
  /**
   * 拖拽开始
   * 需要受控时设置展开节点收起
   * info
   */
  const onDragEnter = useCallback((info) => {
    console.log('onDragEnter info', info);
  }, []);
  /**
   * 拖拽节点
   * 是否允许拖拽时放置在该节点
   * info
   */
  const onDrop = useCallback(
    (info) => {
      const { dataRef: toData, level, key: dropKey, pos } = info.node; // 目标节点
      const { dataRef: moveData } = info.dragNode; // 拖拽节点
      // 判断不超过五级目录
      // 目标节点深度
      const loop = (treeNodes) => {
        let count = 1;
        if (treeNodes.children) {
          let maxCount = 0;
          treeNodes.children.forEach((child) => {
            const childCount = loop(child);
            if (childCount > maxCount) {
              maxCount = childCount;
            }
          });
          count += maxCount;
        } else {
          count += treeNodes.type === PageType.page ? 0 : 1;
        }
        return count;
      };
      const movePath = loop(moveData);
      if (level + movePath > 5) {
        message.warning('页面不能超过5级');
        return false;
      }
      const params = {
        id: moveData.id,
        parentId: toData.id,
        sort: 0,
      };
      const dropPos = pos.split('-'); // 目标层级
      const dropPosition = info.dropPosition - Number(dropPos.at(-1));
      const data = [...searchTree];
      if (!info.dropToGap) {
        // 拖拽到目标节点内容中
        // 查找目标节点，并且插入头部
        if (toData.type === PageType.page) {
          message.warning('不允许向页面添加目录或者页面');
          return false;
        }
        params.parentId = toData.id;
        params.sort = toData.children && toData.children.length > 1 ? toData.children[0].sort : 0;
      } else if (
        ((info.node as any).props.children || []).length > 0 && // Has children
        (info.node as any).props.expanded && // Is expanded
        dropPosition === 1 // 在目标节点下部
      ) {
        // 查找目标节点，并且插入头部
        if (toData.type === PageType.page) {
          message.warning('不允许向页面添加目录或者页面');
          return false;
        }
        params.parentId = toData.id;
        params.sort = toData.children && toData.children.length > 1 ? toData.children[0].sort : 0;
      } else {
        let ar: PageItem[] = [];
        let i: number;
        // 查找目标节点
        loopTree(data, dropKey, (_item, index, arr) => {
          ar = arr;
          i = index;
        });
        params.parentId = toData.parentId;
        if (dropPosition === -1) {
          // 插入目标节点前一个
          params.sort = toData.sort;
        } else {
          // 插入目标节点后一个
          params.sort = i + 1 >= ar.length ? toData.sort + 1 : ar[i + 1].sort;
        }
      }
      updatePageList(params, moveData.appId);
      return true;
    },
    [updatePageList, searchTree],
  );
  /**
   * 点击页面树节点触发 如果是文件夹，不响应，如果是页面，则打开对应页面；
   * 取消点击不响应
   * function(selectedKeys, e:{selected: bool, selectedNodes, node, event})
   */
  const onSelect = useCallback(
    (s, e) => {
      const { dataRef: item } = e.node;
      if (s && s.length > 0) {
        setSelectedPageIds(s);
        setSelectedItem(item);
        addTab(item);
        // addTab(item, callBackFn);
      }
    },
    [setSelectedPageIds, setSelectedItem, addTab],
  );
  /**
   * 页面树展开/收起节点时触发
   * function(expandedKeys, {expanded: bool, node})
   */
  const onExpand = useCallback((ex) => {
    setExpandedKeys(ex);
  }, []);
  /**
   * 页面树节点icon
   */
  const treeIcon = useCallback((item: PageItem) => {
    let iconUrl = '';
    if (item.type === PageType.folder) {
      iconUrl = folderIcon;
    } else {
      iconUrl = item.isHomePage ? mainIcon : pageIcon;
    }
    return <img alt='' src={iconUrl} />;
  }, []);
  /**
   * 页面树
   */
  const treeNode = useCallback(
    (tree: PageItem[]) => {
      return tree.map((item) => {
        return {
          key: item.appPageId,
          title: <TreeTitle item={item} />,
          icon: treeIcon(item),
          dataRef: item,
          level: item.level,
          children: item.level >= 5 ? null : treeNode(item.children || []),
          className: !keyWord || item.name?.includes(keyWord) ? '' : 'did-not-filter',
        };
      });
    },
    [treeIcon, keyWord],
  );
  /**
   * 获取页面树
   */
  useEffect(() => {
    if (bigScreenId) {
      loadPageTree(bigScreenId, true);
    }
  }, [loadPageTree, bigScreenId]);
  /**
   * 获取搜索关键字
   */
  useEffect(() => {
    const EventEmitter = window.globalEventEmitter;
    if (!EventEmitter) return;
    const listenFn = (val) => {
      setKeyWord(val);
    };
    EventEmitter.on('PageTreeSearch', listenFn);
    return () => {
      EventEmitter.removeListener('PageTreeSearch', listenFn);
    };
  }, []);
  /**
   * 过滤页面树
   */
  useEffect(() => {
    // 页面树搜索功能
    if (keyWord) {
      const filterKeys: Set<string> = new Set();
      const tree = filterTree(pageTree, (node) => {
        if (node.type === PageType.folder && node.children && node.children.length > 0) {
          filterKeys.add(node.appPageId);
        }
        return node.name?.includes(keyWord);
      });
      setSearchTree(tree);
      setExpandedKeys([...filterKeys]);
    } else {
      setSearchTree(pageTree);
    }
  }, [pageTree, keyWord]);
  /**
   * 获取选中值
   */
  useEffect(() => {
    if (selectedPageIds && selectedPageIds.length > 0) {
      const selectedKey = selectedPageIds[0];
      loopTree(searchTree, selectedKey, (item) => {
        setSelectedItem(item);
        addTab(item);
        // addTab(item, callBackFn);
      });
    } else {
      setSelectedItem(null);
    }
  }, [searchTree, selectedPageIds, setSelectedItem, addTab]);

  return (
    editModePaths.length === 0 && (
      <div className={styles.pageTreeContainer} onContextMenu={showPageMenu}>
        <div className={styles.pageTreeTop}>
          <div className={styles.pageTreeTitle}>页面列表</div>
          <div className={styles.pageTreeIcon}>
            {/* 导入页面 */}
            {!globalStore.isMobile && (
              <Tooltip title='导入页面'>
                <img alt='' src={importPageIcon} onClick={openImportModal} />
              </Tooltip>
            )}
            {/* 新建文件夹 */}
            <Tooltip title='新建文件夹'>
              <img
                alt=''
                src={addFolderIcon}
                onClick={() => {
                  // 新建文件夹
                  createFolder();
                }}
              />
            </Tooltip>

            {/* 新建页面 */}
            <Tooltip title='新建页面'>
              <img
                alt=''
                src={addPageIcon}
                onClick={() => {
                  // 新建页面
                  createPage();
                }}
              />
            </Tooltip>
          </div>
        </div>

        <Tree
          showIcon
          className={styles.pageTree}
          onDrop={onDrop}
          onDragEnter={onDragEnter}
          switcherIcon={(val) => (
            <img alt='' src={val.expanded ? arrowExpandedIcon : arrowCloseIcon} style={{ width: 16, height: 16 }} />
          )}
          onSelect={onSelect}
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          selectedKeys={selectedPageIds}
          draggable={{
            icon: false,
            nodeDraggable: () => {
              return true;
            },
          }}
          blockNode
          treeData={treeNode(searchTree)}
        />
        {importVisible && (
          <ImportPage
            setImportVisible={setImportVisible}
            appId={bigScreenId}
            parentId={parentIdRef.current}
            shareCallback={shareCallback}
          />
        )}
      </div>
    )
  );
};

export default observer(PageTree);
