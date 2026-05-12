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
				s3Stream = data;
				data.on('data', (chunk: Buffer) => {
					if (!lazyReadable.push(chunk)) {
						data.pause();
					}
				});
				data.on('end', () => lazyReadable.push(null));
				data.on('error', (err: Error) => lazyReadable.destroy(err));
			} catch (err) {
				lazyReadable.destroy(err instanceof Error ? err : new Error(String(err)));
			}
		},
	});

	return lazyReadable;
}
