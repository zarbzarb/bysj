import React, { useCallback, useRef, useState } from 'react';
import { Input, ConfigProvider, message } from 'antd';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import CompTabs, { TabItemType } from '@/components/CompTabs';
// 页面
import PageTree from './components/PageTree';
// 图层
import LayerList from './components/LayerList';
import styles from './index.less';

const { Search } = Input;
/*
 * @Author: 赵晶晶
 * 应用菜单
 */
interface IProps {
  isApp: boolean; // 是否是应用
  onContextMenu: (e) => void; // 显示右键菜单
  className: string; //
}

const tabMenuList: Array<TabItemType> = [
  /* 页面树 */
  {
    label: '页面',
    key: 'PageTree',
    children: <PageTree key='PageTree' />,
  },
  /* 组件图层 */
  {
    label: '组件',
    key: 'LayerList',
    children: '暂无',
  },
];

const AppMenu = (props: IProps) => {
  const { isApp, onContextMenu, className } = props;
  const { pageTabsStore } = useStore();
  const { selectedKey } = pageTabsStore;
  const [searchWord, setSearchWord] = useState('');
  const activeKeyRef = useRef('PageTree');
  tabMenuList[1].children = <LayerList key='LayerList' onContextMenu={onContextMenu} />;
  // 搜索处理
  /**
   * 搜索
   * @param {*} value
   */
  const onKeySearch = useCallback((value) => {
    const val = value.trim();
    // TODO 使用消息通知
    const EventEmitter = window.globalEventEmitter;
    if (activeKeyRef.current === 'PageTree') {
      // 页面树搜索
      EventEmitter.emit('PageTreeSearch', val);
    } else {
      // 组件列表搜索
      EventEmitter.emit('LayerListSearch', val);
    }
  }, []);
  /**
   * 搜索框文字修改，为空时触发搜索
   * @param {*} e
   */
  const onKeySearchChange = useCallback(
    (e) => {
      setSearchWord(e.target.value);
      const val = e.target.value.trim();
      if (val.length === 0) {
        onKeySearch(val);
      }
    },
    [onKeySearch],
  );
  /**
   * tab选项组切换tab项
   * @param activeKey
   */
  const onActiveKeyChange = useCallback(
    (activeKey) => {
      if (activeKeyRef.current !== activeKey) {
        setSearchWord('');
        activeKeyRef.current = activeKey;
        onKeySearch('');
      }
    },
    [onKeySearch],
  );

  /**
   * tab选项组是否可点击
   */
  const checkTabEnable = useCallback(
    (activeKey) => {
      if (activeKey === 'LayerList') {
        if (!selectedKey) {
          message.warning('请先选择页面');
        }
        return !!selectedKey;
      }
      return true;
    },
    [selectedKey],
  );

  console.log('searchWord', searchWord);
  return isApp ? (
    <ConfigProvider componentSize='small'>
      <div className={className}>
        <div className={styles.topContainer}>
          {/* 标题 */}
          <div className={styles.appMenuTitle}>应用</div>
          {/* 搜索框 */}
          <div className={styles.searchContainer}>
            <Search
              allowClear
              size='small'
              className={styles.searchInput}
              placeholder='搜索'
              value={searchWord}
              onSearch={onKeySearch}
              onChange={onKeySearchChange}
            />
          </div>
        </div>
        {/* tab选项 */}
        <CompTabs
          defaultActiveKey='PageTree'
          items={tabMenuList}
          onActiveKeyChange={onActiveKeyChange}
          checkTabEnable={checkTabEnable}
        />
      </div>
    </ConfigProvider>
  ) : (
    <div className={className}>
      {/* 组件图层 */}
      <LayerList onContextMenu={onContextMenu} />
    </div>
  );
};

export default observer(AppMenu);
