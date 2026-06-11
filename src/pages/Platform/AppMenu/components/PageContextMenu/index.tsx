import React, { useCallback } from 'react';
import { Menu, Item } from 'react-contexify';
import { Modal } from 'antd';
import 'react-contexify/dist/ReactContexify.css';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { PageType } from '@/store/pageTree';
import cancelHomeHold from '@/assets/icon/PageTree/rightMenu/cancel_home_hold.png';
import copy from '@/assets/icon/PageTree/rightMenu/copy.png';
import deleteImg from '@/assets/icon/PageTree/rightMenu/delete.png';
import exportImg from '@/assets/icon/PageTree/rightMenu/export.png';
import home from '@/assets/icon/PageTree/rightMenu/home.png';
import name from '@/assets/icon/PageTree/rightMenu/name.png';
import setHomeHold from '@/assets/icon/PageTree/rightMenu/set_home_hold.png';
import styles from './index.less';

// interface IProps {}
const PAGE_MENU_ID = 'page_menu_id';
const { confirm } = Modal;

const PageContextMenu = () => {
  const {
    globalStore,
    pageTreeStore,
    pageTabsStore,
    versionStore: { apiVersion },
  } = useStore();
  const { selectedItem, deleteItem, setMainPage, setMainPageResidence, rename, exportAppPage, copyAppPage } =
    pageTreeStore;
  const { selectedKey, pageKeyList } = pageTabsStore;

  const showDeleteConfirm = (item) => {
    const typeStr = item.type === PageType.folder ? '文件夹' : '页面';
    const titleStr = `是否删除${typeStr}：${item.name}？`;
    confirm({
      getContainer: () => document.querySelector('#app'), // 弹框挂载到编辑模式
      title: titleStr,
      className: 'del-notice-modal',
      okText: '确定',
      cancelText: '取消',
      onOk() {
        deleteItem();
      },
      onCancel() {
        console.log('取消');
      },
    });
  };

  const exportPage = useCallback(() => {
    exportAppPage({
      idList: [selectedItem.appPageId],
      ossNeed: true,
      type: 5,
      version: apiVersion,
    });
  }, [selectedItem, apiVersion]);

  const onClickItem = useCallback((fn, params?) => {
    if (fn) {
      fn(params);
    }
  }, []);

  return (
    <Menu id={PAGE_MENU_ID} className={styles.contextMenuWrap}>
      {selectedItem ? (
        <>
          {selectedItem.type === PageType.page && (
            <>
              <Item
                onClick={() => {
                  onClickItem(rename);
                }}
              >
                <img className={styles.menuIcon} src={name} alt='' /> 重命名
              </Item>
              {!selectedItem.isHomePage && (
                <Item
                  disabled={selectedItem.appPageId === selectedKey && pageKeyList.length === 1}
                  onClick={() => {
                    onClickItem(showDeleteConfirm(selectedItem));
                  }}
                >
                  <img className={styles.menuIcon} src={deleteImg} alt='' /> 删除
                </Item>
              )}
              <Item
                onClick={() => {
                  onClickItem(copyAppPage);
                }}
              >
                <img className={styles.menuIcon} src={copy} alt='' /> 复制
              </Item>
              {!globalStore.isMobile && (
                <Item
                  onClick={() => {
                    onClickItem(exportPage);
                  }}
                >
                  <img className={styles.menuIcon} src={exportImg} alt='' /> 导出
                </Item>
              )}
              {selectedItem.isHomePage ? (
                <>
                  {selectedItem.isHomePageResidency ? (
                    <Item
                      onClick={() => {
                        onClickItem(setMainPageResidence, 0);
                      }}
                    >
                      <img className={styles.menuIcon} src={cancelHomeHold} alt='' /> 取消主页常驻
                    </Item>
                  ) : (
                    <Item
                      onClick={() => {
                        onClickItem(setMainPageResidence, 1);
                      }}
                    >
                      <img className={styles.menuIcon} src={setHomeHold} alt='' /> 设置主页常驻
                    </Item>
                  )}
                </>
              ) : (
                <Item
                  onClick={() => {
                    onClickItem(setMainPage);
                  }}
                >
                  <img className={styles.menuIcon} src={home} alt='' /> 设为主页
                </Item>
              )}
            </>
          )}
          {selectedItem.type === PageType.folder && (
            <>
              <Item
                onClick={() => {
                  onClickItem(rename);
                }}
              >
                <img className={styles.menuIcon} src={name} alt='' /> 重命名
              </Item>
              <Item
                onClick={() => {
                  onClickItem(showDeleteConfirm(selectedItem));
                }}
              >
                <img className={styles.menuIcon} src={deleteImg} alt='' /> 删除
              </Item>
            </>
          )}
        </>
      ) : (
        <Item>请先选择文件夹或者页面</Item>
      )}
    </Menu>
  );
};

export default observer(PageContextMenu);
