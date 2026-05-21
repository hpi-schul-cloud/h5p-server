import {
	IFileStats,
	type IInstalledLibrary,
	type ILibraryMetadata,
	type ILibraryName,
} from '@lumieducation/h5p-server';
import { ObjectId } from '@mikro-orm/mongodb';
import { DomainObject } from '@shared/domain/domain-object';

export interface InstalledLibraryProps extends Omit<IInstalledLibrary, 'compare' | 'compareVersions'> {
	[x: string]: unknown;
	id: string;
	files: IFileStats[];
	createdAt: Date;
	updatedAt: Date;
}

export class InstalledLibrary extends DomainObject<InstalledLibraryProps> implements IInstalledLibrary {
	[x: string]: unknown;
	constructor(props: InstalledLibraryProps) {
		super(props);
	}

	get addTo(): IInstalledLibrary['addTo'] {
		return this.props.addTo;
	}

	get author(): IInstalledLibrary['author'] {
		return this.props.author;
	}

	get coreApi(): IInstalledLibrary['coreApi'] {
		return this.props.coreApi;
	}

	get description(): IInstalledLibrary['description'] {
		return this.props.description;
	}

	get dropLibraryCss(): IInstalledLibrary['dropLibraryCss'] {
		return this.props.dropLibraryCss;
	}

	get dynamicDependencies(): IInstalledLibrary['dynamicDependencies'] {
		return this.props.dynamicDependencies;
	}

	get editorDependencies(): IInstalledLibrary['editorDependencies'] {
		return this.props.editorDependencies;
	}

	get embedTypes(): IInstalledLibrary['embedTypes'] {
		return this.props.embedTypes;
	}

	get fullscreen(): IInstalledLibrary['fullscreen'] {
		return this.props.fullscreen;
	}

	get h(): IInstalledLibrary['h'] {
		return this.props.h;
	}

	get license(): IInstalledLibrary['license'] {
		return this.props.license;
	}

	get metadataSettings(): IInstalledLibrary['metadataSettings'] {
		return this.props.metadataSettings;
	}

	get preloadedCss(): IInstalledLibrary['preloadedCss'] {
		return this.props.preloadedCss;
	}

	get preloadedDependencies(): IInstalledLibrary['preloadedDependencies'] {
		return this.props.preloadedDependencies;
	}

	get preloadedJs(): IInstalledLibrary['preloadedJs'] {
		return this.props.preloadedJs;
	}

	get requiredExtensions(): IInstalledLibrary['requiredExtensions'] {
		return this.props.requiredExtensions;
	}

	get state(): IInstalledLibrary['state'] {
		return this.props.state;
	}

	get machineName(): string {
		return this.props.machineName;
	}

	get majorVersion(): number {
		return this.props.majorVersion;
	}
	get minorVersion(): number {
		return this.props.minorVersion;
	}

	get patchVersion(): number {
		return this.props.patchVersion;
	}
	get runnable(): boolean | 0 | 1 {
		return this.props.runnable;
	}

	get title(): string {
		return this.props.title;
	}
	get restricted(): boolean {
		return this.props.restricted;
	}

	public compare(otherLibrary: IInstalledLibrary): number {
		if (this.props.machineName === otherLibrary.machineName) {
			return this.compareVersions(otherLibrary);
		}

		return this.props.machineName > otherLibrary.machineName ? 1 : -1;
	}

	public compareVersions(otherLibrary: ILibraryName & { patchVersion?: number }): number {
		let result = InstalledLibrary.simple_compare(this.props.majorVersion, otherLibrary.majorVersion);
		if (result !== 0) {
			return result;
		}
		result = InstalledLibrary.simple_compare(this.props.minorVersion, otherLibrary.minorVersion);
		if (result !== 0) {
			return result;
		}

		return InstalledLibrary.simple_compare(this.props.patchVersion, otherLibrary?.patchVersion ?? 0);
	}

	public static simple_compare(a: number, b: number): number {
		if (a > b) {
			return 1;
		}
		if (a < b) {
			return -1;
		}

		return 0;
	}

	public static fromMetadata(metadata: ILibraryMetadata, restricted = false): InstalledLibrary {
		const now = new Date();

		return new InstalledLibrary({
			id: new ObjectId().toHexString(),
			machineName: metadata.machineName,
			majorVersion: metadata.majorVersion,
			minorVersion: metadata.minorVersion,
			patchVersion: metadata.patchVersion,
			runnable: metadata.runnable,
			title: metadata.title,
			restricted,
			files: [],
			addTo: metadata.addTo,
			author: metadata.author,
			coreApi: metadata.coreApi,
			description: metadata.description,
			dropLibraryCss: metadata.dropLibraryCss,
			dynamicDependencies: metadata.dynamicDependencies,
			editorDependencies: metadata.editorDependencies,
			embedTypes: metadata.embedTypes,
			fullscreen: metadata.fullscreen,
			h: metadata.h,
			license: metadata.license,
			metadataSettings: metadata.metadataSettings,
			preloadedCss: metadata.preloadedCss,
			preloadedDependencies: metadata.preloadedDependencies,
			preloadedJs: metadata.preloadedJs,
			w: metadata.w,
			requiredExtensions: metadata.requiredExtensions,
			state: metadata.state,
			createdAt: now,
			updatedAt: now,
		});
	}
}
