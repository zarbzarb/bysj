import React from 'react';
import { InputNumber } from 'antd';
import styles from './index.less';

interface IProps {
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  width: number;
  height: number;
}

const SizeInput = (props: IProps) => {
  const { onWidthChange, onHeightChange, width, height } = props;

  const handleWidthChange = (value: number | undefined) => {
    if (value !== undefined) {
      onWidthChange(value as number);
    }
  };

  const handleHeightChange = (value: number | undefined) => {
    if (value !== undefined) {
      onHeightChange(value as number);
    }
  };
  return (
    <div className={styles.sizeInputContainer}>
      <div className={styles.inputContainer} style={{ marginRight: 12 }}>
        <InputNumber step={1} className={styles.inputNumber} value={width} onChange={handleWidthChange} />
      </div>
      <div className={styles.inputContainer}>
        <InputNumber step={1} className={styles.inputNumber} value={height} onChange={handleHeightChange} />
      </div>
    </div>
  );
};

export default SizeInput;
