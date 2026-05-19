import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { H5PContentParentType } from '@modules/h5p-content-management';
import { NotImplementedException } from '@nestjs/common';
import { H5PContentMapper } from './h5p-content.mapper';

describe(H5PContentMapper.name, () => {
	describe('mapToAllowedAuthorizationEntityType', () => {
		describe('when H5PContentParentType is Board_Element', () => {
			it('should return allowed AuthorizableReferenceType equal to BoardNode', () => {
				const result = H5PContentMapper.mapToAllowedAuthorizationEntityType(H5PContentParentType.BoardElement);

				expect(result).toBe(AuthorizationBodyParamsReferenceType.BOARDNODES);
			});
		});

		describe('when H5PContentParentType is unknown', () => {
			it('should throw NotImplementedException', () => {
				const exec = () => {
					H5PContentMapper.mapToAllowedAuthorizationEntityType('' as H5PContentParentType);
				};
				expect(exec).toThrow(NotImplementedException);
			});
		});
	});
});
