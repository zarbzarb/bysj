import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { TreeSelect, Select, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Input } from '@yl/datai-ui';
import fetch from '@/services/xhr/fetch';
import { getAllLayers, getCurrentGroup, renderGroupNode } from '@/utils/gisCommonUtils';

const { TreeNode } = TreeSelect;
const { Option } = Select;
const { YunliMap } = window;

/* const dataSourceData = [
  { label: '自定义', value: 'custom' },
  { label: '时空数据', value: 'gispublic' },
  { label: '引用CIM平台资源', value: 'cim' }
]; */

@inject('pageTreeStore')
@observer
export default class DataSource extends Component {
  state = {
    source: 'custom',
    layer_groups: [],
    layers: [],
    // group_id: undefined,
    count: 0,
    testResult: '',
    // opLayers: [],
    // tdLayers: [],
    model_addr: 'https://yunli-open-platform.oss-cn-zhangjiakou.aliyuncs.com/gisdata/3dtilesample/tileset.json',
    apiLoad: false,
    dataSourceData: [{ label: '自定义', value: 'custom' }],
  };

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { englishName } = this.props.data;
    const { /* cimSource, */ timeAndSpace } = window.screenConfig.environment;
    const { dataSourceData } = this.state;
    dataSourceData[0].label = englishName === 'Map3DBuildingLayer' ? '内置数据' : '自定义';
    // if (cimSource) {
    //   dataSourceData.push({ label: '引用CIM地理资源', value: 'cim' });
    //   this.loadCimSource(); // cim环境获取数据
    // }
    if (timeAndSpace) {
      dataSourceData.push({
        label: /* '引用时空地理资源' */ '时空数据',
        value: 'gispublic',
      });
      this.loadLayers(); // 其他环境获取数据
    }
    this.setState({ dataSourceData });
    // window.screenConfig.environment?.cimSource
    //   ? this.loadCimSource() //cim环境获取数据
    //   : this.loadLayers(); //其他环境获取数据
    /* this.getLayerFirstItem(
      this.props.CompInstance.compAttr.relation_layer_info
    ); */
  }

  async loadLayers() {
    // 请求时空地理图层列表
    this.setState({
      apiLoad: true,
    });
    const data = await fetch.get('/gis-platform/gispublic/groups/getAll');
    if (data && data.result) {
      // let layers = [];
      // data.result.forEach((item) => {
      //   let threeDtiles = item.layers.filter((sub) => {
      //     return sub.dataType === '3dtiles';
      //   });
      //   layers = layers.concat(threeDtiles);
      // });
      this.setState({
        apiLoad: false,
        layer_groups: data.result,
        // layers
      });
    }
  }
  // async loadCimSource() {
  //   this.setState({
  //     apiLoad: true
  //   });
  //   let { source } = this.props.CompInstance.compAttr;
  //   !source &&
  //     this.props.CompInstance.mergeAttr({
  //       source: 'cim'
  //     });
  //   // 请求cim图层列表
  //   let data = await fetch.get('/api/page/gis/groupSource/v1/getAll');
  //   if (data && Array.isArray(data.data)) {
  //     let cimData = data.data;
  //     let opLayers = []; //倾斜摄影
  //     let tdLayers = []; //三维模型

  //     console.log('loadCimSource****cimData*', cimData);
  //     cimData.forEach((item) => {
  //       if (item.groupName == '倾斜摄影') {
  //         opLayers = item.layers;
  //       } else if (item.groupName == '三维模型') {
  //         tdLayers = item.layers;
  //       }
  //     });

  //     this.setState({
  //       apiLoad: false,
  //       opLayers,
  //       tdLayers
  //     });
  //   }
  // }
  getGroupId(layerCode) {
    for (const item of this.state.layers) {
      if (item.layerCode === layerCode) {
        return item.groupId;
      }
    }
  }

  renderNode(children = []) {
    return children.map((variableGroup, idx) => {
      return (
        <TreeNode disabled value={variableGroup.key} title={variableGroup.name}>
          {variableGroup.children &&
            variableGroup.children.map((variable, index) => {
              return <TreeNode value={variable.key} title={variable.name}></TreeNode>;
            })}
        </TreeNode>
      );
    });
  }

  async getLayerFirstItem(layerCode) {
    window.YunliMap.getFeatureByFilter({
      layerCode,
      callback: (data) => {
        this.setState({
          testResult: data[0].props, // 数据量非常大，只查看第一条显示数据结构
        });
      },
    });
  }

  // v7.5支持模糊搜索
  filterOption(input, option) {
    const val = Array.isArray(option.children) ? option.children.join('') : option.children;
    return val ? val.toLowerCase().indexOf(input.toLowerCase()) >= 0 : false;
  }

  // v7.5支持模糊搜索
  filterTreeNode(input, treeNode) {
    console.log('input', input);
    console.log('treeNode', treeNode);
    if (typeof treeNode.title === 'string') {
      return treeNode.title.toLowerCase().indexOf(input.toLowerCase()) >= 0;
    } else {
      if (typeof treeNode.name === 'string') {
        return treeNode.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
      } else {
        return false;
      }
    }
  }

  render() {
    const {
      layer_groups,
      // group_id,
      // layers,
      model_addr,
      testResult,
      // tdLayers,
      // opLayers,
      apiLoad,
      dataSourceData,
    } = this.state;
    const { CompInstance, data: orgData, pageTreeStore } = this.props;
    const { englishName } = this.props.data;
    let { group_id = '', relation_layer_code, relation_layer_info, url, source = 'custom' } = CompInstance.compAttr;
    // let classifyData = [];
    let layersData = [];
    // console.log(
    //   'CompInstance.compAttr*****',
    //   CompInstance,
    //   CompInstance.compAttr,
    //   orgData
    // );

    /*  if (!source) {
      source = 'cim';
      CompInstance.mergeAttr({
        source: sourceIntVal
      });
    } */

    //group_id = group_id || this.getGroupId(relation_layer_code);
    // let cimType = '';
    // if (window.screenConfig.environment?.cimSource && !source) {
    //   source = 'cim';
    //   CompInstance.mergeAttr({
    //     source: 'cim'
    //   });
    // }

    // if (source == 'cim') {
    //   cimType =
    //     orgData.englishName == 'Map3DThreedLayer' ? '三维模型' : '倾斜摄影';
    //   classifyData = [{ label: cimType, value: cimType }];
    //   let layersArrTmp =
    //     orgData.englishName == 'Map3DThreedLayer' ? tdLayers : opLayers;
    //   layersData = layersArrTmp.map((item) => ({
    //     label: item.layerName,
    //     value:
    //       item.id +
    //       '$' +
    //       item.dataTypeParent +
    //       '$' +
    //       item.dataType +
    //       '$' +
    //       item.file
    //   }));
    // } else {
    //todo 后端增加url字段
    // cimType = group_id;
    // classifyData = layer_groups.map((item) => ({
    //   label: item.groupName,
    //   value: item.fid
    // }));
    if (source == 'cim') {
      source = 'gispublic';
      CompInstance.mergeAttr({
        source: 'gispublic',
      });
    }
    // layer_groups.some((item) => {
    //   if (item.fid === group_id) {
    //     layersData = item.layers
    //       ?.filter((sub) => sub.dataType === '3dtiles')
    //       .map(({ layerName, layerCode, url }) => ({
    //         label: layerName,
    //         //value: layerCode,
    //         value: layerCode + '$' + url
    //       }));
    //     return true;
    //   }
    //   return false;
    // });
    // layer_groups.some((item) => {
    //   if (item.fid === group_id) {
    //     layersData = getAllLayers(item)
    //       .filter((sub) => {
    //         return sub.dataType === '3dtiles';
    //       })
    //       .map(({ layerName, layerCode, url }) => ({
    //         label: layerName,
    //         //value: layerCode,
    //         value: layerCode + '$' + url
    //       }));
    //     return true;
    //   }
    //   return false;
    // });
    const group = getCurrentGroup(layer_groups, group_id);
    if (group) {
      layersData = getAllLayers(group)
        .filter((sub) => {
          return englishName === 'Map3DTilesetLayer'
            ? sub.resourceType === 'op_3dtiles' || sub.resourceType === 'op_osgb'
            : sub.dataType === '3dtiles';
        })
        .map(({ layerName, layerCode, url, file }) => ({
          label: layerName,
          value: layerCode + '$' + file,
        }));
    }
    // layersData = layers
    //   .filter(({ groupId }) => groupId === group_id)
    //   .map(({ layerName, layerCode, url }) => ({
    //     label: layerName,
    //     //value: layerCode,
    //     value: layerCode + '$' + url
    //   }));

    // layersData = layers.map(({ layerName, layerCode, url }) => ({
    //   label: layerName,
    //   //value: layerCode,
    //   value: layerCode + '$' + url
    // }));
    // if (orgData.englishName == 'Map3DThreedLayer') {
    //   classifyData = [];
    //   layersData = [];
    // }
    // }
    // console.log(
    //   'CompInstance.compAttr**classifyData***',
    //   classifyData,
    //   orgData,
    //   layersData
    // );
    // !source && (source = 'custom');

    return (
      <div className='yl-comp-config antd-dark ' style={{ minHeight: '100%' }}>
        <div className='yl-comp-text-field'>
          <div className='yl-comp-field-label'>
            <span className='margin-right-8'>数据源选择</span>
            <Tooltip title='白模图层的内置数据需要访问外网才可正常显示'>
              <QuestionCircleOutlined style={{ color: '#3fb5d2' }} />
            </Tooltip>
          </div>
          <div className='yl-comp-field-content row'>
            <Select
              style={{ width: '100%' }}
              value={source}
              onChange={(v) => {
                CompInstance.mergeAttr({
                  source: v,
                });
                this.setState({ count: ++this.state.count });
                pageTreeStore.setPageInfoStep(1);
              }}
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
              {dataSourceData.map((item) => {
                return <Option value={item.value}>{item.label}</Option>;
              })}
            </Select>
          </div>
        </div>
        {source == 'custom' ? (
          englishName !== 'Map3DBuildingLayer' && (
            <div className='yl-comp-text-field'>
              <div className='yl-comp-field-label'>模型地址</div>
              <div className='yl-comp-field-content row'>
                <Input
                  data-field='url'
                  value={url}
                  onChange={(v) => {
                    this.setState({
                      model_addr: v,
                    });
                    CompInstance.mergeAttr({ url: v });
                    this.setState({ count: ++this.state.count });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                />
              </div>
            </div>
          )
        ) : (
          <div className='yl-comp-text-field'>
            <div className='yl-comp-field-label'>选择资源</div>
            <div className='yl-comp-field-content row'>
              <div className='col' style={{ width: '49%' }}>
                {/* <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  style={{ width: '100%' }}
                  loading={apiLoad}
                  value={group_id}
                  onChange={(v) => {
                    //this.setState({ group_id: v });
                    // let info = window.screenConfig.environment?.cimSource
                    //   ? relation_layer_info
                    //   : '';
                    CompInstance.mergeAttr({
                      group_id: v,
                      relation_layer_info: undefined
                    });

                    this.setState({ count: ++this.state.count });
                  }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}>
                  {layer_groups.map((item) => {
                    return <Option value={item.fid}>{item.groupName}</Option>;
                  })}
                </Select> */}
                <TreeSelect
                  showSearch={true}
                  filterTreeNode={this.filterTreeNode}
                  loading={apiLoad}
                  value={group_id}
                  placeholder='请选择'
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                  popupClassName='custom-tree-select'
                  style={{ width: '100%' }}
                  dropdownStyle={{
                    maxHeight: 400,
                    overflow: 'auto',
                  }}
                  virtual={false}
                  onChange={(v) => {
                    console.log('v', v);
                    CompInstance.mergeAttr({
                      group_id: v,
                      relation_layer_info: undefined,
                      relation_layer_code: undefined,
                    });
                    this.setState({ count: ++this.state.count });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                >
                  {renderGroupNode(layer_groups)}
                </TreeSelect>
              </div>
              <div className='col' style={{ width: '49%' }}>
                {/* <Select
                  value={relation_layer_info}
                  onChange={(v) => {
                    CompInstance.mergeAttr({
                      relation_layer_info: v
                    });
                    this.getLayerFirstItem(v);
                    this.setState({ count: ++this.state.count });
                  }}
                  data={layersData}
                /> */}
                <Select
                  showSearch={true}
                  filterOption={this.filterOption}
                  style={{ width: '100%' }}
                  loading={apiLoad}
                  value={!apiLoad ? relation_layer_info : '请选择'}
                  onChange={(v) => {
                    const layerInfoArr = v.split('$');
                    CompInstance.mergeAttr({
                      relation_layer_info: v,
                      relation_layer_code: layerInfoArr && layerInfoArr.length === 2 ? layerInfoArr[0] : undefined,
                    });
                    //this.getLayerFirstItem(v);
                    this.setState({ count: ++this.state.count });
                    pageTreeStore.setPageInfoStep(1);
                  }}
                  getPopupContainer={(triggerNode) => triggerNode.parentNode}
                >
                  {layersData.map((item) => {
                    return <Option value={item.value}>{item.label}</Option>;
                  })}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
