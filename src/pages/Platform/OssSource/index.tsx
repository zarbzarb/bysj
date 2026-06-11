import React, { memo, useState } from 'react';
import { useStore } from '@/hooks';
import AssetsIcon from '@/assets/newIcon/TopKitBar/Assets.svg';
import { ImageEditStandAlone } from '@yl/datai-ui';

import { Tooltip } from 'antd';

function OssSource() {
  const { globalStore } = useStore();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip title='资源管理'>
        <li onClick={() => setIsOpen(!isOpen)}>
          <img alt='资源管理' src={AssetsIcon} />
        </li>
      </Tooltip>

      <ImageEditStandAlone
        wontReturnSelected
        multiselectable
        folderCreatable
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

export default memo(OssSource);
