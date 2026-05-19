declare module 'crypto-js' {
  export interface WordArray {
    words: number[];
    sigBytes: number;
    toString(encoder?: any): string;
    concat(wordArray: WordArray): WordArray;
    clamp(): void;
    clone(): WordArray;
  }

  export interface CipherParams {
    ciphertext: WordArray;
    key?: WordArray;
    iv?: WordArray;
    salt?: WordArray;
    algorithm?: any;
    mode?: any;
    padding?: any;
    blockSize?: number;
    formatter?: any;
  }

  export interface Encoder {
    stringify(wordArray: WordArray): string;
    parse(str: string): WordArray;
  }

  namespace enc {
    const Hex: Encoder;
    const Latin1: Encoder;
    const Utf8: Encoder;
    const Base64: Encoder;
    const Base64url: Encoder;
  }

  namespace lib {
    class WordArray {
      static create(words?: number[], sigBytes?: number): WordArray;
      static random(nBytes: number): WordArray;
    }
  }

  namespace HmacSHA1 {
    function toString(encoder?: any): string;
  }

  function HmacSHA1(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA256(message: string | WordArray, key: string | WordArray): WordArray;
  function HmacSHA512(message: string | WordArray, key: string | WordArray): WordArray;
  function SHA1(message: string | WordArray): WordArray;
  function SHA256(message: string | WordArray): WordArray;
  function SHA512(message: string | WordArray): WordArray;
  function MD5(message: string | WordArray): WordArray;

  namespace AES {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: any): WordArray;
  }

  namespace DES {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: any): WordArray;
  }

  namespace TripleDES {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: any): WordArray;
  }

  namespace Rabbit {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: any): WordArray;
  }

  namespace RC4 {
    function encrypt(message: string | WordArray, key: string | WordArray, cfg?: any): CipherParams;
    function decrypt(cipherParams: CipherParams | string, key: string | WordArray, cfg?: any): WordArray;
  }

  namespace mode {
    const CBC: any;
    const CFB: any;
    const CTR: any;
    const ECB: any;
    const OFB: any;
  }

  namespace pad {
    const Pkcs7: any;
    const AnsiX923: any;
    const Iso10126: any;
    const Iso97971: any;
    const ZeroPadding: any;
    const NoPadding: any;
  }

  namespace format {
    const OpenSSL: any;
    const Hex: any;
  }

  export default {
    HmacSHA1,
    HmacSHA256,
    HmacSHA512,
    SHA1,
    SHA256,
    SHA512,
    MD5,
    AES,
    DES,
    TripleDES,
    Rabbit,
    RC4,
    enc,
    lib,
    mode,
    pad,
    format,
  };
}
