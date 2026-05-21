import { ILibraryMetadata } from '@lumieducation/h5p-server';
import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections, MongoMemoryDatabaseModule } from '@testing/database';
import { InstalledLibrary } from '../domain/installed-library.do';
import { FileMetadata, InstalledLibraryEntity } from './entity';
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
});
