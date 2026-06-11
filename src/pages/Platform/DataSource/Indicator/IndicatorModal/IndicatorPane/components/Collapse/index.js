import React from 'react';
import CollapseOpen from '@/assets/newIcon/collapse-open.png';
import CollapseClose from '@/assets/newIcon/collapse-close.png';

import styles from './index.less';

const Collapse = (props) => {
  const { title, visible, onCollapse } = props;

  const onClick = () => {
    onCollapse(!visible);
  };

  return (
    <div className={styles.collapse}>
      <div className={styles.title}>
        <div className={styles.leftName}>{title}</div>
        <img className={styles.rightIcon} onClick={onClick} src={visible ? CollapseClose : CollapseOpen} alt='' />
      </div>
      {visible && props.children}
    </div>
  );
};

export default Collapse;
