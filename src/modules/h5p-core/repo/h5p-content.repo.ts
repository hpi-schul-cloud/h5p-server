import { ILibraryName } from '@lumieducation/h5p-server';
import { Utils } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { H5PContentRepo, H5PCountUsageResult } from '../domain';
import { H5PContent } from '../domain/h5p-content.do';
import { H5PContentEntity } from './entity';
import { H5PContentEntityMapper } from './mapper';

@Injectable()
export class H5PContentMikroOrmRepo implements H5PContentRepo {
	constructor(protected readonly _em: EntityManager) {}

	get entityName(): typeof H5PContentEntity {
		return H5PContentEntity;
	}

	public async existsOne(contentId: EntityId): Promise<boolean> {
		const entityCount = await this._em.count(this.entityName, { id: contentId });

		return entityCount === 1;
	}

	public async save(content: H5PContent): Promise<void> {
		const entity = H5PContentEntityMapper.mapDoToEntity(this._em, content);
		await this._em.persist(entity).flush();
	}

	public async delete(content: H5PContent | H5PContent[]): Promise<void> {
		const contents = Utils.asArray(content);

		contents.forEach((c) => {
			const entity = H5PContentEntityMapper.mapDoToEntity(this._em, c);
			this._em.remove(entity);
		});

		await this._em.flush();
	}

	public async deleteContent(content: H5PContent): Promise<void> {
		await this.delete(content);
	}

	public async findById(contentId: EntityId): Promise<H5PContent> {
		const entity = await this._em.findOneOrFail(this.entityName, { id: contentId });

		return H5PContentEntityMapper.mapEntityToDo(entity);
	}

	public async countUsage(library: ILibraryName): Promise<H5PCountUsageResult> {
		const { machineName } = library;

		const pipeline = [
			{
				$facet: {
					asMainLibrary: [{ $match: { metadata_mainLibrary: machineName } }, { $count: 'count' }],
					asDependency: [
						{
							$match: {
								$or: [
									{ 'metadata_preloadedDependencies.machineName': machineName },
									{ 'metadata_editorDependencies.machineName': machineName },
									{ 'metadata_dynamicDependencies.machineName': machineName },
								],
								metadata_mainLibrary: { $ne: machineName },
							},
						},
						{ $count: 'count' },
					],
				},
			},
			{
				$project: {
					asMainLibrary: { $ifNull: [{ $arrayElemAt: ['$asMainLibrary.count', 0] }, 0] },
					asDependency: { $ifNull: [{ $arrayElemAt: ['$asDependency.count', 0] }, 0] },
				},
			},
		];

		const documents = await this._em.getConnection().getCollection('h5p-editor-content').aggregate(pipeline).toArray();

		return this.castToH5PCountUsageResult(documents[0]);
	}

	private castToH5PCountUsageResult(aggregateResult: unknown): H5PCountUsageResult {
		if (this.isH5PCountUsageResult(aggregateResult)) {
			return aggregateResult;
		}

		throw new Error('Invalid dependency count result structure');
	}

	private isH5PCountUsageResult(aggregateResult: unknown): aggregateResult is H5PCountUsageResult {
		const isH5PCountUsageResult =
			typeof aggregateResult === 'object' &&
			aggregateResult !== null &&
			'asMainLibrary' in aggregateResult &&
			'asDependency' in aggregateResult &&
			typeof aggregateResult.asMainLibrary === 'number' &&
			typeof aggregateResult.asDependency === 'number';

		return isH5PCountUsageResult;
	}
}
