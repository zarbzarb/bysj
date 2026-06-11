const scanner = require('sonarqube-scanner');

scanner(
  {
    // 连接的服务器地址
    serverUrl: 'http://172.30.1.123:9118',
    token: '',
    options: {
      // 生成检查结果的项目名称
      'sonar.projectName': 'smart-visual-fe',
      // 生成检查结果的项目描述
      'sonar.projectDescription': 'smart-visual-fe代码扫描',
      // 需要检查的代码目录路径（多个可用逗号分隔）
      'sonar.sources': 'src',
      'sonar.tests': '',
      'sonar.login': 'kongque',
      'sonar.password': 'yunli@123',
    },
  },
  () => process.exit(),
);
