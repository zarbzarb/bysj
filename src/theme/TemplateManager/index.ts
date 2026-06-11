/**
 * echarts 图表模版(根据组件 englishName 和 模版名称 获取对应配置)
 */

import { chartCompTemplatesMap } from '@/staticJson/CompTemplates';
import { TemplateType } from './type';

class TemplateManager {
  templates = {};

  /**
   * 根据组件的分类和组件的类型注册组件模板
   * @param comType 组件类型
   */
  async registryTemplateWithComType(
    comType: keyof typeof chartCompTemplatesMap,
  ): Promise<Record<string, TemplateType>> {
    if (this.templates[comType]) return this.templates[comType];

    const module = await import(`./components/${comType}`);

    this.templates[comType] = module.default?.templates;
    return this.templates[comType];
  }

  /**
   * 根据模版key和组件类型返回该组件的模版
   * @param templateKey 模版key
   * @param comType 组件类型
   * @returns 模版
   */
  templateAttr(templateKey: string, comType: keyof typeof chartCompTemplatesMap): TemplateType | null {
    return this.templates?.[comType]?.[templateKey] ?? null;
  }
}

export default new TemplateManager();
