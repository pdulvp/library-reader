
import AdmZip from "adm-zip";
import { type ContentType, ContentTypes } from "../ContentTypes.mts";
function createZip(files, output, callback) {
  return new Promise((resolve, reject) => {
    var zip = AdmZip();
    let i = 0;
    callback(files.length, 0);
    files.forEach(f => {
      zip.addLocalFile(f);
      callback(files.length, i++);
    });
    zip.writeZip(output, callback);
    resolve(true);
  });
}
function unzipDomain(buffer, outputFolder, outputFullFile, callback): Promise<{ type: ContentType }> {
  return new Promise((resolve, reject) => {
    var zip = AdmZip(buffer);
    var zipEntries = zip.getEntries();

    let entries = zipEntries.filter(ze => ze.name.endsWith(".jpg") || ze.name.endsWith(".png"));
    let i = 0;
    callback(entries.length, 0);
    entries.forEach(ze => {
      zip.extractEntryTo(ze, outputFolder, false);
      callback(entries.length, i++);
    });

    let maxPdf = zipEntries.filter(ze => ze.name.endsWith(".pdf")).reduce((result, ze) => {
      if (!result) return ze;
      return result.getData().length > ze.getData().length ? result : ze;
    }, null);
    if (maxPdf) {
      callback(1, 0);
      zip.extractEntryTo(maxPdf, outputFolder, false, true, false, outputFullFile);
      callback(1, 1);
      resolve({ type: ContentTypes.PDF });
    } else {
      resolve({ type: ContentTypes.JPG });
    }
  });
}

function unzip(buffer, outputFolder) {
  var zip = AdmZip(buffer);
  zip.extractAllTo(outputFolder, true);
}

var ziph = {
  createZip: createZip,
  unzip: unzip,
  unzipDomain: unzipDomain
}

export { ziph };
