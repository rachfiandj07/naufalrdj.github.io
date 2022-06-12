(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.PD = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('probability-distributions');

},{"probability-distributions":2}],2:[function(require,module,exports){
/* ================================================================
 * probability-distributions by Matt Asher (me[at]mattasher.com)
 * Originally created for StatisticsBlog.com
 *
 * first created at : Sat Oct 10 2015
 *
 * ================================================================
 * Copyright 2015 Matt Asher
 *
 * Licensed under the MIT License
 * You may not use this file except in compliance with the License.
 *
 * ================================================================ */

var crypto = require('crypto');

// Shortcuts
var exp = Math.exp;
var ln = Math.log;
var PI = Math.PI;
var pow = Math.pow;

module.exports = {

    /**
     * This is the core function for generating entropy
     *
     * @param len number of bytes of entropy to create
     * @returns {number} A pseduo random number between 0 and 1
     *
     */
    prng: function(len) {
        if(len === undefined) len=16;

        var entropy = crypto.randomBytes(len);
        var result = 0;

        for(var i=0; i<len; i++) {
            result = result + Number(entropy[i])/Math.pow(256,(i+1))
        }
        return result
    },


    /**
     *
     * @param n The number of random variates to create. Must be a positive integer
     * @param alpha
     * @param rate
     * @returns {Array} Random variates array
     */
    rgamma: function(n, alpha, rate) {
        // Adapted from https://github.com/mvarshney/simjs-source/ & scipy
        n = this._v(n, "n");
        alpha = this._v(alpha, "nn");
        rate = this._v(rate, "pos", 1);

        var LOG4 = ln(4.0);
        var SG_MAGICCONST = 1.0 + ln(4.5);
        var beta = 1/rate;

        var toReturn = [];
        for(var i = 0; i<n; i++) {

            /* Based on Python 2.6 source code of random.py.
             */

            if (alpha > 1.0) {
                var ainv = Math.sqrt(2.0 * alpha - 1.0);
                var bbb = alpha - LOG4;
                var ccc = alpha + ainv;

                while (true) {
                    var u1 = this.prng();
                    if ((u1 < 1e-7) || (u > 0.9999999)) {
                        continue;
                    }
                    var u2 = 1.0 - this.prng();
                    var v = ln(u1 / (1.0 - u1)) / ainv;
                    var x = alpha * exp(v);
                    var z = u1 * u1 * u2;
                    var r = bbb + ccc * v - x;
                    if ((r + SG_MAGICCONST - 4.5 * z >= 0.0) || (r >= ln(z))) {
                        var result = x * beta;
                        break;
                    }
                }
            } else if (alpha == 1.0) {
                var u = this.prng();
                while (u <= 1e-7) {
                    u = this.prng();
                }
                var result = - ln(u) * beta;
            } else {
                while (true) {
                    var u = this.prng();
                    var b = (Math.E + alpha) / Math.E;
                    var p = b * u;
                    if (p <= 1.0) {
                        var x = Math.pow(p, 1.0 / alpha);
                    } else {
                        var x = - ln((b - p) / alpha);
                    }
                    var u1 = this.prng();
                    if (p > 1.0) {
                        if (u1 <= Math.pow(x, (alpha - 1.0))) {
                            break;
                        }
                    } else if (u1 <= exp(-x)) {
                        break;
                    }
                }
                var result =  x * beta;
            }

            toReturn[i] = result;
        }

        return toReturn;

    },


    /**
     *
     * @param n The number of random variates to create. Must be a positive integer.
     * @param lambda Mean/Variance of the distribution
     * @returns {Array} Random variates array
     */
    rpois: function(n, lambda) {
        n = this._v(n, "n");
        lambda = this._v(lambda, "pos");

        var toReturn = [];

        for(var i=0; i<n; i++) {

            // Adapted from http://wiki.q-researchsoftware.com/wiki/How_to_Generate_Random_Numbers:_Poisson_Distribution
            if (lambda < 30) {

                var L = exp(-lambda);
                var p = 1;
                var k = 0;
                do {
                    k++;
                    p *= this.prng();
                } while (p > L);
                toReturn.push(k - 1);

            } else {

                // Roll our own
                // Fix total number of samples
                var samples = 10000;
                var p = lambda/samples;
                var k = 0;
                for(var j=0; j<samples; j++) {
                    if(this.prng() < p) {
                        k++
                    }
                }
                toReturn[i] = k;
            }
        }

        return toReturn
    },

    // Return default if undefined, otherwise validate
    // Return a COPY of the validated parameter
    _v: function(param, type, defaultParam) {
        if(param == null && defaultParam != null)
            return defaultParam;

        switch(type) {

            // Array of 1 item or more
            case "a":
                if(!Array.isArray(param) || !param.length) throw new Error("Expected an array of length 1 or greater");
                return param.slice(0);

            // Integer
            case "int":
                if(param !== Number(param)) throw new Error("A required parameter is missing or not a number");
                if(param !== Math.round(param)) throw new Error("Parameter must be a whole number");
                if(param === Infinity) throw new Error("Sent 'infinity' as a parameter");
                return param;

            // Natural number
            case "n":
                if(param === undefined) throw new Error("You must specify how many values you want");
                if(param !== Number(param)) throw new Error("The number of values must be numeric");
                if(param !== Math.round(param)) throw new Error("The number of values must be a whole number");
                if(param < 1) throw new Error("The number of values must be a whole number of 1 or greater");
                if(param === Infinity) throw new Error("The number of values cannot be infinite ;-)");
                return param;

            // Valid probability
            case "p":
                if(Number(param) !== param) throw new Error("Probability value is missing or not a number");
                if(param > 1) throw new Error("Probability values cannot be greater than 1");
                if(param < 0) throw new Error("Probability values cannot be less than 0");
                return param;

            // Positive numbers
            case "pos":
                if(Number(param) !== param) throw new Error("A required parameter is missing or not a number");
                if(param <= 0) throw new Error("Parameter must be greater than 0");
                if(param === Infinity) throw new Error("Sent 'infinity' as a parameter");
                return param;

            // Look for numbers (reals)
            case "r":
                if(Number(param) !== param) throw new Error("A required parameter is missing or not a number");
                if(param === Infinity) throw new Error("Sent 'infinity' as a parameter");
                return param;

            // Non negative real number
            case "nn":
                if(param !== Number(param)) throw new Error("A required parameter is missing or not a number");
                if(param < 0) throw new Error("Parameter cannot be less than 0");
                if(param === Infinity) throw new Error("Sent 'infinity' as a parameter");
                return param;

            // Non negative whole number (integer)
            case "nni":
                if(param !== Number(param)) throw new Error("A required parameter is missing or not a number");
                if(param !== Math.round(param)) throw new Error("Parameter must be a whole number");
                if(param < 0) throw new Error("Parameter cannot be less than zero");
                if(param === Infinity) throw new Error("Sent 'infinity' as a parameter");
                return param;

            // Non-empty string
            case "str":
                if(param !== String(param)) throw new Error("A required parameter is missing or not a string");
                if(param.length === 0) throw new Error("Parameter must be at least one character long");
                return param;


        }
    }
};

// TODO: Add "perfect fake" functions: http://www.statisticsblog.com/2010/06/the-perfect-fake/
// NOTES
// Potential config options:
// default entropy amount
// Need pathway to make ready for secure applications (NIST/diehard?)
// Always return a vector unless number is 1? This could be config option or put "1" at end of fcn to get 1 only
// Separate out core random variate creation from number to create loop
// TODO: To test out quality of randomness, stub in specific values for this.prng and make sure correct stuff is returned.
},{"crypto":75}],3:[function(require,module,exports){},{"./asn1/api":4,"./asn1/base":6,"./asn1/constants":10,"./asn1/decoders":12,"./asn1/encoders":15,"bn.js":17}],4:[function(require,module,exports){},{"./decoders":12,"./encoders":15,"inherits":136}],5:[function(require,module,exports){},{"../base/reporter":8,"inherits":136,"safer-buffer":183}],6:[function(require,module,exports){},{"./buffer":5,"./node":7,"./reporter":8}],7:[function(require,module,exports){},{"../base/buffer":5,"../base/reporter":8,"minimalistic-assert":142}],8:[function(require,module,exports){},{"inherits":136}],9:[function(require,module,exports){},{}],10:[function(require,module,exports){},{"./der":9}],11:[function(require,module,exports){},{"../base/buffer":5,"../base/node":7,"../constants/der":9,"bn.js":17,"inherits":136}],12:[function(require,module,exports){},{"./der":11,"./pem":13}],13:[function(require,module,exports){},{"./der":11,"inherits":136,"safer-buffer":183}],14:[function(require,module,exports){},{"../base/node":7,"../constants/der":9,"inherits":136,"safer-buffer":183}],15:[function(require,module,exports){},{"./der":14,"./pem":16}],16:[function(require,module,exports){},{"./der":14,"inherits":136}],17:[function(require,module,exports){},{"buffer":21}],18:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {}

function _byteLength (b64, validLen, placeHoldersLen) {}

function toByteArray (b64) {}

function tripletToBase64 (num) {}

function encodeChunk (uint8, start, end) {}

function fromByteArray (uint8) {}

},{}],19:[function(require,module,exports){},{"buffer":21}],20:[function(require,module,exports){},{"crypto":21}],21:[function(require,module,exports){},{}],22:[function(require,module,exports){},{"safe-buffer":182}],23:[function(require,module,exports){},{"./aes":22,"./ghash":27,"./incr32":28,"buffer-xor":65,"cipher-base":67,"inherits":136,"safe-buffer":182}],24:[function(require,module,exports){},{"./decrypter":25,"./encrypter":26,"./modes/list.json":36}],25:[function(require,module,exports){},{"./aes":22,"./authCipher":23,"./modes":35,"./streamCipher":38,"cipher-base":67,"evp_bytestokey":105,"inherits":136,"safe-buffer":182}],26:[function(require,module,exports){},{"./aes":22,"./authCipher":23,"./modes":35,"./streamCipher":38,"cipher-base":67,"evp_bytestokey":105,"inherits":136,"safe-buffer":182}],27:[function(require,module,exports){},{"safe-buffer":182}],28:[function(require,module,exports){},{}],29:[function(require,module,exports){},{"buffer-xor":65}],30:[function(require,module,exports){},{"buffer-xor":65,"safe-buffer":182}],31:[function(require,module,exports){},{"safe-buffer":182}],32:[function(require,module,exports){},{"safe-buffer":182}],33:[function(require,module,exports){},{"../incr32":28,"buffer-xor":65,"safe-buffer":182}],34:[function(require,module,exports){},{}],35:[function(require,module,exports){},{"./cbc":29,"./cfb":30,"./cfb1":31,"./cfb8":32,"./ctr":33,"./ecb":34,"./list.json":36,"./ofb":37}],36:[function(require,module,exports){},{}],37:[function(require,module,exports){},{"buffer":66,"buffer-xor":65}],38:[function(require,module,exports){},{"./aes":22,"cipher-base":67,"inherits":136,"safe-buffer":182}],39:[function(require,module,exports){},{"browserify-aes/browser":24,"browserify-aes/modes":35,"browserify-des":40,"browserify-des/modes":41,"evp_bytestokey":105}],40:[function(require,module,exports){},{"cipher-base":67,"des.js":76,"inherits":136,"safe-buffer":182}],41:[function(require,module,exports){},{}],42:[function(require,module,exports){},{"bn.js":43,"buffer":66,"randombytes":164}],43:[function(require,module,exports){},{"buffer":21,"dup":17}],44:[function(require,module,exports){},{"./browser/algorithms.json":45}],45:[function(require,module,exports){},{}],46:[function(require,module,exports){},{}],47:[function(require,module,exports){},{"./algorithms.json":45,"./sign":48,"./verify":49,"create-hash":71,"inherits":136,"readable-stream":64,"safe-buffer":182}],48:[function(require,module,exports){},{"./curves.json":46,"bn.js":19,"browserify-rsa":42,"create-hmac":73,"elliptic":87,"parse-asn1":148,"safe-buffer":182}],49:[function(require,module,exports){},{"./curves.json":46,"bn.js":19,"elliptic":87,"parse-asn1":148,"safe-buffer":182}],50:[function(require,module,exports){},{}],51:[function(require,module,exports){},{"./_stream_readable":53,"./_stream_writable":55,"_process":156,"inherits":136}],52:[function(require,module,exports){},{"./_stream_transform":54,"inherits":136}],53:[function(require,module,exports){},{"../errors":50,"./_stream_duplex":51,"./internal/streams/async_iterator":56,"./internal/streams/buffer_list":57,"./internal/streams/destroy":58,"./internal/streams/from":60,"./internal/streams/state":62,"./internal/streams/stream":63,"_process":156,"buffer":66,"events":104,"inherits":136,"string_decoder/":193,"util":21}],54:[function(require,module,exports){},{"../errors":50,"./_stream_duplex":51,"inherits":136}],55:[function(require,module,exports){},{"../errors":50,"./_stream_duplex":51,"./internal/streams/destroy":58,"./internal/streams/state":62,"./internal/streams/stream":63,"_process":156,"buffer":66,"inherits":136,"util-deprecate":195}],56:[function(require,module,exports){},{"./end-of-stream":59,"_process":156}],57:[function(require,module,exports){},{"buffer":66,"util":21}],58:[function(require,module,exports){},{"_process":156}],59:[function(require,module,exports){},{"../../../errors":50}],60:[function(require,module,exports){},{}],61:[function(require,module,exports){},{"../../../errors":50,"./end-of-stream":59}],62:[function(require,module,exports){},{"../../../errors":50}],63:[function(require,module,exports){},{"events":104}],64:[function(require,module,exports){},{"./lib/_stream_duplex.js":51,"./lib/_stream_passthrough.js":52,"./lib/_stream_readable.js":53,"./lib/_stream_transform.js":54,"./lib/_stream_writable.js":55,"./lib/internal/streams/end-of-stream.js":59,"./lib/internal/streams/pipeline.js":61}],65:[function(require,module,exports){},{"buffer":66}],66:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {}
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {}
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

}).call(this,require("buffer").Buffer)
},{"base64-js":18,"buffer":66,"ieee754":135}],67:[function(require,module,exports){},{"inherits":136,"safe-buffer":182,"stream":192,"string_decoder":193}],68:[function(require,module,exports){},{"../../is-buffer/index.js":137}],69:[function(require,module,exports){
(function (Buffer){

module.exports = function createECDH (curve) {}
}).call(this,require("buffer").Buffer)
},{"bn.js":70,"buffer":66,"elliptic":87}],70:[function(require,module,exports){},{"buffer":21,"dup":17}],71:[function(require,module,exports){

module.exports = function createHash (alg) {}

},{"cipher-base":67,"inherits":136,"md5.js":139,"ripemd160":181,"sha.js":185}],72:[function(require,module,exports){},{"md5.js":139}],73:[function(require,module,exports){
module.exports = function createHmac (alg, key) {}

},{"./legacy":74,"cipher-base":67,"create-hash/md5":72,"inherits":136,"ripemd160":181,"safe-buffer":182,"sha.js":185}],74:[function(require,module,exports){},{"cipher-base":67,"inherits":136,"safe-buffer":182}],75:[function(require,module,exports){
'use strict'

exports.randomBytes = exports.rng = exports.pseudoRandomBytes = exports.prng = require('randombytes')
exports.createHash = exports.Hash = require('create-hash')
exports.createHmac = exports.Hmac = require('create-hmac')

var algos = require('browserify-sign/algos')
var algoKeys = Object.keys(algos)
var hashes = ['sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'md5', 'rmd160'].concat(algoKeys)
exports.getHashes = function () {}

var p = require('pbkdf2')
exports.pbkdf2 = p.pbkdf2
exports.pbkdf2Sync = p.pbkdf2Sync

var aes = require('browserify-cipher')

exports.Cipher = aes.Cipher
exports.createCipher = aes.createCipher
exports.Cipheriv = aes.Cipheriv
exports.createCipheriv = aes.createCipheriv
exports.Decipher = aes.Decipher
exports.createDecipher = aes.createDecipher
exports.Decipheriv = aes.Decipheriv
exports.createDecipheriv = aes.createDecipheriv
exports.getCiphers = aes.getCiphers
exports.listCiphers = aes.listCiphers

var dh = require('diffie-hellman')

exports.DiffieHellmanGroup = dh.DiffieHellmanGroup
exports.createDiffieHellmanGroup = dh.createDiffieHellmanGroup
exports.getDiffieHellman = dh.getDiffieHellman
exports.createDiffieHellman = dh.createDiffieHellman
exports.DiffieHellman = dh.DiffieHellman

var sign = require('browserify-sign')

exports.createSign = sign.createSign
exports.Sign = sign.Sign
exports.createVerify = sign.createVerify
exports.Verify = sign.Verify

exports.createECDH = require('create-ecdh')

var publicEncrypt = require('public-encrypt')

exports.publicEncrypt = publicEncrypt.publicEncrypt
exports.privateEncrypt = publicEncrypt.privateEncrypt
exports.publicDecrypt = publicEncrypt.publicDecrypt
exports.privateDecrypt = publicEncrypt.privateDecrypt

// the least I can do is make error messages for the rest of the node.js/crypto api.
// ;[
//   'createCredentials'
// ].forEach(function (name) {
//   exports[name] = function () {
//     throw new Error([
//       'sorry, ' + name + ' is not implemented yet',
//       'we accept pull requests',
//       'https://github.com/crypto-browserify/crypto-browserify'
//     ].join('\n'))
//   }
// })

var rf = require('randomfill')

exports.randomFill = rf.randomFill
exports.randomFillSync = rf.randomFillSync

exports.createCredentials = function () {}

exports.constants = {
  'DH_CHECK_P_NOT_SAFE_PRIME': 2,
  'DH_CHECK_P_NOT_PRIME': 1,
  'DH_UNABLE_TO_CHECK_GENERATOR': 4,
  'DH_NOT_SUITABLE_GENERATOR': 8,
  'NPN_ENABLED': 1,
  'ALPN_ENABLED': 1,
  'RSA_PKCS1_PADDING': 1,
  'RSA_SSLV23_PADDING': 2,
  'RSA_NO_PADDING': 3,
  'RSA_PKCS1_OAEP_PADDING': 4,
  'RSA_X931_PADDING': 5,
  'RSA_PKCS1_PSS_PADDING': 6,
  'POINT_CONVERSION_COMPRESSED': 2,
  'POINT_CONVERSION_UNCOMPRESSED': 4,
  'POINT_CONVERSION_HYBRID': 6
}

},{"browserify-cipher":39,"browserify-sign":47,"browserify-sign/algos":44,"create-ecdh":69,"create-hash":71,"create-hmac":73,"diffie-hellman":82,"pbkdf2":149,"public-encrypt":157,"randombytes":164,"randomfill":165}],76:[function(require,module,exports){},{"./des/cbc":77,"./des/cipher":78,"./des/des":79,"./des/ede":80,"./des/utils":81}],77:[function(require,module,exports){},{"inherits":136,"minimalistic-assert":142}],78:[function(require,module,exports){},{"minimalistic-assert":142}],79:[function(require,module,exports){},{"./cipher":78,"./utils":81,"inherits":136,"minimalistic-assert":142}],80:[function(require,module,exports){},{"./cipher":78,"./des":79,"inherits":136,"minimalistic-assert":142}],81:[function(require,module,exports){},{}],82:[function(require,module,exports){
(function (Buffer){
function getDiffieHellman (mod) {}

function createDiffieHellman (prime, enc, generator, genc) {}

exports.DiffieHellmanGroup = exports.createDiffieHellmanGroup = exports.getDiffieHellman = getDiffieHellman
exports.createDiffieHellman = exports.DiffieHellman = createDiffieHellman

}).call(this,require("buffer").Buffer)
},{"./lib/dh":83,"./lib/generatePrime":84,"./lib/primes.json":85,"buffer":66}],83:[function(require,module,exports){},{"./generatePrime":84,"bn.js":86,"buffer":66,"miller-rabin":140,"randombytes":164}],84:[function(require,module,exports){

},{"bn.js":86,"miller-rabin":140,"randombytes":164}],85:[function(require,module,exports){},{}],86:[function(require,module,exports){},{"buffer":21,"dup":17}],87:[function(require,module,exports){},{"../package.json":103,"./elliptic/curve":90,"./elliptic/curves":93,"./elliptic/ec":94,"./elliptic/eddsa":97,"./elliptic/utils":101,"brorand":20}],88:[function(require,module,exports){},{"../utils":101,"bn.js":102}],89:[function(require,module,exports){},{"../utils":101,"./base":88,"bn.js":102,"inherits":136}],90:[function(require,module,exports){},{"./base":88,"./edwards":89,"./mont":91,"./short":92}],91:[function(require,module,exports){},{"../utils":101,"./base":88,"bn.js":102,"inherits":136}],92:[function(require,module,exports){},{"../utils":101,"./base":88,"bn.js":102,"inherits":136}],93:[function(require,module,exports){},{"./curve":90,"./precomputed/secp256k1":100,"./utils":101,"hash.js":122}],94:[function(require,module,exports){},{"../curves":93,"../utils":101,"./key":95,"./signature":96,"bn.js":102,"brorand":20,"hmac-drbg":134}],95:[function(require,module,exports){},{"../utils":101,"bn.js":102}],96:[function(require,module,exports){},{"../utils":101,"bn.js":102}],97:[function(require,module,exports){},{"../curves":93,"../utils":101,"./key":98,"./signature":99,"hash.js":122}],98:[function(require,module,exports){},{"../utils":101}],99:[function(require,module,exports){},{"../utils":101,"bn.js":102}],100:[function(require,module,exports){},{}],101:[function(require,module,exports){},{"bn.js":102,"minimalistic-assert":142,"minimalistic-crypto-utils":143}],102:[function(require,module,exports){},{"buffer":21,"dup":17}],103:[function(require,module,exports){},{}],104:[function(require,module,exports){},{}],105:[function(require,module,exports){},{"md5.js":139,"safe-buffer":182}],106:[function(require,module,exports){},{"inherits":136,"readable-stream":121,"safe-buffer":182}],107:[function(require,module,exports){},{"dup":50}],108:[function(require,module,exports){},{"./_stream_readable":110,"./_stream_writable":112,"_process":156,"dup":51,"inherits":136}],109:[function(require,module,exports){},{"./_stream_transform":111,"dup":52,"inherits":136}],110:[function(require,module,exports){},{"../errors":107,"./_stream_duplex":108,"./internal/streams/async_iterator":113,"./internal/streams/buffer_list":114,"./internal/streams/destroy":115,"./internal/streams/from":117,"./internal/streams/state":119,"./internal/streams/stream":120,"_process":156,"buffer":66,"dup":53,"events":104,"inherits":136,"string_decoder/":193,"util":21}],111:[function(require,module,exports){},{"../errors":107,"./_stream_duplex":108,"dup":54,"inherits":136}],112:[function(require,module,exports){},{"../errors":107,"./_stream_duplex":108,"./internal/streams/destroy":115,"./internal/streams/state":119,"./internal/streams/stream":120,"_process":156,"buffer":66,"dup":55,"inherits":136,"util-deprecate":195}],113:[function(require,module,exports){},{"./end-of-stream":116,"_process":156,"dup":56}],114:[function(require,module,exports){},{"buffer":66,"dup":57,"util":21}],115:[function(require,module,exports){},{"_process":156,"dup":58}],116:[function(require,module,exports){},{"../../../errors":107,"dup":59}],117:[function(require,module,exports){},{"dup":60}],118:[function(require,module,exports){},{"../../../errors":107,"./end-of-stream":116,"dup":61}],119:[function(require,module,exports){},{"../../../errors":107,"dup":62}],120:[function(require,module,exports){},{"dup":63,"events":104}],121:[function(require,module,exports){},{"./lib/_stream_duplex.js":108,"./lib/_stream_passthrough.js":109,"./lib/_stream_readable.js":110,"./lib/_stream_transform.js":111,"./lib/_stream_writable.js":112,"./lib/internal/streams/end-of-stream.js":116,"./lib/internal/streams/pipeline.js":118,"dup":64}],122:[function(require,module,exports){},{"./hash/common":123,"./hash/hmac":124,"./hash/ripemd":125,"./hash/sha":126,"./hash/utils":133}],123:[function(require,module,exports){},{"./utils":133,"minimalistic-assert":142}],124:[function(require,module,exports){},{"./utils":133,"minimalistic-assert":142}],125:[function(require,module,exports){},{"./common":123,"./utils":133}],126:[function(require,module,exports){},{"./sha/1":127,"./sha/224":128,"./sha/256":129,"./sha/384":130,"./sha/512":131}],127:[function(require,module,exports){},{"../common":123,"../utils":133,"./common":132}],128:[function(require,module,exports){},{"../utils":133,"./256":129}],129:[function(require,module,exports){},{"../common":123,"../utils":133,"./common":132,"minimalistic-assert":142}],130:[function(require,module,exports){},{"../utils":133,"./512":131}],131:[function(require,module,exports){},{"../common":123,"../utils":133,"minimalistic-assert":142}],132:[function(require,module,exports){},{"../utils":133}],133:[function(require,module,exports){},{"inherits":136,"minimalistic-assert":142}],134:[function(require,module,exports){},{"hash.js":122,"minimalistic-assert":142,"minimalistic-crypto-utils":143}],135:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {}

},{}],136:[function(require,module,exports){},{}],137:[function(require,module,exports){},{}],138:[function(require,module,exports){},{}],139:[function(require,module,exports){},{"hash-base":106,"inherits":136,"safe-buffer":182}],140:[function(require,module,exports){},{"bn.js":141,"brorand":20}],141:[function(require,module,exports){},{"buffer":21,"dup":17}],142:[function(require,module,exports){},{}],143:[function(require,module,exports){},{}],144:[function(require,module,exports){},{}],145:[function(require,module,exports){},{"./certificate":146,"asn1.js":3}],146:[function(require,module,exports){},{"asn1.js":3}],147:[function(require,module,exports){},{"browserify-aes":24,"evp_bytestokey":105,"safe-buffer":182}],148:[function(require,module,exports){},{"./aesid.json":144,"./asn1":145,"./fixProc":147,"browserify-aes":24,"pbkdf2":149,"safe-buffer":182}],149:[function(require,module,exports){
exports.pbkdf2 = require('./lib/async')
exports.pbkdf2Sync = require('./lib/sync')

},{"./lib/async":150,"./lib/sync":153}],150:[function(require,module,exports){
(function (process,global){
module.exports = function (password, salt, iterations, keylen, digest, callback) {}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./default-encoding":151,"./precondition":152,"./sync":153,"./to-buffer":154,"_process":156,"safe-buffer":182}],151:[function(require,module,exports){},{"_process":156}],152:[function(require,module,exports){},{}],153:[function(require,module,exports){
function pbkdf2 (password, salt, iterations, keylen, digest) {}

module.exports = pbkdf2

},{"./default-encoding":151,"./precondition":152,"./to-buffer":154,"create-hash/md5":72,"ripemd160":181,"safe-buffer":182,"sha.js":185}],154:[function(require,module,exports){},{"safe-buffer":182}],155:[function(require,module,exports){},{"_process":156}],156:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {}
function runClearTimeout(marker) {}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {}

function drainQueue() {}

process.nextTick = function (fun) {};

// v8 likes predictible objects
function Item(fun, array) {}
Item.prototype.run = function () {};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) {}

process.binding = function (name) {};

process.cwd = function () {};
process.chdir = function (dir) {};
process.umask = function() {};

},{}],157:[function(require,module,exports){
exports.publicEncrypt = require('./publicEncrypt')
exports.privateDecrypt = require('./privateDecrypt')

exports.privateEncrypt = function privateEncrypt (key, buf) {}

exports.publicDecrypt = function publicDecrypt (key, buf) {}

},{"./privateDecrypt":160,"./publicEncrypt":161}],158:[function(require,module,exports){},{"create-hash":71,"safe-buffer":182}],159:[function(require,module,exports){},{"buffer":21,"dup":17}],160:[function(require,module,exports){

module.exports = function privateDecrypt (privateKey, enc, reverse) {}

},{"./mgf":158,"./withPublic":162,"./xor":163,"bn.js":159,"browserify-rsa":42,"create-hash":71,"parse-asn1":148,"safe-buffer":182}],161:[function(require,module,exports){

module.exports = function publicEncrypt (publicKey, msg, reverse) {}

},{"./mgf":158,"./withPublic":162,"./xor":163,"bn.js":159,"browserify-rsa":42,"create-hash":71,"parse-asn1":148,"randombytes":164,"safe-buffer":182}],162:[function(require,module,exports){},{"bn.js":159,"safe-buffer":182}],163:[function(require,module,exports){},{}],164:[function(require,module,exports){
(function (process,global){
'use strict'

// limit of Crypto.getRandomValues()
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
var MAX_BYTES = 65536

// Node supports requesting up to this number of bytes
// https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48
var MAX_UINT32 = 4294967295

function oldBrowser () {}

var Buffer = require('safe-buffer').Buffer
var crypto = global.crypto || global.msCrypto

if (crypto && crypto.getRandomValues) {
  module.exports = randomBytes
} else {
  module.exports = oldBrowser
}

function randomBytes (size, cb) {
  // phantomjs needs to throw
  if (size > MAX_UINT32) throw new RangeError('requested too many random bytes')

  var bytes = Buffer.allocUnsafe(size)

  if (size > 0) {  // getRandomValues fails on IE if size == 0
    if (size > MAX_BYTES) { // this is the max bytes crypto.getRandomValues
      // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
      for (var generated = 0; generated < size; generated += MAX_BYTES) {
        // buffer.slice automatically checks if the end is past the end of
        // the buffer so we don't have to here
        crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES))
      }
    } else {
      crypto.getRandomValues(bytes)
    }
  }

  if (typeof cb === 'function') {
    return process.nextTick(function () {})
  }

  return bytes
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":156,"safe-buffer":182}],165:[function(require,module,exports){
(function (process,global){
'use strict'

function oldBrowser () {}
var safeBuffer = require('safe-buffer')
var randombytes = require('randombytes')
var Buffer = safeBuffer.Buffer
var kBufferMaxLength = safeBuffer.kMaxLength
var crypto = global.crypto || global.msCrypto
var kMaxUint32 = Math.pow(2, 32) - 1
function assertOffset (offset, length) {}

function assertSize (size, offset, length) {}
if ((crypto && crypto.getRandomValues) || !process.browser) {
  exports.randomFill = randomFill
  exports.randomFillSync = randomFillSync
} else {
  exports.randomFill = oldBrowser
  exports.randomFillSync = oldBrowser
}
function randomFill (buf, offset, size, cb) {}

function actualFill (buf, offset, size, cb) {}
function randomFillSync (buf, offset, size) {}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":156,"randombytes":164,"safe-buffer":182}],166:[function(require,module,exports){},{"./lib/_stream_duplex.js":167}],167:[function(require,module,exports){},{"./_stream_readable":169,"./_stream_writable":171,"core-util-is":68,"inherits":136,"process-nextick-args":155}],168:[function(require,module,exports){},{"./_stream_transform":170,"core-util-is":68,"inherits":136}],169:[function(require,module,exports){},{"./_stream_duplex":167,"./internal/streams/BufferList":172,"./internal/streams/destroy":173,"./internal/streams/stream":174,"_process":156,"core-util-is":68,"events":104,"inherits":136,"isarray":138,"process-nextick-args":155,"safe-buffer":175,"string_decoder/":176,"util":21}],170:[function(require,module,exports){},{"./_stream_duplex":167,"core-util-is":68,"inherits":136}],171:[function(require,module,exports){},{"./_stream_duplex":167,"./internal/streams/destroy":173,"./internal/streams/stream":174,"_process":156,"core-util-is":68,"inherits":136,"process-nextick-args":155,"safe-buffer":175,"timers":194,"util-deprecate":195}],172:[function(require,module,exports){},{"safe-buffer":175,"util":21}],173:[function(require,module,exports){},{"process-nextick-args":155}],174:[function(require,module,exports){},{"dup":63,"events":104}],175:[function(require,module,exports){},{"buffer":66}],176:[function(require,module,exports){},{"safe-buffer":175}],177:[function(require,module,exports){},{"./readable":178}],178:[function(require,module,exports){},{"./lib/_stream_duplex.js":167,"./lib/_stream_passthrough.js":168,"./lib/_stream_readable.js":169,"./lib/_stream_transform.js":170,"./lib/_stream_writable.js":171}],179:[function(require,module,exports){},{"./readable":178}],180:[function(require,module,exports){},{"./lib/_stream_writable.js":171}],181:[function(require,module,exports){},{"buffer":66,"hash-base":106,"inherits":136}],182:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {}

SafeBuffer.alloc = function (size, fill, encoding) {}

SafeBuffer.allocUnsafe = function (size) {}

SafeBuffer.allocUnsafeSlow = function (size) {}

},{"buffer":66}],183:[function(require,module,exports){},{"_process":156,"buffer":66}],184:[function(require,module,exports){},{"safe-buffer":182}],185:[function(require,module,exports){},{"./sha":186,"./sha1":187,"./sha224":188,"./sha256":189,"./sha384":190,"./sha512":191}],186:[function(require,module,exports){},{"./hash":184,"inherits":136,"safe-buffer":182}],187:[function(require,module,exports){},{"./hash":184,"inherits":136,"safe-buffer":182}],188:[function(require,module,exports){},{"./hash":184,"./sha256":189,"inherits":136,"safe-buffer":182}],189:[function(require,module,exports){},{"./hash":184,"inherits":136,"safe-buffer":182}],190:[function(require,module,exports){},{"./hash":184,"./sha512":191,"inherits":136,"safe-buffer":182}],191:[function(require,module,exports){},{"./hash":184,"inherits":136,"safe-buffer":182}],192:[function(require,module,exports){},{"events":104,"inherits":136,"readable-stream/duplex.js":166,"readable-stream/passthrough.js":177,"readable-stream/readable.js":178,"readable-stream/transform.js":179,"readable-stream/writable.js":180}],193:[function(require,module,exports){},{"dup":176,"safe-buffer":182}],194:[function(require,module,exports){},{"process/browser.js":156,"timers":194}],195:[function(require,module,exports){},{}]},{},[1])(1)
});
