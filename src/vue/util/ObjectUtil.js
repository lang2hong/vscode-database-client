export const objectUtil = {
        bufVisible(buf) {
            if (typeof buf === 'string') {
                return true;
            }

            return buf.equals(Buffer.from(buf.toString()));
        },
        bufToString(buf, forceHex = false) {
            // if (typeof buf == 'string') {
            //   return buf;
            // }

            if (!Buffer.isBuffer(buf)) {
                return buf;
            }

            if (!forceHex && this.bufVisible(buf)) {
                return buf.toString();
            }

            return this.bufToHex(buf);
        },
        bufToQuotation(buf) {
            const str = this.bufToString(buf).replaceAll('"', '\\"');
            return `"${str}"`;
        },
        bufToHex(buf) {
            const result = buf.toJSON().data.map((item) => {
                if (item >= 32 && item <= 126) {
                    return String.fromCharCode(item);
                }
                return `\\x${item.toString(16).padStart(2, 0)}`;
            });

            return result.join('');
        },
        xToBuffer(str) {
            let result = '';

            for (let i = 0; i < str.length;) {
                if (str.substr(i, 2) == '\\x') {
                    result += str.substr(i + 2, 2);
                    i += 4;
                } else {
                    result += Buffer.from(str[i++]).toString('hex');
                }
            }

            return Buffer.from(result, 'hex');
        },
        bufToBinary(buf) {
            let binary = '';

            for (const item of buf) {
                binary += item.toString(2).padStart(8, 0);
            }

            return binary;
        },
        binaryStringToBuffer(str) {
            const groups = str.match(/[01]{8}/g);
            const numbers = groups.map(binary => parseInt(binary, 2));

            return Buffer.from(new Uint8Array(numbers));
        },
        cutString(string, maxLength = 20) {
            if (string.length <= maxLength) {
                return string;
            }

            return `${string.substr(0, maxLength)}...`;
        },
        isJson(string) {
            try {
                const obj = JSON.parse(string);
                return !!obj && typeof obj === 'object';
            } catch (e) { }

            return false;
        },
        isPHPSerialize(str) {
            const phpSerialize = require('php-serialize');

            try {
                // phpSerialize.unserialize(str);
                return phpSerialize.isSerialized(str.toString());
            } catch (e) { }

            return false;
        },
        isJavaSerialize(buf) {
            try {
                const { ObjectInputStream } = require('java-object-serialization');
                const result = (new ObjectInputStream(buf)).readObject();
                return typeof result === 'object';
            } catch (e) {
                return false;
            }
        },
        isPickle(buf) {
            try {
                const { Parser } = require('pickleparser');
                const result = (new Parser()).parse(buf);
                return !!result;
            } catch (e) {
                return false;
            }
        },
        isMsgpack(buf) {
            const { decode } = require('@msgpack/msgpack');

            try {
                const result = decode(buf);
                if (['object', 'string'].includes(typeof result)) {
                    return true;
                }
            } catch (e) { }

            return false;
        },
        isBrotli(buf) {
            return typeof this.zippedToString(buf, 'brotli') === 'string';
        },
        isGzip(buf) {
            return typeof this.zippedToString(buf, 'gzip') === 'string';
        },
        isDeflate(buf) {
            return typeof this.zippedToString(buf, 'deflate') === 'string';
        },
        isDeflateRaw(buf) {
            return typeof this.zippedToString(buf, 'deflateRaw') === 'string';
        },
        isProtobuf(buf) {
            // fix #859, #880, exclude number type
            if (!isNaN(buf)) {
                return false;
            }

            const { getData } = require('rawproto');

            try {
                const result = getData(buf);

                // fix #922 some str mismatch
                if (result[0]) {
                    const firstEle = Object.values(result[0])[0];
                    if (firstEle < 1e-14 || firstEle.low) {
                        return false;
                    }
                }
                return true;
            } catch (e) { }

            return false;
        },
        zippedToString(buf, type = 'unzip') {
            const zlib = require('zlib');
            const funMap = {
                // unzip will automatically detect Gzip or Deflate header
                unzip: 'unzipSync',
                gzip: 'gunzipSync',
                deflate: 'inflateSync',
                brotli: 'brotliDecompressSync',
                deflateRaw: 'inflateRawSync',
            };

            try {
                const decompressed = zlib[funMap[type]](buf);
                if (Buffer.isBuffer(decompressed) && decompressed.length) {
                    return decompressed.toString();
                }
            } catch (e) { }

            return false;
        },
        base64Encode(str) {
            return Buffer.from(str, 'utf8').toString('base64');
        },
        base64Decode(str) {
            return Buffer.from(str, 'base64').toString('utf8');
        },
    };
