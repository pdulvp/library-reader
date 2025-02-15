

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
    return { status: type != null && Number(type) != null, msg: "date invalid format" }
  },
  accessors: (type) => {
    return { status: type != null, msg: "type invalid format" }
  }
} as const;

function loadConfiguration(configs) {
  let configuration: Configuration = ["default", ...configs].reduce((res, c) => {
    let config = JSON.parse(fs.readFileSync(`configuration/${c}.json`, { encoding: "utf-8" }).toString()).configuration;
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

export {
  ConfigFields, type Configuration, ConfigRules, loadConfiguration
}
