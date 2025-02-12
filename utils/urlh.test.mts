
import { type Rule, type Rules, urlh } from './urlh.mts';
import { strict as assert, equal } from 'node:assert';

const Rules2: Rules = {
  code: (type) => {
    return { status: type != null && type.match(/^[a-zA-Z0-9_-]+$/) != null, msg: "code invalid format" }
  },
  date: (type) => {
    return { status: type != null && type.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) != null, msg: "date invalid format" }
  },
  type: (type) => {
    return { status: type == "cover" || type == "full" || type == null, msg: "type invalid format" }
  }
};

assert(urlh.check(new URL("https://pdulvp.fr/?code=10&date=2021-01-02"), "code", (code) => { return { status: true, msg: "c" } }));
assert(urlh.check(new URL("https://pdulvp.fr/?code=10&date=2021-01-02"), "date", (date) => { return { status: true, msg: "c" } }));

assert(!urlh.check(new URL("https://pdulvp.fr/?code=10&date=2021-01-02"), "code", (code) => { return { status: false, msg: "c" } }));
assert(!urlh.check(new URL("https://pdulvp.fr/?code=10&date=2021-01-02"), "date", (date) => { return { status: false, msg: "c" } }));

equal(urlh.param(new URL("https://pdulvp.fr/?code=10"), "code", Rules2.code, (code) => code), "10");
equal(urlh.param(new URL("https://pdulvp.fr/?date=2021-01-02"), "date", Rules2.date, (date) => date), "2021-01-02");
