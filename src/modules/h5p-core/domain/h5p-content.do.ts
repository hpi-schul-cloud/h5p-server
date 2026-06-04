import { IContentMetadata } from '@lumieducation/h5p-server';
import { DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { H5PContentParentType } from './types';

export interface H5PContentProps {
	id: EntityId;
	creatorId: EntityId;
	parentType: H5PContentParentType;
	parentId: EntityId;
	schoolId: EntityId;
	metadata: IContentMetadata;
	content: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export class H5PContent extends DomainObject<H5PContentProps> {
	constructor(props: H5PContentProps) {
		super(props);
	}

	get creatorId(): EntityId {
		return this.props.creatorId;
	}

	get parentType(): H5PContentParentType {
		return this.props.parentType;
	}

	get parentId(): EntityId {
		return this.props.parentId;
	}

	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get metadata(): IContentMetadata {
		return this.props.metadata;
	}

	set metadata(metadata: IContentMetadata) {
		this.props.metadata = metadata;
	}

	get content(): unknown {
		return this.props.content;
	}

	set content(content: unknown) {
		this.props.content = content;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
