export default class BasicTemplate {
  templates = {};

  init() {
    const templates = {};
    const path = `../${this.constructor.name}/templates`;
    const contexts = require.context(path, false, /\.ts/);
    contexts.keys().forEach((key) => {
      let name = /\.\/(\S+).ts$/g.exec(key)[1];
      name = name.charAt(0).toUpperCase() + name.slice(1);
      templates[name] = contexts(key).default;
    });

    this.templates = templates;
  }
}
