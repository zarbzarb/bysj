import React, { Component } from 'react';
import classNames from 'classnames';
import DataRef from '@/components/AntdLibs/common/DataRef';
import { Row } from 'antd';

export default class index extends Component {
  render() {
    const { styles, el } = this.props;

    return (
      <div className={classNames(styles.demo)}>
        <Row className={styles.field}>{el.dataset && <DataRef {...this.props} />}</Row>
      </div>
    );
  }
}
