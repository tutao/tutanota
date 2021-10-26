/*!
 * +----------------------------------------------------------------------------------+
 * | murmurHash3.js v3.0.0 (http://github.com/karanlyons/murmurHash3.js)              |
 * | A TypeScript/JavaScript implementation of MurmurHash3's hashing algorithms.      |
 * |----------------------------------------------------------------------------------|
 * | Copyright (c) 2012-2020 Karan Lyons. Freely distributable under the MIT license. |
 * +----------------------------------------------------------------------------------+
 *
 * tutao: heavily stripped down to only take x86hash32, removed types for now.
 * This implementation should handle non-ascii characters.
 */

import {stringToUtf8Uint8Array} from "@tutao/tutanota-utils"

function x86fmix32(h) {
	h ^= h >>> 16;
	h = mul32(h, 0x85ebca6b);
	h ^= h >>> 13;
	h = mul32(h, 0xc2b2ae35);
	h ^= h >>> 16;

	return h;
}


const x86hash32c1 = 0xcc9e2d51;
const x86hash32c2 = 0x1b873593;

function x86mix32(h, k) {
	k = mul32(k, x86hash32c1);
	k = rol32(k, 15);
	k = mul32(k, x86hash32c2);

	h ^= k;
	h = rol32(h, 13);
	h = mul32(h, 5) + 0xe6546b64;

	return h;
}


function mul32(m, n) {
	return ((m & 0xffff) * n) + ((((m >>> 16) * n) & 0xffff) << 16);
}

function rol32(n, r) {
	return (n << r) | (n >>> (32 - r));
}

export default function x86hash32(value) {
	let state = 0
	const buf = stringToUtf8Uint8Array(value)

	let h1;
	let i;
	let len;
	h1 = state;
	i = 0;
	len = 0;

	const dtv = new DataView(buf.buffer, buf.byteOffset);
	const remainder = (buf.byteLength - i) % 4;
	const bytes = buf.byteLength - i - remainder;
	len += bytes;

	for (; i < bytes; i += 4) {
		h1 = x86mix32(h1, dtv.getUint32(i, true));
	}

	len += remainder;
	let k1 = 0x0;
	// noinspection FallThroughInSwitchStatementJS
	switch (remainder) {
		case 3:
			k1 ^= buf[i + 2] << 16;
		case 2:
			k1 ^= buf[i + 1] << 8;
		case 1:
			k1 ^= buf[i];
			k1 = mul32(k1, x86hash32c1);
			k1 = rol32(k1, 15);
			k1 = mul32(k1, x86hash32c2);
			h1 ^= k1;
	}

	h1 ^= len & 0xffffffff;
	h1 = x86fmix32(h1);

	return h1 >>> 0;
}

