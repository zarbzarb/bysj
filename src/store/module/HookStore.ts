import { message } from 'antd';
import { runInAction, makeAutoObservable } from 'mobx';
import * as InfoApi from '@/services/apis/appPageApi';

class HookStore {
  rootStore = null;

  code = [{ title: 'main', content: '', key: 'main' }];

  codeId = '';

  screenConfig = {};

  constructor(rootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  clearObservable = () => {
    this.code = [{ title: 'main', content: '', key: 'main' }];
  };

  getCodeByScreenId = (params) => {
    return InfoApi.getPageHookInfo(params).then((rs) => {
      if (rs.code === '200') {
        runInAction(() => {
          this.codeId = rs.data.id;
          try {
            if (rs.data) {
              try {
                // 反转义
                if (rs.data.dataJs === '{}') {
                  this.code = [{ title: 'main', content: '', key: 'main' }];
                } else {
                  try {
                    this.code = JSON.parse(
                      JSON.parse(rs.data.dataJs).dataJs, // 反转义
                    );
                  } catch {
                    this.code = JSON.parse(rs.data.dataJs); // 反转义
                  }
                }
              } catch {
                this.code = [{ title: 'main', content: '', key: 'main' }];
              }
            } else {
              this.code = [{ title: 'main', content: '', key: 'main' }];
            }
          } catch (error) {
            console.error(error);
            this.code = [{ title: 'main', content: '', key: 'main' }];
          }
          window.hookSaveAble = true;
        });
      } else {
        message.error('获取脚本失败！');
      }
      return rs;
    });
  };

  saveOrUpdateCode = (params) => {
    if (window.hookSaveAble) {
      const { codeStr, type, appId, appPageId, codeId, version } = params;
      this.code = codeStr;
      // v7.4 换成按 tab 保存
      return InfoApi.saveOrUpdateHook({
        appId,
        appPageId,
        id: codeId,
        version,
        dataJs: escape(codeStr).split('').reverse().join(''), // 转义后倒序（防止防火墙拦截）
      })
        .then((rs) => {
          if (type !== 'init') {
            if (rs.code === '200') {
              message.success('保存成功！');
            } else {
              message.error('保存失败！');
            }
          }
          return rs;
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  deleteTabCode = (panekey, codeId) => {
    InfoApi.deleteTabHook({
      id: codeId,
      key: panekey,
    })
      .then((rs) => {
        if (rs?.code === '200') {
          message.success('删除成功！');
        } else {
          message.error(rs?.message);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  updateTabName = (params: { id: string | number; name: string; key: string }) => {
    return InfoApi.updateTabNameHook(params);
  };

  updateTabOrder = (params: { id: string | number; currentTabKey: string; preTabKey: string }) => {
    return InfoApi.updateTabOrderHook(params);
  };

  //  setHookTitle = () => {
  //   // CIM平台需要更换标题和logo
  //   const titleDom = document.getElementById('datai-title');
  //   const logoDOM = titleDom.nextSibling;
  //   if (!window.screenConfig.environment?.cimSource) {
  //     titleDom.innerHTML = '云粒数智可视化大屏';
  //     logoDOM.setAttribute('href', './assets/datai/icons/favicon.ico');
  //   } else {
  //     titleDom.innerHTML = 'CIM基础平台';
  //     logoDOM.setAttribute('href', './assets/cim-platform/favicon.ico');
  //   }
  // };
}

export default HookStore;
