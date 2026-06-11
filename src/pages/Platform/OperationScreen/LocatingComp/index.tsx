import React from 'react';
import { Input, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useStore } from '@/hooks';
import DarkAlgorithm from '@/common/DarkAlgorithm';
import styles from './styles.less';

const LocatingComp = () => {
  const { editorStore: store } = useStore();
  return (
    <DarkAlgorithm>
      <li className={styles.container}>
        <label>
          定位组件
          <Tooltip
            title={
              <>
                <div>定位组件通过输入完全匹配的key值用于关联界面的组件</div>
                <div>注意：动态面板里的组件如果不在当前显示区域内，可以选择，但是不会显示</div>
              </>
            }
          >
            <QuestionCircleOutlined className='tooltipIcon' />
          </Tooltip>
          ：
        </label>

        <Input
          className={styles.inputStyle}
          size='small'
          onPressEnter={(evt) => {
            const { value } = evt.target as HTMLInputElement;
            // if (pageType !== 'card') {
            //   // 第二个参数用于控制组件定位时通知图层选中(兼容以前的组件选中)
            //   store.setChangeKeys([value], true);
            // } else {
            //   store.setChangeKeys([value]);
            // }
            store.setChangeKeys([value.trim?.()], true);
          }}
          placeholder='请输入组件key值'
        />
      </li>
    </DarkAlgorithm>
  );
};
export default LocatingComp;
