import { Module } from '@nestjs/common';
import { MongoMemoryDatabaseModule } from '@testing/database';
import { controllers, imports, providers } from './h5p-editor.app.module';
import { TEST_ENTITIES } from './h5p-editor.entity.exports';

@Module({
	imports: [...imports, MongoMemoryDatabaseModule.forRoot(TEST_ENTITIES)],
	controllers,
	providers,
})
export class H5PEditorTestModule {}
