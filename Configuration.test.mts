import {
  ConfigFields, type Configuration, ConfigRules, loadConfiguration, mergeConfigurations
} from './Configuration.mts'

import { asserth } from "./utils/asserth.mts";

asserth.begin("Configuration");

asserth.assert(ConfigRules.port(20).status == true, "port shall be a number");

asserth.assert(mergeConfigurations([]).hostname == "", "hostname shall be empty");
asserth.assert(mergeConfigurations([{ hostname: "127.0.0.1" }]).hostname == "127.0.0.1", "hostname shall be the one");
asserth.assert(mergeConfigurations([{ hostname: "127.0.0.1" }, { hostname: "127.0.0.2" }]).hostname == "127.0.0.2", "hostname shall be the second one");

asserth.raiseException(() => { mergeConfigurations([{ hostname: 0 }]) }, "hostname shall be valid")
asserth.raiseException(() => { mergeConfigurations([{ port: "0oa" }]) }, "port shall be valid")
asserth.raiseException(() => { mergeConfigurations([{ accessors: "0oa" }]) }, "accessors shall be array")

asserth.equalsArray(mergeConfigurations([{ accessors: ["a", "b"] }, { accessors: ["c", "d"] }]).accessors, ["c", "d"], "Accessors shall be the last one");

