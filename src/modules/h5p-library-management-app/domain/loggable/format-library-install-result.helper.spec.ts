import { ILibraryInstallResultTestFactory } from '@modules/h5p-core/testing';
import { formatLibraryInstallResult, formatLibraryInstallResults } from './format-library-install-result.helper';

describe('formatLibraryInstallResult', () => {
	describe('when type is new', () => {
		const setup = () => {
			const newVersion = {
				machineName: 'H5P.Test',
				majorVersion: 1,
				minorVersion: 2,
				patchVersion: 3,
			};
			const lib = ILibraryInstallResultTestFactory.create('new', newVersion);

			return { lib, newVersion };
		};

		it('should return formatted new library string', () => {
			const { lib } = setup();

			const result = formatLibraryInstallResult(lib);

			expect(result).toBe('H5P.Test-1.2.3');
		});
	});

	describe('when type is patch', () => {
		const setup = () => {
			const oldVersion = {
				machineName: 'H5P.Test',
				majorVersion: 1,
				minorVersion: 2,
				patchVersion: 3,
			};
			const newVersion = {
				machineName: 'H5P.Test',
				majorVersion: 1,
				minorVersion: 2,
				patchVersion: 4,
			};
			const lib = ILibraryInstallResultTestFactory.create('patch', newVersion, oldVersion);

			return { lib, oldVersion, newVersion };
		};

		it('should return formatted patch library string with arrow', () => {
			const { lib } = setup();

			const result = formatLibraryInstallResult(lib);

			expect(result).toBe('H5P.Test-1.2.3 -> H5P.Test-1.2.4');
		});
	});

	describe('when type is none', () => {
		const setup = () => {
			const lib = ILibraryInstallResultTestFactory.create('none');

			return { lib };
		};

		it('should return empty string', () => {
			const { lib } = setup();

			const result = formatLibraryInstallResult(lib);

			expect(result).toBe('');
		});
	});

	describe('when newVersion is undefined for new type', () => {
		const setup = () => {
			const lib = ILibraryInstallResultTestFactory.create('new', undefined);

			return { lib };
		};

		it('should return empty values with dashes and dots', () => {
			const { lib } = setup();

			const result = formatLibraryInstallResult(lib);

			expect(result).toBe('-..');
		});
	});

	describe('when oldVersion is undefined for patch type', () => {
		const setup = () => {
			const newVersion = {
				machineName: 'H5P.Test',
				majorVersion: 1,
				minorVersion: 2,
				patchVersion: 4,
			};
			const lib = ILibraryInstallResultTestFactory.create('patch', newVersion, undefined);

			return { lib };
		};

		it('should return empty old version values with arrow to new version', () => {
			const { lib } = setup();

			const result = formatLibraryInstallResult(lib);

			expect(result).toBe('-.. -> H5P.Test-1.2.4');
		});
	});
});

describe('formatLibraryInstallResults', () => {
	describe('when given multiple libraries', () => {
		const setup = () => {
			const lib1 = ILibraryInstallResultTestFactory.create('new', {
				machineName: 'H5P.TestA',
				majorVersion: 1,
				minorVersion: 0,
				patchVersion: 0,
			});
			const lib2 = ILibraryInstallResultTestFactory.create('new', {
				machineName: 'H5P.TestB',
				majorVersion: 2,
				minorVersion: 1,
				patchVersion: 5,
			});

			return { libs: [lib1, lib2] };
		};

		it('should return comma-separated formatted strings', () => {
			const { libs } = setup();

			const result = formatLibraryInstallResults(libs);

			expect(result).toBe('H5P.TestA-1.0.0, H5P.TestB-2.1.5');
		});
	});

	describe('when given empty array', () => {
		it('should return empty string', () => {
			const result = formatLibraryInstallResults([]);

			expect(result).toBe('');
		});
	});
});
