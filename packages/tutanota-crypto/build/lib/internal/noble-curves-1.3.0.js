// x25519 from noble-curves-1.3.0
//
// How to rebuild this file
// 1. Clone noble-curves https://github.com/paulmillr/noble-curves and CD into it
// 2. Run `npm i` and then `npm run build`
// 3. CD into `build`
// 4. Rewrite input.js into just this one line: export {x25519} from '@noble/curves/ed25519'
// 5. Run `npm i` and `npm run build`
// 6. Copy contents of noble-curves.js to below
"use strict";
var nobleCurves = (() => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
        for (var name in all)
            __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
        if (from && typeof from === "object" || typeof from === "function") {
            for (let key of __getOwnPropNames(from))
                if (!__hasOwnProp.call(to, key) && key !== except)
                    __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
        }
        return to;
    };
    var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
    // input.js
    var input_exports = {};
    __export(input_exports, {
        x25519: () => x25519
    });
    // ../node_modules/@noble/hashes/esm/_assert.js
    function isBytes(a) {
        return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
    }
    function bytes(b, ...lengths) {
        if (!isBytes(b))
            throw new Error("Expected Uint8Array");
        if (lengths.length > 0 && !lengths.includes(b.length))
            throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
    }
    function exists(instance, checkFinished = true) {
        if (instance.destroyed)
            throw new Error("Hash instance has been destroyed");
        if (checkFinished && instance.finished)
            throw new Error("Hash#digest() has already been called");
    }
    function output(out, instance) {
        bytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
            throw new Error(`digestInto() expects output buffer of length at least ${min}`);
        }
    }
    // ../node_modules/@noble/hashes/esm/crypto.js
    var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
    // ../node_modules/@noble/hashes/esm/utils.js
    function isBytes2(a) {
        return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
    }
    var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
    if (!isLE)
        throw new Error("Non little-endian hardware is not supported");
    function utf8ToBytes(str) {
        if (typeof str !== "string")
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str));
    }
    function toBytes(data) {
        if (typeof data === "string")
            data = utf8ToBytes(data);
        if (!isBytes2(data))
            throw new Error(`expected Uint8Array, got ${typeof data}`);
        return data;
    }
    function concatBytes(...arrays) {
        let sum = 0;
        for (let i = 0; i < arrays.length; i++) {
            const a = arrays[i];
            if (!isBytes2(a))
                throw new Error("Uint8Array expected");
            sum += a.length;
        }
        const res = new Uint8Array(sum);
        for (let i = 0, pad = 0; i < arrays.length; i++) {
            const a = arrays[i];
            res.set(a, pad);
            pad += a.length;
        }
        return res;
    }
    var Hash = class {
        // Safe version that clones internal state
        clone() {
            return this._cloneInto();
        }
    };
    var toStr = {}.toString;
    function wrapConstructor(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
    }
    function randomBytes(bytesLength = 32) {
        if (crypto && typeof crypto.getRandomValues === "function") {
            return crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        throw new Error("crypto.getRandomValues must be defined");
    }
    // ../node_modules/@noble/hashes/esm/_sha2.js
    function setBigUint64(view, byteOffset, value, isLE2) {
        if (typeof view.setBigUint64 === "function")
            return view.setBigUint64(byteOffset, value, isLE2);
        const _32n2 = BigInt(32);
        const _u32_max = BigInt(4294967295);
        const wh = Number(value >> _32n2 & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE2 ? 4 : 0;
        const l = isLE2 ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE2);
        view.setUint32(byteOffset + l, wl, isLE2);
    }
    var SHA2 = class extends Hash {
        constructor(blockLen, outputLen, padOffset, isLE2) {
            super();
            this.blockLen = blockLen;
            this.outputLen = outputLen;
            this.padOffset = padOffset;
            this.isLE = isLE2;
            this.finished = false;
            this.length = 0;
            this.pos = 0;
            this.destroyed = false;
            this.buffer = new Uint8Array(blockLen);
            this.view = createView(this.buffer);
        }
        update(data) {
            exists(this);
            const { view, buffer, blockLen } = this;
            data = toBytes(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                if (take === blockLen) {
                    const dataView = createView(data);
                    for (; blockLen <= len - pos; pos += blockLen)
                        this.process(dataView, pos);
                    continue;
                }
                buffer.set(data.subarray(pos, pos + take), this.pos);
                this.pos += take;
                pos += take;
                if (this.pos === blockLen) {
                    this.process(view, 0);
                    this.pos = 0;
                }
            }
            this.length += data.length;
            this.roundClean();
            return this;
        }
        digestInto(out) {
            exists(this);
            output(out, this);
            this.finished = true;
            const { buffer, view, blockLen, isLE: isLE2 } = this;
            let { pos } = this;
            buffer[pos++] = 128;
            this.buffer.subarray(pos).fill(0);
            if (this.padOffset > blockLen - pos) {
                this.process(view, 0);
                pos = 0;
            }
            for (let i = pos; i < blockLen; i++)
                buffer[i] = 0;
            setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
            this.process(view, 0);
            const oview = createView(out);
            const len = this.outputLen;
            if (len % 4)
                throw new Error("_sha2: outputLen should be aligned to 32bit");
            const outLen = len / 4;
            const state = this.get();
            if (outLen > state.length)
                throw new Error("_sha2: outputLen bigger than state");
            for (let i = 0; i < outLen; i++)
                oview.setUint32(4 * i, state[i], isLE2);
        }
        digest() {
            const { buffer, outputLen } = this;
            this.digestInto(buffer);
            const res = buffer.slice(0, outputLen);
            this.destroy();
            return res;
        }
        _cloneInto(to) {
            to || (to = new this.constructor());
            to.set(...this.get());
            const { blockLen, buffer, length, finished, destroyed, pos } = this;
            to.length = length;
            to.pos = pos;
            to.finished = finished;
            to.destroyed = destroyed;
            if (length % blockLen)
                to.buffer.set(buffer);
            return to;
        }
    };
    // ../node_modules/@noble/hashes/esm/_u64.js
    var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    var _32n = /* @__PURE__ */ BigInt(32);
    function fromBig(n, le = false) {
        if (le)
            return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
        return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
    }
    function split(lst, le = false) {
        let Ah = new Uint32Array(lst.length);
        let Al = new Uint32Array(lst.length);
        for (let i = 0; i < lst.length; i++) {
            const { h, l } = fromBig(lst[i], le);
            [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
    }
    var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
    var shrSH = (h, _l, s) => h >>> s;
    var shrSL = (h, l, s) => h << 32 - s | l >>> s;
    var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
    var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
    var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
    var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
    var rotr32H = (_h, l) => l;
    var rotr32L = (h, _l) => h;
    var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
    function add(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
    }
    var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
    var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
    var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
    var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
    var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
    var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
    var u64 = {
        fromBig,
        split,
        toBig,
        shrSH,
        shrSL,
        rotrSH,
        rotrSL,
        rotrBH,
        rotrBL,
        rotr32H,
        rotr32L,
        rotlSH,
        rotlSL,
        rotlBH,
        rotlBL,
        add,
        add3L,
        add3H,
        add4L,
        add4H,
        add5H,
        add5L
    };
    var u64_default = u64;
    // ../node_modules/@noble/hashes/esm/sha512.js
    var [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64_default.split([
        "0x428a2f98d728ae22",
        "0x7137449123ef65cd",
        "0xb5c0fbcfec4d3b2f",
        "0xe9b5dba58189dbbc",
        "0x3956c25bf348b538",
        "0x59f111f1b605d019",
        "0x923f82a4af194f9b",
        "0xab1c5ed5da6d8118",
        "0xd807aa98a3030242",
        "0x12835b0145706fbe",
        "0x243185be4ee4b28c",
        "0x550c7dc3d5ffb4e2",
        "0x72be5d74f27b896f",
        "0x80deb1fe3b1696b1",
        "0x9bdc06a725c71235",
        "0xc19bf174cf692694",
        "0xe49b69c19ef14ad2",
        "0xefbe4786384f25e3",
        "0x0fc19dc68b8cd5b5",
        "0x240ca1cc77ac9c65",
        "0x2de92c6f592b0275",
        "0x4a7484aa6ea6e483",
        "0x5cb0a9dcbd41fbd4",
        "0x76f988da831153b5",
        "0x983e5152ee66dfab",
        "0xa831c66d2db43210",
        "0xb00327c898fb213f",
        "0xbf597fc7beef0ee4",
        "0xc6e00bf33da88fc2",
        "0xd5a79147930aa725",
        "0x06ca6351e003826f",
        "0x142929670a0e6e70",
        "0x27b70a8546d22ffc",
        "0x2e1b21385c26c926",
        "0x4d2c6dfc5ac42aed",
        "0x53380d139d95b3df",
        "0x650a73548baf63de",
        "0x766a0abb3c77b2a8",
        "0x81c2c92e47edaee6",
        "0x92722c851482353b",
        "0xa2bfe8a14cf10364",
        "0xa81a664bbc423001",
        "0xc24b8b70d0f89791",
        "0xc76c51a30654be30",
        "0xd192e819d6ef5218",
        "0xd69906245565a910",
        "0xf40e35855771202a",
        "0x106aa07032bbd1b8",
        "0x19a4c116b8d2d0c8",
        "0x1e376c085141ab53",
        "0x2748774cdf8eeb99",
        "0x34b0bcb5e19b48a8",
        "0x391c0cb3c5c95a63",
        "0x4ed8aa4ae3418acb",
        "0x5b9cca4f7763e373",
        "0x682e6ff3d6b2b8a3",
        "0x748f82ee5defb2fc",
        "0x78a5636f43172f60",
        "0x84c87814a1f0ab72",
        "0x8cc702081a6439ec",
        "0x90befffa23631e28",
        "0xa4506cebde82bde9",
        "0xbef9a3f7b2c67915",
        "0xc67178f2e372532b",
        "0xca273eceea26619c",
        "0xd186b8c721c0c207",
        "0xeada7dd6cde0eb1e",
        "0xf57d4f7fee6ed178",
        "0x06f067aa72176fba",
        "0x0a637dc5a2c898a6",
        "0x113f9804bef90dae",
        "0x1b710b35131c471b",
        "0x28db77f523047d84",
        "0x32caab7b40c72493",
        "0x3c9ebe0a15c9bebc",
        "0x431d67c49c100d4c",
        "0x4cc5d4becb3e42b6",
        "0x597f299cfc657e2a",
        "0x5fcb6fab3ad6faec",
        "0x6c44198c4a475817"
    ].map((n) => BigInt(n))))();
    var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
    var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
    var SHA512 = class extends SHA2 {
        constructor() {
            super(128, 64, 16, false);
            this.Ah = 1779033703 | 0;
            this.Al = 4089235720 | 0;
            this.Bh = 3144134277 | 0;
            this.Bl = 2227873595 | 0;
            this.Ch = 1013904242 | 0;
            this.Cl = 4271175723 | 0;
            this.Dh = 2773480762 | 0;
            this.Dl = 1595750129 | 0;
            this.Eh = 1359893119 | 0;
            this.El = 2917565137 | 0;
            this.Fh = 2600822924 | 0;
            this.Fl = 725511199 | 0;
            this.Gh = 528734635 | 0;
            this.Gl = 4215389547 | 0;
            this.Hh = 1541459225 | 0;
            this.Hl = 327033209 | 0;
        }
        // prettier-ignore
        get() {
            const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        // prettier-ignore
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
            this.Ah = Ah | 0;
            this.Al = Al | 0;
            this.Bh = Bh | 0;
            this.Bl = Bl | 0;
            this.Ch = Ch | 0;
            this.Cl = Cl | 0;
            this.Dh = Dh | 0;
            this.Dl = Dl | 0;
            this.Eh = Eh | 0;
            this.El = El | 0;
            this.Fh = Fh | 0;
            this.Fl = Fl | 0;
            this.Gh = Gh | 0;
            this.Gl = Gl | 0;
            this.Hh = Hh | 0;
            this.Hl = Hl | 0;
        }
        process(view, offset) {
            for (let i = 0; i < 16; i++, offset += 4) {
                SHA512_W_H[i] = view.getUint32(offset);
                SHA512_W_L[i] = view.getUint32(offset += 4);
            }
            for (let i = 16; i < 80; i++) {
                const W15h = SHA512_W_H[i - 15] | 0;
                const W15l = SHA512_W_L[i - 15] | 0;
                const s0h = u64_default.rotrSH(W15h, W15l, 1) ^ u64_default.rotrSH(W15h, W15l, 8) ^ u64_default.shrSH(W15h, W15l, 7);
                const s0l = u64_default.rotrSL(W15h, W15l, 1) ^ u64_default.rotrSL(W15h, W15l, 8) ^ u64_default.shrSL(W15h, W15l, 7);
                const W2h = SHA512_W_H[i - 2] | 0;
                const W2l = SHA512_W_L[i - 2] | 0;
                const s1h = u64_default.rotrSH(W2h, W2l, 19) ^ u64_default.rotrBH(W2h, W2l, 61) ^ u64_default.shrSH(W2h, W2l, 6);
                const s1l = u64_default.rotrSL(W2h, W2l, 19) ^ u64_default.rotrBL(W2h, W2l, 61) ^ u64_default.shrSL(W2h, W2l, 6);
                const SUMl = u64_default.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
                const SUMh = u64_default.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
                SHA512_W_H[i] = SUMh | 0;
                SHA512_W_L[i] = SUMl | 0;
            }
            let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
            for (let i = 0; i < 80; i++) {
                const sigma1h = u64_default.rotrSH(Eh, El, 14) ^ u64_default.rotrSH(Eh, El, 18) ^ u64_default.rotrBH(Eh, El, 41);
                const sigma1l = u64_default.rotrSL(Eh, El, 14) ^ u64_default.rotrSL(Eh, El, 18) ^ u64_default.rotrBL(Eh, El, 41);
                const CHIh = Eh & Fh ^ ~Eh & Gh;
                const CHIl = El & Fl ^ ~El & Gl;
                const T1ll = u64_default.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
                const T1h = u64_default.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
                const T1l = T1ll | 0;
                const sigma0h = u64_default.rotrSH(Ah, Al, 28) ^ u64_default.rotrBH(Ah, Al, 34) ^ u64_default.rotrBH(Ah, Al, 39);
                const sigma0l = u64_default.rotrSL(Ah, Al, 28) ^ u64_default.rotrBL(Ah, Al, 34) ^ u64_default.rotrBL(Ah, Al, 39);
                const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
                const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
                Hh = Gh | 0;
                Hl = Gl | 0;
                Gh = Fh | 0;
                Gl = Fl | 0;
                Fh = Eh | 0;
                Fl = El | 0;
                ({ h: Eh, l: El } = u64_default.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
                Dh = Ch | 0;
                Dl = Cl | 0;
                Ch = Bh | 0;
                Cl = Bl | 0;
                Bh = Ah | 0;
                Bl = Al | 0;
                const All = u64_default.add3L(T1l, sigma0l, MAJl);
                Ah = u64_default.add3H(All, T1h, sigma0h, MAJh);
                Al = All | 0;
            }
            ({ h: Ah, l: Al } = u64_default.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
            ({ h: Bh, l: Bl } = u64_default.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
            ({ h: Ch, l: Cl } = u64_default.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
            ({ h: Dh, l: Dl } = u64_default.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
            ({ h: Eh, l: El } = u64_default.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
            ({ h: Fh, l: Fl } = u64_default.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
            ({ h: Gh, l: Gl } = u64_default.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
            ({ h: Hh, l: Hl } = u64_default.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
            this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
            SHA512_W_H.fill(0);
            SHA512_W_L.fill(0);
        }
        destroy() {
            this.buffer.fill(0);
            this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    };
    var sha512 = /* @__PURE__ */ wrapConstructor(() => new SHA512());
    // ../esm/abstract/utils.js
    var _0n = BigInt(0);
    var _1n = BigInt(1);
    var _2n = BigInt(2);
    function isBytes3(a) {
        return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
    }
    var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex(bytes2) {
        if (!isBytes3(bytes2))
            throw new Error("Uint8Array expected");
        let hex = "";
        for (let i = 0; i < bytes2.length; i++) {
            hex += hexes[bytes2[i]];
        }
        return hex;
    }
    function hexToNumber(hex) {
        if (typeof hex !== "string")
            throw new Error("hex string expected, got " + typeof hex);
        return BigInt(hex === "" ? "0" : `0x${hex}`);
    }
    var asciis = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 };
    function asciiToBase16(char) {
        if (char >= asciis._0 && char <= asciis._9)
            return char - asciis._0;
        if (char >= asciis._A && char <= asciis._F)
            return char - (asciis._A - 10);
        if (char >= asciis._a && char <= asciis._f)
            return char - (asciis._a - 10);
        return;
    }
    function hexToBytes(hex) {
        if (typeof hex !== "string")
            throw new Error("hex string expected, got " + typeof hex);
        const hl = hex.length;
        const al = hl / 2;
        if (hl % 2)
            throw new Error("padded hex string expected, got unpadded hex of length " + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
            const n1 = asciiToBase16(hex.charCodeAt(hi));
            const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
            if (n1 === void 0 || n2 === void 0) {
                const char = hex[hi] + hex[hi + 1];
                throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
            }
            array[ai] = n1 * 16 + n2;
        }
        return array;
    }
    function bytesToNumberBE(bytes2) {
        return hexToNumber(bytesToHex(bytes2));
    }
    function bytesToNumberLE(bytes2) {
        if (!isBytes3(bytes2))
            throw new Error("Uint8Array expected");
        return hexToNumber(bytesToHex(Uint8Array.from(bytes2).reverse()));
    }
    function numberToBytesBE(n, len) {
        return hexToBytes(n.toString(16).padStart(len * 2, "0"));
    }
    function numberToBytesLE(n, len) {
        return numberToBytesBE(n, len).reverse();
    }
    function ensureBytes(title, hex, expectedLength) {
        let res;
        if (typeof hex === "string") {
            try {
                res = hexToBytes(hex);
            }
            catch (e) {
                throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
            }
        }
        else if (isBytes3(hex)) {
            res = Uint8Array.from(hex);
        }
        else {
            throw new Error(`${title} must be hex string or Uint8Array`);
        }
        const len = res.length;
        if (typeof expectedLength === "number" && len !== expectedLength)
            throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
        return res;
    }
    function concatBytes2(...arrays) {
        let sum = 0;
        for (let i = 0; i < arrays.length; i++) {
            const a = arrays[i];
            if (!isBytes3(a))
                throw new Error("Uint8Array expected");
            sum += a.length;
        }
        let res = new Uint8Array(sum);
        let pad = 0;
        for (let i = 0; i < arrays.length; i++) {
            const a = arrays[i];
            res.set(a, pad);
            pad += a.length;
        }
        return res;
    }
    var bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;
    var validatorFns = {
        bigint: (val) => typeof val === "bigint",
        function: (val) => typeof val === "function",
        boolean: (val) => typeof val === "boolean",
        string: (val) => typeof val === "string",
        stringOrUint8Array: (val) => typeof val === "string" || isBytes3(val),
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
    };
    function validateObject(object, validators, optValidators = {}) {
        const checkField = (fieldName, type, isOptional) => {
            const checkVal = validatorFns[type];
            if (typeof checkVal !== "function")
                throw new Error(`Invalid validator "${type}", expected function`);
            const val = object[fieldName];
            if (isOptional && val === void 0)
                return;
            if (!checkVal(val, object)) {
                throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
            }
        };
        for (const [fieldName, type] of Object.entries(validators))
            checkField(fieldName, type, false);
        for (const [fieldName, type] of Object.entries(optValidators))
            checkField(fieldName, type, true);
        return object;
    }
    // ../esm/abstract/modular.js
    var _0n2 = BigInt(0);
    var _1n2 = BigInt(1);
    var _2n2 = BigInt(2);
    var _3n = BigInt(3);
    var _4n = BigInt(4);
    var _5n = BigInt(5);
    var _8n = BigInt(8);
    var _9n = BigInt(9);
    var _16n = BigInt(16);
    function mod(a, b) {
        const result = a % b;
        return result >= _0n2 ? result : b + result;
    }
    function pow(num, power, modulo) {
        if (modulo <= _0n2 || power < _0n2)
            throw new Error("Expected power/modulo > 0");
        if (modulo === _1n2)
            return _0n2;
        let res = _1n2;
        while (power > _0n2) {
            if (power & _1n2)
                res = res * num % modulo;
            num = num * num % modulo;
            power >>= _1n2;
        }
        return res;
    }
    function pow2(x, power, modulo) {
        let res = x;
        while (power-- > _0n2) {
            res *= res;
            res %= modulo;
        }
        return res;
    }
    function invert(number, modulo) {
        if (number === _0n2 || modulo <= _0n2) {
            throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
        }
        let a = mod(number, modulo);
        let b = modulo;
        let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
        while (a !== _0n2) {
            const q = b / a;
            const r = b % a;
            const m = x - u * q;
            const n = y - v * q;
            b = a, a = r, x = u, y = v, u = m, v = n;
        }
        const gcd = b;
        if (gcd !== _1n2)
            throw new Error("invert: does not exist");
        return mod(x, modulo);
    }
    function tonelliShanks(P) {
        const legendreC = (P - _1n2) / _2n2;
        let Q, S, Z;
        for (Q = P - _1n2, S = 0; Q % _2n2 === _0n2; Q /= _2n2, S++)
            ;
        for (Z = _2n2; Z < P && pow(Z, legendreC, P) !== P - _1n2; Z++)
            ;
        if (S === 1) {
            const p1div4 = (P + _1n2) / _4n;
            return function tonelliFast(Fp2, n) {
                const root = Fp2.pow(n, p1div4);
                if (!Fp2.eql(Fp2.sqr(root), n))
                    throw new Error("Cannot find square root");
                return root;
            };
        }
        const Q1div2 = (Q + _1n2) / _2n2;
        return function tonelliSlow(Fp2, n) {
            if (Fp2.pow(n, legendreC) === Fp2.neg(Fp2.ONE))
                throw new Error("Cannot find square root");
            let r = S;
            let g = Fp2.pow(Fp2.mul(Fp2.ONE, Z), Q);
            let x = Fp2.pow(n, Q1div2);
            let b = Fp2.pow(n, Q);
            while (!Fp2.eql(b, Fp2.ONE)) {
                if (Fp2.eql(b, Fp2.ZERO))
                    return Fp2.ZERO;
                let m = 1;
                for (let t2 = Fp2.sqr(b); m < r; m++) {
                    if (Fp2.eql(t2, Fp2.ONE))
                        break;
                    t2 = Fp2.sqr(t2);
                }
                const ge = Fp2.pow(g, _1n2 << BigInt(r - m - 1));
                g = Fp2.sqr(ge);
                x = Fp2.mul(x, ge);
                b = Fp2.mul(b, g);
                r = m;
            }
            return x;
        };
    }
    function FpSqrt(P) {
        if (P % _4n === _3n) {
            const p1div4 = (P + _1n2) / _4n;
            return function sqrt3mod4(Fp2, n) {
                const root = Fp2.pow(n, p1div4);
                if (!Fp2.eql(Fp2.sqr(root), n))
                    throw new Error("Cannot find square root");
                return root;
            };
        }
        if (P % _8n === _5n) {
            const c1 = (P - _5n) / _8n;
            return function sqrt5mod8(Fp2, n) {
                const n2 = Fp2.mul(n, _2n2);
                const v = Fp2.pow(n2, c1);
                const nv = Fp2.mul(n, v);
                const i = Fp2.mul(Fp2.mul(nv, _2n2), v);
                const root = Fp2.mul(nv, Fp2.sub(i, Fp2.ONE));
                if (!Fp2.eql(Fp2.sqr(root), n))
                    throw new Error("Cannot find square root");
                return root;
            };
        }
        if (P % _16n === _9n) {
        }
        return tonelliShanks(P);
    }
    var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
    var FIELD_FIELDS = [
        "create",
        "isValid",
        "is0",
        "neg",
        "inv",
        "sqrt",
        "sqr",
        "eql",
        "add",
        "sub",
        "mul",
        "pow",
        "div",
        "addN",
        "subN",
        "mulN",
        "sqrN"
    ];
    function validateField(field) {
        const initial = {
            ORDER: "bigint",
            MASK: "bigint",
            BYTES: "isSafeInteger",
            BITS: "isSafeInteger"
        };
        const opts = FIELD_FIELDS.reduce((map, val) => {
            map[val] = "function";
            return map;
        }, initial);
        return validateObject(field, opts);
    }
    function FpPow(f, num, power) {
        if (power < _0n2)
            throw new Error("Expected power > 0");
        if (power === _0n2)
            return f.ONE;
        if (power === _1n2)
            return num;
        let p = f.ONE;
        let d = num;
        while (power > _0n2) {
            if (power & _1n2)
                p = f.mul(p, d);
            d = f.sqr(d);
            power >>= _1n2;
        }
        return p;
    }
    function FpInvertBatch(f, nums) {
        const tmp = new Array(nums.length);
        const lastMultiplied = nums.reduce((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = acc;
            return f.mul(acc, num);
        }, f.ONE);
        const inverted = f.inv(lastMultiplied);
        nums.reduceRight((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = f.mul(acc, tmp[i]);
            return f.mul(acc, num);
        }, inverted);
        return tmp;
    }
    function nLength(n, nBitLength) {
        const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
        const nByteLength = Math.ceil(_nBitLength / 8);
        return { nBitLength: _nBitLength, nByteLength };
    }
    function Field(ORDER, bitLen, isLE2 = false, redef = {}) {
        if (ORDER <= _0n2)
            throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
        const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
        if (BYTES > 2048)
            throw new Error("Field lengths over 2048 bytes are not supported");
        const sqrtP = FpSqrt(ORDER);
        const f = Object.freeze({
            ORDER,
            BITS,
            BYTES,
            MASK: bitMask(BITS),
            ZERO: _0n2,
            ONE: _1n2,
            create: (num) => mod(num, ORDER),
            isValid: (num) => {
                if (typeof num !== "bigint")
                    throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
                return _0n2 <= num && num < ORDER;
            },
            is0: (num) => num === _0n2,
            isOdd: (num) => (num & _1n2) === _1n2,
            neg: (num) => mod(-num, ORDER),
            eql: (lhs, rhs) => lhs === rhs,
            sqr: (num) => mod(num * num, ORDER),
            add: (lhs, rhs) => mod(lhs + rhs, ORDER),
            sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
            mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
            pow: (num, power) => FpPow(f, num, power),
            div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
            // Same as above, but doesn't normalize
            sqrN: (num) => num * num,
            addN: (lhs, rhs) => lhs + rhs,
            subN: (lhs, rhs) => lhs - rhs,
            mulN: (lhs, rhs) => lhs * rhs,
            inv: (num) => invert(num, ORDER),
            sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
            invertBatch: (lst) => FpInvertBatch(f, lst),
            // TODO: do we really need constant cmov?
            // We don't have const-time bigints anyway, so probably will be not very useful
            cmov: (a, b, c) => c ? b : a,
            toBytes: (num) => isLE2 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
            fromBytes: (bytes2) => {
                if (bytes2.length !== BYTES)
                    throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes2.length}`);
                return isLE2 ? bytesToNumberLE(bytes2) : bytesToNumberBE(bytes2);
            }
        });
        return Object.freeze(f);
    }
    function FpSqrtEven(Fp2, elm) {
        if (!Fp2.isOdd)
            throw new Error(`Field doesn't have isOdd`);
        const root = Fp2.sqrt(elm);
        return Fp2.isOdd(root) ? Fp2.neg(root) : root;
    }
    // ../esm/abstract/curve.js
    var _0n3 = BigInt(0);
    var _1n3 = BigInt(1);
    function wNAF(c, bits) {
        const constTimeNegate = (condition, item) => {
            const neg = item.negate();
            return condition ? neg : item;
        };
        const opts = (W) => {
            const windows = Math.ceil(bits / W) + 1;
            const windowSize = 2 ** (W - 1);
            return { windows, windowSize };
        };
        return {
            constTimeNegate,
            // non-const time multiplication ladder
            unsafeLadder(elm, n) {
                let p = c.ZERO;
                let d = elm;
                while (n > _0n3) {
                    if (n & _1n3)
                        p = p.add(d);
                    d = d.double();
                    n >>= _1n3;
                }
                return p;
            },
            /**
             * Creates a wNAF precomputation window. Used for caching.
             * Default window size is set by `utils.precompute()` and is equal to 8.
             * Number of precomputed points depends on the curve size:
             * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
             * - 𝑊 is the window size
             * - 𝑛 is the bitlength of the curve order.
             * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
             * @returns precomputed point tables flattened to a single array
             */
            precomputeWindow(elm, W) {
                const { windows, windowSize } = opts(W);
                const points = [];
                let p = elm;
                let base = p;
                for (let window = 0; window < windows; window++) {
                    base = p;
                    points.push(base);
                    for (let i = 1; i < windowSize; i++) {
                        base = base.add(p);
                        points.push(base);
                    }
                    p = base.double();
                }
                return points;
            },
            /**
             * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
             * @param W window size
             * @param precomputes precomputed tables
             * @param n scalar (we don't check here, but should be less than curve order)
             * @returns real and fake (for const-time) points
             */
            wNAF(W, precomputes, n) {
                const { windows, windowSize } = opts(W);
                let p = c.ZERO;
                let f = c.BASE;
                const mask = BigInt(2 ** W - 1);
                const maxNumber = 2 ** W;
                const shiftBy = BigInt(W);
                for (let window = 0; window < windows; window++) {
                    const offset = window * windowSize;
                    let wbits = Number(n & mask);
                    n >>= shiftBy;
                    if (wbits > windowSize) {
                        wbits -= maxNumber;
                        n += _1n3;
                    }
                    const offset1 = offset;
                    const offset2 = offset + Math.abs(wbits) - 1;
                    const cond1 = window % 2 !== 0;
                    const cond2 = wbits < 0;
                    if (wbits === 0) {
                        f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                    }
                    else {
                        p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                    }
                }
                return { p, f };
            },
            wNAFCached(P, precomputesMap, n, transform) {
                const W = P._WINDOW_SIZE || 1;
                let comp = precomputesMap.get(P);
                if (!comp) {
                    comp = this.precomputeWindow(P, W);
                    if (W !== 1) {
                        precomputesMap.set(P, transform(comp));
                    }
                }
                return this.wNAF(W, comp, n);
            }
        };
    }
    function validateBasic(curve) {
        validateField(curve.Fp);
        validateObject(curve, {
            n: "bigint",
            h: "bigint",
            Gx: "field",
            Gy: "field"
        }, {
            nBitLength: "isSafeInteger",
            nByteLength: "isSafeInteger"
        });
        return Object.freeze({
            ...nLength(curve.n, curve.nBitLength),
            ...curve,
            ...{ p: curve.Fp.ORDER }
        });
    }
    // ../esm/abstract/edwards.js
    var _0n4 = BigInt(0);
    var _1n4 = BigInt(1);
    var _2n3 = BigInt(2);
    var _8n2 = BigInt(8);
    var VERIFY_DEFAULT = { zip215: true };
    function validateOpts(curve) {
        const opts = validateBasic(curve);
        validateObject(curve, {
            hash: "function",
            a: "bigint",
            d: "bigint",
            randomBytes: "function"
        }, {
            adjustScalarBytes: "function",
            domain: "function",
            uvRatio: "function",
            mapToCurve: "function"
        });
        return Object.freeze({ ...opts });
    }
    function twistedEdwards(curveDef) {
        const CURVE = validateOpts(curveDef);
        const { Fp: Fp2, n: CURVE_ORDER, prehash, hash: cHash, randomBytes: randomBytes2, nByteLength, h: cofactor } = CURVE;
        const MASK = _2n3 << BigInt(nByteLength * 8) - _1n4;
        const modP = Fp2.create;
        const uvRatio2 = CURVE.uvRatio || ((u, v) => {
            try {
                return { isValid: true, value: Fp2.sqrt(u * Fp2.inv(v)) };
            }
            catch (e) {
                return { isValid: false, value: _0n4 };
            }
        });
        const adjustScalarBytes2 = CURVE.adjustScalarBytes || ((bytes2) => bytes2);
        const domain = CURVE.domain || ((data, ctx, phflag) => {
            if (ctx.length || phflag)
                throw new Error("Contexts/pre-hash are not supported");
            return data;
        });
        const inBig = (n) => typeof n === "bigint" && _0n4 < n;
        const inRange = (n, max) => inBig(n) && inBig(max) && n < max;
        const in0MaskRange = (n) => n === _0n4 || inRange(n, MASK);
        function assertInRange(n, max) {
            if (inRange(n, max))
                return n;
            throw new Error(`Expected valid scalar < ${max}, got ${typeof n} ${n}`);
        }
        function assertGE0(n) {
            return n === _0n4 ? n : assertInRange(n, CURVE_ORDER);
        }
        const pointPrecomputes = /* @__PURE__ */ new Map();
        function isPoint(other) {
            if (!(other instanceof Point))
                throw new Error("ExtendedPoint expected");
        }
        class Point {
            constructor(ex, ey, ez, et) {
                this.ex = ex;
                this.ey = ey;
                this.ez = ez;
                this.et = et;
                if (!in0MaskRange(ex))
                    throw new Error("x required");
                if (!in0MaskRange(ey))
                    throw new Error("y required");
                if (!in0MaskRange(ez))
                    throw new Error("z required");
                if (!in0MaskRange(et))
                    throw new Error("t required");
            }
            get x() {
                return this.toAffine().x;
            }
            get y() {
                return this.toAffine().y;
            }
            static fromAffine(p) {
                if (p instanceof Point)
                    throw new Error("extended point not allowed");
                const { x, y } = p || {};
                if (!in0MaskRange(x) || !in0MaskRange(y))
                    throw new Error("invalid affine point");
                return new Point(x, y, _1n4, modP(x * y));
            }
            static normalizeZ(points) {
                const toInv = Fp2.invertBatch(points.map((p) => p.ez));
                return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
            }
            // "Private method", don't use it directly
            _setWindowSize(windowSize) {
                this._WINDOW_SIZE = windowSize;
                pointPrecomputes.delete(this);
            }
            // Not required for fromHex(), which always creates valid points.
            // Could be useful for fromAffine().
            assertValidity() {
                const { a, d } = CURVE;
                if (this.is0())
                    throw new Error("bad point: ZERO");
                const { ex: X, ey: Y, ez: Z, et: T } = this;
                const X2 = modP(X * X);
                const Y2 = modP(Y * Y);
                const Z2 = modP(Z * Z);
                const Z4 = modP(Z2 * Z2);
                const aX2 = modP(X2 * a);
                const left = modP(Z2 * modP(aX2 + Y2));
                const right = modP(Z4 + modP(d * modP(X2 * Y2)));
                if (left !== right)
                    throw new Error("bad point: equation left != right (1)");
                const XY = modP(X * Y);
                const ZT = modP(Z * T);
                if (XY !== ZT)
                    throw new Error("bad point: equation left != right (2)");
            }
            // Compare one point to another.
            equals(other) {
                isPoint(other);
                const { ex: X1, ey: Y1, ez: Z1 } = this;
                const { ex: X2, ey: Y2, ez: Z2 } = other;
                const X1Z2 = modP(X1 * Z2);
                const X2Z1 = modP(X2 * Z1);
                const Y1Z2 = modP(Y1 * Z2);
                const Y2Z1 = modP(Y2 * Z1);
                return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
            }
            is0() {
                return this.equals(Point.ZERO);
            }
            negate() {
                return new Point(modP(-this.ex), this.ey, this.ez, modP(-this.et));
            }
            // Fast algo for doubling Extended Point.
            // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
            // Cost: 4M + 4S + 1*a + 6add + 1*2.
            double() {
                const { a } = CURVE;
                const { ex: X1, ey: Y1, ez: Z1 } = this;
                const A = modP(X1 * X1);
                const B = modP(Y1 * Y1);
                const C = modP(_2n3 * modP(Z1 * Z1));
                const D = modP(a * A);
                const x1y1 = X1 + Y1;
                const E = modP(modP(x1y1 * x1y1) - A - B);
                const G2 = D + B;
                const F = G2 - C;
                const H = D - B;
                const X3 = modP(E * F);
                const Y3 = modP(G2 * H);
                const T3 = modP(E * H);
                const Z3 = modP(F * G2);
                return new Point(X3, Y3, Z3, T3);
            }
            // Fast algo for adding 2 Extended Points.
            // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
            // Cost: 9M + 1*a + 1*d + 7add.
            add(other) {
                isPoint(other);
                const { a, d } = CURVE;
                const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
                const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
                if (a === BigInt(-1)) {
                    const A2 = modP((Y1 - X1) * (Y2 + X2));
                    const B2 = modP((Y1 + X1) * (Y2 - X2));
                    const F2 = modP(B2 - A2);
                    if (F2 === _0n4)
                        return this.double();
                    const C2 = modP(Z1 * _2n3 * T2);
                    const D2 = modP(T1 * _2n3 * Z2);
                    const E2 = D2 + C2;
                    const G3 = B2 + A2;
                    const H2 = D2 - C2;
                    const X32 = modP(E2 * F2);
                    const Y32 = modP(G3 * H2);
                    const T32 = modP(E2 * H2);
                    const Z32 = modP(F2 * G3);
                    return new Point(X32, Y32, Z32, T32);
                }
                const A = modP(X1 * X2);
                const B = modP(Y1 * Y2);
                const C = modP(T1 * d * T2);
                const D = modP(Z1 * Z2);
                const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
                const F = D - C;
                const G2 = D + C;
                const H = modP(B - a * A);
                const X3 = modP(E * F);
                const Y3 = modP(G2 * H);
                const T3 = modP(E * H);
                const Z3 = modP(F * G2);
                return new Point(X3, Y3, Z3, T3);
            }
            subtract(other) {
                return this.add(other.negate());
            }
            wNAF(n) {
                return wnaf.wNAFCached(this, pointPrecomputes, n, Point.normalizeZ);
            }
            // Constant-time multiplication.
            multiply(scalar) {
                const { p, f } = this.wNAF(assertInRange(scalar, CURVE_ORDER));
                return Point.normalizeZ([p, f])[0];
            }
            // Non-constant-time multiplication. Uses double-and-add algorithm.
            // It's faster, but should only be used when you don't care about
            // an exposed private key e.g. sig verification.
            // Does NOT allow scalars higher than CURVE.n.
            multiplyUnsafe(scalar) {
                let n = assertGE0(scalar);
                if (n === _0n4)
                    return I;
                if (this.equals(I) || n === _1n4)
                    return this;
                if (this.equals(G))
                    return this.wNAF(n).p;
                return wnaf.unsafeLadder(this, n);
            }
            // Checks if point is of small order.
            // If you add something to small order point, you will have "dirty"
            // point with torsion component.
            // Multiplies point by cofactor and checks if the result is 0.
            isSmallOrder() {
                return this.multiplyUnsafe(cofactor).is0();
            }
            // Multiplies point by curve order and checks if the result is 0.
            // Returns `false` is the point is dirty.
            isTorsionFree() {
                return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
            }
            // Converts Extended point to default (x, y) coordinates.
            // Can accept precomputed Z^-1 - for example, from invertBatch.
            toAffine(iz) {
                const { ex: x, ey: y, ez: z } = this;
                const is0 = this.is0();
                if (iz == null)
                    iz = is0 ? _8n2 : Fp2.inv(z);
                const ax = modP(x * iz);
                const ay = modP(y * iz);
                const zz = modP(z * iz);
                if (is0)
                    return { x: _0n4, y: _1n4 };
                if (zz !== _1n4)
                    throw new Error("invZ was invalid");
                return { x: ax, y: ay };
            }
            clearCofactor() {
                const { h: cofactor2 } = CURVE;
                if (cofactor2 === _1n4)
                    return this;
                return this.multiplyUnsafe(cofactor2);
            }
            // Converts hash string or Uint8Array to Point.
            // Uses algo from RFC8032 5.1.3.
            static fromHex(hex, zip215 = false) {
                const { d, a } = CURVE;
                const len = Fp2.BYTES;
                hex = ensureBytes("pointHex", hex, len);
                const normed = hex.slice();
                const lastByte = hex[len - 1];
                normed[len - 1] = lastByte & ~128;
                const y = bytesToNumberLE(normed);
                if (y === _0n4) {
                }
                else {
                    if (zip215)
                        assertInRange(y, MASK);
                    else
                        assertInRange(y, Fp2.ORDER);
                }
                const y2 = modP(y * y);
                const u = modP(y2 - _1n4);
                const v = modP(d * y2 - a);
                let { isValid, value: x } = uvRatio2(u, v);
                if (!isValid)
                    throw new Error("Point.fromHex: invalid y coordinate");
                const isXOdd = (x & _1n4) === _1n4;
                const isLastByteOdd = (lastByte & 128) !== 0;
                if (!zip215 && x === _0n4 && isLastByteOdd)
                    throw new Error("Point.fromHex: x=0 and x_0=1");
                if (isLastByteOdd !== isXOdd)
                    x = modP(-x);
                return Point.fromAffine({ x, y });
            }
            static fromPrivateKey(privKey) {
                return getExtendedPublicKey(privKey).point;
            }
            toRawBytes() {
                const { x, y } = this.toAffine();
                const bytes2 = numberToBytesLE(y, Fp2.BYTES);
                bytes2[bytes2.length - 1] |= x & _1n4 ? 128 : 0;
                return bytes2;
            }
            toHex() {
                return bytesToHex(this.toRawBytes());
            }
        }
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
        Point.ZERO = new Point(_0n4, _1n4, _1n4, _0n4);
        const { BASE: G, ZERO: I } = Point;
        const wnaf = wNAF(Point, nByteLength * 8);
        function modN(a) {
            return mod(a, CURVE_ORDER);
        }
        function modN_LE(hash) {
            return modN(bytesToNumberLE(hash));
        }
        function getExtendedPublicKey(key) {
            const len = nByteLength;
            key = ensureBytes("private key", key, len);
            const hashed = ensureBytes("hashed private key", cHash(key), 2 * len);
            const head = adjustScalarBytes2(hashed.slice(0, len));
            const prefix = hashed.slice(len, 2 * len);
            const scalar = modN_LE(head);
            const point = G.multiply(scalar);
            const pointBytes = point.toRawBytes();
            return { head, prefix, scalar, point, pointBytes };
        }
        function getPublicKey(privKey) {
            return getExtendedPublicKey(privKey).pointBytes;
        }
        function hashDomainToScalar(context = new Uint8Array(), ...msgs) {
            const msg = concatBytes2(...msgs);
            return modN_LE(cHash(domain(msg, ensureBytes("context", context), !!prehash)));
        }
        function sign(msg, privKey, options = {}) {
            msg = ensureBytes("message", msg);
            if (prehash)
                msg = prehash(msg);
            const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
            const r = hashDomainToScalar(options.context, prefix, msg);
            const R = G.multiply(r).toRawBytes();
            const k = hashDomainToScalar(options.context, R, pointBytes, msg);
            const s = modN(r + k * scalar);
            assertGE0(s);
            const res = concatBytes2(R, numberToBytesLE(s, Fp2.BYTES));
            return ensureBytes("result", res, nByteLength * 2);
        }
        const verifyOpts = VERIFY_DEFAULT;
        function verify(sig, msg, publicKey, options = verifyOpts) {
            const { context, zip215 } = options;
            const len = Fp2.BYTES;
            sig = ensureBytes("signature", sig, 2 * len);
            msg = ensureBytes("message", msg);
            if (prehash)
                msg = prehash(msg);
            const s = bytesToNumberLE(sig.slice(len, 2 * len));
            let A, R, SB;
            try {
                A = Point.fromHex(publicKey, zip215);
                R = Point.fromHex(sig.slice(0, len), zip215);
                SB = G.multiplyUnsafe(s);
            }
            catch (error) {
                return false;
            }
            if (!zip215 && A.isSmallOrder())
                return false;
            const k = hashDomainToScalar(context, R.toRawBytes(), A.toRawBytes(), msg);
            const RkA = R.add(A.multiplyUnsafe(k));
            return RkA.subtract(SB).clearCofactor().equals(Point.ZERO);
        }
        G._setWindowSize(8);
        const utils = {
            getExtendedPublicKey,
            // ed25519 private keys are uniform 32b. No need to check for modulo bias, like in secp256k1.
            randomPrivateKey: () => randomBytes2(Fp2.BYTES),
            /**
             * We're doing scalar multiplication (used in getPublicKey etc) with precomputed BASE_POINT
             * values. This slows down first getPublicKey() by milliseconds (see Speed section),
             * but allows to speed-up subsequent getPublicKey() calls up to 20x.
             * @param windowSize 2, 4, 8, 16
             */
            precompute(windowSize = 8, point = Point.BASE) {
                point._setWindowSize(windowSize);
                point.multiply(BigInt(3));
                return point;
            }
        };
        return {
            CURVE,
            getPublicKey,
            sign,
            verify,
            ExtendedPoint: Point,
            utils
        };
    }
    // ../esm/abstract/montgomery.js
    var _0n5 = BigInt(0);
    var _1n5 = BigInt(1);
    function validateOpts2(curve) {
        validateObject(curve, {
            a: "bigint"
        }, {
            montgomeryBits: "isSafeInteger",
            nByteLength: "isSafeInteger",
            adjustScalarBytes: "function",
            domain: "function",
            powPminus2: "function",
            Gu: "bigint"
        });
        return Object.freeze({ ...curve });
    }
    function montgomery(curveDef) {
        const CURVE = validateOpts2(curveDef);
        const { P } = CURVE;
        const modP = (n) => mod(n, P);
        const montgomeryBits = CURVE.montgomeryBits;
        const montgomeryBytes = Math.ceil(montgomeryBits / 8);
        const fieldLen = CURVE.nByteLength;
        const adjustScalarBytes2 = CURVE.adjustScalarBytes || ((bytes2) => bytes2);
        const powPminus2 = CURVE.powPminus2 || ((x) => pow(x, P - BigInt(2), P));
        function cswap(swap, x_2, x_3) {
            const dummy = modP(swap * (x_2 - x_3));
            x_2 = modP(x_2 - dummy);
            x_3 = modP(x_3 + dummy);
            return [x_2, x_3];
        }
        function assertFieldElement(n) {
            if (typeof n === "bigint" && _0n5 <= n && n < P)
                return n;
            throw new Error("Expected valid scalar 0 < scalar < CURVE.P");
        }
        const a24 = (CURVE.a - BigInt(2)) / BigInt(4);
        function montgomeryLadder(pointU, scalar) {
            const u = assertFieldElement(pointU);
            const k = assertFieldElement(scalar);
            const x_1 = u;
            let x_2 = _1n5;
            let z_2 = _0n5;
            let x_3 = u;
            let z_3 = _1n5;
            let swap = _0n5;
            let sw;
            for (let t = BigInt(montgomeryBits - 1); t >= _0n5; t--) {
                const k_t = k >> t & _1n5;
                swap ^= k_t;
                sw = cswap(swap, x_2, x_3);
                x_2 = sw[0];
                x_3 = sw[1];
                sw = cswap(swap, z_2, z_3);
                z_2 = sw[0];
                z_3 = sw[1];
                swap = k_t;
                const A = x_2 + z_2;
                const AA = modP(A * A);
                const B = x_2 - z_2;
                const BB = modP(B * B);
                const E = AA - BB;
                const C = x_3 + z_3;
                const D = x_3 - z_3;
                const DA = modP(D * A);
                const CB = modP(C * B);
                const dacb = DA + CB;
                const da_cb = DA - CB;
                x_3 = modP(dacb * dacb);
                z_3 = modP(x_1 * modP(da_cb * da_cb));
                x_2 = modP(AA * BB);
                z_2 = modP(E * (AA + modP(a24 * E)));
            }
            sw = cswap(swap, x_2, x_3);
            x_2 = sw[0];
            x_3 = sw[1];
            sw = cswap(swap, z_2, z_3);
            z_2 = sw[0];
            z_3 = sw[1];
            const z2 = powPminus2(z_2);
            return modP(x_2 * z2);
        }
        function encodeUCoordinate(u) {
            return numberToBytesLE(modP(u), montgomeryBytes);
        }
        function decodeUCoordinate(uEnc) {
            const u = ensureBytes("u coordinate", uEnc, montgomeryBytes);
            if (fieldLen === 32)
                u[31] &= 127;
            return bytesToNumberLE(u);
        }
        function decodeScalar(n) {
            const bytes2 = ensureBytes("scalar", n);
            const len = bytes2.length;
            if (len !== montgomeryBytes && len !== fieldLen)
                throw new Error(`Expected ${montgomeryBytes} or ${fieldLen} bytes, got ${len}`);
            return bytesToNumberLE(adjustScalarBytes2(bytes2));
        }
        function scalarMult(scalar, u) {
            const pointU = decodeUCoordinate(u);
            const _scalar = decodeScalar(scalar);
            const pu = montgomeryLadder(pointU, _scalar);
            if (pu === _0n5)
                throw new Error("Invalid private or public key received");
            return encodeUCoordinate(pu);
        }
        const GuBytes = encodeUCoordinate(CURVE.Gu);
        function scalarMultBase(scalar) {
            return scalarMult(scalar, GuBytes);
        }
        return {
            scalarMult,
            scalarMultBase,
            getSharedSecret: (privateKey, publicKey) => scalarMult(privateKey, publicKey),
            getPublicKey: (privateKey) => scalarMultBase(privateKey),
            utils: { randomPrivateKey: () => CURVE.randomBytes(CURVE.nByteLength) },
            GuBytes
        };
    }
    // ../esm/ed25519.js
    var ED25519_P = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949");
    var ED25519_SQRT_M1 = BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
    var _0n6 = BigInt(0);
    var _1n6 = BigInt(1);
    var _2n4 = BigInt(2);
    var _5n2 = BigInt(5);
    var _10n = BigInt(10);
    var _20n = BigInt(20);
    var _40n = BigInt(40);
    var _80n = BigInt(80);
    function ed25519_pow_2_252_3(x) {
        const P = ED25519_P;
        const x2 = x * x % P;
        const b2 = x2 * x % P;
        const b4 = pow2(b2, _2n4, P) * b2 % P;
        const b5 = pow2(b4, _1n6, P) * x % P;
        const b10 = pow2(b5, _5n2, P) * b5 % P;
        const b20 = pow2(b10, _10n, P) * b10 % P;
        const b40 = pow2(b20, _20n, P) * b20 % P;
        const b80 = pow2(b40, _40n, P) * b40 % P;
        const b160 = pow2(b80, _80n, P) * b80 % P;
        const b240 = pow2(b160, _80n, P) * b80 % P;
        const b250 = pow2(b240, _10n, P) * b10 % P;
        const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
        return { pow_p_5_8, b2 };
    }
    function adjustScalarBytes(bytes2) {
        bytes2[0] &= 248;
        bytes2[31] &= 127;
        bytes2[31] |= 64;
        return bytes2;
    }
    function uvRatio(u, v) {
        const P = ED25519_P;
        const v3 = mod(v * v * v, P);
        const v7 = mod(v3 * v3 * v, P);
        const pow3 = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
        let x = mod(u * v3 * pow3, P);
        const vx2 = mod(v * x * x, P);
        const root1 = x;
        const root2 = mod(x * ED25519_SQRT_M1, P);
        const useRoot1 = vx2 === u;
        const useRoot2 = vx2 === mod(-u, P);
        const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
        if (useRoot1)
            x = root1;
        if (useRoot2 || noRoot)
            x = root2;
        if (isNegativeLE(x, P))
            x = mod(-x, P);
        return { isValid: useRoot1 || useRoot2, value: x };
    }
    var Fp = Field(ED25519_P, void 0, true);
    var ed25519Defaults = {
        // Param: a
        a: BigInt(-1),
        // Fp.create(-1) is proper; our way still works and is faster
        // d is equal to -121665/121666 over finite field.
        // Negative number is P - number, and division is invert(number, P)
        d: BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"),
        // Finite field 𝔽p over which we'll do calculations; 2n**255n - 19n
        Fp,
        // Subgroup order: how many points curve has
        // 2n**252n + 27742317777372353535851937790883648493n;
        n: BigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"),
        // Cofactor
        h: BigInt(8),
        // Base point (x, y) aka generator point
        Gx: BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"),
        Gy: BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960"),
        hash: sha512,
        randomBytes,
        adjustScalarBytes,
        // dom2
        // Ratio of u to v. Allows us to combine inversion and square root. Uses algo from RFC8032 5.1.3.
        // Constant-time, u/√v
        uvRatio
    };
    function ed25519_domain(data, ctx, phflag) {
        if (ctx.length > 255)
            throw new Error("Context is too big");
        return concatBytes(utf8ToBytes("SigEd25519 no Ed25519 collisions"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
    }
    var ed25519ctx = /* @__PURE__ */ twistedEdwards({
        ...ed25519Defaults,
        domain: ed25519_domain
    });
    var ed25519ph = /* @__PURE__ */ twistedEdwards({
        ...ed25519Defaults,
        domain: ed25519_domain,
        prehash: sha512
    });
    var x25519 = /* @__PURE__ */ (() => montgomery({
        P: ED25519_P,
        a: BigInt(486662),
        montgomeryBits: 255,
        // n is 253 bits
        nByteLength: 32,
        Gu: BigInt(9),
        powPminus2: (x) => {
            const P = ED25519_P;
            const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
            return mod(pow2(pow_p_5_8, BigInt(3), P) * b2, P);
        },
        adjustScalarBytes,
        randomBytes
    }))();
    var ELL2_C1 = (Fp.ORDER + BigInt(3)) / BigInt(8);
    var ELL2_C2 = Fp.pow(_2n4, ELL2_C1);
    var ELL2_C3 = Fp.sqrt(Fp.neg(Fp.ONE));
    var ELL2_C4 = (Fp.ORDER - BigInt(5)) / BigInt(8);
    var ELL2_J = BigInt(486662);
    var ELL2_C1_EDWARDS = FpSqrtEven(Fp, Fp.neg(BigInt(486664)));
    var SQRT_AD_MINUS_ONE = BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
    var INVSQRT_A_MINUS_D = BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
    var ONE_MINUS_D_SQ = BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
    var D_MINUS_ONE_SQ = BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
    var MAX_255B = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    return __toCommonJS(input_exports);
})();
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
export const x25519 = nobleCurves.x25519;
