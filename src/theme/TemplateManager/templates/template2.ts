export default {
  line: {
    lineStyle: {
      type: 'dashed',
      width: 2,
    },
    label: {
      show: false,
      position: [0, -15],
    },
    symbolSize: 8,
    symbol: 'circle',
    smooth: false,
  },
  bar: {
    barStyle: {
      barFillType: 'Grid', // 栅格
      gridX: 2, // 栅格尺寸
      gridY: 2, // 栅格间距
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
      show: true,
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
    icon: 'triangle', // 三角形
    itemWidth: 10,
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
