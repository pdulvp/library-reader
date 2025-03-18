
import assert from "assert";
import { asserth } from "./asserth.mts";
import { consoleh } from "./consoleh.mts";

const Colors = { green: "green", red: "red", yellow: "yellow", blue: "blue", unknown: "unknown" }
type Color = typeof Colors[keyof typeof Colors];

let triggered: Color = Colors.unknown;

asserth.internal.console = {
  green(msg: string): void {
    triggered = Colors.green;
    consoleh.green(msg);
  },
  red(msg: string): void {
    triggered = Colors.red;
  },
  yellow(msg: string): void {
    triggered = Colors.yellow;
  },
  blue(msg: string): void {
    triggered = Colors.blue;
  }
}

let is = (expectedKind: Color) => {
  return triggered == expectedKind;
}

asserth.begin("Toto");
assert(is(Colors.green), "Color shall be green");

try {
  asserth.assert(true, "no error shall be raised");
  assert(is(Colors.blue), "Color shall be blue");
} catch (e) {
  assert(false);
}

let isRaised = false;
try {
  asserth.raiseException(() => { true }, "error shall be raised");
} catch (e) {
  isRaised = true;
}
assert(is(Colors.red), "Color shall be red");
assert(isRaised, "error shall be raised");

isRaised = false;
try {
  asserth.raiseException(() => { assert(false) }, "error shall not be raised");
} catch (e) {
  isRaised = true;
}
assert(is(Colors.blue), "Color shall be blue");
assert(!isRaised, "error shall not be raised");
