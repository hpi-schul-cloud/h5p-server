import { InstalledLibrary } from '../installed-library.do';

export const H5P_LIBRARY_REPO = 'H5P_LIBRARY_REPO';

export interface HP5LibraryRepo {
	createLibrary(library: InstalledLibrary): Promise<void>;
	save(library: InstalledLibrary): Promise<void>;
	delete(library: InstalledLibrary | InstalledLibrary[]): Promise<void>;
	/**
	 * This is a operation that need high memory consumption.
	 */
	getAll(): Promise<InstalledLibrary[]>;
	findOneByNameAndVersionOrFail(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary>;
	findByName(machineName: string): Promise<InstalledLibrary[]>;
	findNewestByNameAndVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary>;
	findByNameAndExactVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number,
		patchVersion: number
	): Promise<InstalledLibrary>;
}
