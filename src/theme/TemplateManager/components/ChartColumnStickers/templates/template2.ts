export default {
  name: '方形柱状图',
  thumbnail: 'assets/templates/chartColumnStickers_temp2.png',
  from: 'datai',
  attr: {
    barStyle: {
      barWidth: 20,
      showBackground: false,
      backgroundStyle: {
        color: '#242A37',
      },
    },
    series: [
      {
        abled: false,
        position: 'top',
        fontSize: 14,
        icon: './assets/datai/images/charts/stickersCenter_temp2.png',
        topStyles: {
          abled: true,
          imgUrl: './assets/datai/images/charts/stickersTop_temp2.png',
          imgWidth: 20,
          imgHeight: 14,
          offsetY: -7,
        },
        bottomStyles: {
          abled: true,
          imgUrl: './assets/datai/images/charts/stickersBottom_temp2.png',
          imgWidth: 30,
          imgHeight: 16,
          offsetX: 0.5,
          offsetY: 8,
        },
      },
    ],
  },
};
