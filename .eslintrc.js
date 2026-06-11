const OFF = 0;
const WARN = 1;
const ERROR = 2;

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:unicorn/recommended',
    'plugin:promise/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      impliedStrict: true,
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'unicorn', 'promise', '@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.tsx', '.ts', '.js', '.json', '.less'],
      },
      typescript: {},
    },
  },
  rules: {
    'import/extensions': [
      ERROR,
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
      },
    ],
    'import/no-extraneous-dependencies': [ERROR, { devDependencies: true }],
    'import/prefer-default-export': OFF,
    'import/no-unresolved': [
      ERROR,
      {
        ignore: ['^./'], // @ 是设置的路径别名
      },
    ],
    'import/no-dynamic-require': OFF,

    'unicorn/better-regex': ERROR,
    'unicorn/prevent-abbreviations': OFF,
    'unicorn/filename-case': [
      ERROR,
      {
        cases: {
          // 中划线
          kebabCase: true,
          // 小驼峰
          camelCase: true,
          // 下划线
          snakeCase: false,
          // 大驼峰
          pascalCase: true,
        },
      },
    ],
    'unicorn/no-array-instanceof': WARN,
    'unicorn/no-for-loop': WARN,
    'unicorn/prefer-add-event-listener': [
      ERROR,
      {
        excludedPackages: ['koa', 'sax'],
      },
    ],
    'unicorn/prefer-query-selector': ERROR,
    'unicorn/no-null': OFF,
    'unicorn/no-array-reduce': OFF,
    'unicorn/no-process-exit': OFF,
    'unicorn/consistent-func': OFF,
    'unicorn/consistent-destructuring': OFF,
    'unicorn/consistent-function-scoping': WARN,
    'unicorn/no-array-for-each': OFF,
    'unicorn/prefer-module': OFF,
    'unicorn/prefer-spread': OFF,
    'unicorn/prefer-logical-operator-over-ternary': OFF,
    'unicorn/numeric-separators-style': OFF,

    '@typescript-eslint/no-useless-constructor': ERROR,
    '@typescript-eslint/no-empty-function': WARN,
    '@typescript-eslint/no-var-requires': OFF,
    '@typescript-eslint/explicit-function-return-type': OFF,
    '@typescript-eslint/explicit-module-boundary-types': OFF,
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/no-use-before-define': ERROR,
    '@typescript-eslint/no-unused-vars': WARN,
    'no-unused-vars': OFF,

    'react/jsx-filename-extension': [ERROR, { extensions: ['.tsx', 'ts', '.jsx', 'js'] }],

    'react/jsx-one-expression-per-line': OFF,
    'react/destructuring-assignment': OFF,
    'react/state-in-constructor': OFF,
    'react/jsx-props-no-spreading': OFF,
    'react/prop-types': OFF,
    'react/display-name': OFF,
    'react/require-default-props': OFF,
    'react/no-array-index-key': OFF,

    'react/jsx-indent': OFF,

    'react-hooks/rules-of-hooks': ERROR, // 检查 Hook 的规则
    'react-hooks/exhaustive-deps': WARN, // 检查 effect 的依赖
    'react/prefer-stateless-function': WARN,
    'react/static-property-placement': OFF,
    'react/no-unknown-property': OFF,
    'react/jsx-boolean-value': OFF,

    'jsx-a11y/click-events-have-key-events': OFF,
    'jsx-a11y/no-noninteractive-element-interactions': OFF,
    'jsx-a11y/no-static-element-interactions': OFF,
    'jsx-a11y/anchor-is-valid': OFF,
    'jsx-a11y/label-has-associated-control': OFF,

    'lines-between-class-members': [ERROR, 'always'],
    // indent: [ERROR, 2, { SwitchCase: 1 }],
    'linebreak-style': [OFF, 'unix'],
    // 'linebreak-style': [0, 'error', 'windows'],
    quotes: [ERROR, 'single'],
    semi: [ERROR, 'always'],
    'no-unused-expressions': WARN,
    'no-plusplus': OFF,
    'no-console': OFF,

    'jsx-quotes': [ERROR, 'prefer-single'],
    'global-require': OFF,
    'no-use-before-define': OFF,
    'no-restricted-syntax': OFF,
    'no-continue': OFF,
    'no-param-reassign': OFF, // 禁止对函数参数再赋值
    'no-shadow': OFF,
    '@typescript-eslint/no-shadow': ERROR,
    'no-useless-return': OFF,
    'promise/always-return': OFF,
    'promise/catch-or-return': OFF,
    radix: OFF,
    'consistent-return': WARN, // 异步函数中不允许return
    'no-underscore-dangle': OFF, // 标识符不能以_开头或结尾
    'prefer-destructuring': WARN, // 数组不允许索引取值赋值
    'no-useless-escape': OFF,
    'no-new-func': OFF,
    'no-template-curly-in-string': OFF,
    'one-var': OFF,
    'class-methods-use-this': OFF,
    'no-return-assign': OFF,
    'unicorn/prefer-ternary': OFF,
  },
};
