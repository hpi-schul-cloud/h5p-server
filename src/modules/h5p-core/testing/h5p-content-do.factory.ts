import { ObjectId } from '@mikro-orm/mongodb';
import { BaseFactory } from '@testing/factory/base.factory';
import { H5PContent, H5PContentParentType, H5PContentProps } from '../domain';

class H5PContentDoFactory extends BaseFactory<H5PContent, H5PContentProps> {}

export const h5pContentDoFactory = H5PContentDoFactory.define(H5PContent, ({ sequence }) => {
	const now = new Date();

	const props: H5PContentProps = {
		id: new ObjectId().toHexString(),
		parentType: H5PContentParentType.BoardElement,
		parentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		content: {
			field: sequence,
			dateField: new Date(sequence),
			thisObjectHasNoStructure: true,
			nested: {
				works: true,
			},
		},
		metadata: {
			defaultLanguage: 'de-de',
			embedTypes: ['iframe'],
			language: 'de-de',
			license: `License #${sequence}`,
			mainLibrary: `Library-${sequence}.0`,
			preloadedDependencies: [],
			title: `Title #${sequence}`,
		},
		createdAt: now,
		updatedAt: now,
	};

	return props;
});
