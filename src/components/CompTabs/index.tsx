import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import classNames from 'classnames';
import styles from './index.less';

export interface TabItemType {
  key: string; // 对应 activeKey
  label: string; // 选项卡头显示文字
  children: ReactNode | string; // 选项卡头显示内容
}
interface IProps {
  defaultActiveKey: string; // 初始化选中面板的 key，如果没有设置 activeKey
  items: Array<TabItemType>;
  onActiveKeyChange?: (activeKey: string) => void;
  checkTabEnable?: (activeKey: string) => boolean;
}

const CompTabs = (props: IProps) => {
  const { defaultActiveKey, items, onActiveKeyChange, checkTabEnable } = props;
  const { pageTabsStore, editorStore } = useStore();
  const { selectedKey } = pageTabsStore;
  const { changeKeys } = editorStore;
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  const clickHandler = useCallback(
    (key) => {
      // console.log('clickHandler key', key);
      if (!checkTabEnable || checkTabEnable(key)) {
        setActiveKey(key);
        // console.log('clickHandler onActiveKeyChange key', key);
        onActiveKeyChange(key);
      }
    },
    [checkTabEnable, onActiveKeyChange],
  );

  useEffect(() => {
    if (!selectedKey && activeKey === 'LayerList') {
      clickHandler('PageTree');
    }
  }, [selectedKey, activeKey, clickHandler]);
  /**
   * v8.11.0 选中组件组件列表快速定位
   * changeKeys 发生改变时触发副作用
   * changeKeys.length > 0 执行切换
   */
  useEffect(() => {
    if (changeKeys.length > 0) {
      // console.log('clickHandler LayerList');
      clickHandler('LayerList');
    }
  }, [changeKeys, clickHandler]);
  return (
    <div className={styles.compTabsContainer}>
      <div className={styles.compTabs}>
        {items.map((item) => {
          return (
            <div
              key={`comp-tab-${item.key}`}
              className={classNames('comp-tab', item.key === activeKey ? 'active' : '')}
              onClick={() => clickHandler(item.key)}
            >
              {item.label}
            </div>
          );
        })}
      </div>
      {items
        .filter((item) => {
          return item.key === activeKey;
        })
        .map((item) => {
          return item.children;
        })}
    </div>
  );
};

export default observer(CompTabs);
