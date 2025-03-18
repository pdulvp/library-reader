import {
  type ContentType, ContentTypes, from
} from './ContentTypes.mts'
import assert from "node:assert";

assert(from("toto.zip") == ContentTypes.ZIP);
assert(from("toto.mjx") == ContentTypes.UNKNOWN);
