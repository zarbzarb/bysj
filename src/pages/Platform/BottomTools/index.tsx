import React, { useState } from 'react';
import { getVersionInfo } from '@/utils/loadScript';
import rulesIconDefault from '@/assets/icon/rules-icon-default.png';
import rulesIconChecked from '@/assets/icon/rules-icon-checked.png';
import ConsoleTool from './ConsoleTool';
import ZoomController from './ZoomController';
import Shortcutkey from './shortcutKey';
import './index.less';

const BottomTool = (props) => {
  const [ruleIcon, setRuleIcon] = useState(rulesIconDefault);

  const pdfPath = `${window.publicPath}assets/datai/孔雀设计器使用规约.pdf`;

  const ruleEnterHandler = () => {
    setRuleIcon(rulesIconChecked);
  };
  const ruleLeaveHandler = () => {
    setRuleIcon(rulesIconDefault);
  };
  return (
    <div className='ant-dark screen-bottom-console'>
      <ConsoleTool {...props} />
      <div className='screen-name center' style={{ margin: '0 auto' }}>
        {getVersionInfo()}
      </div>
      {/* eslint-disable-next-line react/jsx-no-target-blank */}
      <a
        target='_blank'
        href={pdfPath}
        className='rules-icon'
        onMouseEnter={ruleEnterHandler}
        onMouseLeave={ruleLeaveHandler}
      >
        <img src={ruleIcon} alt='使用规约' />
      </a>
      <Shortcutkey />
      <ZoomController {...props} />
    </div>
  );
};

export default BottomTool;
