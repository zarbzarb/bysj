const { IgnorePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackBar = require('webpackbar');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const paths = require('../paths');
const { isDevelopment, isProduction } = require('../env');
const { imageInlineSizeLimit } = require('../conf');

// 多入口配置
const entryConfigs = [
  {
    template: paths.appHtml,
    chunk: 'index',
  },
  {
    template: paths.preHtml,
    chunk: 'pre',
  },
  {
    template: paths.hookHtml,
    chunk: 'hook',
  },
  {
    template: paths.mobileHtml,
    chunk: 'mobile',
  },
  {
    template: paths.testHtml,
    chunk: 'test',
  },
];

// 生成多入口HtmlWebpackPlugin配置
const generateHtmlWebpackPlugins = (entrys) =>
  entrys.map((entry) => {
    return new HtmlWebpackPlugin({
      template: entry.template,
      filename: `${entry.chunk}.html`,
      cache: true,
      templateParameters: {
        publicPath: paths.publicPath,
      },
      chunks: [entry.chunk],
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    });
  });

const getCssLoaders = (importLoaders, noModules) => [
  isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
  {
    loader: 'css-loader',
    options: {
      modules: noModules ? false : { localIdentName: '[local]_[hash:base64:5]' },
      sourceMap: isDevelopment,
      importLoaders,
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      postcssOptions: {
        plugins: [
          require('postcss-flexbugs-fixes'),
          isProduction && [
            'postcss-preset-env',
            {
              autoprefixer: {
                grid: true,
                flexbox: 'no-2009',
              },
              stage: 3,
            },
          ],
        ].filter(Boolean),
      },
    },
  },
];

module.exports = {
  entry: {
    index: paths.appIndex,
    pre: paths.preEntry,
    hook: paths.hookEntry,
    mobile: paths.mobileEntry,
    test: paths.testEntry,
  },
  /** 通过 npm link 调试组件库时，需把 cache 关闭, snapshot 开启，开启后 node_modules 文件变化了可热更新 */
  // cache: {
  //   type: 'filesystem',
  //   buildDependencies: {
  //     config: [__filename],
  //   },
  // },
  snapshot: {
    managedPaths: [],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
    alias: {
      '@': paths.appSrc,
      Src: paths.appSrc,
      Components: paths.appSrcComponents,
      Utils: paths.appSrcUtils,
    },
    symlinks: false, // npm link 用到
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    // jquery: 'jQuery',
    // moment: 'moment',
    // antd: 'antd',
    // lodash: '_',
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|js)$/,
        loader: 'babel-loader',
        options: { cacheDirectory: true },
        include: [paths.appSrc],
        exclude: [/node_modules/, /public/],
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/, /public/],
        use: getCssLoaders(1),
      },
      {
        test: /\.css$/,
        include: /node_modules/,
        use: getCssLoaders(1, true),
      },
      {
        test: /\.less$/,
        use: [
          ...getCssLoaders(2),
          {
            loader: 'less-loader',
            options: {
              sourceMap: isDevelopment,
              lessOptions: { javascriptEnabled: true },
            },
          },
        ],
      },
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: imageInlineSizeLimit,
          },
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2?)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    ...generateHtmlWebpackPlugins(entryConfigs),
    new CopyPlugin({
      patterns: [
        {
          from: paths.appPublic,
          to: paths.appBuild,
          toType: 'dir',
          globOptions: {
            dot: true,
            gitignore: false,
            ignore: ['**/index.html', '**/pre.html', '**/hook.html', '**/mobile.html', '**/test.html'],
          },
        },
      ],
    }),
    new WebpackBar({
      name: isDevelopment ? 'RUNNING' : 'BUNDLING',
      color: isDevelopment ? '#52c41a' : '#722ed1',
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: paths.appTsConfig,
        memoryLimit: 7500, // 增大构建内存
      },
    }),
    new MonacoWebpackPlugin({
      languages: ['json', 'javascript', 'typescript'],
    }),
    // 忽略moment中的语言包
    new IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
  ],
};
