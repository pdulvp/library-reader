
import assert from "node:assert";
import { consoleh } from "./consoleh.mts";

var asserth = {
  internal: {
    console: consoleh,
  },
  assert: (value, msg) => {
    try {
      assert(value, msg);
      asserth.internal.console.blue("[OK]: " + msg);
    } catch (e) {
      asserth.internal.console.red("[KO]: " + msg);
      throw e;
    }
  },

  raiseException: (func, msg) => {
    try {
      func();
    } catch (e) {
      asserth.internal.console.blue("[OK]: " + msg);
      assert(true);
      return;
    }
    asserth.internal.console.red("[KO]: " + msg);
    assert(false, msg);
  },

  begin: (txt) => {
    asserth.internal.console.green(`======== ${txt} ========`);
  },

  equalsArray: (array, array2, msg) => {
    try {
      assert(array.length == array2.length && array2.filter(c => !array.includes(c)).length == 0, msg);
      asserth.internal.console.blue("[OK]: " + msg);
    } catch (e) {
      asserth.internal.console.red("[KO]: " + msg);
      throw e;
    }
  }
}

export {
  asserth
}
