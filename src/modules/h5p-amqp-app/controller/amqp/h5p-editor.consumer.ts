import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Logger } from '@infra/logger';
import { registerAmqpSubscriber } from '@infra/rabbitmq';
import { H5PEditor, IUser as LumiIUser } from '@lumieducation/h5p-server';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { H5PContentParentType, H5pEditorContentService } from '@modules/h5p-core';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CopyContentParams, DeleteContentParams, H5pEditorEvents } from '../../domain/interface';
import {
	H5pEditorContentCopySuccessfulLoggable,
	H5pEditorContentDeletionSuccessfulLoggable,
	H5pEditorExchangeInvalidParamsLoggableException,
} from '../../domain/loggable';
import { H5P_EXCHANGE_CONFIG_TOKEN, H5pExchangeConfig } from '../../h5p-exchange.config';

@Injectable()
export class H5pEditorConsumer implements OnModuleInit {
	constructor(
		private readonly logger: Logger,
		private readonly h5pEditor: H5PEditor,
		private readonly h5pEditorContentService: H5pEditorContentService,
		private readonly orm: MikroORM,
		private readonly amqpConnection: AmqpConnection,
		@Inject(H5P_EXCHANGE_CONFIG_TOKEN)
		private readonly exchangeConfig: H5pExchangeConfig
	) {
		this.logger.setContext(H5pEditorConsumer.name);
	}

	public async onModuleInit(): Promise<void> {
		await registerAmqpSubscriber(
			this.amqpConnection,
			this.exchangeConfig.exchangeName,
			H5pEditorEvents.DELETE_CONTENT,
			(payload: DeleteContentParams) => this.deleteContent(payload),
			H5pEditorConsumer.name,
			this.logger
		);

		await registerAmqpSubscriber(
			this.amqpConnection,
			this.exchangeConfig.exchangeName,
			H5pEditorEvents.COPY_CONTENT,
			(payload: CopyContentParams) => this.copyContent(payload),
			H5pEditorConsumer.name,
			this.logger
		);
	}

	public async deleteContent(payload: DeleteContentParams): Promise<void> {
		await RequestContext.create(this.orm.em, async () => {
			const user: LumiIUser = {
				email: '',
				id: '',
				name: '',
				type: '',
			};

			await this.h5pEditor.deleteContent(payload.contentId, user);

			this.logger.info(new H5pEditorContentDeletionSuccessfulLoggable(payload.contentId));
		});
	}

	public async copyContent(payload: CopyContentParams): Promise<void> {
		await RequestContext.create(this.orm.em, async () => {
			const parentType: H5PContentParentType | undefined = Object.values(H5PContentParentType).find(
				(type: H5PContentParentType) => type === payload.parentType?.valueOf()
			);
			if (!parentType) {
				throw new H5pEditorExchangeInvalidParamsLoggableException(H5pEditorEvents.COPY_CONTENT, payload);
			}

			await this.h5pEditorContentService.copyH5pContent({
				...payload,
				parentType,
				creatorId: payload.userId,
			});

			this.logger.info(new H5pEditorContentCopySuccessfulLoggable(payload.sourceContentId, payload.copiedContentId));
		});
	}
}
