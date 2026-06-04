import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { InstalledLibrary, InstalledLibraryProps } from '../domain/installed-library.do';

class InstalledLibraryFactory extends BaseFactory<InstalledLibrary, InstalledLibraryProps> {}

export const installedLibraryFactory = InstalledLibraryFactory.define(InstalledLibrary, ({ sequence }) => {
	const now = new Date();

	const props: InstalledLibraryProps = {
		id: new ObjectId().toHexString(),
		machineName: `H5P.TestLibrary${sequence}`,
		majorVersion: 1,
		minorVersion: sequence,
		patchVersion: 0,
		runnable: true,
		title: `Test Library ${sequence}`,
		restricted: false,
		files: [],
		addTo: undefined,
		author: undefined,
		coreApi: undefined,
		description: undefined,
		dropLibraryCss: undefined,
		dynamicDependencies: undefined,
		editorDependencies: undefined,
		embedTypes: undefined,
		fullscreen: undefined,
		h: undefined,
		license: undefined,
		metadataSettings: undefined,
		preloadedCss: undefined,
		preloadedDependencies: undefined,
		preloadedJs: undefined,
		w: undefined,
		requiredExtensions: undefined,
		state: undefined,
		createdAt: now,
		updatedAt: now,
	};

	return props;
});
