import { EntityManager } from '@mikro-orm/mongodb';
import { InstalledLibrary, InstalledLibraryProps } from '../../domain/installed-library.do';
import { FileMetadata, InstalledLibraryEntity, LibraryName, Path } from '../entity';

export class InstalledLibraryEntityMapper {
	public static mapEntityToDo(entity: InstalledLibraryEntity): InstalledLibrary {
		const props: InstalledLibraryProps = {
			id: entity.id,
			machineName: entity.machineName,
			majorVersion: entity.majorVersion,
			minorVersion: entity.minorVersion,
			patchVersion: entity.patchVersion,
			runnable: entity.runnable,
			title: entity.title,
			restricted: entity.restricted,
			files: entity.files,
			addTo: entity.addTo,
			author: entity.author,
			coreApi: entity.coreApi,
			description: entity.description,
			dropLibraryCss: entity.dropLibraryCss,
			dynamicDependencies: entity.dynamicDependencies,
			editorDependencies: entity.editorDependencies,
			embedTypes: entity.embedTypes,
			fullscreen: entity.fullscreen,
			h: entity.h,
			license: entity.license,
			metadataSettings: entity.metadataSettings,
			preloadedCss: entity.preloadedCss,
			preloadedDependencies: entity.preloadedDependencies,
			preloadedJs: entity.preloadedJs,
			w: entity.w,
			requiredExtensions: entity.requiredExtensions,
			state: entity.state,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};

		return new InstalledLibrary(props);
	}

	public static mapDoToEntity(em: EntityManager, library: InstalledLibrary): InstalledLibraryEntity {
		const props = library.getProps();

		const existingEntity = em.getUnitOfWork().getById<InstalledLibraryEntity>(InstalledLibraryEntity.name, props.id);

		if (existingEntity) {
			existingEntity.machineName = props.machineName;
			existingEntity.majorVersion = props.majorVersion;
			existingEntity.minorVersion = props.minorVersion;
			existingEntity.patchVersion = props.patchVersion;
			existingEntity.runnable = props.runnable;
			existingEntity.title = props.title;
			existingEntity.restricted = props.restricted;
			existingEntity.files = props.files.map((f) =>
				f instanceof FileMetadata ? f : new FileMetadata((f as FileMetadata).name, f.birthtime, f.size)
			);
			existingEntity.addTo = props.addTo;
			existingEntity.author = props.author;
			existingEntity.coreApi = props.coreApi;
			existingEntity.description = props.description;
			existingEntity.dropLibraryCss = props.dropLibraryCss;
			existingEntity.dynamicDependencies = props.dynamicDependencies?.map((d) =>
				d instanceof LibraryName ? d : new LibraryName(d.machineName, d.majorVersion, d.minorVersion)
			);
			existingEntity.editorDependencies = props.editorDependencies?.map((d) =>
				d instanceof LibraryName ? d : new LibraryName(d.machineName, d.majorVersion, d.minorVersion)
			);
			existingEntity.embedTypes = props.embedTypes;
			existingEntity.fullscreen = props.fullscreen;
			existingEntity.h = props.h;
			existingEntity.license = props.license;
			existingEntity.metadataSettings = props.metadataSettings;
			existingEntity.preloadedCss = props.preloadedCss?.map((p) => (p instanceof Path ? p : new Path(p.path)));
			existingEntity.preloadedDependencies = props.preloadedDependencies?.map((d) =>
				d instanceof LibraryName ? d : new LibraryName(d.machineName, d.majorVersion, d.minorVersion)
			);
			existingEntity.preloadedJs = props.preloadedJs?.map((p) => (p instanceof Path ? p : new Path(p.path)));
			existingEntity.w = props.w;
			existingEntity.requiredExtensions = props.requiredExtensions;
			existingEntity.state = props.state;

			return existingEntity;
		}

		return new InstalledLibraryEntity(
			props,
			props.restricted,
			props.files.map((f) =>
				f instanceof FileMetadata ? f : new FileMetadata((f as FileMetadata).name, f.birthtime, f.size)
			),
			props.id
		);
	}
}
