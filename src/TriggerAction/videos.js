import { getComponent } from '@/utils/componentUtils';
import { message } from 'antd';

const resetVideoPlayer = (comp) => {
  comp.player.reset(); // 重置播放器
  comp.player.autoplay(false); // 取消自动播放
  comp.player.initChildren(); // 初始化播放器子组件

  // 直播流强制结束加载 设置封面图
  comp.player.ready(() => {
    setTimeout(() => {
      comp.player.trigger('loadeddata');
      comp.player.posterImage.setSrc(comp.player.options_.poster);
      comp.player.posterImage.show();
    }, 30);
  });
};

export default (action) => {
  console.warn(action);
  const { compKey } = action.actionSettings;
  const { actionKey } = action.actionSettings;
  const comp = window.comList && compKey ? window.comList.get(compKey) : getComponent(compKey, window.layerList);

  // console.log(comp, actionKey);
  if (!comp) return message.warning('播放器组件不存在!');
  if (!comp.player) return console.warn('播放器实例不存在!');
  switch (actionKey) {
    case '0':
      // comp.player.dispose();
      // comp.player = null;
      // comp.player.reset();
      // comp.player.autoplay = false;
      // comp.player.poster(comp.player.poster);
      // comp.player.src(comp.player.src());
      // comp.player.pause();
      // comp.player.currentTime(0);
      // comp.player.autoplay(false);
      // comp.player.preload('none');

      resetVideoPlayer(comp);
      break;
    case '1':
      // 直播模式，暂停也销毁
      if (comp.props.options.yunliMode === 'live') {
        resetVideoPlayer(comp);
        return;
      }
      comp?.player?.pause();
      break;
    default:
      comp?.player?.pause();
      break;
  }
};
