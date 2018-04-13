"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const jsbn_1 = require("jsbn");
const util = require("./util");
// MODULE VARIABLES
// ================================================================================================
const SECURE_PRIME_LENGTH = 2048;
function createCipher(groupPrimeOrLength) {
    return __awaiter(this, void 0, void 0, function* () {
        let prime;
        if (Buffer.isBuffer(groupPrimeOrLength)) {
            prime = groupPrimeOrLength;
        }
        if (typeof groupPrimeOrLength === 'number') {
            prime = yield util.generateSafePrime(groupPrimeOrLength);
        }
        else if (typeof groupPrimeOrLength === 'string') {
            prime = util.getPrime(groupPrimeOrLength);
        }
        else if (groupPrimeOrLength === null || groupPrimeOrLength === undefined) {
            prime = util.getPrime('modp2048');
        }
        const key = yield util.generateKey(prime);
        return new Cipher(prime, key);
    });
}
exports.createCipher = createCipher;
function mergeKeys(key1, key2) {
    // validate key1
    if (key1 === undefined || key1 === null) {
        throw new TypeError('Cannot merge keys: key1 is undefined');
    }
    else if (!Buffer.isBuffer(key1)) {
        throw new TypeError('Cannot merge keys: key1 is invalid');
    }
    // validate key2
    if (key2 === undefined || key2 === null) {
        throw new TypeError('Cannot merge keys: key2 is undefined');
    }
    else if (!Buffer.isBuffer(key2)) {
        throw new TypeError('Cannot merge keys: key2 is invalid');
    }
    // convert keys to BigInts
    const k1 = util.bufferToBigInt(key1);
    const k2 = util.bufferToBigInt(key2);
    // multiply and return
    const k12 = k1.multiply(k2);
    return util.bigIntToBuffer(k12);
}
exports.mergeKeys = mergeKeys;
// CIPHER DEFINITION
// ================================================================================================
class Cipher {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(prime, enkey) {
        // validate prime parameter
        if (prime === undefined || prime === null) {
            throw new TypeError('Cannot create cipher: prime is undefined');
        }
        else if (!Buffer.isBuffer(prime)) {
            throw new TypeError('Cannot create cipher: prime is invalid');
        }
        // validate enkey parameter
        if (enkey === undefined || enkey === null) {
            throw new TypeError('Cannot create cipher: enkey is undefined');
        }
        else if (!Buffer.isBuffer(enkey)) {
            throw new TypeError('Cannot create cipher: enkey is invalid');
        }
        // set prime
        this.prime = prime;
        this.p = util.checkPrime(this.prime);
        if (!this.p) {
            throw new TypeError('Cannot create cipher: prime is not a prime');
        }
        else if (this.p.bitLength() < SECURE_PRIME_LENGTH) {
            console.warn('The prime you are using is too small for secure encryption');
        }
        // set encryption key
        this.enkey = enkey;
        this.e = util.bufferToBigInt(enkey);
        if (!util.isValidKey(this.e)) {
            throw new Error('Cannot create cipher: the encryption key is invalid');
        }
        // calculate and set decryption key
        this.d = this.e.modInverse(this.p.subtract(jsbn_1.BigInteger.ONE));
        this.dekey = util.bigIntToBuffer(this.d);
    }
    // PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
    encrypt(data, encoding) {
        if (data === undefined || data === null) {
            throw new TypeError('Cannot encrypt: data is undefiend');
        }
        // prepare the data
        let buf;
        if (Buffer.isBuffer(data)) {
            buf = data;
        }
        else if (typeof data === 'string') {
            encoding = encoding || 'utf8';
            if (encoding !== 'utf8' && encoding !== 'hex' && encoding !== 'base64') {
                throw new TypeError('Cannot encrypt: encoding is invalid');
            }
            buf = Buffer.from(data, encoding);
        }
        else {
            throw new TypeError('Cannot encrypt: data is invalid');
        }
        // convert data to numeric representation and make sure it is not bigger than prime
        const m = util.bufferToBigInt(buf);
        if (m.compareTo(this.p) >= 0) {
            throw new TypeError('Cannot encrypt: data is too large');
        }
        // encrypt and return buffer
        const c = m.modPow(this.e, this.p);
        return util.bigIntToBuffer(c);
    }
    decrypt(data, encoding) {
        if (data === undefined || data === null) {
            throw new TypeError('Cannot decrypt: data is undefiend');
        }
        // prepare the data
        let buf;
        if (Buffer.isBuffer(data)) {
            buf = data;
        }
        else if (typeof data === 'string') {
            encoding = encoding || 'hex';
            if (encoding !== 'hex' && encoding !== 'base64') {
                throw new TypeError('Cannot decrypt: encoding is invalid');
            }
            buf = Buffer.from(data, encoding);
        }
        else {
            throw new TypeError('Cannot decrypt: data is invalid');
        }
        // decrypt and return the buffer
        const c = util.bufferToBigInt(buf);
        const m = c.modPow(this.d, this.p);
        return util.bigIntToBuffer(m);
    }
}
exports.Cipher = Cipher;
//# sourceMappingURL=index.js.map