import { makeAutoObservable } from 'mobx';
import { addApiRelated } from '@/services/apis/dataManage';
import * as CardApi from '@/services/apis/CardApi';
import _ from 'lodash';

export default class CardStore {
  rootStore;

  /**
   * 卡片关联API列表
   */
  cardApiList = [];

  /**
   * 自定义卡片分类
   */
  cardSortList = [];

  /**
   * 卡片集市分类
   */
  marketSortList = [];

  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  /**
   * 获取卡片关联接口
   * @param pageId 页面id
   * @param item
   */
  getCardApiList = (pageId, item) => {
    const {
      VersionStore: { apiVersion },
    } = this.rootStore;
    const nerArr = [...item, ...this.cardApiList];
    this.cardApiList = _.uniqWith(nerArr, _.isEqual);
    this.cardApiList.forEach((api) => {
      addApiRelated({
        interfaceCode: api.interfaceCode, // 换成不变的code
        pageId, // 页面ID
        apiId: api.id, // 通过id保存引用关系兼容项目现场没有升级大屏
        ver: apiVersion,
      })
        .then(({ success }) => {
          if (!success) return;
        })
        .catch((error) => error);
    });
    // 卡片接口关联完成
    window.globalEventEmitter.emit('cardApiList', this.cardApiList);
  };

  /**
   * 获取自定义卡片分类
   * @param cb
   */
  getCardSortList = async (cb?) => {
    const res = await CardApi.GETCATEGORYLIST({ sortType: 1, includeCount: true });
    if (Number(res.code) === 200) {
      this.cardSortList = res.data;
      if (cb) {
        cb();
      }
    }
  };

  /**
   * 获取卡片集市分类
   * @param cb
   */
  getMarketSortList = async (cb?) => {
    const res = await CardApi.GETCATEGORYLIST({ sortType: 2, includeCount: true });
    if (Number(res.code) === 200) {
      this.marketSortList = res.data;
      if (cb) {
        cb(res.data);
      }
    }
  };

  // getCartList = async (params, cb?) => {
  //   const res = await CardApi.ALLCARDLIST(params);
  //   if (Number(res.code) === 200 && cb) {
  //     cb(res.data);
  //   }
  // };

  // getMarketCartList = async (params, cb?) => {
  //   const res = await CardApi.CUSTOMCAEDMARKETLIST(params);
  //   if (Number(res.code) === 200 && cb) {
  //     cb(res.data);
  //   }
  // };
}
