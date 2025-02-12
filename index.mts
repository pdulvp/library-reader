import fs from 'fs';
import http from "http";
import fDomainh from "./domainh.mts";
import { type Rule, type Rules, urlh } from './utils/urlh.mts';
import { consoleh } from './utils/consoleh.mts';
import { type ContentType, ContentTypes, from as ContentTypeFrom } from "./ContentTypes.mts";
import { createProcessor, type RequestProcessor } from "./RequestProcessor.mts";

import { combine } from "./Accessor.mts";

const ConfigFields = { hostname: "hostname", port: "port", accessors: "accessors" };

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

if (!fs.existsSync("configuration-default.json")) {
  console.log("configuration-default is weirdly missing.");
  process.exit();
}

let config = JSON.parse(fs.readFileSync("configuration-default.json", { encoding: "utf-8" }).toString()).configuration;
let configuration: Configuration = {
  hostname: urlh.param(config, ConfigFields.hostname, ConfigRules.hostname, (hostname) => hostname),
  port: urlh.param(config, ConfigFields.port, ConfigRules.port, (port) => port),
  accessors: urlh.param(config, ConfigFields.accessors, ConfigRules.accessors, (accessors) => accessors)
};

let params = process.argv.slice(2);
if (params.length > 0) {
  let name = params[0];
  if (name.match("^[a-z\-]+$") && fs.existsSync(name + ".json")) {
    console.log("load additional configuration: " + name);

    let config = JSON.parse(fs.readFileSync(name + ".json", { encoding: "utf-8" }).toString()).configuration;
    let userConfiguration: Configuration = {
      hostname: urlh.param(config, ConfigFields.hostname, ConfigRules.hostname, (hostname) => hostname, true),
      port: urlh.param(config, ConfigFields.port, ConfigRules.port, (port) => port, true),
      accessors: urlh.param(config, ConfigFields.accessors, ConfigRules.accessors, (accessors) => accessors, true)
    };

    configuration = { ...configuration, ...Object.fromEntries(Object.entries(userConfiguration).filter(([_, value]) => value !== undefined)) }
  }
}

let accessors = configuration.accessors;
if (accessors.length == 0) {
  console.log("An accessor is required");
  process.exit();
}

let unaccessibleAccessors = accessors.filter(a => !fs.existsSync("./" + a));
if (unaccessibleAccessors.length > 0) {
  console.log("The specified accessors doesn't exist:" + unaccessibleAccessors);
  process.exit();
}

let accessorModules: any[] = [];
for (let i = 0; i < accessors.length; i++) {
  const module: any = await import("./" + accessors[i]);
  accessorModules.push(module.default);
}

console.log("Loaded accessors: " + accessors);
console.log("Loaded accessor modules: " + accessorModules);
let accessorh = combine(accessorModules);
var domainh = fDomainh(accessorh);

var api = {
  list: accessorh.getBooks,
  archives: accessorh.getArchives,
  fetch: {
    status: domainh.getStatus,
    read: domainh.read,
    download: domainh.download,
    downloads: domainh.getDownloads,
    stop: domainh.stopDownload,
    thumb: domainh.getThumbnail,
  },
}

console.log(api);

const URLFields = { code: "code", date: "date", type: "type" };

const Rules: { code: Rule<string>, date: Rule<string>, downloadType: Rule<string> } = {
  code: (type) => {
    return { status: type != null && type.match(/^[a-zA-Z0-9_-]+$/) != null, msg: "code invalid format" }
  },
  date: (type) => {
    return { status: type != null && type.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/) != null, msg: "date invalid format" }
  },
  downloadType: (type) => {
    return { status: type == "cover" || type == "full" || type == "slice", msg: "type invalid format" }
  }
} as const;

function proceedRequest(processor: RequestProcessor, onError: (e: Error) => void) {

  let allowedFiles =
    ["customElements/BooksList.mjs",
      "customElements/StatusImage.mjs",
      "customElements/BookLink.mjs",
      "customElements/BookPanel.mjs",
      "customElements/ArchivesPanel.mjs",
      "customElements/SpinProgress.mjs",
      "customElements/SpinProgress.domain.mjs",
      "customElements/NavHeader.mjs",
      "customElements/BackgroundPanel.mjs",
      "customElements/DownloadsPanel.mjs",
      "customElements/SidePanel.mjs",
      "api.mjs",
      "domh.mjs",
      "index.mjs",
      "dateh.mjs",
      "accessorh/sampleh.mjs",
      "css/main.css",
      "index.html"
    ];

  let url = new URL("https://" + hostname + processor.url);
  console.log(url.pathname + " " + url.searchParams);

  let file = processor.url == '/' ? "index.html" : processor.url != undefined ? processor.url.substring(1, processor.url.length) : "<unknown>";
  if (allowedFiles.includes(file)) {
    processor.end(fs.readFileSync("site/" + file), ContentTypeFrom(file));

  } else if (url.pathname == '/api/list') {
    api.list().then(e => {
      processor.json(e);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/api/archives') {
    let code = urlh.param(url, URLFields.code, Rules.code, (code) => "e");

    api.archives(code).then(e => {
      processor.json(e);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/api/status') {
    processor.read.asJson().then(json => {
      api.fetch.status(json).then(e => {
        processor.json(e);
      }).catch((e) => { onError(e) });
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/thumb') {
    let [code, date] = [
      urlh.param(url, URLFields.code, Rules.code, (code) => code),
      urlh.param(url, URLFields.date, Rules.date, (date) => date)
    ];

    api.fetch.thumb(code, date).then(r => {
      processor.writeHead("Content-Disposition", `attachment;filename=${code}${date}.png`);
      processor.writeHead("X-Thumbnail-Status", r.status);
      processor.end(r.thumbnail, ContentTypes.PNG);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/read') {
    let [code, date] = [
      urlh.param(url, URLFields.code, Rules.code, (code) => code),
      urlh.param(url, URLFields.date, Rules.date, (date) => date)
    ];
    api.fetch.read(code, date).then(r => {
      processor.writeHead("Content-Disposition", `attachment;filename=${code}${date}.${r.type}`);
      processor.end(r.data, r.type == "cbz" ? ContentTypes.CBZ : ContentTypes.PDF);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/api/download') {
    let [code, date, type] = [
      urlh.param(url, URLFields.code, Rules.code, (code) => code),
      urlh.param(url, URLFields.date, Rules.date, (date) => date),
      urlh.param(url, URLFields.type, Rules.downloadType, (type) => type)
    ];
    api.fetch.download(code, date, "slice").then(r => { //type
      processor.json(r);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/api/downloads') {
    api.fetch.downloads(null).then(r => {
      processor.json(r);
    }).catch((e) => { onError(e) });

  } else if (url.pathname == '/api/stop') {
    let [code, date] = [
      urlh.param(url, URLFields.code, Rules.code, (code) => code),
      urlh.param(url, URLFields.date, Rules.date, (date) => date)
    ];
    api.fetch.stop(code, date).then(r => {
      processor.json(r);
    }).catch((e) => { onError(e) });

  } else {
    throw new Error(`Unknown url: ${processor.url}`);
  }
}

const hostname = configuration.hostname;
const port = configuration.port;
const server = http.createServer();

server.on("request", (request, res) => {
  var processor = createProcessor(request, res);
  let onError = (e: Error): void => {
    if (e.message) {
      consoleh.red(e.message);
    }
    if (e.stack) {
      consoleh.red(e.stack);
    }
    processor.error(e);
  };
  res.on("error", e => {
    onError(e);
  });

  try {
    proceedRequest(processor, onError);
  } catch (e) {
    onError(e);
  }
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
