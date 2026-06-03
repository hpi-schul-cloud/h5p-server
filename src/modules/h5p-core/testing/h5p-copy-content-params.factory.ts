import { ObjectId } from '@mikro-orm/mongodb';
import { Factory } from 'fishery';
import { H5pCopyContentParams, H5PContentParentType } from '../domain';

export const h5pCopyContentParamsFactory = Factory.define<H5pCopyContentParams>(() => {
	const params: H5pCopyContentParams = {
		sourceContentId: new ObjectId().toHexString(),
		copiedContentId: new ObjectId().toHexString(),
		creatorId: new ObjectId().toHexString(),
		schoolId: new ObjectId().toHexString(),
		parentId: new ObjectId().toHexString(),
		parentType: H5PContentParentType.BoardElement,
	};

	return params;
});
