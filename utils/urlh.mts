
type RuleResult = { status: boolean; msg: string }
type Rule<V> = (type: V) => RuleResult

type Transform<V, U> = (v: V) => U;

interface Rules {
  [key: string]: Rule<any>;
}

interface Entries {
  [key: string]: string;
}

type ParamValue = {
  variable: string;
  value: string
}
//check: <V, T extends Rules4<V>>(url: Entries | URL, rules: T): { [key in keyof V]: RuleResult } => {
// let p: Entries = isFruit(url) ? url : Object.fromEntries(url.searchParams);

const isURL = (x: any) => { return x.searchParams != undefined };
const isV = <V extends any>(x: any): x is V => true;

var urlh = {
  check: <V extends any>(url: Entries | URL, type: string, rule: Rule<V>, optional: boolean = false): RuleResult => {
    let p: Entries = isURL(url) ? Object.fromEntries((url as URL).searchParams) : url as Entries;
    if (optional && p[type] == null) return { status: true, msg: "null" }
    if (p[type] == null) return { status: false, msg: "null" }
    if (!isV(p[type])) return { status: false, msg: "not V" }
    let value: V = p[type] as V;
    let result = rule(value as V);
    return result as RuleResult;
  },
  param: <V, U>(url: Entries | URL, type: string, rule: Rule<V>, trans: Transform<V, U>, optional: boolean = false): U => {
    let result = urlh.check(url, type, rule, optional);
    if (!result.status) {
      throw new Error('Wrong parameter: ' + type + " " + result.msg);
    }
    let p: Entries = isURL(url) ? Object.fromEntries((url as URL).searchParams) : url as Entries;
    let value: V = p[type] as V;
    return trans(value);
  }
};

export { type Rule, type RuleResult, type Rules, type ParamValue, urlh };
/*
var urlh = {
  check: <V extends any>(value: V | null, rule: Rule<V>): RuleResult => {
    if (value == null) return { status: false, msg: "null" }
    let result = rule(value);
    return result as RuleResult;
  },
  params: <V, U>(value: V | null, rule: Rule<V>, trans: Transform<V, U>): U => {
    let result = urlh.check(value, rule);
    if (!result.status) {
      throw new Error('Wrong parameters: ' + Object.keys(result).filter(k => !result[k].status).map(k => result[k].msg).join(","));
    }
    return trans(value!);
  }
};
*/