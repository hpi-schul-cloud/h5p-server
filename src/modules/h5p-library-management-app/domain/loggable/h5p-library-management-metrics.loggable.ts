import { Loggable, LogMessage } from '@infra/logger';
import { ILibraryAdministrationOverviewItem, ILibraryInstallResult } from '@lumieducation/h5p-server';
import { formatLibraryInstallResults } from './format-library-install-result.helper';

export class H5PLibraryManagementMetricsLoggable implements Loggable {
	constructor(
		private readonly initialLibraries: ILibraryAdministrationOverviewItem[],
		private readonly uninstalledLibraries: ILibraryAdministrationOverviewItem[],
		private readonly installedLibraries: ILibraryInstallResult[],
		private readonly synchronizedLibraries: ILibraryInstallResult[],
		private readonly brokenLibraries: ILibraryAdministrationOverviewItem[]
	) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: `Available ${this.initialLibraries.length} libraries. Removed ${this.uninstalledLibraries.length} libraries. Added/updated ${this.installedLibraries.length} libraries. Synced ${this.synchronizedLibraries.length} libraries.`,
			data: {
				initialLibraries: this.initialLibraries
					.map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`)
					.join(', '),
				uninstalledLibraries: this.uninstalledLibraries
					.map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`)
					.join(', '),
				installedLibraries: formatLibraryInstallResults(this.installedLibraries),
				synchronizedLibraries: formatLibraryInstallResults(this.synchronizedLibraries),
				brokenLibraries: this.brokenLibraries
					.map((lib) => `${lib.machineName}-${lib.majorVersion}.${lib.minorVersion}.${lib.patchVersion}`)
					.join(', '),
			},
		};

		return logMessage;
	}
}
