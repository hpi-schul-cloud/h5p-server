import { TEST_ENTITIES } from '@modules/h5p-core/h5p-core.entity.exports';
import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { controllers, imports, providers } from './h5p-editor.app.module';

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot(TEST_ENTITIES)],
	controllers,
	providers,
})
export class H5PEditorTestModule {}
