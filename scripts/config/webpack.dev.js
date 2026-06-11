const Webpack = require('webpack');
// const ErrorOverlayPlugin = require('error-overlay-webpack-plugin'); //不支持webpack5
const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const paths = require('../paths');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  target: 'web',
  output: {
    filename: 'js/[name].js',
    path: paths.appBuild,
    publicPath: paths.publicPath,
  },
  devServer: {
    compress: true,
    stats: 'errors-only',
    clientLogLevel: 'silent',
    open: true,
    hot: true,
    noInfo: true,
    proxy: {
      ...require(paths.appProxySetup),
    },
    historyApiFallback: {
      verbose: true,
      rewrites: [
        { from: /^\/dashboard/, to: '/index.html' },
        { from: /^\/platform/, to: '/index.html' },
        { from: /^\/login/, to: '/index.html' },
        { from: /^\/register/, to: '/index.html' },
        { from: /^\/editor\/.*$/, to: '/index.html' },
        { from: /^\/preview\/.*$/, to: '/pre.html' },
        { from: /^\/hook\/.*$/, to: '/hook.html' },
        { from: /^\/config\/.*$/, to: '/index.html' },
      ],
    },
  },
  plugins: [new Webpack.HotModuleReplacementPlugin()],
  optimization: {
    minimize: false,
    minimizer: [],
    splitChunks: {
      chunks: 'all',
      minSize: 0,
    },
  },
});
