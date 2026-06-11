import React from 'react';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import { Tooltip } from 'antd';
import styles from './styles.less';
/*
 * @Author: 赵晶晶
 * 左上角菜单栏
 */
// interface IProps {}

const LeftTopMenu = () => {
  const { controlStore } = useStore();
  const { tabList, selectedTabs, changeTabsHandler } = controlStore;

  return (
    <ul className={styles.topKitBar}>
      {tabList.map((item, i) => {
        const isSelected = selectedTabs.includes(item.value);

        return (
          <Tooltip title={item.label} key={`${item.value}_${i}_Tooltip`}>
            <li
              className={isSelected ? styles.selected : ''}
              key={`${item.value}_${i}`}
              onClick={() => {
                changeTabsHandler(item.value, false);
              }}
            >
              <img style={{ height: 14, width: 14 }} src={isSelected ? item.activeIcon : item.icon} alt={item.label} />
            </li>
          </Tooltip>
        );
      })}
    </ul>
  );
};

export default observer(LeftTopMenu);
