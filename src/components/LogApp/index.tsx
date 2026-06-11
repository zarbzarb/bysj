import React, { useEffect, useRef, useState, useCallback } from 'react';
import '@/styles/index.global.less';

const LogApp = () => {
  const [consoleToolVisiable, setConsoleToolVisiable] = useState(false);
  const LogRef = useRef(null);

  const toggleConsoleTool = useCallback(() => {
    if (consoleToolVisiable === true) setConsoleToolVisiable(false);
  }, [consoleToolVisiable]);

  // 增加监听函数删除
  useEffect(() => {
    const keyupFn = (evt) => {
      const { key } = evt;
      if (key === 'F9') {
        import('@/components/LogApp/Log/index')
          .then(({ default: Log }) => {
            LogRef.current = Log;
            setConsoleToolVisiable(true);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    };
    document.addEventListener('keyup', keyupFn);
    return () => {
      document.removeEventListener('keyup', keyupFn);
    };
  }, []);

  const Log = LogRef.current;
  return Log ? <Log visible={consoleToolVisiable} toggleConsoleTool={toggleConsoleTool} previewLog={true} /> : null;
};

export default LogApp;
