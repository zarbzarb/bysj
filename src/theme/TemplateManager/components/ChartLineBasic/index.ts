class ChartLineBasic {
  templates = {};

  constructor() {
    this.init();
  }

  init() {
    const templates = {};
    const contexts = require.context('./templates', false, /\.ts/);
    contexts.keys().forEach((key) => {
      let name = /\.\/(\S+).ts$/g.exec(key)[1];
      name = name.charAt(0).toUpperCase() + name.slice(1);
      templates[name] = contexts(key).default;
    });

    this.templates = templates;
  }
}

export default new ChartLineBasic();
