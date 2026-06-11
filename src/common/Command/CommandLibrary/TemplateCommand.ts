import { cloneDeep } from 'lodash';
import updateCompMergeWithTemplate from '@/utils/updateCompMergeWithTemplate';
import Command from './BaseCommand';

export default class TemplateCommand extends Command {
  el: any;

  templateKey: string;

  undoValue: any;

  undoTemplateKey: string;

  constructor(el: any, templateKey: string) {
    super();

    this.el = el;

    this.templateKey = templateKey;

    this.undoValue =
      el.classType === 'com'
        ? {
            ...el,
            classType: 'com',
            templateKey: el.templateKey,
            instance: { ...el.instance, compAttr: cloneDeep(el.instance.compAttr) },
          }
        : cloneDeep(el);

    this.undoTemplateKey = el.templateKey;
  }

  static cmdType = 'TemplateCommand';

  execute() {
    this.el.templateKey = this.templateKey;
    updateCompMergeWithTemplate(this.el);
  }

  undo() {
    this.el.templateKey = this.undoTemplateKey;
    updateCompMergeWithTemplate(this.el, this.undoValue);
  }
}
