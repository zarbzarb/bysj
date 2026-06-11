import React, { Component, Fragment } from 'react';
import { Col, Row, Input, Select, Collapse, Tooltip } from 'antd';
import { inject, observer } from 'mobx-react';
import { getImageUrl } from '@/utils/utils';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Panel } = Collapse;

// 上传图片导致面板收起问题时，设置changeImageFlag为false

@inject('ossStore')
@observer
export default class index extends Component {
  state = { isShow: 'none', file: '', imagePreviewUrl: '' };

  handleImageChange = (e) => {
    const {
      field,
      updateField,
      ossStore: { uploadImage },
      handleImageChangeCallback,
    } = this.props;

    const file = e.target.files[0];

    uploadImage(file, this.props, field);

    if (handleImageChangeCallback) handleImageChangeCallback();

    e.preventDefault();
  };

  uploadClick = () => {
    const {
      field,
      updateField,
      ossStore: { showImage },
      uploadClickCallback,
    } = this.props;
    showImage(true, this.props, { path: '' }, field);
    uploadClickCallback && uploadClickCallback();
  };

  uploadClick2 = () => {};

  deleteImg = (e) => {
    const { field, updateField } = this.props;
    updateField(field, '');
    e.stopPropagation();
  };

  onMouseEnter = () => {
    const { value } = this.props;
    if (value) {
      this.setState(
        {
          isShow: 'flex',
        },
        () => {
          console.log(this.state.isShow);
        },
      );
    } else {
      this.setState({
        isShow: 'none',
      });
    }
  };

  onMouseLeave = () => {
    this.setState({
      isShow: 'none',
    });
  };

  render() {
    const { label, field, value, styles, updateField } = this.props;
    const fileUploadId = `avatarFor_${field}`;
    const fileLocalUploadId = `avatarFor_local_${field}`;

    // 支持多级目录部署
    const imgUrl = getImageUrl(value);

    return (
      <>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel}>
            {label}
          </Col>
          <Col flex='206px' className={styles.fieldInput}>
            <Input
              value={value}
              onChange={(evt) => {
                updateField(field, evt.target.value);
              }}
            />
          </Col>
        </Row>
        <Row className={styles.field}>
          <Col flex='auto' className={styles.fieldLabel} />
          <Col flex='206px' className={styles.fieldInput}>
            <div
              style={{
                width: '192px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                margintop: '3px',
                background: '#1d2126',
                border: '1px solid #000',
                fontSize: '14px',
                color: '#fff',
              }}
              // onClick={this.uploadClick}
              onMouseEnter={this.onMouseEnter}
              onMouseLeave={this.onMouseLeave}
            >
              {value ? (
                <img
                  src={imgUrl}
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain',
                  }}
                  alt='uploads'
                />
              ) : (
                <div
                  className='mask'
                  style={{
                    zIndex: '100',
                    background: 'rgba(48,54,64,.7)',
                    display: 'flex',
                    width: '192px',
                    height: '120px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                  }}
                >
                  <a
                    onClick={this.uploadClick}
                    style={{
                      textAlign: 'right',
                      marginRight: '10px',
                      cursor: 'pointer',
                      color: '#0099ff',
                    }}
                  >
                    引用(图片库){' '}
                  </a>
                  <div>
                    <input
                      id={fileUploadId}
                      style={{ display: 'none' }}
                      type='file'
                      onChange={this.handleImageChange}
                    />
                    <label
                      style={{
                        cursor: 'pointer',
                        color: '#0099ff',
                      }}
                      htmlFor={fileUploadId}
                    >
                      上传(本地){' '}
                    </label>
                  </div>
                </div>
              )}
              {value ? (
                <div
                  className='mask'
                  style={{
                    zIndex: '100',
                    background: 'rgba(48,54,64,.7)',
                    display: this.state.isShow,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    width: '192px',
                    height: '120px',
                    alignItems: 'center',
                    position: 'absolute',
                  }}
                >
                  <div style={{ marginBottom: '10px' }}>
                    <a
                      onClick={this.uploadClick}
                      style={{
                        textAlign: 'right',
                        flex: '1',
                        marginRight: '10px',
                        cursor: 'pointer',
                        color: '#0099ff',
                      }}
                    >
                      更改(图片库)
                    </a>
                    <a
                      onClick={this.deleteImg}
                      style={{
                        flex: '1',
                        marginRight: '10px',
                        cursor: 'pointer',
                        color: '#0099ff',
                      }}
                    >
                      删除
                    </a>
                  </div>

                  <div>
                    <input
                      id={fileLocalUploadId}
                      style={{ display: 'none' }}
                      type='file'
                      onChange={this.handleImageChange}
                    />
                    <label
                      style={{
                        cursor: 'pointer',
                        color: '#0099ff',
                      }}
                      htmlFor={fileLocalUploadId}
                    >
                      更改(本地)
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </Col>
        </Row>
      </>
    );
  }
}
