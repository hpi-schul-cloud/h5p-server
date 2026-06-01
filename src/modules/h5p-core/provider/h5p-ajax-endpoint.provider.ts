import { H5PAjaxEndpoint, H5PEditor } from '@lumieducation/h5p-server';

export const H5PAjaxEndpointProvider = {
	provide: H5PAjaxEndpoint,
	inject: [H5PEditor],
	useFactory: (h5pEditor: H5PEditor): H5PAjaxEndpoint => {
		const h5pAjaxEndpoint = new H5PAjaxEndpoint(h5pEditor);

		return h5pAjaxEndpoint;
	},
};
