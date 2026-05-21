import { ObjectId } from '@mikro-orm/mongodb';
import { H5PContentParentType } from '../../domain';
import { ContentMetadata, H5PContentEntity, H5PContentEntityProperties } from './h5p-content.entity';

describe(H5PContentEntity.name, () => {
	describe('when a H5PContent instance is created', () => {
		const setup = () => {
			const props: H5PContentEntityProperties = {
				creatorId: new ObjectId().toHexString(),
				parentType: H5PContentParentType.BoardElement,
				parentId: new ObjectId().toHexString(),
				schoolId: new ObjectId().toHexString(),
				metadata: new ContentMetadata({
					embedTypes: ['iframe'],
					language: 'en',
					mainLibrary: 'mainLibrary123',
					defaultLanguage: 'en',
					license: 'MIT',
					title: 'Title Example',
					preloadedDependencies: [],
					dynamicDependencies: [],
					editorDependencies: [],
				}),
				content: {},
			};

			return { props };
		};

		it('should create a H5PContent', () => {
			const { props } = setup();

			const result = new H5PContentEntity(props);

			expect(result).toBeInstanceOf(H5PContentEntity);
			expect(result).toEqual(expect.objectContaining<Partial<H5PContentEntity>>({ ...props }));
		});
	});

	describe('when a H5PContent instance is created with the provided id', () => {
		const setup = () => {
			const props: H5PContentEntityProperties = {
				id: new ObjectId().toHexString(),
				creatorId: new ObjectId().toHexString(),
				parentType: H5PContentParentType.BoardElement,
				parentId: new ObjectId().toHexString(),
				schoolId: new ObjectId().toHexString(),
				metadata: new ContentMetadata({
					embedTypes: ['iframe'],
					language: 'en',
					mainLibrary: 'mainLibrary123',
					defaultLanguage: 'en',
					license: 'MIT',
					title: 'Title Example',
					preloadedDependencies: [],
					dynamicDependencies: [],
					editorDependencies: [],
				}),
				content: {},
			};

			return { props };
		};

		it('should create an H5PContent with the provided id', () => {
			const { props } = setup();

			const result = new H5PContentEntity(props);

			expect(result).toBeInstanceOf(H5PContentEntity);
			expect(result.id).toEqual(props.id);
			expect(result._id).toEqual(new ObjectId(props.id));
			expect(result).toEqual(expect.objectContaining<Partial<H5PContentEntity>>({ ...props }));
		});
	});
});
