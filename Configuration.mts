

import { type Rule, type Rules, urlh } from './utils/urlh.mts';
const ConfigFields = { hostname: "hostname", port: "port", accessors: "accessors" };
import fs from 'fs';

type Configuration = {
  hostname: string;
  port: number,
  accessors: string[]
}

const ConfigRules: { hostname: Rule<string>, port: Rule<number>, accessors: Rule<string[]> } = {
  hostname: (type) => {
    return { status: type != null && type.match(/^[0-9.]+$/) != null, msg: "code invalid format" }
  },
  port: (type) => {
    return { status: typeof (type) == "number", msg: "invalid format" }
  },
  accessors: (type) => {
    return { status: Array.isArray(type) && type.filter(x => typeof (x) != "string").length == 0, msg: "type invalid format" }
  }
} as const;

function mergeConfigurations(configs) {
  let configuration: Configuration = configs.reduce((res, config) => {
    let userConfiguration: Configuration = {
      hostname: urlh.param(config, ConfigFields.hostname, ConfigRules.hostname, (hostname) => hostname, true),
      port: urlh.param(config, ConfigFields.port, ConfigRules.port, (port) => port, true),
      accessors: urlh.param(config, ConfigFields.accessors, ConfigRules.accessors, (accessors) => accessors, true)
    };
    res = { ...res, ...Object.fromEntries(Object.entries(userConfiguration).filter(([_, value]) => value !== undefined)) }
    return res;
  }, {
    hostname: "",
    port: 0,
    accessors: []
  });
  return configuration;
}

function loadConfiguration(configs) {
  return mergeConfigurations(["default", ...configs].map(c => {
    return JSON.parse(fs.readFileSync(`configuration/${c}.json`, { encoding: "utf-8" }).toString()).configuration
  }));
}

export {
  ConfigFields, type Configuration, ConfigRules, loadConfiguration, mergeConfigurations
}
