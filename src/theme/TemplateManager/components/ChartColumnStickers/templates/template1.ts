export default {
  name: '标签柱状图',
  thumbnail: 'assets/templates/chartColumnStickers_temp1.png',
  from: 'datai',
  attr: {
    barStyle: {
      barWidth: 6,
      showBackground: true,
      backgroundStyle: {
        color: '#242A37',
      },
    },
    series: [
      {
        abled: true,
        position: 'top',
        fontSize: 14,
        icon: './assets/datai/images/charts/stickersCenter_temp1.png',
        topStyles: {
          abled: true,
          imgUrl: './assets/datai/images/charts/stickersTop_temp1.png',
          imgWidth: 40,
          imgHeight: 38,
          offsetY: -24,
        },
        bottomStyles: {
          abled: false,
          imgUrl: '',
        },
      },
    ],
  },
};
