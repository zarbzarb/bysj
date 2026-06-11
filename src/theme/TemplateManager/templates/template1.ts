export default {
  line: {
    lineStyle: {
      type: 'solid',
      width: 2,
    },
    label: {
      show: false,
      position: [0, 0],
    },
    symbolSize: 8,
    symbol: 'circle',
    smooth: false,
  },
  bar: {
    barStyle: {
      barFillType: 'Pattern', // 图案
      patternType: 'DiagonalLine', // 斜线
      dashX: 3, // 尺寸
      dashY: 2, // 间距
      patternColor: 'rgba(0, 0, 0, 0.3)', // 填充色
      rotation: -60, // 图案角度
    },
  },
  pie: {
    itemStyle: {
      borderWidth: 0,
      borderColor: '#ccc',
    },
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#eeeeee',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#eeeeee',
      },
    },
    axisLabel: {
      show: true,
      color: '#eeeeee',
    },
    splitLine: {
      show: false,
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#eeeeee'],
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#eeeeee',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#eeeeee',
      },
    },
    axisLabel: {
      show: true,
      color: '#eeeeee',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#aaaaaa'],
      },
    },
    splitArea: {
      show: false,
      areaStyle: {
        color: ['#eeeeee'],
      },
    },
  },
  legend: {
    show: true,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: {
      fontSize: 14,
    },
  },
  tooltip: {
    axisPointer: {
      lineStyle: {
        color: '#eeeeee',
        width: '1',
      },
      crossStyle: {
        color: '#eeeeee',
        width: '1',
      },
    },
  },
};
