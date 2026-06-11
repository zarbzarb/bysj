let observer;
const callBackFnQueue = [];
const targetQueue = [];
var observerOptions = {
  childList: false, // 观察目标子节点的变化，是否有添加或者删除
  attributes: true, // 观察属性变动
  subtree: false, // 观察后代节点，默认为 false
  attributesFilter: ['style'],
};
const listenFn = (list) => {
  callBackFnQueue.forEach((fn) => {
    fn && fn(list);
  });
};
const createObserver = () => {
  observer = new MutationObserver(listenFn);
};
export const destroyObserver = (idx) => {
  callBackFnQueue.splice(idx, 1);
  targetQueue.splice(idx, 1);
  observer.takeRecords();
  observer.disconnect();
};
export const addListenDomStyle = (targetNode, callback) => {
  if (!callback || typeof callback != 'function') return;
  !observer && createObserver();
  observer.observe(targetNode, observerOptions);
  let idx = callBackFnQueue.length;
  targetQueue.push(targetNode);
  callBackFnQueue.push(callback);
  return idx;
};
