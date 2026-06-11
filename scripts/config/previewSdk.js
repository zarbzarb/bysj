import alias from '@rollup/plugin-alias';
//import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import path from 'path';
import postcss from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import builtins from 'rollup-plugin-node-builtins';
import _ from 'lodash';
import fs from 'fs';
import svgr from '@svgr/rollup';
import typescript from 'rollup-plugin-typescript2';

const selectorNamespace = require('postcss-selector-namespace');
const removeGlobal = require('postcss-remove-global-all');
import VersionConfig from '../../src/versionConfig';

//添加头部版本信息
const compiledLicense = _.template(fs.readFileSync(path.resolve(__dirname, '../config/license-header.txt'), 'utf8'));
const bannerData = {
  version: VersionConfig.sdkVersion,
};
const banner = compiledLicense(Object.assign({ includesVtt: true }, bannerData));

const externalDepend = [
  'lodash',
  'react',
  'antd',
  'react-dom',
  'react-router-dom',
  'mobx',
  'axios',
  'animejs',
  '@ant-design/icons',
  '@babel/runtime',
  'qs',
  'jquery',
  'uuid',
  'short-uuid',
  'shortid',
  'moment',
  // 'dayjs',
  'styled-components',
  '@babel/standalone',
  '@yl/datai-visual-component-library',
];

const getPlugins = function (opt = {}) {
  const { compress } = opt;
  return [
    svgr(),
    image(),
    alias({
      entries: [
        {
          find: '@',
          replacement: path.resolve(__dirname, '../../src'),
        },
        {
          find: 'Src',
          replacement: path.resolve(__dirname, '../../src'),
        },
        {
          find: '~@',
          replacement: path.resolve(__dirname, '../../src'),
        },
        {
          find: 'AntdLibs',
          replacement: path.resolve(__dirname, '../../src/components/AntdLibs'),
        },
        {
          find: 'Components',
          replacement: path.resolve(__dirname, '../../src/components'),
        },
        {
          find: 'Utils',
          replacement: path.resolve(__dirname, '../../src/utils'),
        },
      ],
    }),
    postcss({
      extract: 'datai-visual-sdk.css', // 提取出单独的文件
      use: {
        less: {
          javascriptEnabled: true,
        },
      },
      plugins: [
        selectorNamespace({
          namespace(css) {
            return '.datai-visual-sdk'; // 添加前缀
          },
        }),
        removeGlobal(), // 去掉:global
      ],
    }),
    // less({
    //   insert: true
    // }),
    commonjs({
      include: 'node_modules/**',
    }),
    resolve({
      preferBuiltins: true,
      extensions: ['.js', '.ts', '.tsx', '.json'],
    }),

    babel({
      babelHelpers: 'runtime',
      exclude: '**/node_modules/**',
    }),

    builtins(),
    compress &&
      terser({
        compress: {
          drop_console: true, // 去除console调试信息
        },
      }),
    typescript(),
    // 暂时不打类型声明文件
    // typescript({
    //   tsconfigOverride: {
    //     compilerOptions: { declaration: true },
    //   }
    // })
  ];
};

export default [
  {
    input: path.resolve(__dirname, '../../src/pages/Preview/index'),
    output: {
      file: 'sdk/index.js',
      inlineDynamicImports: true,
      format: 'esm',
      sourcemap: false,
      name: 'RenderEngine',
      banner,
    },
    plugins: getPlugins(),
    external: (id) => {
      for (const item of externalDepend) {
        if (id.includes(item)) {
          return true;
        }
      }
    },
  },
  // 目前用不到这个格式，先注释掉，影响打包速度
  // {
  //   input: path.resolve(__dirname, '../../src/pages/Preview/index'),
  //   output: {
  //     file: 'sdk/index.umd.min.js',
  //     inlineDynamicImports: true,
  //     format: 'umd',
  //     sourcemap: false,
  //     name: 'RenderEngine',
  //     banner,
  //   },
  //   plugins: getPlugins({ compress: true }),
  //   external: (id) => {
  //     for (const item of externalDepend) {
  //       if (id.includes(item)) {
  //         return true;
  //       }
  //     }
  //   },
  // },
];
