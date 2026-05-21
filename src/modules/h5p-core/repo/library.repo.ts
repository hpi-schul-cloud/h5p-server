import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { InstalledLibrary } from '../domain/installed-library.do';
import { InstalledLibraryEntity } from './entity';
import { InstalledLibraryEntityMapper } from './mapper';

@Injectable()
export class HP5LibraryMikroOrmRepo {
	constructor(protected readonly _em: EntityManager) {}

	get entityName(): typeof InstalledLibraryEntity {
		return InstalledLibraryEntity;
	}

	public async createLibrary(library: InstalledLibrary): Promise<void> {
		const entity = InstalledLibraryEntityMapper.mapDoToEntity(this._em, library);
		await this._em.persist(entity).flush();
	}

	public async save(library: InstalledLibrary): Promise<void> {
		const entity = InstalledLibraryEntityMapper.mapDoToEntity(this._em, library);
		await this._em.persist(entity).flush();
	}

	public async delete(library: InstalledLibrary | InstalledLibrary[]): Promise<void> {
		const libraries = Array.isArray(library) ? library : [library];
		const entities = libraries.map((l) => InstalledLibraryEntityMapper.mapDoToEntity(this._em, l));
		await this._em.remove(entities).flush();
	}

	/**
	 * This is a operation that need high memory consumption.
	 */
	public async getAll(): Promise<InstalledLibrary[]> {
		const entities = await this._em.find(this.entityName, {});

		return entities.map((e) => InstalledLibraryEntityMapper.mapEntityToDo(e));
	}

	public async findOneByNameAndVersionOrFail(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary> {
		const entities = await this._em.find(this.entityName, { machineName, majorVersion, minorVersion });
		if (entities.length === 1) {
			return InstalledLibraryEntityMapper.mapEntityToDo(entities[0]);
		}

		if (entities.length === 0) {
			throw new Error('Library not found');
		}

		throw new Error('Multiple libraries with the same name and version found');
	}

	public async findByName(machineName: string): Promise<InstalledLibrary[]> {
		const entities = await this._em.find(this.entityName, { machineName });

		return entities.map((e) => InstalledLibraryEntityMapper.mapEntityToDo(e));
	}

	public async findNewestByNameAndVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number
	): Promise<InstalledLibrary | null> {
		const entities = await this._em.find(this.entityName, {
			machineName,
			majorVersion,
			minorVersion,
		});
		let latest: InstalledLibraryEntity | null = null;

		for (const entity of entities) {
			if (latest === null || entity.patchVersion > latest.patchVersion) {
				latest = entity;
			}
		}

		return latest ? InstalledLibraryEntityMapper.mapEntityToDo(latest) : null;
	}

	public async findByNameAndExactVersion(
		machineName: string,
		majorVersion: number,
		minorVersion: number,
		patchVersion: number
	): Promise<InstalledLibrary | null> {
		const [entities, count] = await this._em.findAndCount(this.entityName, {
			machineName,
			majorVersion,
			minorVersion,
			patchVersion,
		});

		if (count > 1) {
			throw new Error('too many libraries with same name and version');
		}

		if (count === 1) {
			return InstalledLibraryEntityMapper.mapEntityToDo(entities[0]);
		}

		return null;
	}
}
