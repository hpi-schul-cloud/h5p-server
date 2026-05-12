import { Readable } from 'node:stream';

/**
 * Returns a lazy Readable that only opens the S3 connection when first read.
 * This prevents S3 streams from being opened while yazl is still consuming
 * a previous large file, which would cause the streams to sit idle and hit
 * the S3 client's inactivity timeout before yazl ever reads them.
 * @param getStream A function that fetches the S3 stream on demand.
 */
export function createLazyS3Readable(getStream: () => Promise<{ data: Readable }>): Readable {
	let s3Stream: Readable | null = null;
	let initializing = false;
	let onData: ((chunk: Buffer) => void) | null = null;
	let onEnd: (() => void) | null = null;
	let onError: ((err: Error) => void) | null = null;

	const cleanup = (): void => {
		if (!s3Stream) {
			return;
		}

		const stream = s3Stream;
		s3Stream = null;

		if (onData) {
			stream.removeListener('data', onData);
		}
		if (onEnd) {
			stream.removeListener('end', onEnd);
		}
		if (onError) {
			stream.removeListener('error', onError);
		}

		if (!stream.destroyed) {
			stream.destroy();
		}
	};

	const lazyReadable = new Readable({
		async read(): Promise<void> {
			if (s3Stream) {
				// _read() is called when the consumer wants more data.
				// If the S3 stream was paused due to backpressure, resume it now.
				s3Stream.resume();

				return;
			}
			if (initializing) {
				// Already waiting for the S3 connection; the data handler will push
				// chunks once the connection is established.
				return;
			}

			initializing = true;
			try {
				const { data } = await getStream();
				if (lazyReadable.destroyed) {
					data.destroy();

					return;
				}

				s3Stream = data;
				onData = (chunk: Buffer): void => {
					if (!lazyReadable.push(chunk)) {
						data.pause();
					}
				};
				onEnd = (): void => {
					lazyReadable.push(null);
				};
				onError = (err: Error): void => {
					lazyReadable.destroy(err);
				};

				data.on('data', onData);
				data.on('end', onEnd);
				data.on('error', onError);
			} catch (err) {
				lazyReadable.destroy(err instanceof Error ? err : new Error(String(err)));
			}
		},
	});

	lazyReadable.once('close', cleanup);

	return lazyReadable;
}
