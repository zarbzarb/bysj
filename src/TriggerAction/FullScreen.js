const getFullscreenElement = () => {
  return (
    document.fullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullScreenElement ||
    document.webkitFullscreenElement ||
    null
  );
};
const changeFullScreen = (fullScreen) => {
  const element = document.documentElement;
  if (fullScreen) {
    // 全屏
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } else {
    // 恢复
    console.log('恢复');
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (element.msExitFullscreen) {
      element.msExitFullscreen();
    }
  }
};
export default (action) => {
  const {
    actionSettings: { fullScreen },
  } = action;
  const isFullScreen = !!getFullscreenElement();
  switch (fullScreen) {
    // '全屏'
    case '1':
      if (!isFullScreen) {
        changeFullScreen(true);
      }
      break;
    // '恢复'
    case '0':
      if (isFullScreen) {
        changeFullScreen(false);
      }
      break;
    // '切换'
    default:
      changeFullScreen(!isFullScreen);
      break;
  }
};
