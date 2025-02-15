import o from "@tutao/otest";
import { hexToUint8Array, stringToUtf8Uint8Array } from "@tutao/tutanota-utils";
import { sha256Hash } from "../lib/hashes/Sha256.js";
import sjcl from "../lib/internal/sjcl.js";
o.spec("Sha256", function () {
    o("hash", function () {
        o(Array.from(sha256Hash(new Uint8Array(0)))).deepEquals(Array.from(hexToUint8Array("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")));
        o(Array.from(sha256Hash(stringToUtf8Uint8Array("The quick brown fox jumps over the lazy dog.")))).deepEquals(Array.from(hexToUint8Array("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c")));
    });
    o("same value gives the same result", function () {
        const uint8Array = new Uint8Array([1, 2, 3, 4, 5, 6]);
        o(sha256Hash(uint8Array)).deepEquals(sha256Hash(uint8Array));
    });
    o("same value gives the same result on bigger buffers", function () {
        // this tests that we are not blindly using the whole underlying buffer
        const bigUint8Array1 = new Uint8Array(1000);
        bigUint8Array1.fill(2, 100, 200);
        const uint8array1 = bigUint8Array1.subarray(3, 13);
        uint8array1.fill(1);
        const bigUint8Array2 = new Uint8Array(1000);
        bigUint8Array2.fill(3, 100, 200);
        const uint8array2 = bigUint8Array2.subarray(3, 13);
        uint8array2.fill(1);
        o(sha256Hash(uint8array1)).deepEquals(sha256Hash(uint8array2));
    });
    o("multiple updates equals concatenation", function () {
        let sjclHash = new sjcl.hash.sha256();
        const part1 = new Uint8Array([3, 5, 7]);
        const part2 = new Uint8Array([33, 55, 77, 8]);
        sjclHash.update(sjcl.codec.arrayBuffer.toBits(part1.buffer, part1.byteOffset, part1.byteLength));
        sjclHash.update(sjcl.codec.arrayBuffer.toBits(part2.buffer, part2.byteOffset, part2.byteLength));
        const partResult = new Uint8Array(sjcl.codec.arrayBuffer.fromBits(sjclHash.finalize(), false));
        const wholeResult = sha256Hash(new Uint8Array([3, 5, 7, 33, 55, 77, 8]));
        o(Array.from(partResult)).deepEquals(Array.from(wholeResult));
    });
});
