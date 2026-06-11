const { merge } = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const os = require('node:os');
const common = require('./webpack.common.js');
const paths = require('../paths');
const { shouldOpenAnalyzer, ANALYZER_HOST, ANALYZER_PORT } = require('../conf');

const threads = os.cpus().length;

/** @type {import('webpack').Configuration} */
module.exports = merge(common, {
  mode: 'production',
  devtool: false, // 'eval-cheap-source-map',
  target: 'browserslist',
  output: {
    filename: 'static/js/[name].[contenthash:8].chunk.js',
    path: paths.appBuild,
    publicPath: paths.publicPath,
    assetModuleFilename: 'static/images/[name].[contenthash:8].[ext]',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
      ignoreOrder: true,
    }),
    shouldOpenAnalyzer &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        analyzerHost: ANALYZER_HOST,
        analyzerPort: ANALYZER_PORT,
      }),
  ].filter(Boolean),
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        test: /\.chunk\.js(\?.*)?$/i,
        extractComments: false,
        terserOptions: {
          output: {
            // 是否输出可读性较强的代码，即会保留空格和制表符，默认为输出，为了达到更好的压缩效果，可以设置为false
            beautify: false,
            // 是否保留代码中的注释，默认为保留，为了达到更好的压缩效果，可以设置为false
            comments: false,
          },
          compress: {
            // 是否在UglifyJS删除没有用到的代码时输出警告信息，默认为输出，可以设置为false关闭这些作用不大的警告
            warnings: false,
            drop_debugger: true,
            pure_funcs: ['console.log'], // 移除console
          },
        },
        exclude: /\/public/,
        parallel: threads, // 开启多进程
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      // chunks: 'all',
      chunks(chunk) {
        // exclude 排除预览页面
        return chunk.name !== 'pre';
      },
      // 缓存分组
      cacheGroups: {
        // 第三方模块
        vendor: {
          name: 'vendor', // chunk名称
          test: /[\\/]node_modules[\\/]/, // 设置命中目录规则
          priority: 1, // 优先级，数值越大，优先级越高
          minSize: 0, // 小于这个大小的文件，不分割
          minChunks: 1, // 最少复用几次，这里意思是只要用过一次就分割出来
          chunks: 'initial',
        },
        // 公共模块
        common: {
          name: 'common',
          priority: 0,
          minSize: 0,
          minChunks: 2, // 只要引用过2次，就分割成公共代码
        },
        monaco: {
          name: 'monaco-editor',
          priority: 22,
          test: /[/\\]node_modules[/\\]monaco-editor[/\\]/,
          enforce: true,
          reuseExistingChunk: true,
        },
        dataiVisualComponentLibrary: {
          name: 'component-library',
          priority: 20,
          test: /[/\\]node_modules[/\\]@yl[/\\]datai-visual-component-library[/\\]/,
          enforce: true,
          reuseExistingChunk: true,
        },
        dui: {
          name: 'datai-ui',
          priority: 20,
          test: /[\\/]node_modules[\\/]@yl[\\/]datai-ui[\\/]/,
          enforce: true,
          reuseExistingChunk: true,
        },
      },
    },
  },
});
