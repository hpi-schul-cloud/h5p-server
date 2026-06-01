import { Loggable, LogMessage } from '@infra/logger';
import { ILibraryInstallResult } from '@lumieducation/h5p-server';
import { formatLibraryInstallResults } from './format-library-install-result.helper';

export class H5PLibraryManagementInstallResultsLoggable implements Loggable {
	constructor(private readonly installResult: ILibraryInstallResult[]) {}

	// istanbul ignore next
	public getLogMessage(): LogMessage {
		const logMessage = {
			message: `Added/updated ${this.installResult.length} libraries from H5P Hub.`,
			data: {
				installResult: formatLibraryInstallResults(this.installResult),
			},
		};

		return logMessage;
	}
}
