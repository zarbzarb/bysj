import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import JSEdit from '@/components/commons/JSEdit';
import { babelTransform3 /* , babelTransform4 */ } from '@/utils/utils';
import { DropPanel } from '@yl/datai-ui';
// let Editor = window.dataqUi['Editor'];

@inject('pageTreeStore')
@observer
export default class ChartOption extends Component {
  // state = {
  //   show: false,
  // };

  // isDrop = () => {
  //   const { show } = this.state;
  //   this.setState({
  //     show: !show,
  //   });
  // };

  changeFnCode = (val) => {
    if (!val) {
      return;
    }
    const { item, pageTreeStore } = this.props;
    // let datas = item.instance.oldData;
    try {
      // let optionFn =
      //   val.indexOf('function') == -1
      //     ? babelTransform3(val)
      //     : babelTransform4(val)();
      const optionFn = babelTransform3(val);
      item.middleWareFnCode = val;
      pageTreeStore.setPageInfoStep(1);
      item.instance.filterFn = optionFn;
      item.instance.compAttr.codeEdit = Math.random();
      item.instance.render();
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    let optionStr = `     // 报表配置
    //arguments[0] -option 报表配置
    //arguments[1] -datas 源数据 或undefined
    //arguments[2] -dataset 数据集或undefined
    //arguments[3] -chart 报表实例或undefined
    //arguments[4] -dataSource 数据源或undefined

    console.log(option, datas ,dataset ,chart,dataSource,'报表配置'); 
    let chartOption = {
      //chart option
    };
    option = Object.assign({}, option, chartOption);
    // console.log(option,'报表配置新'); 
    return option;`;
    const { item } = this.props;
    // const { show } = this.state;
    // let datas = item.instance.oldData;
    if (item.middleWareFnCode) {
      optionStr = item.middleWareFnCode;
    }
    return (
      <div className='yl-comp-config'>
        {/* <div className='yl-comp-text-field comp-drop-panel display'>
          <div className='comp-drop-panel-header row' onClick={this.isDrop}>
            <div className='yl-comp-field-label'>
              <span>自定义配置</span>
            </div>
            <div className='col-12 right cursor paddingRight0'>
              <div className={`yl-data-icon icon-arrow ${show ? 'open' : ''}`}>
                <svg width='8px' height='8px' viewBox='-2 0 16 22' version='1.1'>
                  <g id='工作台' stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
                    <path
                      d='M2.04111276,0.752461845 L11.2108378,9.26720651 C11.6155484,9.64300927 11.6389829,10.2757404 11.2631802,10.6804511 C11.2463847,10.6985386 11.2289252,10.715998 11.2108378,10.7327935 L2.04111276,19.2475382 C1.63640209,19.6233409 1.00367093,19.5999064 0.627868166,19.1951958 C0.344225826,18.8897348 0.279815912,18.4403682 0.466234466,18.0675311 L4.2763932,10.4472136 C4.41715695,10.1656861 4.41715695,9.8343139 4.2763932,9.5527864 L0.466234466,1.93246893 C0.219245218,1.43849044 0.419469564,0.837817395 0.913448062,0.590828146 C1.28628517,0.404409591 1.73565178,0.468819506 2.04111276,0.752461845 Z'
                      id='路径-12'
                      fill='#D8D8D8'
                    ></path>
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <div className={`comp-drop-panel-container ${show ? 'open' : ''}`}>
            <div className='component-attr'>
              <div className='yl-comp-text-field editor'>
                <JSEdit
                  key={`JSEdit-${item.key}`}
                  codeType='javascript'
                  onChange={this.changeFnCode}
                  value={optionStr}
                />
              </div>
            </div>
          </div>
        </div> */}

        <DropPanel title='自定义配置'>
          <JSEdit key={`JSEdit-${item.key}`} codeType='javascript' onChange={this.changeFnCode} value={optionStr} />
        </DropPanel>
      </div>
    );
  }
}
