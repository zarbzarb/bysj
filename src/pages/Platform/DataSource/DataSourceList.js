import React, { Component } from 'react';
import DataSourceComp from './DataSource';
import arrowIcon from '@/assets/icon/leftIcon.png';

export default class componentName extends Component {
  state = { showPages: [] };
  render() {
    const { ...props } = this.props;
    let { showPages } = this.state;
    let config = props.CompInstance.config;
    if (Array.isArray(config)) {
      return (
        <div>
          {config.map((vl, i) => {
            let bool = showPages.indexOf(i) >= 0;
            let style = '';
            if (bool) {
              style = ' active';
            }
            return (
              <div>
                <div className='yl-comp-config'>
                  <div
                    className='yl-comp-text-field row data-dropdown'
                    onClick={() => {
                      let index = showPages.indexOf(i);
                      if (index >= 0) {
                        showPages.splice(index, 1);
                      } else {
                        showPages.push(i);
                      }
                      this.setState({
                        showPages,
                      });
                    }}
                  >
                    <div className={'yl-comp-back-icon' + style}>
                      <img src={arrowIcon} />
                    </div>
                    <div className='yl-comp-field-label'>{vl._dataName}</div>
                    <div className='yl-comp-field-label right'>配置完成</div>
                  </div>
                </div>
                {bool && <DataSourceComp {...props} config={vl} dataSourceIndex={i} />}
              </div>
            );
          })}
        </div>
      );
    } else {
      return (
        <React.Fragment>
          <DataSourceComp {...props} config={config} dataSourceIndex={undefined}>
            <div className='yl-comp-text-field row '>
              <div className='yl-comp-field-label'>数据接口</div>
              <div className='yl-comp-field-label right'>配置完成</div>
            </div>
          </DataSourceComp>
        </React.Fragment>
      );
    }
  }
}
