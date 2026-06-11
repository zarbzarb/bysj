import React, { useEffect, useRef, useState } from 'react';
import { SketchPicker } from 'react-color';
import s from './index.less';
import ColorBall from '../ColorBall';
import Icon, { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { ReactComponent as Conditions } from '@/assets/svg/conditions.svg';
import { ReactComponent as Infinite } from '@/assets/svg/infinite.svg';
import { Slider, Checkbox, Popover } from 'antd';

function HandlePickColor(props) {
  // v7.6.0 支持颜色回填
  const { gradientColor, onChange, disabled } = props;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const colorRef = useRef(gradientColor);
  colorRef.current = gradientColor;
  const key = useRef(1);
  const [isGradient, setIsGradient] = useState(gradientColor.isGradient);
  const [gradientAngle, setGradientAngle] = useState(180);
  const [active, setActive] = useState(1);
  const [visible, setVisible] = useState({
    ratio: false,
    angle: false,
  });
  const [colors, setColors] = useState([{ color: { hex: '#000000' }, key: key.current, ratio: 0 }]);
  // v7.6.0初始化回填数据
  useEffect(() => {
    // console.log('colorRef.current', colorRef.current);
    const { isGradient, gradient, color } = colorRef.current;
    setIsGradient(isGradient);
    if (isGradient) {
      const colorInfo = gradient.split('(')[1].split(')')[0].split(',');
      const [_angle, ..._colors] = colorInfo;
      setGradientAngle(parseFloat(_angle) || 180);
      const newColors = _colors.map((item) => {
        item = item.trim();
        const [c, r] = item.split(' ');
        return {
          color: {
            hex: c,
          },
          key: ++key.current,
          ratio: parseFloat(r) || 0,
        };
      });
      setActive(newColors[0].key);
      setColors(newColors);
    } else {
      const newColors = [
        {
          color: {
            hex: color,
          },
          key: ++key.current,
          ratio: 0,
        },
      ];
      setActive(newColors[0].key);
      setColors(newColors);
    }
  }, []);
  // v7.6.0支持渐变色和正常颜色
  useEffect(() => {
    const { gradient, color } = colorRef.current;
    if (isGradient) {
      const colorStr = colors.reduce((p, c) => [...p, `${c.color.hex} ${c.ratio}%`], []);
      const newGradient = `linear-gradient(${gradientAngle}deg, ${colorStr.join(', ')})`;
      onChangeRef.current({
        isGradient,
        gradient: newGradient,
        color,
      });
    } else {
      const newColor = colors[0].color.hex;
      onChangeRef.current({
        isGradient,
        gradient,
        color: newColor,
      });
    }
  }, [gradientAngle, isGradient, colors]);

  const { ratio, angle } = visible;
  // 颜色改变
  const onChangeColor = (v) => {
    const newC = colors.map((c) => {
      if (c.key === active) {
        c.color = v;
      }
      return c;
    });
    setColors(newC);
  };

  // 增加
  const onAdd = () => {
    if (!isGradient || colors.length === 5) return;
    if (colors.length === 5) return;
    let num = 100 / colors.length;
    key.current++;
    const newColors = colors.concat({
      color: {
        hex: '#F8E71C',
      },
      ratio: 0,
      key: key.current,
    });
    newColors.forEach((item, index, arr) => {
      return (arr[index].ratio = num * index);
    });
    setColors(newColors);
  };

  // 删除
  const onRemove = () => {
    if (colors.length === 1 || !isGradient) return;
    const newC = colors.filter((c) => c.key !== active);
    let num = 100 / (newC.length - 1);
    newC.forEach((item, index, arr) => {
      return (arr[index].ratio = num * index);
    });
    setColors(newC);
    setActive(newC[0].key);
  };

  // 切换渐变
  const onToggleGradient = (e) => {
    const v = e.target.checked;
    if (v === false) {
      setActive(colors[0].key);
    }
    setIsGradient(v);
  };

  // 禁止弹出tip
  const onVisibleChange = (v, key) => {
    if (!isGradient) return;
    setVisible((s) => ({
      ...s,
      [key]: v,
    }));
  };

  // 修改颜色比例
  const onChangeRatio = (v, key) => {
    let newColors = colors.map((item) => {
      if (item.key === key) {
        item.ratio = v;
      }
      return item;
    });
    setColors(newColors);
  };

  const currentColor = colors.find((c) => c.key === active);
  const disabledStyle = {
    cursor: !isGradient ? 'not-allowed' : '',
    color: !isGradient ? '#cccccc' : '',
  };
  return (
    <div className={s.pickColorWrap}>
      <SketchPicker color={currentColor.color} onChange={onChangeColor} />
      <div className={s.colorCardWrap}>
        {colors
          .filter((c, i) => {
            if (isGradient) {
              return true;
            }
            return i === 0;
          })
          .map((item) => (
            <ColorBall key={item.key} item={item} setActive={setActive} active={active} />
          ))}
      </div>
      <div className={s.handle}>
        <span title='是否渐变' className={s.checkboxWrap}>
          <Checkbox checked={isGradient} disabled={disabled} onChange={onToggleGradient} />
        </span>
        <PlusOutlined
          style={{
            cursor: colors.length === 3 ? 'not-allowed' : '',
            ...disabledStyle,
          }}
          onClick={onAdd}
          title='添加颜色'
        />
        <MinusOutlined
          onClick={onRemove}
          style={{
            ...disabledStyle,
            cursor: colors.length === 1 ? 'not-allowed' : '',
          }}
          title='删除颜色'
        />
        <Popover
          trigger={'click'}
          placement='top'
          getPopupContainer={() => document.body}
          overlayClassName={s.pop}
          visible={ratio}
          color='#fff'
          onVisibleChange={(v) => onVisibleChange(v, 'ratio')}
          title={null}
          content={
            <div className={s.adjustWrap}>
              <span>颜色比例</span>
              <div className={s.colorRatioWrap}>
                {colors.map((item) => (
                  <div className={s.colorRatioItemWrap} key={item.key}>
                    <ColorBall item={item} active={null} />
                    <Slider
                      getTooltipPopupContainer={() => document.querySelector(`.${s.pop}`)}
                      tipFormatter={(v) => `${v}%`}
                      value={item.ratio}
                      onChange={(v) => onChangeRatio(v, item.key)}
                    />
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <Icon component={Conditions} style={disabledStyle} title='颜色比例' />
        </Popover>
        <Popover
          trigger={'click'}
          placement='top'
          getPopupContainer={() => document.body}
          overlayClassName={s.pop_2}
          color='#fff'
          visible={angle}
          onVisibleChange={(v) => onVisibleChange(v, 'angle')}
          title={null}
          content={
            <div className={s.adjustWrap}>
              <span>渐变角度</span>
              <Slider
                min={0}
                max={360}
                marks={{
                  0: '0°',
                  90: '90°',
                  180: '180°',
                  270: '270°',
                  360: '360°',
                }}
                getTooltipPopupContainer={() => document.querySelector(`.${s.pop_2}`)}
                value={gradientAngle}
                onChange={(v) => setGradientAngle(v)}
                tipFormatter={(v) => `${v} °`}
                defaultValue={0}
              />
            </div>
          }
        >
          <Icon style={disabledStyle} component={Infinite} title='调整角度' />
        </Popover>
      </div>
    </div>
  );
}

export default HandlePickColor;
