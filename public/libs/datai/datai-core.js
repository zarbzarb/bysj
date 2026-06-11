  window.$ = jQuery;
function BaseComp() {}

BaseComp.prototype = {
  // init() 方法之前执行的钩子函数
  beforeInit: function () {
    // 可以在这里做一些统一修改 config 或者 compAttr 的操作，比如根据组件类型做一些兼容性处理
    // console.log('beforeInit')
    const scale = window.screenConfig?.scale
    // 屏幕缩放时echarts图表使用svg渲染可以保证缩放后图表不失真
    if(scale === 'initSize'){
      this.renderer = 'canvas'
    }else{
      this.renderer = 'svg'
    }
  },
  dataRequest: function (config, callback, compatible = false) {
    const { dynamic, _source } = config;

    const { source, dimensionMap, dataFromParent } = config[_source]; // v7.11 新增了“指标数据”，_source 为 indicator
    if(dataFromParent){
      let normaldata = CompatibleTool.dataFieldMapArrayObject(dimensionMap, dataFromParent);
      console.log('标准格式数据', normaldata);
      if (compatible) {
        // 组件自己内部做数据兼容
        setTimeout(() => {
          callback && callback(normaldata);
        }, 0);
        return
      }

      const compatibleData = this.getCompatibleData(normaldata, config, dataFromParent)
      console.log('兼容格式数据', compatibleData);
      setTimeout(() => {
        if (Array.isArray(compatibleData)) {
          if (compatibleData.length == 0 && this.chart) {
            this.chart.clear();
          }
          this.setData(compatibleData);
        } else {
          this.setData(compatibleData);
          console.error(this, compatibleData, '依赖的数据格式化后不符合数组格式');
        }

        callback && callback(compatibleData);
      }, 0);
      return
    }

    const dynamicApis = (this.config.screenConfig?.dynamicApis || window.screenConfig.dynamicApis || []).filter((api) => api !== null);
    const currentApi = dynamicApis.find((api) => api.id === source.id);
    if (!currentApi){
      console.warn('找不到 currentApi');
      return;
    }

    this.regisTransSeriesCb();
    let requestParam = {
      apiInfo: currentApi.apiInfo,
      paramList: source.params, // 使用组件自己配置过的参数
      headers: currentApi.headers,
      isLoop: source.repeat.on,
      apiMs: source.repeat.intervalTime,
    };
    // v7.9 用于区分走的刷新数据源交互
    if (dynamic.interactDynamicParams) {
      // NOTE: interactDynamicParams 只是一个临时变量，直接复用 dynamic 的
      requestParam.paramList = dynamic.interactDynamicParams.params;
      requestParam.headers = dynamic.interactDynamicParams.headers;
      requestParam.isLoop = false;
    }
    if (currentApi.isIndicator) {
      requestParam.headers.push({
        key: 'x-token',
        value: getCookie('aksk-token'),
        paramType: 'header',
      });
    }
    DynamicRequest.triggerRequest(
      requestParam,
      (res) => {
        if (dynamic.interactDynamicParams) {
          delete dynamic.interactDynamicParams;
        }
        if (DataI.isConfigPage() && !Array.isArray(res)) {
          return console.warn('数据不符合规范');
        }
        let arrayObject = res;
        let normaldata = CompatibleTool.dataFieldMapArrayObject(dimensionMap, arrayObject);
        const originalData = CompatibleTool.filterDataset(dimensionMap, arrayObject)
        console.log('标准格式数据', normaldata);
        if (compatible) {
          // 组件自己内部做数据兼容
          return callback && callback(normaldata);
        }

        if(CompatibleTool.isNVChart(config) || CompatibleTool.isPolarChart(config) || CompatibleTool.isRadarChart(config)){
          normaldata = this.filterInvalidData(normaldata, originalData)
        }
        const compatibleData = this.getCompatibleData(normaldata, config, arrayObject)
        console.log('兼容格式数据', compatibleData);
        this.setOriginalData(originalData); // v8.6 保存接口原始数据
        if (Array.isArray(compatibleData)) {
          if (compatibleData.length == 0 && this.chart) {
            this.chart.clear();
          }
          this.setData(compatibleData);
        } else {
          this.setData(compatibleData);
          console.error(this, compatibleData, '依赖的数据格式化后不符合数组格式');
        }

        callback && callback(compatibleData);
      },
      this,
    );
  },

  /**
   * 将数据转换为兼容格式数据
   * @param {array} normaldata 普通格式数据
   * @param {object} config 配置信息
   * @param {array} originalData 原始数据
   */
  getCompatibleData: function(normaldata, config, originalData){
    let compatibleData = []
    if (CompatibleTool.isXYSChart(config)) {
      // x/y/s兼容格式数据
      const dynamic = config[config._source];
      if (dynamic && dynamic.seriesType === 2) {
        compatibleData = CompatibleTool.dataFieldMapArrayObject(dynamic.dimensionMap2, originalData);
      } else {
        compatibleData = CompatibleTool.compatibleXYSFn(normaldata);
      }
    } else if (CompatibleTool.isNVChart(config)) {
      // name/value兼容格式数据
      compatibleData = CompatibleTool.compatibleNVFn(normaldata);
    } else if (
      config._mockData.every((item) => item instanceof Array) // 二维数组
    ) {
      // 嵌套环形图
      compatibleData = CompatibleTool.compatibleDoubleDimensionalArray(normaldata);
    } else if (CompatibleTool.isPolarChart(config)) {
      // 极坐标
      compatibleData = CompatibleTool.compatiblePolarChart(normaldata);
    } else if (CompatibleTool.isRadarChart(config)) {
      // 雷达图
      compatibleData = CompatibleTool.compatibleRadarChart(normaldata);
    } 
    // else if (CompatibleTool.isTreeChart(config)) {
    //   // 矩形树图
    //   compatibleData = CompatibleTool.compatibleTreemapChart(normaldata);
    // } 
    else {
      // 数组对象类型(ArrayObject): 新旧数据结构一致、映射字段一致
      compatibleData = normaldata;
    }
    return compatibleData;
  },

  // 去除无x轴的数据
  filterInvalidData: function(normaldata, originalData){
    const res = [];
    normaldata.forEach((item, index) => {
      if (item.x !== undefined) {
        res.push(item);
      } else {
        originalData.splice(index, 1);
      }
    });
    return res;
  },

  regisTransSeriesCb: function () {
    //let _this = obj;
    if (this.YLChart) {
      this.YLChart._isDynamicType = this.config._source === 'dynamic' || this.config._source === 'indicator';
      this.YLChart._transSeriesField = this._transSeriesField;
      this.YLChart._repSeriesField = this._repSeriesField;
      if (CompatibleTool.isXYSChart(this.config)) {
        const dynamic = this.config[this.config._source];
        if (dynamic && dynamic.seriesType === 2) {
          // “动态生成系列”的时候，不需要进行系列字段转换
          this.YLChart._transSeriesField = null;
        }
      }
    } else {
      this._isDynamicType = this.config._source === 'dynamic' || this.config._source === 'indicator';
      // this._transSeriesField = this.transSeriesField;
      //this._repSeriesField = this.repSeriesField;
    }
  },
  _transSeriesField: function (dynamicData, obj) {
    let { compAttr } = obj;
    let series = compAttr.series;
    let seriesName = {};
    //映射两种系列数据格式
    let transformData = {};

    if (!this._isDynamicType) {
      return transformData;
    }
    transformData = {
      dataset: [],
      values: [],
    };
    if (series[0]?.hasOwnProperty('rainbowColorList')) {
      // 彩虹柱状图
      seriesName['series0'] = series[0].nameField;
      if (series[0].isSubAble) {
        seriesName['series1'] = series[0].subNameField;
        series = [...series, {}];
      }
    } else {
      series?.forEach((item, index) => {
        let key = 'series' + index;
        seriesName[key] = item.serieName;
      });
    }

    dynamicData?.forEach((itemData) => {
      let arrTmp = [];
      arrTmp.push(itemData?.x ? itemData?.x : '');
      series?.forEach((item, index) => {
        let key = 'series' + index;
        arrTmp.push(itemData[key]);
      });
      transformData.dataset.push(arrTmp);

      let ObjTmp = Object.assign({}, itemData);
      Object.keys(seriesName)?.forEach((key) => {
        if (seriesName[key] != key) {
          ObjTmp[seriesName[key]] = ObjTmp[key];
          delete ObjTmp[key];
        }
      });
      transformData.values.push(ObjTmp);
    });
    return transformData;
  },
  _repSeriesField: function (dynamicData, obj) {
    let { compAttr } = obj;
    let series = compAttr.series;
    let seriesName = {};
    //简单替换系列数据字段
    let transformData = [];

    if (!this._isDynamicType) {
      return dynamicData;
    }
    series?.forEach((item, index) => {
      let key = 'series' + index;
      seriesName[key] = item.serieName;
    });
    dynamicData?.forEach((itemData) => {
      let objTmp = Object.assign({}, itemData);
      objTmp['s'] = seriesName[objTmp['s']];
      transformData.push(objTmp);
    });
    return transformData;
  },

  // 更新默认数据
  updateDefaultData: function(defaultData){
    this.defaultData = defaultData
  },
  updateConfig: function (config, i) {
    if (i === undefined) {
      this.config = {
        ...config,
      };
    } else {
      this.config[i] = {
        ...config,
      };
    }
    this.mapSourceToData();
  },
  updateAttr: function (attr) {
    this.compAttr = { ...attr };
    clearTimeout(this.syncTime);
    this.syncTime = setTimeout(() => {
      this.mapSourceToData();
    }, 300);
  },
  changeAttr: function (_this, value, field, parentFields = [], index = -1, type) {
    if (_this.state.CompInstance) {
      const { compAttr } = _this.state;
      let parentField = parentFields[0];
      if (parentField) {
        if (index == -1) {
          if (compAttr[parentField][field] == value) return;
        } else if (index != -1 && type) {
          index = parseInt(index);
          if (compAttr[parentField][index][type][field] == value) return;
        } else {
          index = parseInt(index);
          let compAttrObj = compAttr[parentField][index][field];
          if (typeof compAttrObj != 'object' && compAttr[parentField][index][field] == value) return;
        }
      } else {
        if (typeof compAttr[field] !== 'object' && compAttr[field] == value) return;
        if (typeof compAttr[field] === 'object' && JSON.stringify(compAttr[field]) == JSON.stringify(value)) return;
      }
      executeCommand('UpdateCssPage', _this, value, field, parentFields, index, type);
    } else if (_this.props.CompInstance) {
      console.log('changeAttr2')
      const { compAttr, attr } = _this.props;
      if (field) {
        if (JSON.stringify(compAttr[attr][field]) === JSON.stringify({ ..._this.state[field], ...value })) return;
      } else {
        if (JSON.stringify(compAttr[attr]) === JSON.stringify({ ..._this.state, ...value })) return;
      }
      executeCommand('UpdateCssPage', _this, value, field);
    }
  },
  asyncData: function (i, callback) {
    let httpReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
    let url = '';
    let source = '';
    const _this = this;
    if (Array.isArray(this.config)) {
      url = this.config[i]._ajaxUrl;
      source = this.config[i]._source;
    } else {
      url = this.config._ajaxUrl;
      source = this.config._source;
    }
    if (source != 'ajax') {
      return;
    }
    // if (!httpReg.test(url)) {
    // }
    $.get(url, (rs) => {
      if (Array.isArray(rs)) {
        _this.syncData(rs, i);
      }
      callback && callback(rs.result);
    });
  },
  setData: function (data, fn) {
    if (!Array.isArray(data)) {
      console.error('data is not array');
      return;
    }
    try {
      if (Array.isArray(this.config)) {
        this.config[i]._initData = data;
        this.config[i]._data = data;
      } else {
        this.config._initData = data;
        this.config._data = data;
      }
      this.mapSourceToData();
    } catch (e) {}

    fn && fn(this);
  },
  // 保存原始数据
  setOriginalData: function (data) {
    console.log('originalData', data);
    if (!Array.isArray(data)) {
      console.error('data is not array');
      return;
    }
    try {
      if (Array.isArray(this.config)) {
        this.config[i]._originalData = data;
      } else {
        this.config._originalData = data;
      }
    } catch (e) {
      console.log(e);
    }
  },
  syncData: function (data, i) {
    if (!Array.isArray(data)) {
      data = JSON.parse(data);
    }
    try {
      if (Array.isArray(this.config)) {
        this.config[i]._data = data;
      } else {
        this.config._data = data;
      }
      this.mapSourceToData();
    } catch (e) {
      if (Array.isArray(this.config)) {
        this.config[i]._data = [];
      } else {
        this.config._data = [];
      }
      console.error(e, '鏁版嵁鏍煎紡鏈夎!');
    }
  },
  hide: function () {
    if (this.container) {
      this.container.parent().hide();
      this.container.parent().attr('data-hidden', 'true');
    }
  },
  show: function () {
    if (this.container) {
      this.container.parent().show();
      this.container.parent().attr('data-hidden', 'false');
    }
  },
  deepMap: function (vl, data) {
    const dataMap = vl._source === 'variableRef' && vl.variableDataMap ? vl.variableDataMap: vl._api;
    var result = data.map((item, i) => {
      if (Array.isArray(item)) {
        this.deepMap(vl, item);
      } else if (item.children && Array.isArray(item.children) && item.children.length) {
        dataMap.forEach((field, key) => {
          item[field.field] = item[field.mapField];
          if (Array.isArray(item.children) && item.children.length) {
            this.deepMap(vl, item.children);
          }
          return item;
        });
      } else {
        dataMap.forEach((field, key) => {
          item[field.field] = item[field.mapField]; //delete item[field.mapField];
          return item;
        });
      }
      return item;
    });
    return result;
  },
  delUndefiend: function (data) {
    let result = data.map((item) => {
      for (let key in item) {
        if (item[key] === undefined) {
          delete item[key];
        }
        if (key === 'children' && Array.isArray(item[key])) {
          this.delUndefiend(item[key]);
        }
      }
      return item;
    });
    return result;
  },
  deepFormatData: function (data, defaultData) {
    if (Array.isArray(defaultData)) {
      if (Array.isArray(data)) {
        defaultData.forEach((vl, i) => {
          if (defaultData[i]) {
            this.deepFormatData(data[i], vl);
          } else {
            data[i] = vl;
          }
        });
      } else {
        if (data === undefined) {
          data = defaultData;
        }
      }
    } else if (typeof defaultData === 'object') {
      if (typeof data === 'object' && !Array.isArray(data)) {
        for (let key in defaultData) {
          if (!data[key] && typeof defaultData[key] === typeof data[key]) {
            if (typeof defaultData[key] === 'object') {
              if (Array.isArray(defaultData[key]) && Array.isArray(data[key])) {
                this.deepFormatData(data[key], defaultData[key]);
              } else {
                if (data[key] === undefined) {
                  data[key] = defaultData[key];
                }
              }
            } else {
              this.deepFormatData(data[key], defaultData[key]);
            }
          } else {
            if (data[key] === undefined) {
              data[key] = defaultData[key];
            }
          }
        }
      } else {
        if (data === undefined) {
          data = defaultData;
        }
      }
    } else {
      if (data === undefined) {
        data = defaultData;
      }
    }
  },
  deepFormatApi: function (api, defaultApi) {
    defaultApi.map((item, index) => {
      let isHas = false;
      api.map((apiItem, apiIndex) => {
        if (apiItem.field == item.field) {
          isHas = true;
        }
        return apiItem;
      });
      if (!isHas) {
        api.push(item);
      }
      return item;
    });
    if (defaultApi.length < api.length) {
      let count = [];
      api.forEach((vl, index) => {
        let isHas = false;
        defaultApi.forEach((deVl, deIndex) => {
          if (deVl.field === vl.field) {
            isHas = true;
          }
        });
        if (!isHas) {
          count.push(index);
        }
      });
      for (let i = 0; i < count.length; i++) {
        api.splice(count[i], 1);
        for (let j = i; j < count.length; j++) {
          count[j] = count[j] - 1;
        }
      }
    }
  },
  deepFormat: function (attr, defaultAttr) {
    if (Array.isArray(defaultAttr)) {
      if (Array.isArray(attr)) {
        defaultAttr.forEach((vl, i) => {
          if (attr[i]) {
            this.deepFormatData(attr[i], vl);
          } else {
            attr[i] = vl;
          }
        });
      } else {
        if (attr === undefined) {
          attr = defaultAttr;
        }
      }
    } else if (typeof defaultAttr === 'object') {
      if (typeof attr === 'object' && !Array.isArray(attr)) {
        for (let key in defaultAttr) {
          if (!attr[key] && typeof defaultAttr[key] === typeof attr[key]) {
            if (typeof defaultAttr[key] === 'object') {
              if (Array.isArray(defaultAttr[key]) && Array.isArray(attr[key])) {
                this.deepFormat(attr[key], defaultAttr[key]);
              } else {
                if (attr[key] === undefined) {
                  attr[key] = defaultAttr[key];
                }
              }
            } else {
              this.deepFormat(attr[key], defaultAttr[key]);
            }
          } else {
            if (attr[key] === undefined) {
              attr[key] = defaultAttr[key];
            }
          }
        }
      } else {
        if (attr === undefined) {
          attr = defaultAttr;
        }
      }
    } else {
      if (attr === undefined) {
        attr = defaultAttr;
      }
    }
  },
  listFormatter: function (list) {
    let defaultData = this.defaultData;
    if (defaultData) {
      list.forEach((vl, i) => {
        if (defaultData._api) {
          this.deepFormatApi(vl._api, defaultData._api);
        }
        // if(defaultData._data){
        //   this.deepFormatData(vl._data,defaultData._data)
        // }
      });
    }
  },
  attrFormatter: function (attr) {
    let defaultAttr = this.defaultAttr;
    if (defaultAttr) {
      this.deepFormat(attr, defaultAttr);
    }
  },
  // 将普通格式的数据，转换为 xys 格式的数据
  normalDataToXYS: function(data, xMapField = 'x') {
    const res = [];
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'x' && key !== xMapField) {
          const x = item[xMapField] || item.x || '';
          res.push({ x, s: key, y: item[key] });
        }
      });
    });
    return res;
  },
  mapSourceToData: function () {
    let list = [];
    this.config = JSON.parse(JSON.stringify(this.config));
    if (Array.isArray(this.config)) {
      list = this.config;
    } else {
      if (!this.config._data && !this.dataSourceHidden) {
        return;
      }
      list = [this.config];
    }
    this.listFormatter(list);
    this.attrFormatter(this.compAttr);

    list.forEach((vl, i) => {
      if (vl._data) {
        // 整个项目中_initData不需要使用了(标准组件数据源切换这块需要重新整理下)
        let sourceData = JSON.parse(JSON.stringify(vl._data));

        // let sourceData = vl._initData?JSON.parse(JSON.stringify(vl._initData)):JSON.parse(JSON.stringify(vl._data));
        if (typeof sourceData === 'string') sourceData = JSON.parse(sourceData);
        try {
          // let mapData = this.delUndefiend(this.deepMap(vl, sourceData));
          let mapData = [];
          // 动态数据源不需要再使用_api中的映射
          if (this.config._source === 'dynamic' || this.config._source === 'indicator') {
            mapData = this.delUndefiend(sourceData);
          } else {
            // 配置界面 defaultData 有值 (解决映射匹配不上时会删掉_data中的数据 导致 静态数据源会丢失，defaultData会保存静态数据源，不会被删除)
            if(Array.isArray(window.componentList) && this.config._source === 'json'){
              sourceData = JSON.parse(JSON.stringify(this.defaultData._data))
            }

            if(vl._seriesType === 1){
              if(CompatibleTool.isXYSDataFormat(sourceData)){
                // 编辑态页面刷新和预览的时候，数据已经是 xys 格式，无需处理
                mapData = sourceData
              } else {
                const dimensionMap = vl._dataMap.map(v => ({dataMapKey: v.field, col: v.mapField, row: v.row}))
                sourceData = CompatibleTool.dataFieldMapArrayObject(dimensionMap, sourceData, false)
                mapData = this.normalDataToXYS(sourceData, vl._dataMap[0].mapField);
                mapData = this.delUndefiend(mapData)
              }
            } else {
              if(this.config._source === 'json' && vl._api?.[0]?.row && Array.isArray(window.componentList)){
                // 处理不同字段，选择的数据行数不同情况
                const dimensionMap = vl._api.map(v => ({dataMapKey: v.field, col: v.mapField, row: v.row}))
                sourceData = CompatibleTool.dataFieldMapArrayObject(dimensionMap, sourceData, false)
              }
              mapData = this.delUndefiend(this.deepMap(vl, sourceData));
            }

            // isNVChart 去除 name 为 undefined 的数据
            if(CompatibleTool.isNVChart(this.config)){
              const dynamicFields = this.config.dynamic?.dataMap?.map((v) => v.key) ?? [];
              if(dynamicFields.includes('x')){
                mapData = mapData.filter(item => item.name !== undefined)
              }
            }
          }
          // if (CompatibleTool.isTreeChart(this.config)) {
          //   // 矩形树图
          //   mapData = CompatibleTool.compatibleTreemapChart(mapData);
          // }
          // console.log('mapData', mapData, 'sourceData', sourceData);
          let enable = true;
          mapData.map((item) => {
            for (let key in item) {
              if (item[key] === undefined) {
                enable = false;
              }
            }
            return item;
          });
          if (!enable) {
            if (i == 0) {
              this._data = [];
              this.config._data = [];
            } else {
              this[`_data${i}`] = [];
              this.config[`_data${i}`] = [];
            }
          } else {
            if (i == 0) {
              this._data = mapData;
              this.config._data = mapData;
            } else {
              this[`_data${i}`];
              this.config[`_data${i}`];
            }
          }
        } catch (e) {
          console.error(e)
          if (i == 0) {
            this._data = [];
          } else {
            this[`_data${i}`] = [];
          }
        }
      }
    });
    // let fastModeComs = ['@yl/datai-com-map-gl-FoundationPlan','@yl/datai-com-map-gl-buiding-layer'];
    let fastModeComs = [];
    if (fastModeComs.indexOf(this._comName) < 0 || !(window.location.hash.indexOf('/console/') >= 0)) {
      clearTimeout(this.syncTime);
      this.syncTime = setTimeout(() => {
        this.render();
      }, 300);
    }
  },
  getImageUrl: function (path) {
    let imgUrl = path;
    // 支持多级目录部署
    if (imgUrl && typeof imgUrl === 'string' && !!!/^(http|https):\/\//.test(imgUrl)) {
      if (imgUrl.indexOf('/assets') > -1) {
        // 使用默认图片
        imgUrl = imgUrl.replace('./', '/'); // 兼容处理
        imgUrl = window.publicPath + imgUrl;
        imgUrl = imgUrl.replace('//', '/'); // 去重
      } else if (imgUrl.indexOf('/iocoss') > -1 || imgUrl.indexOf('/imageproxy') > -1) {
        // 使用OSS图片或者走图片代理
        if (
          window.publicPath !== './' &&
          window.publicPath !== '/visual-console/' // 兼容SDK中使用
        ) {
          imgUrl = window.publicPath + imgUrl;
          imgUrl = imgUrl.replace('//', '/'); // 去重
        } else if (
          window.publicPath === './' ||
          window.publicPath === '/visual-console/' // 兼容SDK中使用
        ) {
          if (window.fromSdk === 'layout') {
            // 兼容布局设计器中使用
            if (window.publicPath === '/visual-console/') {
              imgUrl = '/' + imgUrl;
            } else {
              imgUrl = window.publicPath + imgUrl;
            }
          } else {
            imgUrl = '../' + imgUrl;
          }
          imgUrl = imgUrl.replace('//', '/'); // 去重
        }
        // 走图片代理的都去掉桶名兼容阿里云OSS
        if (imgUrl.indexOf('/imageproxy') > -1) {
          const pathReg = new RegExp(`(/imageproxy/[^\/]+/([^\/]+/).*)((screen|card|layer|custom)\/.+)`, 'g');
          const matches = pathReg.exec(imgUrl);
          if (matches && matches.length > 0) {
            let prefix = matches[1];
            const bucketPath = matches[2];
            const path = matches[3]; // 不带桶的路径
            prefix = prefix.replace(bucketPath, '');
            imgUrl = prefix + path;
          }
        }

        // oss资源走单独的域名
        if (window.screenConfig.ossProxy) {
          imgUrl = imgUrl.replace(/.*\/iocoss/, window.screenConfig.ossProxy);
        }
      }
    }
    return imgUrl;
  },
  getMapDataFn: async function () {
    const {
      _source,
      _variable,
      _expression,
      relation_layer_code,
      apiParamVar,
      _data,
      _api
    } = this.config
    console.log('12314', this.config)
    let mapData = [];
    if (_source === 'variableRef') {
      mapData = setVariableRef(_variable, _expression)
      this.config.variableDataMap = _api
    } else if (_source === 'gispublic') {
      const apiParams = setApiParam(apiParamVar)
      const yunliMapFn = window.YunliMap || window.YunliMapGL || window.YunliMap3D;
      let mapOps = {
        layerCode: relation_layer_code
      } 
      if(apiParams) {
        mapOps.apiParam = apiParams;
      }
      mapData = await yunliMapFn.queryDataInLayer(mapOps)
    } else if (_source === 'json') {
      mapData = _data
    }

    //映射处理
    if(mapData) {
      mapData = this.delUndefiend(this.deepMap(this.config, mapData));
    }
    return mapData || [];
  },
  carouselAnimation(chart, carouselConfig) {
    const {
      show = false,
      pause = true,
      interval = 2000,
      trigger = 'axis',
      position = 'right',
      dataWithLegend = false, // 环形图、饼形图 受此状态影响
    } = carouselConfig
    let timer = null
    // 数据项Index
    let dataIndex = -1
    // 鼠标悬浮的系列
    let hoverSeriesIndex = -1

    /**
     * 查找需要轮播的索引(跳过未选中的图例对应的索引)
     * @param {*} indexs 未选中的索引数组
     * @param {*} index 当前轮播的索引
     * @returns 正确的轮播索引
     */
    const findDataIndex = (indexs, index) => {
      if (indexs.includes(index)) {
        return findDataIndex(indexs, index + 1);
      }
      return index;
    };

    return {
      init() {
        if (!show || window.componentList || !chart) return this
        // 开启鼠标悬浮暂停 注册鼠标事件
        if (pause) {
          chart.on('mouseover', params => {
            this.pause()
            chart.dispatchAction({
              type: 'downplay',
              seriesIndex: 0,
              dataIndex,
            })
          })
          chart.on('mouseout', params => {
            dataIndex = params.dataIndex
            if (trigger !== 'axis') {
              hoverSeriesIndex = params.seriesIndex
            }
            this.play()
          })
        }

        /**单击图例事件 */
        chart.on('legendselectchanged', params => {
          if (trigger === 'axis') {
            this.pause().play()
          } else {
            // 重置当前轮播，重新从头开始播放
            this.reset().play()
          }
        })

        return this
      },
      play() {
        if (!show || window.componentList || !chart) return this

        try {
          const options = chart.getOption()
          // 取出数据长度(各图表设置数据的方式不一样，兼容处理)
          let dataLength = options.dataset
            ? options?.dataset[0].source?.length
            : options.series[0]?.data?.length
          // 获取显示在界面上的系列的索引，用于轮播的参数(兼容单击图例可以隐藏系列数据)
          const seriesArray = options.series
            .map((ser, index) => ({ ...ser, index }))
            .filter(ser => options.legend[0].selected[ser.name] !== false)
            .map(ser => ser.index)
          let idxs = []; // 未选中的图例在数据中的索引(饼图、环形图)
          if (dataWithLegend) {
            try {
              const disabledLegend = Object.entries(options.legend[0].selected)
                .filter(([, value]) => !value)
                .map(([name]) => name);
              const data = options.series[0]?.data;
              if (disabledLegend.length === data.length - 1) return;
              idxs = data.reduce((prev, cur, idx) => {
                if (disabledLegend.includes(cur.name)) {
                  prev.push(idx);
                }
                return prev;
              }, []);
            } catch (error) {
              console.error(error);
            }
          }

          let seriesIndexArray = seriesArray.slice()

          // 全部系列都没选择 不进行轮播
          if (seriesIndexArray.length === 0) return
          timer = setInterval(() => {
            if (trigger === 'axis') {
              // 坐标轴触发可以认为是单系列
              if (dataIndex >= dataLength - 1) {
                dataIndex = 0
              } else {
                dataIndex = dataIndex + 1
              }
              if (dataWithLegend) {
                dataIndex = findDataIndex(idxs, dataIndex);
                if (dataIndex > dataLength - 1) {
                  dataIndex = 0;
                }
              }
            } else {
              // 单击图例后对鼠标悬浮数据的处理
              if (hoverSeriesIndex !== -1) {
                // 获取真实的系列索引(为了兼容点击图例隐藏了部分系列)
                const seriesIndex = seriesIndexArray.indexOf(hoverSeriesIndex)

                // 保留鼠标悬浮系列后续的序列数据
                seriesIndexArray = seriesIndexArray.splice(seriesIndex + 1)

                // 重置hover状态
                hoverSeriesIndex = -1
              }

              // 当前数据项的系列播放完毕
              if (seriesIndexArray.length === 0) {
                // 还原系列索引，重新播放下一个数据项
                seriesIndexArray = seriesArray.slice()
                // 数据项索引+1
                dataIndex = dataIndex + 1
                // 数据项播放完毕，重新从头开始播放
                if (dataIndex == dataLength) {
                  dataIndex = 0
                }
              } else {
                dataIndex = dataIndex === -1 ? 0 : dataIndex
              }
            }

            const seriesIndex = trigger === 'axis'
            ? seriesIndexArray[0]
            : seriesIndexArray.shift()

            // 显示提示框
            chart.dispatchAction({
              type: 'showTip',
              seriesIndex,
              dataIndex,
              position: position === 'auto' ? undefined : position,
            })

            // 取消全部系列数据高亮
            chart.dispatchAction({
              type: 'downplay',
            })

            // 高亮当前系列数据
            chart.dispatchAction({
              type: 'highlight',
              seriesIndex,
              dataIndex,
            })
          }, interval)
        } catch (error) {
          console.error(error)
        }

        return this
      },
      // 暂停
      pause() {
        if (!show || window.componentList) return this
        timer && clearInterval(timer) && (timer = null)
        return this
      },
      // 重置
      reset() {
        // 清除定时器
        this.pause()
        // 数据项从0开始
        dataIndex = -1
        return this
      },
      // 销毁
      dispose() {
        this.pause()
        carouselConfig = null
        chart = null
      },
    }
  },
};

BaseComp.extend = function (fn, props) {
  if (typeof fn !== 'function' || !fn) {
    fn = function () {};
  }

  const originalClass = this;
  const newPrototype = Object.create(this.prototype, {
    constructor: {
      value: fn,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });

  if (props) {
    for (let i in props) {
      if (props.hasOwnProperty(i)) {
        newPrototype[i] = props[i];
      }
    }
  }

  newPrototype._super = originalClass;
  fn.prototype = newPrototype;
  return fn;
};

// datai-comhook
function Comhook(_this, container, config, attr, defaultData, defaultAttr) {
  deepCloneObject(config);
  deepCloneObject(attr);
  this.target = _this;
  this.container = container;
  this.config = config;
  this.attr = attr;

  // 把defaultData换成config的原因是 组件显示的静态数据改为了由 defaultData 提供, 所以需要让defaultData和config保持一致。
  this.defaultData = {...config};
  this.defaultAttr = defaultAttr;
}

Comhook.prototype.init = function () {
  // 预览界面减少instance上的属性挂载
  if(Array.isArray(window.layerList)) return;
  this.setDefaultData();
};

Comhook.prototype.setDefaultData = function () {
  this.target.defaultData = this.defaultData;
  this.target.defaultAttr = this.defaultAttr;

  if(Array.isArray(window.componentList) && this.config._mockData){
    // 编辑态刷新页面时，需要从 _mockData 还原静态数据内容
    this.target.defaultData._data = [...this.config._mockData]
  }
};

function deepCloneObject(obj) {
  if (Object.prototype.toString.call(obj) !== '[object Object]') {
    return;
  }
  let objKeys = Object.keys(obj);
  if (Object.prototype.toString.call(objKeys) !== '[object Array]') {
    return;
  }
  objKeys.forEach((key) => {
    if (obj[key] instanceof Object) {
      try {
        obj[key] = JSON.parse(JSON.stringify(obj[key]));
      } catch (e) {
        console.info('Deep Clone Object Failed', e);
      }
    }
  });
  return obj;
}

/**
 * 读取 cookie 的方法
 * @param {string} name cookie 名称，可选，不填返回整个 cookie 对象
 * @returns 字符串或对象
 */
function getCookie(name){
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const res = {};
  for(let i = 0; i < cookies.length; i++){
    const pairs = cookies[i].split("=");
    const found = decodeURIComponent(pairs[0]);
    res[found] = pairs[1];
    if(found === name){
      break;
    }
  }
  return name ? res[name] : res;
}

/**
 * 时间格式化方法
 * @param {any} date    日期
 * @param {string} fmt  格式，如：YYYY-MM-DD HH:mm:ss、YY-M-D H:m:s
 * @returns 字符串
 */
function dateFormat(date, fmt) {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  if (isNaN(date.getTime())) {
    return "??";
  }
  var o = {
    "M+": date.getMonth() + 1,
    "D+": date.getDate(),
    "H+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
  };
  if (/(Y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}

function GetQueryString(name) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
  const r = window.location.search.slice(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
}

function setSpaceIdHeader (config = { headers: {} })  {
  const spaceId = GetQueryString('spaceId') || window.wutongNsKey;
  if (spaceId) {
    config.headers.CLIENT_APP = config.headers.CLIENT_APP || 'WT';
    config.headers.CUSTOM_SESSION_DATA_WT_NS = config.headers.CUSTOM_SESSION_DATA_WT_NS || spaceId;
  }
  return config;
}

const DynamicRequest = {
  commonHeaders(){
    return setSpaceIdHeader().headers
  },
  allTypesFetch: {
    get(url, params, { headers }) {
      return $.ajax(url, { type: 'GET', data: params, dataType: 'json', headers:{...headers,...DynamicRequest.commonHeaders()} }).then((res) => {
        return Promise.resolve(res);
      });
    },
    post(url, params, { headers }) {
      return $.ajax(url, {
        type: 'POST',
        data: JSON.stringify(params),
        dataType: 'json',
        contentType: 'application/json',
        headers:{
          ...headers,
          ...DynamicRequest.commonHeaders()
        },
      }).then((res) => {
        console.log(res);
        return Promise.resolve(res);
      });
    },
  },
  removeComments(code) {
    const regex = /(^|[^:])\/\/.*|\/\*[\s\S]*?\*\//g;
    return code.replace(regex, (match, group1) => {
      // 保留以 `http://` 或 `https://` 开头的 URL，不处理这些注释
      if (group1 === ':') return match;
      return ''; // 删除正常的注释
    });
  },
  babelTransform(expression = '', data) {
    expression = removeComments(expression); //expression.replace(/(?<!:)\/\/.*\n|\/\*(\s|.)*?\*\/\n/g, ''); // REVIEW liuming 去掉注释
    if (!expression.includes('return')) {
      expression = `return ${expression}`; // 没带return的带上
    }
    try {
      const getFun = new Function(
        'data',
        `
        try {
          ${expression}
        } catch (error) {
          console.error(error, '函数错误error');
          return ((data) => data)(data);
        }
      `,
      );
      const value = getFun(data);
      return value;
    } catch (error) {
      console.error(error);
    }
  },
  getExampleValue(paramList) {
    // 入参转换
    let params = paramList.reduce((prevParam, currParm) => {
      let { name: key, example: value, type, isRefer, exampleValue, exampleExpression, queryFlag } = currParm;
      if (exampleValue && isRefer) {
        value = getDataByKey(exampleValue) === 0 ? getDataByKey(exampleValue) : getDataByKey(exampleValue) || '';
        if (exampleExpression && exampleExpression.trim().length > 0) {
          try {
            value = DynamicRequest.babelTransform(exampleExpression, value); // 运行时ES6转ES5
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (type === 'number') {
          value = value ? Number.parseFloat(value) : '';
        } else if (type === 'array' || type === 'object') {
          value && (value = JSON.parse(value));
        }
        // else if (type === 'boolean') {
        //   value = value == 'false' ? false : Boolean(value);
        // }
      }
      if (!queryFlag && value !== undefined) {
        prevParam[key] = value;
      }
      return prevParam;
    }, {});
    return params;
  },
  isEasyDataApi(url) {
    return /.*\/easydata/.test(url);
  },
  triggerRequest(dataQuerys, testCallBack, instance) {
    DynamicRequest.executeAjax(dataQuerys, window.screenConfig, testCallBack, instance);
  },
  executeAjax(dataQuerys, screenConfig, testCallBack, instance) {
    const dataQuery = JSON.parse(JSON.stringify(dataQuerys));
    // apiInfo 数据信息 paramList入参 dataMapList 数据映射 variable 变量
    const { apiInfo, contentType, headers = [], dataMapList = [], variable, isLoop = false } = dataQuery;
    let paramList = dataQuery.paramList || [];
    // 变量表达式
    let { variableExpression = 'data.data' } = dataQuery;
    if (variableExpression === '') {
      variableExpression = 'data.data';
    }
    if (paramList == null) {
      paramList = [];
    }

    if (apiInfo.isIndicator) {
      // 遇到参数值类似 {Date@YYYY/MM/DD HH:mm:ss} 的，表示要替换为当前时间
      const pattern = /^{Date@(.+)}$/;
      paramList.forEach((item) => {
        if (item.type === 'string' && pattern.test(item.example)) {
          const match = pattern.exec(item.example);
          item.example = dateFormat(new Date(), match[1]);
        }
      });
    }

    let params = DynamicRequest.getExampleValue(paramList);
    // 完善apiInfo字段判断
    if (Object.prototype.toString.call(apiInfo) !== '[object Object]') {
      return;
    }
    let { method, url, useProxy, interfaceCode, source, centerUrl } = apiInfo; // 添加useProxy和interfaceCode用于请求和保存缓存数据

    // 外部接口: 只有使用代理的情况下才使用centerUrl
    if (source === 3) {
      if (useProxy === 1) {
        //使用代理
        url = centerUrl;
      }
    } else {
      // 其他类型接口: 有centerUrl使用centerUrl
      url = centerUrl ? centerUrl : url; // 接口中心换了字段做兼容处理
    }

    method = method.toLocaleLowerCase();

    // 添加支持POST请求的query参数
    if (method === 'post') {
      const querys = paramList.filter((item) => !!item.queryFlag);
      const queryArr = [];
      querys.forEach((item, index) => {
        let { name: key, example: value, type, isRefer, exampleValue, exampleExpression, queryFlag } = item;
        if (exampleValue && isRefer) {
          value = getDataByKey(exampleValue) || ''; // 根据key获取全局变量的值
          if (exampleExpression && exampleExpression.trim().length > 0) {
            try {
              value = DynamicRequest.babelTransform(exampleExpression, value); // 运行时ES6转ES5
            } catch (e) {
              // message.warning(e);
              console.log(e); // message.warning会导致白屏
            }
          }
        } else {
          if (type === 'number') {
            value = value ? parseFloat(value) : '';
          } else if (type === 'array' || type === 'object') {
            value && (value = JSON.parse(value));
          }
          // else if (type === 'string') {
          //   value = value == undefined ? '' : value;
          // }
          // else if (type === 'boolean') {
          //   value = value == 'false' ? false : Boolean(value);
          // }
        }
        // queryArr[index] = key + '=' + value;
        if (value !== undefined) {
          queryArr[index] = `${key}=${value}`;
        }
      });
      const queryStr = queryArr.join('&');
      // 加判断解决没有query参数带?的情况
      if (!!queryStr) {
        url += url.indexOf('?') === -1 ? '?' : '&';
        url += queryStr;
      }
    }

    //处理url里面有变量{}
    const regUrl = /\{(.+?)\}/g;
    if (regUrl.test(url)) {
      url = setUrl(url, params, regUrl, method);
      console.log(url);
    }

    dataQuery.realParams = params;

    if (url.indexOf('api') == 0) {
      url = '/' + url;
    }

    // 接口支持多级目录部署路径
    if (!!window.requestPrefix) {
      if ((source === 3 && useProxy === 0) || url.indexOf('/indicator/') === 0) {
        // 外部接口不使用代理这种情况是直接请求外部接口，不需要考虑多级目录部署路径
      } else {
        const prefix = window.requestPrefix.replace('/api', '');
        url = prefix + url;
      }
    }

    const getApi = (isLoop) => {
      let fetchUrl = url;
      let fetchMethod = method;

      // 兼容接口轮询时参数引用变量变化时能够更新参数
      let params = DynamicRequest.getExampleValue(paramList);

      // get 请求参数处理
      if (
        method === 'get' && // 外部接口代理 || api接口
        (source === 6 || (source === 3 && useProxy === 1))
      ) {
        const queryParams = CompatibleTool.queryStringify(params);
        fetchUrl = DynamicRequest.isEasyDataApi(url) ? `${fetchUrl}?${queryParams}` : `${fetchUrl}&${queryParams}`;
        params = null;
      }

      // 执行数据缓存接口逻辑
      if (screenConfig.dataType === 1 && !(url.indexOf('/indicator/') === 0)) {
        fetchMethod = 'post';
        switch (source) {
          case 1: // SQL配置
            // url 是原始url，fetchUrl是请求的url
            if (DynamicRequest.isEasyDataApi(url)) {
              fetchUrl = '/api/query/cache/V1/cacheBodyQuery'; // SQL配置新接口
            } else {
              fetchUrl = '/api/query/cache/V1/cacheBasicQuery'; // SQL配置老接口
            }
            break;
          case 2: // 系统自研
            fetchUrl = '/api/query/cache/V1/queryExternalInterfaceData';
            params = {
              interfaceCode: interfaceCode,
              queryParam: params ? JSON.stringify(params) : '{}',
            };
            break;
          case 3: // 外部接口
            // 开启代理
            if (useProxy) {
              const pos = url.indexOf('?');
              const query = url.slice(pos); // 需要带上targetUrl参数
              if (DynamicRequest.isEasyDataApi(url)) {
                fetchUrl = `/api/query/cache/V1/cacheProxyQueryByCode/${interfaceCode}${query}`; // 外部新接口
              } else {
                fetchUrl = `/api/query/cache/V1/cacheProxyQuery${query}`; // 外部老接口
              }
            } else {
              // 前端直接请求外部接口
              fetchUrl = '/api/query/cache/V1/queryExternalInterfaceData';
              params = {
                interfaceCode: interfaceCode,
                queryParam: params ? JSON.stringify(params) : '{}',
              };
            }
            break;
          case 5: // 数据集
            fetchUrl = `/api/query/cache/V1/cacheBodyQuery`;
            params = params ? { ...params, sqlApiCode: interfaceCode } : { sqlApiCode: interfaceCode };
            break;
          case 6: // api接口
            const pos = url.indexOf('?');
            const query = url.slice(pos); // 需要带上targetUrl参数
            fetchUrl = `/api/query/cache/V1/cacheProxyQueryByCode/${interfaceCode}${query}`;
            break;

          default:
            break;
        }
        // 获取缓存接口支持多级目录部署路径
        if (!!window.requestPrefix) {
          const prefix = window.requestPrefix.replace('/api', '');
          fetchUrl = prefix + fetchUrl;
        }

        // if (isLoop) {
        //   fetchUrl += '?cycle=true'; // 轮询的接口在url后面加参数标识
        // }
      }

      let config = {};
      headers.forEach((item) => {
        config[item.key] = item.value;
      });
      // v7-10-0 区分post不同参数格式
      let methodType = fetchMethod;
      const paramsKeys = params && Object.keys(params);
      // console.log('paramsKeys', paramsKeys);
      if (method === 'post' && paramsKeys && paramsKeys.length > 0) {
        if (contentType === 'formData') {
          methodType = 'postFormData';
        } else if (contentType === 'xWwwFormUrlencoded') {
          methodType = 'postFormUrlencoded';
        }
      }
      // 无参数时不传
      if (!paramsKeys || paramsKeys.length === 0) {
        params = null;
      }
      DynamicRequest.allTypesFetch[methodType](fetchUrl, params, { headers: config }).then((data) => {
        // 使用动态数据源的接口返回数据是数组
        let cacheData = data;

        // 系统自研和不使用代理的外部接口 需要 调用保存缓存的接口
        if ((source === 3 || source === 2) && useProxy === 0 && cacheData) {
          // 正常请求时进行缓存
          if (!screenConfig.dataType) {
            // 前端直接请求外部接口返回的数据保存到后端
            let urls = '/api/query/cache/V1/saveExternalInterfaceData';
            const saveParams = {
              cycle: isLoop,
              interfaceCode: interfaceCode,
              queryParam: params ? JSON.stringify(params) : '{}',
              result: JSON.stringify(cacheData), // 有结果再保存
            };
            // 外部接口不启用代理保存缓存接口支持多级目录部署路径
            if (!!window.requestPrefix) {
              const prefix = window.requestPrefix.replace('/api', '');
              urls = prefix + urls;
            }
            allTypesFetch['post'](urls, saveParams, { source }); // 提交保存
          }

          // 如果接口返回的是字符串，说明是调用缓存接口返回的数据，需要进行反序列化成对象
          if (typeof cacheData === 'string') {
            cacheData = JSON.parse(cacheData);
          }
        }

        dataQuery.response = cacheData;
        delete dataQuery.realParams;

        let store = {};
        // 测试回调 && 动态数据源使用回调
        if (testCallBack) {
          testCallBack && testCallBack(cacheData);
          return;
        }
        // 保存返回变量
        if (variable) {
          try {
            store[variable] = DynamicRequest.babelTransform(variableExpression, cacheData); // 运行时ES6转ES5
          } catch (e) {
            formatErrorLog({
              data: cacheData,
              expression: `return ${variableExpression}`,
            });
          }
        }
        // 数据映射
        store = dataMapList.reduce((s, mapInfo) => {
          const { type, path, code, variable } = mapInfo;
          let value;
          // v7.3.0 数据映射处理
          if (type === 'config') {
            value = _.get(cacheData, path);
          }
          if (type === 'code') {
            value = DynamicRequest.babelTransform(code, cacheData);
          }
          if (value || typeof value !== 'undefined') {
            s[variable] = value.data ? value.data : value;
          }
          return s;
        }, store);

        Object.entries(store).forEach(([key, value]) => {
          // v7.3.0 数据更新 TODO数据类型校验
          setStoreData(key, value); // 更新全局存储的变量数据
        });
      });
    };
    let timer;
    if (dataQuery.apiMs == undefined) {
      dataQuery.apiMs = 5;
    }
    //预览的时候轮询
    if (dataQuery.isLoop && window.layerList) {
      let apiMs = dataQuery.apiMs;
      if (dataQuery.msVariable) {
        apiMs = getExpDataByKey(dataQuery.msVariable, dataQuery.msExpression);
      }
      getApi(true);
      if (dataQuerys.timer) {
        clearInterval(dataQuerys.timer);
      }
      const timer = setInterval(() => {
        getApi(true);
      }, parseInt(apiMs * 1000));
      dataQuerys.timer = timer;
      //暴露方法清除定时器
      dataQuerys.clearIntervalFn = function () {
        clearInterval(dataQuerys.timer);
      };
      window.timerTask.addTask({
        taskId: timer,
        taskType: 'interval',
        appPageId: instance.config.screenConfig.pageId,
      });
    } else {
      clearInterval(timer);
      getApi();
    }
  },
};

const CompatibleTool = {
  // 兼容雷达图
  compatibleRadarChart: function (normaldata) {
    let compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            value: data[ser],
            field: data.x,
            rate: data[ser],
            sort: data[ser],
            s: ser,
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },

  // v8.14兼容矩形树图
  // compatibleTreemapChart: function (normaldata) {
  //   const compatibledata = [];
  //   const childStr = 'children'
  //   const treeMap = {};
  //   if (!Array.isArray(normaldata)) {
  //     return compatibledata;
  //   }
  //   // eslint-disable-next-line no-prototype-builtins
  //   const checkFieldFlag = normaldata.some((item) => !item.hasOwnProperty('id') || !item.hasOwnProperty('pid'));
  //   if (checkFieldFlag) {
  //     return normaldata;
  //   }
  //   // 清除之前的children
  //   normaldata.forEach(function (item) {
  //     delete item[childStr];
  //   });
  //   // 将所有数据的id作为key键，添加到treeMap对象中
  //   normaldata.forEach(function (item) {
  //     treeMap[item['id']] = item;
  //   });
  //   // 遍历数据，修改数据层级
  //   normaldata.forEach(function (item) {
  //     const parentId = item['pid'];
  //     if (parentId) {
  //       // 找到父节点
  //       const parent = treeMap[parentId];
  //       if (parent) {
  //         // 添加子节点到父节点的 children 数组中
  //         if (!parent[childStr]) {
  //           parent[childStr] = [];
  //         }
  //         parent[childStr].push(item);
  //       } else {
  //         // 如果父节点不存在，将当前节点存储到compatibledata 中
  //         compatibledata.push(item)
  //       }
  //     } else {
  //       // 如果没有父节点将当前节点存储到compatibledata 中
  //       compatibledata.push(item)
  //     }
  //   });
  //   return compatibledata;
  // },
  // 兼容极坐标堆叠柱图
  compatiblePolarChart: function (normaldata) {
    let compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            angle: data.x,
            r: data[ser] - 0,
            s: ser,
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },
  // 兼容嵌套环形【图二维数组
  // [{pieName: '火车', ringName: '飞机', series0: 180, series1: 1375}]
  // [[{name:'火车',value:180}],[{name:'飞机',value:1375]]
  compatibleDoubleDimensionalArray: function (normaldata) {
    // 内
    const pie = normaldata
      .map((data) => {
        return {
          name: data.pieName,
          value: data.series0,
        };
      })
      .filter((val) => val.name !== undefined && val.value !== undefined);

    // 外
    const ring = normaldata
      .map((data) => {
        return {
          name: data.ringName,
          value: data.series1,
        };
      })
      .filter((val) => val.name !== undefined && val.value !== undefined);

    return [ring, pie];
  },
  // [{x:'2016',series0:"60"},{x:'2017',series0:"80"}]==>[{name:'2017',value:'80'}]
  compatibleNVFn: (normaldata) => {
    let compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            name: data.x,
            value: data[ser],
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },
  // [{x:'2016',series0:"60",series1:"100"}]==>[{x:'2016',y:'60',s:'series0'},{x:'2016',y:'60',s:'series0'}]
  compatibleXYSFn: (normaldata) => {
    let compatibledata = [];
    // 去除无x轴的数据
    // normaldata = JSON.parse(JSON.stringify(normaldata.filter((data) => data.x !== undefined)));
    if (normaldata.length > 0) {
      // 获取系列数量
      const temp = normaldata[0];
      const seriekeys = Object.keys(temp).filter((val) => val.startsWith('series'));
      seriekeys.forEach((ser) => {
        normaldata.forEach((data) => {
          const mapData = {
            x: data.x,
            y: data[ser],
            s: ser,
          };
          compatibledata.push(mapData);
        });
      });
    }
    return compatibledata.sort((a, b) => a.x - b.x);
  },
  /**
   * 过滤数据集
   * @param {object} _dimensionMap 属性字段映射关系
   * @param {array} dataSet       数据集
   * @returns
   */
  filterDataset: function(_dimensionMap, dataSet) {
    const result = [];
    if (dataSet.length === Number.POSITIVE_INFINITY) return result;
    for (const [rowIndex, rowData] of dataSet.entries()) {
      const allUnchecked = _dimensionMap.every((item) => item.row.includes(rowIndex));
      if (allUnchecked) continue; // 如果所有字段都取消勾选了这一行，则过滤掉这一行
      result.push(rowData);
    }
    return result;
  },
  /**
   * 映射成多个对象的数组
   * @param {object} _dimensionMap 属性字段映射关系
   * @param {array} dataSet       数据集
   * @param {bool} needReplace   是否替换数据中的字段
   * @returns
   */
  dataFieldMapArrayObject: function (_dimensionMap, dataSet, needReplace = true) {
    const result = [];
    if (dataSet.length === Number.POSITIVE_INFINITY) return result;
    for (const [rowIndex, rowData] of dataSet.entries()) {
      const allUnchecked = _dimensionMap.every((item) => item.row && item.row.includes(rowIndex));
      if (allUnchecked) continue; // 如果所有字段都取消勾选了这一行，则过滤掉这一行
      const obj = _dimensionMap.reduce((pre, cur) => {
        const field = needReplace ? cur.dataMapKey : cur.col;
        const unchecked = cur.row && cur.row.includes(rowIndex);
        //  如果当前字段取消勾选了这一行，则值设置为 undefined
        pre[field] = unchecked ? null : rowData[cur.col];
        return pre;
      }, {});
      result.push(obj);
    }
    return result;
  },
  // 映射成只有一个对象的数组
  dataFieldMapOnlyObject: function (dimensionMap, dataSet) {
    const obj = dimensionMap.reduce((pre, cur) => {
      pre[cur.dataMapKey] = dataSet
        .filter((data, idx) => cur.row.includes(idx))
        .map((v) => v[cur.col])
        .join('');
      return pre;
    }, {});
    return [obj];
  },
  // 老数据转成新数据 [{x:'2016',y:'60',s:'series0'},{x:'2016',y:'60',s:'series0'}] ==> [{x:'2016',series0:"60",series1:"100"}]
  dataFieldMapHasX: (dimensionMap, dataSet) => {
    const groups = dimensionMap.map((dims) => {
      return dataSet
        .filter((val, idx) => dims.row.includes(idx))
        .map((data) => {
          return {
            [dims.dataMapKey]: data[dims.col],
          };
        });
    });

    // 取x轴数据长度
    const lens = groups
      .map((g, idx) => {
        const key = dimensionMap[idx].dataMapKey;
        let obj = {
          [key]: g.length,
        };
        return obj;
      })
      .find((f) => f.x)?.x;

    let list = [];
    for (let index = 0; index < lens; index++) {
      let obj = {};
      groups.forEach((g, idx) => {
        const key = dimensionMap[idx].dataMapKey;
        obj[key] = g[index] && g[index][key];
      });
      list.push(obj);
    }

    return list;
  },
  // 映射字段中有value、field、s 雷达图
  isRadarChart: function (config) {
    let match = false;
    const _api = config._api;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('value') && fields.includes('field') && fields.includes('s');
    return match;
  },
  // 映射字段中有r、angle、s 极坐标
  isPolarChart: function (config) {
    let match = false;
    const _api = config._api;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('r') && fields.includes('angle') && fields.includes('s');
    return match;
  },
  // 映射字段中有x,y,s类型的图表
  isXYSChart: function (config) {
    let match = false;
    const _api = config._api;
    const fields = _api.map((f) => f.field) || [];
    match = fields.includes('x') && fields.includes('y') && fields.includes('s');
    return match;
  },
  // 映射字段中有name,value类型的图表
  isNVChart: function (config) {
    let match = false;
    const _api = config?._api;
    if(!_api && !Array.isArray(_api)){
      return
    }
    const fields = _api.map((f) => f.field) || [];
    const _mockData = config._mockData ? config._mockData : config._data;
    const dynamic = config.dynamic;
    const _mapFields = dynamic?.dataMap?.map((v) => v.key) ?? [];
    const includes = _mapFields.includes('name') && _mapFields.includes('value') && _mapFields.includes('type'); // 排除词云
    // 必须有name、value 或者text、value
    // 暂时让水波图不归为这一类 
    // v8.14 通过不包含pid排除矩形树图
    match =
      (fields.includes('name') || fields.includes('text')) &&
      fields.includes('value') &&
      !fields.includes('percent') &&
      !fields.includes('pid') &&
      !includes &&
      Object.prototype.toString.call(_mockData[0]) === '[object Object]';

    return match;
  },
  // v8.14映射字段中有id，pid, name，value，类型的图表
  // isTreeChart: function (config) {
  //   let match = false;
  //   const _api = config?._api;
  //   const fields = _api.map((f) => f.field) || [];
  //   match = fields.includes('id') && fields.includes('pid') && fields.includes('name') && fields.includes('value');
  //   return match;
  // },
  // 判断数据是不是 xys 格式
  isXYSDataFormat: function(data){
    if(Array.isArray(data)){
      const keys =  Object.keys(data[0]);
      if(keys.includes('x') && keys.includes('y') && keys.includes('s') ) return true;
    }
    return false;
  },
  filterCheckFieldRows: function (rows = [], data = []) {
    return data.reduce((pre, cur, idx) => {
      if (!rows.includes(idx)) {
        pre.push(idx);
      }
      return pre;
    }, []);
  },
  queryStringify: function (obj) {
    let str = '';
    for (var k in obj) str += k + '=' + obj[k] + '&';
    return str.slice(0, -1);
  },
};

const setVariableRef = (variable, exp) => {
  const expression = exp || 'data'
  const fn = new Function('data', `return ${expression}`)
  const variableValue = fn(window.getDataByKey(variable))
  return variableValue
}

const setApiParam = apiParamVar => {
  let { type, layerType, defaultValue, dataVariable, dataExpression } =
    apiParamVar || {}
  let reApiParam = ''
  if (layerType == 'API') {
    if (type == 'default') {
      reApiParam = defaultValue
    } else if (type == 'variableRef') {
      setVariableRef(dataVariable, dataExpression)
    }
  }
  return reApiParam
}


window['BaseComp'] = BaseComp;
