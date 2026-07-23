/** **********************************************************
 * This is a module facade.                                  *
 * Export only what is allowed to be used externally.        *
 * Do not use wildcard exports.                              *
 * Do not export *.app.module.ts here; import them directly. *
 *********************************************************** */

export { AuthorizationBodyParamsReferenceType, AuthorizationContextParams } from './authorization-api-client';
export { AuthorizationClientAdapter } from './authorization-client.adapter';
export { AUTHORIZATION_CLIENT_CONFIG_TOKEN, AuthorizationClientConfig } from './authorization-client.config';
export { AuthorizationClientModule } from './authorization-client.module';
export { AuthorizationContextBuilder } from './mapper';
