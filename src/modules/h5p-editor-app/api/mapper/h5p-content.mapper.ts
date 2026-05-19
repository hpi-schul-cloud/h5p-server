import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { H5PContentParentType } from '@modules/h5p-core';
import { NotImplementedException } from '@nestjs/common';

export class H5PContentMapper {
	public static mapToAllowedAuthorizationEntityType(type: H5PContentParentType): AuthorizationBodyParamsReferenceType {
		const types = new Map<H5PContentParentType, AuthorizationBodyParamsReferenceType>();

		types.set(H5PContentParentType.BoardElement, AuthorizationBodyParamsReferenceType.BOARDNODES);

		const res: AuthorizationBodyParamsReferenceType | undefined = types.get(type);

		if (!res) {
			throw new NotImplementedException();
		}

		return res;
	}
}
