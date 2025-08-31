import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  react: true,
  isInEditor: false,
  unocss: true,
}).append({
  rules: {
    'no-console': 'warn',
    'unused-imports/no-unused-vars': 'warn',
  },
  ignores: ['/*/**/nodeData.ts'],
})
