import React from 'react';
import Sdk from '../../../sdk/index';
import '../../../sdk/datai-visual-sdk.css';

function App() {
  const demoProps = {
    id: '1663469694503485440',
    // id:'1404686384945590272',
    type: 'page',
    // runtimePublicPath: "/visual-console/",
  };

  console.log('=================sdk');
  return (
    <>
      {/** sdk需要用id做为key值，保证id替换的时候，同一位置容器刷新 */}
      <Sdk key={demoProps.id} {...demoProps} />
    </>
  );
}

export default App;

/*
  步骤A：
  在index.html 页面引用相关global依赖

  步骤B：
  B1：依赖准备  animejs jquery react antd 等依赖信息
  yarn add animejs styled-components antd axios events lodash mobx react-color short-uuid react-grid-layout
  B2：接口代理地址信息
  找到 个人的代理，配置接口代理信息 ，此项目的代理在 setupProxy  , 代理的环境为 console.deliver环境，私有化的请更改proxy地址信息

  前置准备
  步骤C：传如sdk的参数
  id={id} 
  type={type}

  步骤D
  定义全局globalEventEmitter , 注意：如果与时空地理平台一起使用，请保证 ioc可视化配置、时空地理平台、项目 三方的event是一个单例，避免无法接受到对应的event事件

  常见问题:
  1.样式不一致， 在index.html页面没有引入对应的libs和reset.css文件信息
  2.图片不显示，没有设置window.iocStorageUrl，指向自己的oss资源代理环境，注意proxy
  3.页面显示，但是数据不注入？ 请查看下在index.html依赖的datai-core 与demo模板提供的是否一致
  4.组件初始化定义值给组件引用，有时候不生效？ 请将组件默认的数据或字段在变量中设置， 不要在组件内通过初始化进行定义
  */
