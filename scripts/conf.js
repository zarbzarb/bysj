const path = require('path');

const PROJECT_PATH = path.resolve(__dirname, '../');
const PROJECT_NAME = path.parse(PROJECT_PATH).name;

// Dev server host and port
const SERVER_HOST = '0.0.0.0';
const SERVER_PORT = 8888;
const PAGE_TYPE = 'page';
const PAGE_ID = 'screen_1774937682642';

// Whether to enable bundle package analysis
const shouldOpenAnalyzer = false;
const ANALYZER_HOST = 'localhost';
const ANALYZER_PORT = 9527;

// Resource size limit
const imageInlineSizeLimit = 4 * 1024;

module.exports = {
  PROJECT_PATH,
  PROJECT_NAME,
  SERVER_HOST,
  SERVER_PORT,
  shouldOpenAnalyzer,
  ANALYZER_HOST,
  ANALYZER_PORT,
  imageInlineSizeLimit,
  PAGE_TYPE,
  PAGE_ID,
};
