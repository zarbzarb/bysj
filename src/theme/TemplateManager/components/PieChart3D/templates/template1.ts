import { TemplateType } from '@/theme/TemplateManager/type';

export default {
  name: '3D环形图',
  thumbnail: 'assets/templates/RoundChart3D.png',
  from: 'antd',
  attr: {
    props: {
      viewPort: {
        xRotation: -60,
        yRotation: 37,
      },

      pieStyle: {
        radiusInner: 27,
        radius: 50,
      },

      light: {
        mainLightColor: '#ffffff',
        mainLightRadiation: 16,
        mainLightRotation: {
          xRotation: -78,
          yRotation: 78,
        },
        ambientLightColor: '#ffffff',
        ambientLightRadiation: 28,
        isUseShadowMapping: false,
      },

      legend: {
        isShow: true,
        sort: 'default',
        layout: 'vertical',
        columnsNumber: 1,
        rowSpacing: 15,
        columnSpacing: 10,
        offset: [290, 77],
        alignWay: 'following',
        iconShape: 'rect',
        iconWidth: 12,
        iconHeight: 5,
        category: {
          isShow: true,
          colorExtends: false,
          offset: [0, 0],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 14,
            fontWeight: 'normal',
            color: 'rgba(196, 196, 196, 1)',
          },
          overflow: 'ellipsis',
          width: 20,
          maxWidth: 50,
          lineHeight: 1,
        },
        nature: {
          suffix: {
            isShow: false,
            content: '',
            paddingLeft: 10,
            font: {
              fontFamily: 'Microsoft Yahei',
              fontSize: 14,
              fontWeight: 'normal',
              color: '#ffffff',
            },
          },
          isShow: false,
          colorExtends: true,
          offset: [0, 0],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#ffffff',
          },
          overflow: 'ellipsis',
          width: 20,
          maxWidth: 50,
          lineHeight: 1,
        },
        proportion: {
          isShow: true,
          colorExtends: false,
          offset: [0, 0],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 14,
            fontWeight: 'normal',
            color: '#ffffff',
          },
          overflow: 'ellipsis',
          width: 20,
          maxWidth: 50,
          lineHeight: 1,
          decimalPlaces: 0,
        },
      },

      centerLabel: {
        isShow: true,
        category: {
          isShow: true,
          colorExtends: false,
          offset: [0, 0],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 14,
            fontWeight: 'lighter',
            color: '#ffffff',
          },
          overflow: 'wrap',
          width: 20,
          maxWidth: 200,
          lineHeight: 2,
        },
        nature: {
          suffix: {
            isShow: false,
            content: '',
            paddingLeft: 10,
            font: {
              fontFamily: 'Microsoft Yahei',
              fontSize: 14,
              fontWeight: 'normal',
              color: '#ffffff',
            },
          },
          isShow: true,
          colorExtends: false,
          offset: [0, -25],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 27,
            fontWeight: 'normal',
            color: '#ffffff',
          },
          overflow: 'ellipsis',
          width: 20,
          maxWidth: 200,
          lineHeight: 20,
        },
        proportion: {
          isShow: false,
          colorExtends: false,
          offset: [0, -25],
          font: {
            fontFamily: 'Microsoft Yahei',
            fontSize: 30,
            fontWeight: 'normal',
            color: '#ffffff',
          },
          overflow: 'ellipsis',
          width: 20,
          maxWidth: 200,
          lineHeight: 20,
          decimalPlaces: 0,
        },
      },

      animation: {
        carousel: {
          isPauseWhenHover: true,
          isShowTooltip: false,
          isShowCenterLabel: true,
        },
      },
    },
  },
} as const satisfies TemplateType;
