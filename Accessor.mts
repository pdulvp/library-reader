

type Page = string;
type Code = string;
type Date = string;

import { type ContentType, ContentTypes, from as ContentTypeFrom } from "./ContentTypes.mts";
type Book = {
  code: string;
  name: string;
  group: string;
  latest: { date: Date }
}

const FullModes: {
  FULL: string, EXTERNAL: string, PERPAGE: string
} = {
  FULL: "FULL",
  EXTERNAL: "EXTERNAL",
  PERPAGE: "PERPAGE",
} as const;

type FullMode = typeof FullModes[keyof typeof FullModes];

type FullData = {
  type: ContentType
  buffer: Buffer
}

type CodeAndDate = {
  code: Code, date: Date
}

type Accessor = {
  name: string
  getBooks: () => Promise<Book[]>;
  getPages: (code: Code, date: Date) => Promise<Page[]>
  isFull: (code: Code) => Promise<FullMode>
  getArchives: (code: Code) => Promise<CodeAndDate[]>
  getThumbnail(code: Code, date: Date): Promise<Buffer>
  getFull: (code: Code, date: Date) => Promise<FullData>
  getImage: (code: Code, imageId: string) => Promise<Buffer>
}

function combine(accessorhs): Accessor {
  let coveringAccessor = {};
  let cover = (code: Code): Promise<Accessor> => {
    if (Object.keys(coveringAccessor).length == 0) {
      return Promise.all(accessorhs.map(a => a.getBooks())).then(bookResults => {
        bookResults.forEach((books, index) => books.forEach(book => coveringAccessor[book.code] = accessorhs[index]));
        return Promise.resolve(coveringAccessor[code]);
      });
    } else {
      return Promise.resolve(coveringAccessor[code]);
    }
  }
  return {
    name: "combine",
    getBooks: () => {
      return Promise.all(accessorhs.map(a => a.getBooks())).then(books => {
        return Promise.resolve(books.reduce((o, i) => o.concat(i), []));
      });
    },
    getPages: (code, date) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.getPages(code, date);
        return Promise.reject("unsupported code");
      });
    },
    getArchives: (code) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.getArchives(code);
        return Promise.reject("unsupported code");
      });
    },
    getImage: (code, imageId) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.getImage(code, imageId);
        return Promise.reject("unsupported code");
      });
    },
    getFull: (code, date) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.getFull(code, date);
        return Promise.reject("unsupported code");
      });
    },
    isFull: (code) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.isFull(code);
        return Promise.reject("unsupported code");
      });
    },
    getThumbnail: (code, date) => {
      return cover(code).then(accessor => {
        if (accessor) return accessor.getThumbnail(code, date);
        return Promise.reject("unsupported code");
      });
    },
  }
}

export {
  type Accessor, type Page, type Code, type Date, type Book, type CodeAndDate, type FullData, type FullMode, FullModes, combine

}
