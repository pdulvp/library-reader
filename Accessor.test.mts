
import { type Accessor, type Page, type Code, type Date, type Book, type CodeAndDate, type FullData, type FullMode, FullModes, combine } from "./Accessor.mts";
import { ContentTypes } from "./ContentTypes.mts";

import { asserth } from "./utils/asserth.mts";

let accessor: (id) => Accessor = (id) => {
  return {
    name: id,
    getBooks: (): Promise<Book[]> => {
      return Promise.resolve([
        { code: `${id}_A`, name: `${id}_A`, group: `${id}`, latest: { date: "2020" } },
        { code: `${id}_B`, name: `${id}_B`, group: `${id}`, latest: { date: "2020" } }
      ]);
    },
    getPages: (code: Code, date: Date): Promise<Page[]> => {
      return Promise.resolve([
        `${code}_1`, `${code}_2`
      ])
    },
    isFull: (code: Code): Promise<FullMode> => {
      if (id == "AAA") return Promise.resolve(FullModes.FULL);
      return Promise.resolve(FullModes.EXTERNAL);
    },
    getArchives: (code: Code): Promise<CodeAndDate[]> => {
      return Promise.resolve([
        { code: `${code}_A`, date: "1" },
        { code: `${code}_A`, date: "2" }
      ]);
    },
    getThumbnail: (code: Code, date: Date): Promise<Buffer> => {
      return Promise.resolve(Buffer.from(id));
    },
    getFull: (code: Code, date: Date): Promise<FullData> => {
      return Promise.resolve({
        type: ContentTypes.JPG,
        buffer: Buffer.from(id)
      });
    },
    getImage: (code: Code, imageId: string): Promise<Buffer> => {
      return Promise.resolve(Buffer.from(id));
    }
  }
}

let cmb = combine([accessor("AAA"), accessor("BBB")]);

async function test() {
  let b = await cmb.getBooks();
  asserth.begin("getBooks");
  asserth.equalsArray([...new Set(b.map(c => c.code))], ['AAA_A', 'AAA_B', 'BBB_A', 'BBB_B'], "Books shall includes both")

  let pages = await cmb.getPages("AAA_A", "date");
  asserth.begin("getPages");
  asserth.assert(pages.filter(p => !p.startsWith("AAA_A_")).length == 0, "Pages shall be correct");
  asserth.assert(pages.length == 2, "Pages shall be correct");

  let archives = await cmb.getArchives("AAA_A");
  asserth.begin("getArchives");
  asserth.assert(archives.map(c => c.code).filter(p => !p.startsWith("AAA_A_")).length == 0, "Archives shall be correct");
  asserth.assert(archives.map(c => c.code).length == 2, "Archives shall be correct");

  let image = await cmb.getImage("AAA_A", "date");
  asserth.begin("images");
  asserth.assert(image.toString() == "AAA", "Image shall be correct");

  let thumb = await cmb.getThumbnail("AAA_A", "date");
  asserth.begin("thumb");
  asserth.assert(thumb.toString() == "AAA", "Thumbnail shall be correct");

  let full = await cmb.getFull("AAA_A", "date");
  asserth.begin("full");
  asserth.assert(full.buffer.toString() == "AAA", "Full shall be correct");

  asserth.begin("isFull");
  let isFull = await cmb.isFull("BBB_A");
  asserth.assert(isFull == FullModes.EXTERNAL, "isFull shall be correct");
  isFull = await cmb.isFull("AAA_A");
  asserth.assert(isFull == FullModes.FULL, "isFull shall be correct");
}

test();