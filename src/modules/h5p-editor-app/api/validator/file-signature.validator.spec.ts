import { hasMatchingFileSignature } from './file-signature.validator';

describe('hasMatchingFileSignature', () => {
	const bytes = (...values: number[]): Buffer => Buffer.from(values);
	const ascii = (text: string): Buffer => Buffer.from(text, 'latin1');

	describe('when the content matches the extension', () => {
		it.each([
			['image.png', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00)],
			['image.JPG', bytes(0xff, 0xd8, 0xff, 0xe0)],
			['image.gif', ascii('GIF89a...')],
			['image.tiff', bytes(0x4d, 0x4d, 0x00, 0x2a)],
			['video.mp4', Buffer.concat([bytes(0x00, 0x00, 0x00, 0x18), ascii('ftypisom')])],
			['audio.mp3', ascii('ID3\u0004')],
			['audio.mp3', bytes(0xff, 0xfb, 0x90)],
			['audio.wav', ascii('RIFF\u0000\u0000\u0000\u0000WAVEfmt ')],
			['document.pdf', ascii('%PDF-1.7')],
			['document.docx', bytes(0x50, 0x4b, 0x03, 0x04)],
			['document.xls', bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)],
			['model.glb', ascii('glTF')],
		])('should accept %s', (filename, data) => {
			expect(hasMatchingFileSignature(filename, data)).toBe(true);
		});
	});

	describe('when the content does not match the extension', () => {
		it.each([
			['image.png', ascii('<svg onload="alert(1)"></svg>')],
			['image.jpg', ascii('<html><script>alert(1)</script></html>')],
			['document.pdf', bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)],
			['audio.wav', ascii('RIFF\u0000\u0000\u0000\u0000AVI ')],
			['image.png', bytes(0x89, 0x50, 0x4e)],
			['image.png', Buffer.alloc(0)],
			['image.png', undefined],
		])('should reject %s', (filename, data) => {
			expect(hasMatchingFileSignature(filename, data)).toBe(false);
		});
	});

	describe('when the extension has no known signature', () => {
		it.each([
			'image.svg',
			'data.json',
			'notes.txt',
			'subtitles.vtt',
			'no-extension',
			'file.constructor',
			'file.__proto__',
		])('should accept %s regardless of content', (filename) => {
			expect(hasMatchingFileSignature(filename, ascii('anything'))).toBe(true);
		});
	});
});
