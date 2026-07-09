/** @type {import('jest').Config} */
module.exports = {
	extensionsToTreatAsEsm: ['.ts'],
	transformIgnorePatterns: [
		'/node_modules/(?!(mime|p-limit|yocto-queue)/)',
	],
	transform: {
		'^.+\\.(t|j)s?$': ['@swc/jest']
	},
	moduleFileExtensions: ['js', 'json', 'ts'],
	rootDir: 'src',
	testRegex: String.raw`.*\.spec\.ts$`,
	collectCoverageFrom: ['**/*.(t|j)s'],
	coverageDirectory: '../coverage',
	testEnvironment: 'node',
	moduleNameMapper: {
		// add ts-config path's here as regex
		'^@infra/(.*)$': '<rootDir>/infra/$1',
		'^@modules/(.*)$': '<rootDir>/modules/$1',
		'^@testing/(.*)$': '<rootDir>/testing/$1',
		'^@shared/(.*)$': '<rootDir>/shared/$1',
	},
	globalSetup: '<rootDir>/../scripts/testing/globalSetup.ts',
	globalTeardown: '<rootDir>/../scripts/testing/globalTeardown.ts',
};
