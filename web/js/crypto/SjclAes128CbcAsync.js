"use strict";

tutao.provide('tutao.crypto.SjclAes128CbcAsync');

/**
 * @constructor
 * @implements {tutao.crypto.AesInterfaceAsync}
 */
tutao.crypto.SjclAes128CbcAsync = function() {
    this._byteKeyLength = 16; // for a 128 Bit key;
};

/**
 * @inheritDoc
 */
tutao.crypto.SjclAes128CbcAsync.prototype.encryptBytes = function (key, bytes, randomIv, resultCallback) {
    try {
        var iv = sjcl.codec.arrayBuffer.toBits(randomIv.buffer);
        var xor = sjcl.bitArray._xor4;
        var uint32ArraysPerBlock = this._byteKeyLength / 4;
        var prp = new sjcl.cipher.aes(key);
        // the floor'ed division cuts off a last partial block which must be padded. if no partial block exists a padding block must be added.
        // so in both cases a padded block is added plus a block for the iv
        var nbrOfFullSrcBlocks = Math.floor(bytes.length / this._byteKeyLength);

        var dstBuffer = new ArrayBuffer((nbrOfFullSrcBlocks + 2) * this._byteKeyLength);
        var srcDataView = new DataView(bytes.buffer);
        var dstDataView = new DataView(dstBuffer);

        // put the iv into first destination block
        for (var i = 0; i < uint32ArraysPerBlock; i++) {
            dstDataView.setUint32(i * 4, this._int32ToUint32(iv[i]), false);
        }

        // encrypt full src blocks
        var plainBlock = [0, 0, 0, 0]; // dummy initialization
        for (var i = 0; i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
            plainBlock[0] = srcDataView.getUint32(i * 4, false);
            plainBlock[1] = srcDataView.getUint32((i + 1) * 4, false);
            plainBlock[2] = srcDataView.getUint32((i + 2) * 4, false);
            plainBlock[3] = srcDataView.getUint32((i + 3) * 4, false);
            iv = prp.encrypt(xor(iv, plainBlock));
            var dstBlockOffset = (uint32ArraysPerBlock + i) * 4;
            dstDataView.setUint32(dstBlockOffset, this._int32ToUint32(iv[0]), false);
            dstDataView.setUint32(dstBlockOffset + 4, this._int32ToUint32(iv[1]), false);
            dstDataView.setUint32(dstBlockOffset + 8, this._int32ToUint32(iv[2]), false);
            dstDataView.setUint32(dstBlockOffset + 12, this._int32ToUint32(iv[3]), false);
        }

        // padding
        var srcDataViewLastBlock = new DataView(new ArrayBuffer(this._byteKeyLength));
        var i;
        // copy the remaining bytes to the last block
        var nbrOfRemainingSrcBytes = bytes.length - nbrOfFullSrcBlocks * this._byteKeyLength;
        for (i = 0; i < nbrOfRemainingSrcBytes; i++) {
            srcDataViewLastBlock.setUint8(i, srcDataView.getUint8(nbrOfFullSrcBlocks * this._byteKeyLength + i));
        }
        // fill the last block with padding bytes
        var paddingByte = this._byteKeyLength - (bytes.length % this._byteKeyLength);
        for (; i < this._byteKeyLength; i++) {
            srcDataViewLastBlock.setUint8(i, paddingByte);
        }
        plainBlock[0] = srcDataViewLastBlock.getUint32(0, false);
        plainBlock[1] = srcDataViewLastBlock.getUint32(4, false);
        plainBlock[2] = srcDataViewLastBlock.getUint32(8, false);
        plainBlock[3] = srcDataViewLastBlock.getUint32(12, false);
        iv = prp.encrypt(xor(iv, plainBlock));
        var dstLastBlockOffset = (nbrOfFullSrcBlocks + 1) * this._byteKeyLength;
        dstDataView.setUint32(dstLastBlockOffset, this._int32ToUint32(iv[0]), false);
        dstDataView.setUint32(dstLastBlockOffset + 4, this._int32ToUint32(iv[1]), false);
        dstDataView.setUint32(dstLastBlockOffset + 8, this._int32ToUint32(iv[2]), false);
        dstDataView.setUint32(dstLastBlockOffset + 12, this._int32ToUint32(iv[3]), false);
        resultCallback({ type: 'result', result: new Uint8Array(dstBuffer)});
    } catch (e) {
        resultCallback({ type: 'error', msg: "SjclAes128CbcAsync encrypt error:" + e.message});
    }
};


/**
 * @inheritDoc
 */
tutao.crypto.SjclAes128CbcAsync.prototype.decryptBytes = function (key, bytes, decryptedBytesLength, resultCallback) {
    try {
        var xor = sjcl.bitArray._xor4;

        var uint32ArraysPerBlock = this._byteKeyLength / 4;
        var prp = new sjcl.cipher.aes(key);
        // iv and padding block are not full blocks
        var nbrOfFullSrcBlocks = bytes.length / this._byteKeyLength - 2;

        var dstBuffer = new ArrayBuffer(decryptedBytesLength);
        var srcDataView = new DataView(bytes.buffer);
        var dstDataView = new DataView(dstBuffer);

        var iv = [];
        for (var i = 0; i < uint32ArraysPerBlock; i++) {
            iv.push(srcDataView.getUint32(i * 4, false));
        }
        // move the view behind the iv
        srcDataView = new DataView(bytes.buffer, this._byteKeyLength);

        // decrypt full src blocks
        var decryptedBlock = null;
        for (var i = 0; i < ((nbrOfFullSrcBlocks + 1) * uint32ArraysPerBlock); i += uint32ArraysPerBlock) {
            var encryptedBlock = [srcDataView.getUint32(i * 4, false),
                srcDataView.getUint32((i + 1) * 4, false),
                srcDataView.getUint32((i + 2) * 4, false),
                srcDataView.getUint32((i + 3) * 4, false)];
            decryptedBlock = xor(iv, prp.decrypt(encryptedBlock));
            if (i < (nbrOfFullSrcBlocks * uint32ArraysPerBlock)) {
                dstDataView.setUint32(i * 4, decryptedBlock[0], false);
                dstDataView.setUint32(i * 4 + 4, decryptedBlock[1], false);
                dstDataView.setUint32(i * 4 + 8, decryptedBlock[2], false);
                dstDataView.setUint32(i * 4 + 12, decryptedBlock[3], false);
                iv = encryptedBlock;
            } else {
                var lastSrcBlock = new DataView(new ArrayBuffer(this._byteKeyLength));
                // copy the decrypted uint32 to the last block
                for (var a = 0; a < uint32ArraysPerBlock; a++) {
                    lastSrcBlock.setUint32(a * 4, this._int32ToUint32(decryptedBlock[a]), false);
                }
                // check the padding length
                var nbrOfPaddingBytes = decryptedBlock[3] & 255;
                if (nbrOfPaddingBytes == 0 || nbrOfPaddingBytes > 16) {
                    throw new Error("invalid padding value: " + nbrOfPaddingBytes);
                }
                if (decryptedBytesLength != ((nbrOfFullSrcBlocks + 1) * this._byteKeyLength - nbrOfPaddingBytes)) {
                    throw new Error("invalid decrypted size: " + decryptedBytesLength + ", expected: " + (nbrOfFullSrcBlocks * this._byteKeyLength + nbrOfPaddingBytes));
                }
                // copy the remaining bytes
                var a;
                for (a = 0; a < (this._byteKeyLength - nbrOfPaddingBytes); a++) {
                    dstDataView.setUint8(nbrOfFullSrcBlocks * this._byteKeyLength + a, lastSrcBlock.getUint8(a));
                }
                // check the padding bytes
                for (; a < this._byteKeyLength; a++) {
                    if (lastSrcBlock.getUint8(a) != nbrOfPaddingBytes) {
                        throw new Error("invalid padding byte found: " + lastSrcBlock.getUint8(a) + ", expected: " + nbrOfPaddingBytes);
                    }
                }
            }
        }
        resultCallback({ type: 'result', result: new Uint8Array(dstBuffer)});
    } catch (e) {
        resultCallback({ type: 'error', msg: "SjclAes128CbcAsync decrypt error: " + e.message});
    }
};

tutao.crypto.SjclAes128CbcAsync.prototype._int32ToUint32 = function (value) {
    if (value < 0) {
        return value + 4294967296; // =2^32
    } else {
        return value;
    }
};



