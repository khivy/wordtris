/* eslint-disable */
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface PlayerSubmissionData {
  score: number;
  name: string;
  ip: string;
  words: string[];
  checksum: Uint8Array;
}

function createBasePlayerSubmissionData(): PlayerSubmissionData {
  return { score: 0, name: "", ip: "", words: [], checksum: new Uint8Array() };
}

export const PlayerSubmissionData = {
  encode(message: PlayerSubmissionData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.score !== 0) {
      writer.uint32(8).int32(message.score);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.ip !== "") {
      writer.uint32(26).string(message.ip);
    }
    for (const v of message.words) {
      writer.uint32(34).string(v!);
    }
    if (message.checksum.length !== 0) {
      writer.uint32(42).bytes(message.checksum);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PlayerSubmissionData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePlayerSubmissionData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.score = reader.int32();
          break;
        case 2:
          message.name = reader.string();
          break;
        case 3:
          message.ip = reader.string();
          break;
        case 4:
          message.words.push(reader.string());
          break;
        case 5:
          message.checksum = reader.bytes();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PlayerSubmissionData {
    return {
      score: isSet(object.score) ? Number(object.score) : 0,
      name: isSet(object.name) ? String(object.name) : "",
      ip: isSet(object.ip) ? String(object.ip) : "",
      words: Array.isArray(object?.words) ? object.words.map((e: any) => String(e)) : [],
      checksum: isSet(object.checksum) ? bytesFromBase64(object.checksum) : new Uint8Array(),
    };
  },

  toJSON(message: PlayerSubmissionData): unknown {
    const obj: any = {};
    message.score !== undefined && (obj.score = Math.round(message.score));
    message.name !== undefined && (obj.name = message.name);
    message.ip !== undefined && (obj.ip = message.ip);
    if (message.words) {
      obj.words = message.words.map((e) => e);
    } else {
      obj.words = [];
    }
    message.checksum !== undefined &&
      (obj.checksum = base64FromBytes(message.checksum !== undefined ? message.checksum : new Uint8Array()));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PlayerSubmissionData>, I>>(object: I): PlayerSubmissionData {
    const message = createBasePlayerSubmissionData();
    message.score = object.score ?? 0;
    message.name = object.name ?? "";
    message.ip = object.ip ?? "";
    message.words = object.words?.map((e) => e) || [];
    message.checksum = object.checksum ?? new Uint8Array();
    return message;
  },
};

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (globalThis.Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (globalThis.Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
