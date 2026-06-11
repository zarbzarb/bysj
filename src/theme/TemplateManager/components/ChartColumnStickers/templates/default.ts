export default {
  name: '默认样式',
  thumbnail: 'assets/templates/chartColumnStickers_default.png',
  from: 'datai',
  attr: {
    barStyle: {
      barWidth: 12,
      showBackground: false,
      backgroundStyle: {
        color: '#101721',
      },
    },
    series: [
      {
        abled: false,
        position: 'inside',
        fontSize: 12,
        icon: './assets/datai/images/charts/stickersCenter.png',
        topStyles: {
          abled: false,
          imgUrl: '',
          imgWidth: 18,
          imgHeight: 18,
          offsetY: 0,
        },
        bottomStyles: {
          abled: true,
          imgUrl: './assets/datai/images/charts/stickersBottom.png',
        },
      },
    ],
  },
};
