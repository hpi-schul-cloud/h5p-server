import { installedLibraryFactory } from '../testing/installed-library.factory';
import { InstalledLibrary } from './installed-library.do';

describe(InstalledLibrary.name, () => {
	describe('compare', () => {
		describe('when machineNames are equal', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					machineName: 'H5P.TestLib',
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 3,
				});
				const otherLibrary = installedLibraryFactory.build({
					machineName: 'H5P.TestLib',
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 4,
				});

				return { library, otherLibrary };
			};

			it('should delegate to compareVersions', () => {
				const { library, otherLibrary } = setup();

				const result = library.compare(otherLibrary);

				// patchVersion 3 < 4, so should return -1
				expect(result).toBe(-1);
			});
		});

		describe('when this.machineName is greater than otherLibrary.machineName', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					machineName: 'H5P.ZLibrary',
				});
				const otherLibrary = installedLibraryFactory.build({
					machineName: 'H5P.ALibrary',
				});

				return { library, otherLibrary };
			};

			it('should return 1', () => {
				const { library, otherLibrary } = setup();

				const result = library.compare(otherLibrary);

				expect(result).toBe(1);
			});
		});

		describe('when this.machineName is less than otherLibrary.machineName', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					machineName: 'H5P.ALibrary',
				});
				const otherLibrary = installedLibraryFactory.build({
					machineName: 'H5P.ZLibrary',
				});

				return { library, otherLibrary };
			};

			it('should return -1', () => {
				const { library, otherLibrary } = setup();

				const result = library.compare(otherLibrary);

				expect(result).toBe(-1);
			});
		});
	});

	describe('compareVersions', () => {
		describe('when majorVersion differs', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					majorVersion: 2,
					minorVersion: 0,
					patchVersion: 0,
				});
				const otherLibrary = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 5,
					patchVersion: 10,
				});

				return { library, otherLibrary };
			};

			it('should return comparison based on majorVersion', () => {
				const { library, otherLibrary } = setup();

				const result = library.compareVersions(otherLibrary);

				expect(result).toBe(1);
			});
		});

		describe('when majorVersions are equal and minorVersion differs', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 10,
				});
				const otherLibrary = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 5,
					patchVersion: 0,
				});

				return { library, otherLibrary };
			};

			it('should return comparison based on minorVersion', () => {
				const { library, otherLibrary } = setup();

				const result = library.compareVersions(otherLibrary);

				expect(result).toBe(-1);
			});
		});

		describe('when majorVersion and minorVersion are equal', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 5,
				});
				const otherLibrary = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 3,
				});

				return { library, otherLibrary };
			};

			it('should return comparison based on patchVersion', () => {
				const { library, otherLibrary } = setup();

				const result = library.compareVersions(otherLibrary);

				expect(result).toBe(1);
			});
		});

		describe('when all versions are equal', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 3,
				});
				const otherLibrary = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 3,
				});

				return { library, otherLibrary };
			};

			it('should return 0', () => {
				const { library, otherLibrary } = setup();

				const result = library.compareVersions(otherLibrary);

				expect(result).toBe(0);
			});
		});

		describe('when otherLibrary has undefined patchVersion', () => {
			const setup = () => {
				const library = installedLibraryFactory.build({
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: 1,
				});
				const otherLibrary = {
					machineName: 'H5P.TestLib',
					majorVersion: 1,
					minorVersion: 2,
					patchVersion: undefined,
				};

				return { library, otherLibrary };
			};

			it('should treat undefined patchVersion as 0', () => {
				const { library, otherLibrary } = setup();

				const result = library.compareVersions(otherLibrary);

				// patchVersion 1 > 0 (default), so should return 1
				expect(result).toBe(1);
			});
		});
	});

	describe('simple_compare', () => {
		describe('when a is greater than b', () => {
			it('should return 1', () => {
				const result = InstalledLibrary.simple_compare(5, 3);

				expect(result).toBe(1);
			});
		});

		describe('when a is less than b', () => {
			it('should return -1', () => {
				const result = InstalledLibrary.simple_compare(3, 5);

				expect(result).toBe(-1);
			});
		});

		describe('when a equals b', () => {
			it('should return 0', () => {
				const result = InstalledLibrary.simple_compare(5, 5);

				expect(result).toBe(0);
			});
		});
	});
});
