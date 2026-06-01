import { ILibraryName } from '@lumieducation/h5p-server';
import { EntityId } from '@shared/domain/types';
import { H5PContent } from '../h5p-content.do';
import { H5PCountUsageResult } from '../types';

export const H5P_CONTENT_REPO = 'H5P_CONTENT_REPO';

export interface H5PContentRepo {
	existsOne(contentId: EntityId): Promise<boolean>;
	save(content: H5PContent): Promise<void>;
	delete(content: H5PContent | H5PContent[]): Promise<void>;
	deleteContent(content: H5PContent): Promise<void>;
	findById(contentId: EntityId): Promise<H5PContent>;
	countUsage(library: ILibraryName): Promise<H5PCountUsageResult>;
}
