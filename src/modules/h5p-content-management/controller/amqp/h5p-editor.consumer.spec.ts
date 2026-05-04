import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { H5PEditor } from '@lumieducation/h5p-server';
import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { H5P_EXCHANGE_CONFIG_TOKEN } from '@modules/h5p-content-management/h5p-exchange.config';
import {
	CopyContentParams,
	CopyContentParentType,
	DeleteContentParams,
	H5pEditorEvents,
} from '@modules/h5p-content-management/interface';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ENTITIES } from '../../h5p-editor.entity.exports';
import {
	H5pEditorContentCopySuccessfulLoggable,
	H5pEditorContentDeletionSuccessfulLoggable,
	H5pEditorExchangeInvalidParamsLoggableException,
} from '../../loggable';
import { H5pEditorContentService } from '../../service';
import { h5pCopyContentParamsFactory, h5pEditorExchangeCopyContentParamsFactory } from '../../testing';
import { H5PContentParentType } from '../../types';
import * as AmqpSubscriberHelper from './amqp-subscriber.helper';
import { H5pEditorConsumer } from './h5p-editor.consumer';

describe(H5pEditorConsumer.name, () => {
	let module: TestingModule;
	let consumer: H5pEditorConsumer;

	let logger: DeepMocked<Logger>;
	let h5pEditor: DeepMocked<H5PEditor>;
	let h5pEditorContentService: DeepMocked<H5pEditorContentService>;
	let amqpConnection: DeepMocked<AmqpConnection>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5pEditorConsumer,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: H5PEditor,
					useValue: createMock<H5PEditor>(),
				},
				{
					provide: H5pEditorContentService,
					useValue: createMock<H5pEditorContentService>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities(ENTITIES),
				},
				{
					provide: AmqpConnection,
					useValue: createMock<AmqpConnection>(),
				},
				{
					provide: H5P_EXCHANGE_CONFIG_TOKEN,
					useValue: {
						exchangeName: 'h5p-exchange',
						exchangeType: 'direct',
					},
				},
			],
		}).compile();

		consumer = module.get(H5pEditorConsumer);
		logger = module.get(Logger);
		h5pEditor = module.get(H5PEditor);
		h5pEditorContentService = module.get(H5pEditorContentService);
		amqpConnection = module.get(AmqpConnection);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('onModuleInit', () => {
		describe('when module is initialized', () => {
			let registerAmqpSubscriberSpy: jest.SpyInstance;

			beforeEach(() => {
				registerAmqpSubscriberSpy = jest.spyOn(AmqpSubscriberHelper, 'registerAmqpSubscriber').mockResolvedValue();
			});

			afterEach(() => {
				registerAmqpSubscriberSpy.mockRestore();
			});

			it('should register a subscriber for DELETE_CONTENT event', async () => {
				await consumer.onModuleInit();

				expect(registerAmqpSubscriberSpy).toHaveBeenCalledWith(
					amqpConnection,
					'h5p-exchange',
					H5pEditorEvents.DELETE_CONTENT,
					expect.any(Function),
					H5pEditorConsumer.name,
					logger
				);
			});

			it('should register a subscriber for COPY_CONTENT event', async () => {
				await consumer.onModuleInit();

				expect(registerAmqpSubscriberSpy).toHaveBeenCalledWith(
					amqpConnection,
					'h5p-exchange',
					H5pEditorEvents.COPY_CONTENT,
					expect.any(Function),
					H5pEditorConsumer.name,
					logger
				);
			});

			it('should pass a handler that calls deleteContent for DELETE_CONTENT event', async () => {
				const deleteContentSpy = jest.spyOn(consumer, 'deleteContent').mockResolvedValue();
				const payload: DeleteContentParams = { contentId: new ObjectId().toHexString() };

				await consumer.onModuleInit();

				const deleteContentHandler = registerAmqpSubscriberSpy.mock.calls.find(
					(call) => call[2] === H5pEditorEvents.DELETE_CONTENT
				)?.[3] as (payload: DeleteContentParams) => Promise<void>;

				await deleteContentHandler(payload);

				expect(deleteContentSpy).toHaveBeenCalledWith(payload);

				deleteContentSpy.mockRestore();
			});

			it('should pass a handler that calls copyContent for COPY_CONTENT event', async () => {
				const copyContentSpy = jest.spyOn(consumer, 'copyContent').mockResolvedValue();
				const payload = h5pEditorExchangeCopyContentParamsFactory.build();

				await consumer.onModuleInit();

				const copyContentHandler = registerAmqpSubscriberSpy.mock.calls.find(
					(call) => call[2] === H5pEditorEvents.COPY_CONTENT
				)?.[3] as (payload: CopyContentParams) => Promise<void>;

				await copyContentHandler(payload);

				expect(copyContentSpy).toHaveBeenCalledWith(payload);

				copyContentSpy.mockRestore();
			});
		});
	});

	describe('deleteContent', () => {
		describe('when deleting content', () => {
			const setup = () => {
				const contentId = new ObjectId().toHexString();

				return {
					contentId,
				};
			};

			it('should delete content', async () => {
				const { contentId } = setup();

				await consumer.deleteContent({
					contentId,
				});

				expect(h5pEditor.deleteContent).toHaveBeenCalledWith(contentId, {
					email: '',
					id: '',
					name: '',
					type: '',
				});
			});

			it('should log a success info', async () => {
				const { contentId } = setup();

				await consumer.deleteContent({
					contentId,
				});

				expect(logger.info).toHaveBeenCalledWith(new H5pEditorContentDeletionSuccessfulLoggable(contentId));
			});
		});

		describe('when deletion fails', () => {
			const setup = () => {
				const contentId = new ObjectId().toHexString();

				h5pEditor.deleteContent.mockRejectedValue(new Error());

				return {
					contentId,
				};
			};

			it('should not log a success info', async () => {
				const { contentId } = setup();

				await expect(
					consumer.deleteContent({
						contentId,
					})
				).rejects.toThrow();

				expect(logger.info).not.toHaveBeenCalled();
			});
		});
	});

	describe('copyContent', () => {
		describe('when copying a content', () => {
			it('should call the copy method of the h5p content service', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build({
					parentType: CopyContentParentType.BoardElement,
				});
				const params = h5pCopyContentParamsFactory.build({
					...payload,
					creatorId: payload.userId,
					parentType: H5PContentParentType.BoardElement,
				});

				await consumer.copyContent(payload);

				expect(h5pEditorContentService.copyH5pContent).toHaveBeenCalledWith(params);
			});

			it('should log a success info', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build();

				await consumer.copyContent(payload);

				expect(logger.info).toHaveBeenCalledWith(
					new H5pEditorContentCopySuccessfulLoggable(payload.sourceContentId, payload.copiedContentId)
				);
			});
		});

		describe('when the parent type from the payload is invalid', () => {
			it('it should throw an H5pEditorExchangeInvalidParamsLoggableException', async () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build({ parentType: undefined });

				const promise = consumer.copyContent(payload);

				await expect(promise).rejects.toThrow(
					new H5pEditorExchangeInvalidParamsLoggableException(H5pEditorEvents.COPY_CONTENT, payload)
				);
			});
		});

		describe('when copying fails', () => {
			const setup = () => {
				const payload = h5pEditorExchangeCopyContentParamsFactory.build();

				h5pEditorContentService.copyH5pContent.mockRejectedValueOnce(new Error());

				return { payload };
			};

			it('should not log a success info', async () => {
				const { payload } = setup();

				const promise = consumer.copyContent(payload);

				await expect(promise).rejects.toThrow();
				expect(logger.info).not.toHaveBeenCalled();
			});
		});
	});
});
