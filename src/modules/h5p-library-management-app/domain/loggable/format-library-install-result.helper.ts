import { ILibraryInstallResult } from '@lumieducation/h5p-server';

export const formatLibraryInstallResult = (lib: ILibraryInstallResult): string => {
	let result = '';
	if (lib.type === 'new') {
		result = `${lib.newVersion?.machineName ?? ''}-${lib.newVersion?.majorVersion ?? ''}.${
			lib.newVersion?.minorVersion ?? ''
		}.${lib.newVersion?.patchVersion ?? ''}`;
	}
	if (lib.type === 'patch') {
		result = `${lib.oldVersion?.machineName ?? ''}-${lib.oldVersion?.majorVersion ?? ''}.${
			lib.oldVersion?.minorVersion ?? ''
		}.${lib.oldVersion?.patchVersion ?? ''} -> ${lib.newVersion?.machineName ?? ''}-${
			lib.newVersion?.majorVersion ?? ''
		}.${lib.newVersion?.minorVersion ?? ''}.${lib.newVersion?.patchVersion ?? ''}`;
	}

	return result;
};

export const formatLibraryInstallResults = (libs: ILibraryInstallResult[]): string => {
	return libs.map(formatLibraryInstallResult).join(', ');
};
