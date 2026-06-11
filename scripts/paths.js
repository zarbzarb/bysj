const path = require('path');
const fs = require('fs');

// Get the working directory of the file executed by node
const appDirectory = fs.realpathSync(process.cwd());

/**
 * Resolve absolute path from relative path
 * @param {string} relativePath relative path
 */
function resolveApp(relativePath) {
  return path.resolve(appDirectory, relativePath);
}

// Default module extension
const moduleFileExtensions = ['ts', 'tsx', 'js', 'jsx'];

/**
 * Resolve module path
 * @param {function} resolveFn resolve function
 * @param {string} filePath file path
 */
function resolveModule(resolveFn, filePath) {
  // Check if the file exists
  const extension = moduleFileExtensions.find((ex) => fs.existsSync(resolveFn(`${filePath}.${ex}`)));

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }
  return resolveFn(`${filePath}.ts`); // default is .ts
}

module.exports = {
  publicPath: process.env.NODE_ENV === 'development' ? '/' : '/visual-console/',
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  testEntry: resolveModule(resolveApp, 'src/test/index'), // 预览页面入口
  testHtml: resolveApp('public/test.html'),
  mobileEntry: resolveModule(resolveApp, 'src/mobileApp'), // 移动端入口
  mobileHtml: resolveApp('public/mobile.html'),
  preEntry: resolveModule(resolveApp, 'src/previewApp'), // 预览页面入口
  preHtml: resolveApp('public/pre.html'),
  hookEntry: resolveModule(resolveApp, 'src/hookApp'), // hook页面入口
  hookHtml: resolveApp('public/hook.html'),
  appIndex: resolveModule(resolveApp, 'src/index'), // Package entry path
  appHtml: resolveApp('public/index.html'),
  appNodeModules: resolveApp('node_modules'), // node_modules path
  appSrc: resolveApp('src'),
  appSrcComponents: resolveApp('src/components'),
  appSrcUtils: resolveApp('src/utils'),
  appProxySetup: resolveModule(resolveApp, 'src/setProxy'),
  appPackageJson: resolveApp('package.json'),
  appTsConfig: resolveApp('tsconfig.json'),
  moduleFileExtensions,
};
