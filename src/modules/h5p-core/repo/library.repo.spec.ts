import { ILibraryMetadata } from '@lumieducation/h5p-server';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, MongoMemoryDatabaseModule } from '@testing/database';
import { InstalledLibrary } from '../domain/installed-library.do';
import { FileMetadata, InstalledLibraryEntity, LibraryName, Path } from './entity';
import { HP5LibraryMikroOrmRepo } from './library.repo';

describe('LibraryRepo', () => {
	let module: TestingModule;
	let libraryRepo: HP5LibraryMikroOrmRepo;
	let addonLibVersionOne: InstalledLibrary;
	let addonLibVersionOneDuplicate: InstalledLibrary;
	let addonLibVersionTwo: InstalledLibrary;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot([InstalledLibraryEntity])],
			providers: [HP5LibraryMikroOrmRepo],
		}).compile();
		libraryRepo = module.get(HP5LibraryMikroOrmRepo);
		em = module.get(EntityManager);

		const testingLibMetadataVersionOne: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'testing',
			majorVersion: 1,
			minorVersion: 2,
		};
		const testingLibVersionOne = InstalledLibrary.fromMetadata(testingLibMetadataVersionOne).getProps();
		testingLibVersionOne.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionOne: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 3,
			machineName: 'addonVersionOne',
			majorVersion: 1,
			minorVersion: 2,
		};
		const addonLibMetadataVersionOneDuplicate: ILibraryMetadata = {
			runnable: false,
			title: 'Duplicate',
			patchVersion: 3,
			machineName: 'addonVersionOne',
			majorVersion: 1,
			minorVersion: 2,
		};
		addonLibVersionOne = InstalledLibrary.fromMetadata(addonLibMetadataVersionOne);
		addonLibVersionOne.getProps().addTo = { player: { machineNames: [testingLibVersionOne.machineName] } };

		addonLibVersionOneDuplicate = InstalledLibrary.fromMetadata(addonLibMetadataVersionOneDuplicate);
		addonLibVersionOneDuplicate.getProps().addTo = { player: { machineNames: [testingLibVersionOne.machineName] } };

		const testingLibMetadataVersionTwo: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 4,
			machineName: 'addonVersionTwo',
			majorVersion: 2,
			minorVersion: 3,
		};
		const testingLibVersionTwo = InstalledLibrary.fromMetadata(testingLibMetadataVersionTwo).getProps();
		testingLibVersionTwo.files.push(
			new FileMetadata('file1', new Date(), 2),
			new FileMetadata('file2', new Date(), 4),
			new FileMetadata('file3', new Date(), 6)
		);

		const addonLibMetadataVersionTwo: ILibraryMetadata = {
			runnable: false,
			title: '',
			patchVersion: 4,
			machineName: 'addonVersionTwo',
			majorVersion: 2,
			minorVersion: 3,
		};
		addonLibVersionTwo = InstalledLibrary.fromMetadata(addonLibMetadataVersionTwo);
		addonLibVersionTwo.getProps().addTo = { player: { machineNames: [testingLibVersionTwo.machineName] } };

		await libraryRepo.createLibrary(addonLibVersionOne);
		await libraryRepo.createLibrary(addonLibVersionTwo);
	});

	afterAll(async () => {
		await cleanupCollections(em);
		await module.close();
	});

	describe('createLibrary', () => {
		it('should save a Library', async () => {
			const found = await libraryRepo.findOneByNameAndVersionOrFail(
				addonLibVersionOne.machineName,
				addonLibVersionOne.majorVersion,
				addonLibVersionOne.minorVersion
			);
			expect(found).toBeDefined();
			expect(found.machineName).toBe(addonLibVersionOne.machineName);
		});
	});

	describe('getAll', () => {
		it('should get all libaries', async () => {
			const result = await libraryRepo.getAll();
			expect(result).toBeDefined();
			expect(result).toHaveLength(2);
		});
	});

	describe('findByName', () => {
		it('should get libaries by name', async () => {
			const result = await libraryRepo.findByName('addonVersionTwo');
			expect(result).toBeDefined();
			expect(result).toEqual([
				expect.objectContaining({
					machineName: addonLibVersionTwo.machineName,
					majorVersion: addonLibVersionTwo.majorVersion,
					minorVersion: addonLibVersionTwo.minorVersion,
					patchVersion: addonLibVersionTwo.patchVersion,
				}),
			]);
		});
	});

	describe('findOneByNameAndVersionOrFail', () => {
		it('should get library', async () => {
			const result = await libraryRepo.findOneByNameAndVersionOrFail('addonVersionOne', 1, 2);
			expect(result).toBeDefined();
		});

		it('should throw error', async () => {
			try {
				await libraryRepo.findOneByNameAndVersionOrFail('notexistinglibrary', 1, 2);
				fail('Expected Error');
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
		it('should throw error', async () => {
			try {
				await libraryRepo.createLibrary(addonLibVersionOneDuplicate);
				await libraryRepo.findOneByNameAndVersionOrFail('addonVersionOne', 1, 2);
				fail('Expected Error');
			} catch (error) {
				expect(error).toBeDefined();
				expect(error).toEqual(new Error('Multiple libraries with the same name and version found'));
			}
		});
	});

	describe('findNewestByNameAndVersion', () => {
		it('should get a library by name and version', async () => {
			const result = await libraryRepo.findNewestByNameAndVersion('addonVersionTwo', 2, 3);
			expect(result).toBeDefined();
			expect(result).toEqual(
				expect.objectContaining({
					machineName: addonLibVersionTwo.machineName,
					majorVersion: addonLibVersionTwo.majorVersion,
					minorVersion: addonLibVersionTwo.minorVersion,
					patchVersion: addonLibVersionTwo.patchVersion,
				})
			);
		});
	});

	describe('findByNameAndExactVersion', () => {
		it('should get a library by name and exact version', async () => {
			const result = await libraryRepo.findByNameAndExactVersion('addonVersionTwo', 2, 3, 4);
			expect(result).toBeDefined();
			expect(result).toEqual(
				expect.objectContaining({
					machineName: addonLibVersionTwo.machineName,
					majorVersion: addonLibVersionTwo.majorVersion,
					minorVersion: addonLibVersionTwo.minorVersion,
					patchVersion: addonLibVersionTwo.patchVersion,
				})
			);
		});
		it('should throw error', async () => {
			try {
				await libraryRepo.findByNameAndExactVersion('addonVersionOne', 1, 2, 3);
				fail('Expected Error');
			} catch (error) {
				expect(error).toBeDefined();
				expect(error).toEqual(new Error('too many libraries with same name and version'));
			}
		});
		it('should return null', async () => {
			const result = await libraryRepo.findByNameAndExactVersion('addonVersionTwo', 99, 3, 4);
			expect(result).toBeDefined();
			expect(result).toEqual(null);
		});
	});

	describe('save', () => {
		it('should update basic library properties when entity already exists in unit of work', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: true,
				title: 'Original Title',
				patchVersion: 1,
				machineName: 'saveTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('saveTestLib', 1, 0);

			const updatedProps = found.getProps();
			updatedProps.title = 'Updated Title';
			updatedProps.patchVersion = 2;
			updatedProps.runnable = false;
			updatedProps.restricted = true;
			updatedProps.author = 'Test Author';
			updatedProps.description = 'Test Description';
			updatedProps.license = 'MIT';
			updatedProps.fullscreen = 1;
			updatedProps.h = 100;
			updatedProps.w = 200;

			const updatedLibrary = new InstalledLibrary(updatedProps);
			await libraryRepo.save(updatedLibrary);

			const result = await libraryRepo.findOneByNameAndVersionOrFail('saveTestLib', 1, 0);
			expect(result.title).toBe('Updated Title');
			expect(result.patchVersion).toBe(2);
			expect(result.runnable).toBe(false);
			expect(result.restricted).toBe(true);
			expect(result.getProps().author).toBe('Test Author');
			expect(result.getProps().description).toBe('Test Description');
			expect(result.getProps().license).toBe('MIT');
			expect(result.getProps().fullscreen).toBe(1);
			expect(result.getProps().h).toBe(100);
			expect(result.getProps().w).toBe(200);
		});

		it('should update files array with FileMetadata instances', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Files Test',
				patchVersion: 1,
				machineName: 'filesTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			library.getProps().files = [new FileMetadata('initial.js', new Date(), 100)];
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('filesTestLib', 1, 0);
			const props = found.getProps();
			props.files = [
				new FileMetadata('updated1.js', new Date(), 200),
				new FileMetadata('updated2.css', new Date(), 300),
			];

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('filesTestLib', 1, 0);
			expect(result.getProps().files).toHaveLength(2);
			expect((result.getProps().files[0] as FileMetadata).name).toBe('updated1.js');
			expect((result.getProps().files[1] as FileMetadata).name).toBe('updated2.css');
		});

		it('should update preloadedDependencies with LibraryName instances', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Dependencies Test',
				patchVersion: 1,
				machineName: 'depsTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('depsTestLib', 1, 0);
			const props = found.getProps();
			props.preloadedDependencies = [
				new LibraryName('H5P.Dependency1', 1, 0),
				new LibraryName('H5P.Dependency2', 2, 1),
			];

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('depsTestLib', 1, 0);
			expect(result.preloadedDependencies).toHaveLength(2);
			expect(result.preloadedDependencies?.[0].machineName).toBe('H5P.Dependency1');
			expect(result.preloadedDependencies?.[1].machineName).toBe('H5P.Dependency2');
		});

		it('should update dynamicDependencies and editorDependencies', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Dynamic Deps Test',
				patchVersion: 1,
				machineName: 'dynamicDepsTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('dynamicDepsTestLib', 1, 0);
			const props = found.getProps();
			props.dynamicDependencies = [new LibraryName('H5P.DynamicDep', 1, 0)];
			props.editorDependencies = [new LibraryName('H5P.EditorDep', 2, 0)];

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('dynamicDepsTestLib', 1, 0);
			expect(result.dynamicDependencies).toHaveLength(1);
			expect(result.dynamicDependencies?.[0].machineName).toBe('H5P.DynamicDep');
			expect(result.editorDependencies).toHaveLength(1);
			expect(result.editorDependencies?.[0].machineName).toBe('H5P.EditorDep');
		});

		it('should update preloadedCss and preloadedJs with Path instances', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Paths Test',
				patchVersion: 1,
				machineName: 'pathsTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('pathsTestLib', 1, 0);
			const props = found.getProps();
			props.preloadedCss = [new Path('styles/main.css'), new Path('styles/theme.css')];
			props.preloadedJs = [new Path('scripts/main.js'), new Path('scripts/utils.js')];

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('pathsTestLib', 1, 0);
			expect(result.preloadedCss).toHaveLength(2);
			expect(result.preloadedCss?.[0].path).toBe('styles/main.css');
			expect(result.preloadedCss?.[1].path).toBe('styles/theme.css');
			expect(result.preloadedJs).toHaveLength(2);
			expect(result.preloadedJs?.[0].path).toBe('scripts/main.js');
			expect(result.preloadedJs?.[1].path).toBe('scripts/utils.js');
		});

		it('should update embedTypes and metadataSettings', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'EmbedTypes Test',
				patchVersion: 1,
				machineName: 'embedTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('embedTestLib', 1, 0);
			const props = found.getProps();
			props.embedTypes = ['iframe', 'div'];
			props.metadataSettings = { disable: 0, disableExtraTitleField: 1 };

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('embedTestLib', 1, 0);
			expect(result.embedTypes).toEqual(['iframe', 'div']);
			expect(result.metadataSettings).toEqual({ disable: 0, disableExtraTitleField: 1 });
		});

		it('should update coreApi, dropLibraryCss, addTo, requiredExtensions, and state', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Complex Props Test',
				patchVersion: 1,
				machineName: 'complexPropsTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const library = InstalledLibrary.fromMetadata(libMetadata);
			await libraryRepo.createLibrary(library);

			const found = await libraryRepo.findOneByNameAndVersionOrFail('complexPropsTestLib', 1, 0);
			const props = found.getProps();
			props.coreApi = { majorVersion: 1, minorVersion: 24 };
			props.dropLibraryCss = [{ machineName: 'H5P.SomeLibrary' }];
			props.addTo = { player: { machineNames: ['H5P.Video'] } };
			props.requiredExtensions = { sharedState: 1 };
			props.state = {
				snapshotSchema: true,
				opSchema: false,
				snapshotLogicChecks: true,
				opLogicChecks: false,
			};

			await libraryRepo.save(new InstalledLibrary(props));

			const result = await libraryRepo.findOneByNameAndVersionOrFail('complexPropsTestLib', 1, 0);
			expect(result.coreApi).toEqual({ majorVersion: 1, minorVersion: 24 });
			expect(result.getProps().dropLibraryCss).toEqual([{ machineName: 'H5P.SomeLibrary' }]);
			expect(result.addTo).toEqual({ player: { machineNames: ['H5P.Video'] } });
			expect(result.requiredExtensions).toEqual({ sharedState: 1 });
			expect(result.state).toEqual({
				snapshotSchema: true,
				opSchema: false,
				snapshotLogicChecks: true,
				opLogicChecks: false,
			});
		});
	});

	describe('createLibrary - files mapping', () => {
		it('should correctly map FileMetadata instances when creating a new library', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'FileMetadata Test',
				patchVersion: 1,
				machineName: 'fileMetadataTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const props = InstalledLibrary.fromMetadata(libMetadata).getProps();
			props.files = [
				new FileMetadata('script.js', new Date('2026-01-01'), 100),
				new FileMetadata('style.css', new Date('2026-01-02'), 200),
			];
			const library = new InstalledLibrary(props);

			await libraryRepo.createLibrary(library);

			const result = await libraryRepo.findOneByNameAndVersionOrFail('fileMetadataTestLib', 1, 0);
			expect(result.getProps().files).toHaveLength(2);
			expect((result.getProps().files[0] as FileMetadata).name).toBe('script.js');
			expect(result.getProps().files[0].size).toBe(100);
			expect((result.getProps().files[1] as FileMetadata).name).toBe('style.css');
			expect(result.getProps().files[1].size).toBe(200);
		});

		it('should convert plain file objects to FileMetadata when creating a new library', async () => {
			const libMetadata: ILibraryMetadata = {
				runnable: false,
				title: 'Plain Files Test',
				patchVersion: 1,
				machineName: 'plainFilesTestLib',
				majorVersion: 1,
				minorVersion: 0,
			};
			const props = InstalledLibrary.fromMetadata(libMetadata).getProps();
			// Simulate plain objects (not FileMetadata instances) that would come from JSON deserialization
			props.files = [
				{ name: 'app.js', birthtime: new Date('2026-02-01'), size: 500 },
				{ name: 'app.css', birthtime: new Date('2026-02-02'), size: 300 },
			] as FileMetadata[];
			const library = new InstalledLibrary(props);

			await libraryRepo.createLibrary(library);

			const result = await libraryRepo.findOneByNameAndVersionOrFail('plainFilesTestLib', 1, 0);
			expect(result.getProps().files).toHaveLength(2);
			expect((result.getProps().files[0] as FileMetadata).name).toBe('app.js');
			expect(result.getProps().files[0].size).toBe(500);
			expect((result.getProps().files[1] as FileMetadata).name).toBe('app.css');
			expect(result.getProps().files[1].size).toBe(300);
		});
	});
});
