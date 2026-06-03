import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { H5PContent, H5PContentProps } from '../../domain/h5p-content.do';
import { ContentMetadata, H5PContentEntity, H5PContentEntityProperties } from '../entity';

export class H5PContentEntityMapper {
	public static mapEntityToDo(entity: H5PContentEntity): H5PContent {
		const props: H5PContentProps = {
			id: entity.id,
			creatorId: entity.creatorId,
			parentType: entity.parentType,
			parentId: entity.parentId,
			schoolId: entity.schoolId,
			metadata: entity.metadata,
			content: entity.content,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};

		return new H5PContent(props);
	}

	public static mapDoToEntity(em: EntityManager, h5pContent: H5PContent): H5PContentEntity {
		const props = h5pContent.getProps();

		const existingEntity = em.getUnitOfWork().getById<H5PContentEntity>(H5PContentEntity.name, props.id);

		if (existingEntity) {
			existingEntity._creatorId = new ObjectId(props.creatorId);
			existingEntity._parentId = new ObjectId(props.parentId);
			existingEntity._schoolId = new ObjectId(props.schoolId);
			existingEntity.parentType = props.parentType;
			existingEntity.metadata = new ContentMetadata(props.metadata);
			existingEntity.content = props.content;

			return existingEntity;
		}

		const entityProps: H5PContentEntityProperties = {
			id: props.id,
			creatorId: props.creatorId,
			parentType: props.parentType,
			parentId: props.parentId,
			schoolId: props.schoolId,
			metadata: new ContentMetadata(props.metadata),
			content: props.content,
		};

		return new H5PContentEntity(entityProps);
	}
}
