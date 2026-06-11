import React, { useState, Fragment, useEffect } from 'react';
import { Radio } from 'antd';
import styles from './index.less';
export default (props) => {
  const { currentEvent, currentComponet, animateItem } = props;
  let showHideType = animateItem.settings.showHideType;
  const [value, setValue] = useState(showHideType ? showHideType : 'show');
  useEffect(() => {
    animateItem.settings.showHideType = showHideType ? showHideType : 'show';
  }, [animateItem.settings.showHideType, showHideType]);
  const onChange = (e) => {
    animateItem.settings.showHideType = e.target.value;
    setValue(e.target.value);
  };

  const options = [
    { label: '显示', value: 'show' },
    { label: '隐藏', value: 'hide' },
    { label: '切换', value: 'toggle' },
  ];

  return (
    <Fragment>
      <div
        style={{
          padding: '12px 20px',
        }}
      >
        <Radio.Group
          className={styles.radioCom}
          options={options}
          onChange={onChange}
          value={value}
          optionType='button'
          buttonStyle='solid'
        />
      </div>
    </Fragment>
  );
};
