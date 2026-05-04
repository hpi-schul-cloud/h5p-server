import { Entity, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { setupEntities } from '@testing/database';
import { BaseEntity } from './base.entity';

@Entity()
class TestEntity extends BaseEntity {}

describe('BaseEntity', () => {
	let orm: MikroORM;
	beforeAll(async () => {
		orm = await setupEntities([TestEntity]);
	});

	afterAll(async () => {
		await orm.close(true);
	});

	describe('when _id property is set to ObjectId', () => {
		it('should serialize the ObjectId to the id property', () => {
			const entity = new TestEntity();
			entity._id = new ObjectId();
			orm.em.persist(entity);

			expect(entity.id).toEqual(entity._id.toHexString());
		});
	});

	describe('when id property is set to serialized ObjectId', () => {
		it('should wrap the serialized id to the _id property', () => {
			const entity = new TestEntity();
			entity.id = new ObjectId().toHexString();
			orm.em.persist(entity);

			expect(entity._id).toBeInstanceOf(ObjectId);
			expect(entity._id.toHexString()).toEqual(entity.id);
		});
	});
});
