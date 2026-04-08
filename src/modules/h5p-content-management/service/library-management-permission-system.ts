/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ContentPermission,
	GeneralPermission,
	IPermissionSystem,
	IUser,
	TemporaryFilePermission,
	UserDataPermission,
} from '@lumieducation/h5p-server';

export default class LibraryManagementPermissionSystem implements IPermissionSystem<IUser> {
	public checkForUserData(
		actingUser: IUser,
		permission: UserDataPermission,
		contentId: string,
		affectedUserId?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	public checkForContent(
		actingUser: IUser | undefined,
		permission: ContentPermission,
		contentId?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	public checkForTemporaryFile(
		user: IUser | undefined,
		permission: TemporaryFilePermission,
		filename?: string
	): Promise<boolean> {
		return Promise.resolve(false);
	}

	public checkForGeneralAction(actingUser: IUser | undefined, permission: GeneralPermission): Promise<boolean> {
		switch (permission) {
			case GeneralPermission.InstallRecommended:
				return Promise.resolve(true);
			case GeneralPermission.UpdateAndInstallLibraries:
				return Promise.resolve(true);
			case GeneralPermission.CreateRestricted:
				return Promise.resolve(true);
			default:
				return Promise.resolve(false);
		}
	}
}
