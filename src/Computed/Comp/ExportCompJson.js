import _ from 'lodash';
import DataI from '@/utils/global-api/core';
export const getCompListJSONSettings = (keys) => {
  // let list = window.componentList.filter((vl, idx) => {
  //   return keys.indexOf(vl.key) > -1;
  // });
  // 兼容选中的是某个组内的组件提交卡片
  let list = DataI.getComList(keys[0]);
  list = _.cloneDeep(list).map((item) => {
    // v7.6.0 修改提交卡片的顶级组位置
    // if (item.styles) item.styles.transform = 'translate(20px, 20px)';
    // if (item.shapeCss) item.shapeCss.transform = 'translate(20px, 20px)';
    if (item.styles) item.styles.transform = 'translate(0px, 0px)';
    if (item.shapeCss) item.shapeCss.transform = 'translate(0px, 0px)';
    return item;
  });
  return removeComponentInstance(list);
};

const removeComponentInstance = (list) => {
  list.forEach((item, key) => {
    if (item.instance) {
      item.preAttr = {
        _attr: JSON.parse(JSON.stringify(item.instance.compAttr)),
        _config: JSON.parse(JSON.stringify(item.instance.config)),
        _data: JSON.parse(JSON.stringify(item.instance._data)),
        _shap: JSON.parse(JSON.stringify(item.instance.shapeCss || {})),
        _visible: item.instance.visible,
      };

      item._attr = JSON.parse(JSON.stringify(item.instance.compAttr));
      item._config = JSON.parse(JSON.stringify(item.instance.config));
      item._data = JSON.parse(JSON.stringify(item.instance._data));
      item._shap = JSON.parse(JSON.stringify(item.instance.shapeCss || {}));
      item._visible = item.instance.visible;

      delete item.idx;
      delete item.instance;
      delete item.initCom;
      delete item.CssPage;
    }
    item.layers &&
      item.layers.forEach((child, index) => {
        child.preAttr = {
          _attr: JSON.parse(JSON.stringify(child.instance.compAttr)),
          _config: JSON.parse(JSON.stringify(child.instance.config)),
          _data: JSON.parse(JSON.stringify(child.instance._data)),
          _shap: JSON.parse(JSON.stringify(child.instance.shapeCss)),
          _visible: child.instance.visible,
        };

        child._attr = JSON.parse(JSON.stringify(child.instance.compAttr));
        child._config = JSON.parse(JSON.stringify(child.instance.config));
        child._data = JSON.parse(JSON.stringify(child.instance._data));
        child._shap = JSON.parse(JSON.stringify(child.instance.shapeCss));
        child._visible = child.instance.visible;

        delete child.instance;
        delete child.initCom;
        delete child.CssPage;
      });

    if (item.childComList) {
      item.childComList = item.childComList.map((child) => {
        if (child.instance) {
          child.preAttr = {
            _attr: JSON.parse(JSON.stringify(child.instance.compAttr)),
            _config: JSON.parse(JSON.stringify(child.instance.config)),
            _data: JSON.parse(JSON.stringify(child.instance._data)),
            _shap: JSON.parse(JSON.stringify(child.instance.shapeCss || {})),
          };

          child._attr = JSON.parse(JSON.stringify(child.instance.compAttr));
          child._config = JSON.parse(JSON.stringify(child.instance.config));
          child._data = JSON.parse(JSON.stringify(child.instance._data));
          child._shap = JSON.parse(JSON.stringify(child.instance.shapeCss || {}));
          delete child.instance;
          delete child.initCom;
          delete child.CssPage;
        }
        if (child.childComList) {
          child.childComList = JSON.parse(removeComponentInstance(child.childComList));
        }
        return child;
      });
    }
  });

  return JSON.stringify(list);
};
