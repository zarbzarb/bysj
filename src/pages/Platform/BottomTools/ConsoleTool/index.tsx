import { Button } from 'antd';
import React, { useState, useRef } from 'react';

const ConsoleTool = () => {
  const [consoleToolVisiable, setConsoleToolVisiable] = useState(false);
  const LogRef = useRef();

  const toggleConsoleTool = () => {
    // if (!consoleToolVisiable) {
    //   import('@/components/Log').then(({ default: Log }) => {
    //     LogRef.current = Log;
    //     setConsoleToolVisiable(true);
    //   });
    // } else {
    //   setConsoleToolVisiable(false);
    // }
  };

  return (
    <div className='console-tool'>
      {/* <Button onClick={toggleConsoleTool} size='small' type='primary' className='console-visiable-btn'>
        控制台
      </Button>
      {consoleToolVisiable ? (
        <LogRef.current visible={consoleToolVisiable} toggleConsoleTool={toggleConsoleTool} />
      ) : null} */}
    </div>
  );
};

export default ConsoleTool;
