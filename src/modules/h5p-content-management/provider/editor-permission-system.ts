/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	ContentPermission,
	GeneralPermission,
	IPermissionSystem,
	IUser,
	TemporaryFilePermission,
	UserDataPermission,
} from '@lumieducation/h5p-server';

export default class EditorPermissionSystem implements IPermissionSystem<IUser> {
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
		return Promise.resolve(true);
	}

	public checkForTemporaryFile(
		user: IUser | undefined,
		permission: TemporaryFilePermission,
		filename?: string
	): Promise<boolean> {
		return Promise.resolve(true);
	}

	public checkForGeneralAction(actingUser: IUser | undefined, permission: GeneralPermission): Promise<boolean> {
		return Promise.resolve(false);
	}
}
