import { Security } from "@/packages/types/types";

export const compareIsoStrings = (s1: string, s2: string) => {
  if (!s1 && !s2) return 0;
  if (s1 && !s2) return -1;
  if (s2 && !s1) return 1;
  if (Date.parse(s1) < Date.parse(s2)) return -1;
  if (Date.parse(s1) > Date.parse(s2)) return 1;
  return 0;
};

export const compareMoodyRatings = (r1: string, r2: string) => {
  const ratings = [
    "aaa",
    "aa1",
    "aa2",
    "aa3",
    "a1",
    "a2",
    "a3",
    "aaa1",
    "aaa2",
    "aaa3",
    "baa1",
    "baa2",
    "baa3",
    "ba1",
    "ba2",
    "ba3",
    "b1",
    "b2",
    "b3",
    "caa1",
    "caa2",
    "caa3",
    "ca",
    "c",
  ];

  if (!r1 && !r2) return 0;

  if (r1 && !r2) return -1;

  if (!r1 && r2) return 1;

  const i1 = ratings.findIndex((x) => x == r1.toLowerCase());
  const i2 = ratings.findIndex((x) => x == r2.toLowerCase());

  if (i2 == -1) return -1;

  if (i1 == -1) return 1;

  if (i1 < i2) return -1;

  if (i1 > i2) return 1;

  return 0;
};

type SecurityComparatorField = {
  field: keyof Security;
  comparator: (
    a?: string | number | boolean,
    b?: string | number | boolean
  ) => number;
};

const FIELDS = [
  {
    field: "defaultSecurityId",
    comparator: (a?: string, b?: string) => {
      a = a || "";
      b = b || "";
      if (String(a).toLowerCase() < String(b).toLowerCase()) {
        return -1;
      } else if (String(a).toLowerCase() > String(b).toLowerCase()) {
        return 1;
      }
      return 0;
    },
  },
  {
    field: "name",
    comparator: (a?: string, b?: string) => {
      a = a || "";
      b = b || "";
      if (String(a).toLowerCase() < String(b).toLowerCase()) {
        return -1;
      } else if (String(a).toLowerCase() > String(b).toLowerCase()) {
        return 1;
      }
      return 0;
    },
  },
  {
    field: "currencyCode",
    comparator: (a?: string, b?: string) => {
      a = a || "";
      b = b || "";
      if (a.toUpperCase() === "USD" && b.toUpperCase() !== "USD") {
        return -1;
      } else if (b.toUpperCase() === "USD" && a.toUpperCase() !== "USD") {
        return 1;
      } else if (a.toUpperCase() < b.toUpperCase()) {
        return -1;
      } else if (a.toUpperCase() > b.toUpperCase()) {
        return 1;
      }
      return 0;
    },
  },
  {
    field: "maturityDate",
    comparator: compareIsoStrings,
  },
  {
    field: "moodyRating",
    comparator: compareMoodyRatings,
  },
  {
    field: "acctAndMv",
    comparator: (a?: string, b?: string) => {
      a = a || "";
      b = b || "";
      const aParts = a.split(" Accts, $");
      const bParts = b.split(" Accts, $");

      const val: {
        k?: number;
        m?: number;
        b?: number;
      } = {
        k: 0,
        m: 1,
        b: 2,
      };

      const aAccts = Number(aParts[0]);
      const aMv = Number(aParts[1]?.split(/[a-z]/gi)[0]);
      const bAccts = Number(bParts[0]);
      const bMv = Number(bParts[1]?.split(/[a-z]/gi)[0]);

      let aMvType: keyof typeof val = "k";
      let bMvType: keyof typeof val = "k";

      if (/[kmb]/.test(aParts?.[1].slice(-1)[0])) {
        aMvType = aParts[1].slice(-1)[0] as keyof typeof val;
      }
      if (/[kmb]/.test(bParts?.[1].slice(-1)[0])) {
        bMvType = bParts[1].slice(-1)[0] as keyof typeof val;
      }

      if (aAccts < bAccts) {
        return -1;
      } else if (aAccts > bAccts) {
        return 1;
      } else {
        if (val[aMvType] == null && val[bMvType] == null) {
          return 0;
        } else if (val[aMvType] == null) {
          return -1;
        } else if (val[bMvType] == null) {
          return 1;
        } else if (Number(val[aMvType]) < Number(val[bMvType])) {
          return -1;
        } else if (Number(val[aMvType]) > Number(val[bMvType])) {
          return 1;
        } else {
          if (aMv < bMv) {
            return -1;
          } else if (aMv > bMv) {
            return 1;
          }
        }
      }
      return 0;
    },
  },
] as SecurityComparatorField[];

export const sorter = (field: keyof Security, direction = "ASC") => {
  return (sec1?: Security, sec2?: Security) => {
    if (field == null) {
      for (let i = 0; i < FIELDS.length; i++) {
        const { field: f, comparator } = FIELDS[i];
        if (sec1 == null && sec2 == null) {
          return 0;
        } else if (sec1 == null) {
          return -1;
        } else if (sec2 == null) {
          return 1;
        }
        const result = comparator(sec1[f], sec2[f]);
        if (result !== 0) {
          return result;
        }
      }
    } else {
      const { comparator } = FIELDS.find((f) => f.field === field) || {
        comparator: (a, b) => {
          if (typeof a === "number" || typeof b === "number") {
            if (a == null) {
              return -1;
            }
            if (b == null) {
              return 1;
            }
            if (a < b) {
              return -1;
            } else if (a > b) {
              return 1;
            }
          } else if (a == null || b == null) {
            if (a == null && b == null) {
              return 0;
            } else if (a == null) {
              return -1;
            }
            return 1;
          } else {
            const fieldA = String(a || "");
            const fieldB = String(b || "");
            if (fieldA.toLowerCase() < fieldB.toLowerCase()) {
              return -1;
            } else if (fieldA.toLowerCase() > fieldB.toLowerCase()) {
              return 1;
            }
          }
          return 0;
        },
      };

      return direction === "ASC"
        ? comparator(sec1?.[field], sec2?.[field])
        : comparator(sec2?.[field], sec1?.[field]);
    }
  };
};

export function ensureInName(name: string, values: string[] = []) {
  return values.reduce((acc, value) => {
    if (
      value != null &&
      acc.toLowerCase().indexOf(value.toLowerCase()) === -1
    ) {
      return `${acc} ${value}`;
    }
    return acc;
  }, name);
}

export function formatMaturityDate(maturityDate: string) {
  if (maturityDate == null) {
    return "";
  }
  const datePart = maturityDate.split("T")[0];
  if (/\d{4}[-_]\d{1,2}[-_]\d{1,2}/.test(datePart)) {
    const parts = datePart.split(/[_-]/g);
    return `${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}/${
      parts[0]
    }`;
  }
  if (/\d{1,2}[/-_]\d{1,2}[/-_]\d{4}/.test(datePart)) {
    const parts = datePart.split(/[/_-]/g);
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${
      parts[2]
    }`;
  }
  return datePart;
}
