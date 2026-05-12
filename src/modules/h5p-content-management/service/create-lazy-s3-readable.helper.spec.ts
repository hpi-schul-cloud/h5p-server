import { PassThrough, Readable } from 'node:stream';
import { createLazyS3Readable } from './create-lazy-s3-readable.helper';

function readStream(stream: Readable): Promise<Buffer> {
	const chunks: Buffer[] = [];

	return new Promise((resolve, reject) => {
		stream.on('data', (chunk: Buffer | string) => {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		});
		stream.on('end', () => resolve(Buffer.concat(chunks)));
		stream.on('error', reject);
	});
}

function createS3Stream(content: string): PassThrough {
	const stream = new PassThrough();
	stream.end(content);

	return stream;
}

describe('createLazyS3Readable', () => {
	describe('WHEN the stream is read', () => {
		it('should call getStream only once', async () => {
			const s3Stream = createS3Stream('hello');
			const getStream = jest.fn().mockResolvedValue({ data: s3Stream });

			const readable = createLazyS3Readable(getStream);
			await readStream(readable);

			expect(getStream).toHaveBeenCalledTimes(1);
		});

		it('should return the data from the S3 stream', async () => {
			const content = 'hello world';
			const s3Stream = createS3Stream(content);
			const getStream = jest.fn().mockResolvedValue({ data: s3Stream });

			const readable = createLazyS3Readable(getStream);
			const result = await readStream(readable);

			expect(result.toString('utf-8')).toBe(content);
		});

		it('should return a Readable stream', () => {
			const getStream = jest.fn().mockResolvedValue({ data: createS3Stream('') });
			const result = createLazyS3Readable(getStream);

			expect(result).toBeInstanceOf(Readable);
		});
	});

	describe('WHEN getStream is not yet called', () => {
		it('should not call getStream before reading starts', () => {
			const getStream = jest.fn().mockResolvedValue({ data: createS3Stream('data') });

			createLazyS3Readable(getStream);

			expect(getStream).not.toHaveBeenCalled();
		});
	});

	describe('WHEN the S3 stream emits an error', () => {
		it('should destroy the readable with the error', async () => {
			const s3Stream = new PassThrough();
			const expectedError = new Error('S3 read error');
			const getStream = jest.fn().mockResolvedValue({ data: s3Stream });

			const readable = createLazyS3Readable(getStream);
			const readPromise = readStream(readable);

			// Emit an error after the connection is initiated
			setImmediate(() => s3Stream.destroy(expectedError));

			await expect(readPromise).rejects.toThrow('S3 read error');
		});
	});

	describe('WHEN getStream rejects', () => {
		it('should destroy the readable with an Error instance', async () => {
			const expectedError = new Error('connection failed');
			const getStream = jest.fn().mockRejectedValue(expectedError);

			const readable = createLazyS3Readable(getStream);

			await expect(readStream(readable)).rejects.toThrow('connection failed');
		});

		it('should wrap non-Error rejections in an Error', async () => {
			const getStream = jest.fn().mockRejectedValue('string error');

			const readable = createLazyS3Readable(getStream);

			await expect(readStream(readable)).rejects.toThrow('string error');
		});
	});

	describe('WHEN read is called multiple times concurrently', () => {
		it('should not call getStream more than once', async () => {
			let resolveGetStream!: (value: { data: Readable }) => void;
			const streamPromise = new Promise<{ data: Readable }>((resolve) => {
				resolveGetStream = resolve;
			});
			const getStream = jest.fn().mockReturnValue(streamPromise);

			const readable = createLazyS3Readable(getStream);

			// Trigger two _read() calls before the stream resolves
			readable.read(0);
			readable.read(0);

			resolveGetStream({ data: createS3Stream('data') });
			await readStream(readable);

			expect(getStream).toHaveBeenCalledTimes(1);
		});

		it('should return early while the S3 stream is still initializing', async () => {
			let resolveGetStream!: (value: { data: Readable }) => void;
			const streamPromise = new Promise<{ data: Readable }>((resolve) => {
				resolveGetStream = resolve;
			});
			const getStream = jest.fn().mockReturnValue(streamPromise);

			const readable = createLazyS3Readable(getStream);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const firstRead = (readable as any)._read() as Promise<void>;
			expect(getStream).toHaveBeenCalledTimes(1);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await expect((readable as any)._read()).resolves.toBeUndefined();
			expect(getStream).toHaveBeenCalledTimes(1);

			resolveGetStream({ data: createS3Stream('data') });
			await firstRead;
			await readStream(readable);
		});
	});

	describe('WHEN the S3 stream emits multiple chunks', () => {
		it('should forward all chunks to the readable', async () => {
			const s3Stream = new PassThrough();
			const getStream = jest.fn().mockResolvedValue({ data: s3Stream });

			const readable = createLazyS3Readable(getStream);
			const readPromise = readStream(readable);

			setImmediate(() => {
				s3Stream.write('chunk1');
				s3Stream.write('chunk2');
				s3Stream.end('chunk3');
			});

			const result = await readPromise;
			expect(result.toString('utf-8')).toBe('chunk1chunk2chunk3');
		});

		it('should pause the S3 stream when backpressure is signalled', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			const s3Stream = new Readable({ read() {} });
			const pauseSpy = jest.spyOn(s3Stream, 'pause');
			const getStream = jest.fn().mockResolvedValue({ data: s3Stream });

			const readable = createLazyS3Readable(getStream);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await (readable as any)._read();

			s3Stream.emit('data', Buffer.alloc(70 * 1024));

			expect(pauseSpy).toHaveBeenCalledTimes(1);
		});
	});
});
