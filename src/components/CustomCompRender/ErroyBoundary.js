import React from 'react';
import { getImageUrl } from '@/utils/utils';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      compName: props.compName,
      compKey: props.compKey,
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 具体错误信息
    console.log(
      `自定义组件内部代码错误!!! 组件名称:${this.state.compName} 组件key:${this.state.compKey}`,
      error,
      errorInfo,
    );
  }

  render() {
    const { width, height } = this.props;
    const aspectRatio = Number.parseInt(width) / Number.parseInt(height);
    let errorUI =
      aspectRatio > 1
        ? '/assets/datai/icons/componentIcon/error-ui-w.svg'
        : '/assets/datai/icons/componentIcon/error-ui-h.svg';
    errorUI = getImageUrl(errorUI);
    const mode = aspectRatio > 1 ? 'cover' : 'cover';
    if (this.state.hasError) {
      // 自定义降级后的 UI 并渲染
      return (
        <div
          style={{
            display: 'flex',
            'flex-direction': 'column',
            width: this.props.width,
            height: this.props.height,
          }}
        >
          <div
            style={{
              width: '100%',
              flex: 1,
              background: `url(${errorUI}) left top / ${mode} no-repeat`,
            }}
          />
          <div style={{ color: '#818B93', padding: '20px 5px' }}>自定义组件内部代码错误</div>
        </div>
      );
    }

    return this.props.children;
  }
}
