import React, { Fragment } from 'react';
import { Menu, Item } from 'react-contexify';
import { copyHandler, pasteEventHandler, pasteActionHandler } from '@/utils/CopyEvent';
import 'react-contexify/dist/ReactContexify.css';
import styles from './index.less';

export default ({ comp, forceUpdate }) => {
  return (
    <>
      <Menu id='event_menu' className={styles.contextMenuWrap}>
        <Item onClick={() => copyHandler(comp, forceUpdate)}>复制</Item>
        <Item onClick={() => pasteEventHandler(comp, forceUpdate)}>粘贴事件</Item>
        <Item onClick={() => pasteActionHandler(comp, forceUpdate)}>粘贴交互</Item>
      </Menu>
    </>
  );
};
