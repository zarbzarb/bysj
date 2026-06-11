/**
 * 选择版本组件
 */
import React, { FC, useEffect } from 'react';
import { Select } from 'antd';
import { observer } from 'mobx-react';
import { useStore } from '@/hooks';
import DarkAlgorithm from '@/common/DarkAlgorithm';
import mainVersion from '@/assets/newIcon/main_version.png';
import downArrow from '@/assets/newIcon/downArrow.png';
import styles from './styles.less';

type IProps = {
  appId: string;
  onChange: (cb: () => void) => void;
};

const SelectVersion: FC<IProps> = (props) => {
  const { onChange, appId } = props;
  const { versionStore } = useStore();
  const { versionList, currentVersion, changeCurrentVersion, getVersionList } = versionStore;

  const handleChange = (val: string) => {
    if (onChange)
      onChange(() => {
        // 先判断是否有修改的页面或者变量弹提示框，待确认后再执行切换版本
        changeCurrentVersion(val);
      });
  };

  useEffect(() => {
    getVersionList(appId);
  }, []);

  return (
    <DarkAlgorithm>
      <div className='version-select-wrap'>
        <Select
          className={`version-select-box ${styles.Select}`}
          getPopupContainer={(triggerNode) => triggerNode.parentNode}
          style={{ width: '100%', height: 26 }}
          value={currentVersion}
          onChange={handleChange}
        >
          {versionList.map((item: any) => {
            return (
              <Select.Option value={item.version} key={item.version}>
                {item.isMajorVersion && (
                  <img src={mainVersion} style={{ height: 12, width: 12 }} className='major-icon' alt='主分支' />
                )}
                {item.version === 'dev' ? '开发版本' : `V${item.version}`}
              </Select.Option>
            );
          })}
        </Select>
        <img className='select-custom-arrow' src={downArrow} alt='箭头' />
      </div>
    </DarkAlgorithm>
  );
};

export default observer(SelectVersion);
