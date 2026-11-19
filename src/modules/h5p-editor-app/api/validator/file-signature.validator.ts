import { extname } from 'node:path';

type SignatureMatcher = (data: Buffer) => boolean;

const startsWith =
	(...signature: number[]): SignatureMatcher =>
	(data) =>
		data.length >= signature.length && signature.every((byte, index) => data[index] === byte);

const asciiAt =
	(offset: number, text: string): SignatureMatcher =>
	(data) =>
		data.length >= offset + text.length && data.toString('latin1', offset, offset + text.length) === text;

const anyOf =
	(...matchers: SignatureMatcher[]): SignatureMatcher =>
	(data) =>
		matchers.some((matcher) => matcher(data));

const allOf =
	(...matchers: SignatureMatcher[]): SignatureMatcher =>
	(data) =>
		matchers.every((matcher) => matcher(data));

const mpegAudioFrameSync: SignatureMatcher = (data) =>
	data.length >= 2 && data[0] === 0xff && (data[1] & 0xe0) === 0xe0;

const jpeg = startsWith(0xff, 0xd8, 0xff);
const tiff = anyOf(
	startsWith(0x49, 0x49, 0x2a, 0x00),
	startsWith(0x4d, 0x4d, 0x00, 0x2a),
	startsWith(0x49, 0x49, 0x2b, 0x00),
	startsWith(0x4d, 0x4d, 0x00, 0x2b)
);
const isoBaseMedia = asciiAt(4, 'ftyp');
const oleCompoundFile = startsWith(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
const zip = anyOf(startsWith(0x50, 0x4b, 0x03, 0x04), startsWith(0x50, 0x4b, 0x05, 0x06));

// Only binary formats are listed; text-based formats (svg, json, txt, csv, ...) have no reliable signature.
const FILE_SIGNATURES: Record<string, SignatureMatcher> = {
	png: startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
	jpg: jpeg,
	jpeg: jpeg,
	gif: anyOf(asciiAt(0, 'GIF87a'), asciiAt(0, 'GIF89a')),
	bmp: asciiAt(0, 'BM'),
	tif: tiff,
	tiff: tiff,
	webm: startsWith(0x1a, 0x45, 0xdf, 0xa3),
	mp4: isoBaseMedia,
	m4a: isoBaseMedia,
	ogg: asciiAt(0, 'OggS'),
	mp3: anyOf(asciiAt(0, 'ID3'), mpegAudioFrameSync),
	wav: allOf(asciiAt(0, 'RIFF'), asciiAt(8, 'WAVE')),
	pdf: asciiAt(0, '%PDF-'),
	doc: oleCompoundFile,
	xls: oleCompoundFile,
	ppt: oleCompoundFile,
	docx: zip,
	xlsx: zip,
	pptx: zip,
	odt: zip,
	ods: zip,
	odp: zip,
	glb: asciiAt(0, 'glTF'),
};

/**
 * Checks whether the leading bytes of a file match the signature expected for its extension.
 * Files with an extension without a known signature are accepted, as they cannot be verified.
 */
export const hasMatchingFileSignature = (filename: string, data: Buffer | undefined): boolean => {
	const extension = extname(filename).slice(1).toLowerCase();
	const matcher = FILE_SIGNATURES[extension];

	if (!matcher) {
		return true;
	}

	const isMatching = !!data && matcher(data);

	return isMatching;
};
