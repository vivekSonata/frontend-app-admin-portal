// eslint-disable-next-line import/no-extraneous-dependencies
const { createConfig } = require('@openedx/frontend-build');

const config = createConfig('jest', {
  setupFiles: [
    '<rootDir>/src/setupTest.js',
  ],
});
config.transformIgnorePatterns = [
  'node_modules/(?!(lodash-es|@(open)?edx|@2uinc/frontend-enterprise-logistration|@2uinc/frontend-enterprise-utils|@2uinc/frontend-enterprise-hotjar|@2uinc/frontend-enterprise-catalog-search)/)',
];


module.exports = config;
