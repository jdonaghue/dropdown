import { Security } from "@/packages/types/types";

export const compareIsoStrings = (s1: string, s2: string) => {
  if (!s1 && !s2) return 0;
  if (s1 && !s2) return -1;
  if (s2 && !s1) return 1;
  if (Date.parse(s1) < Date.parse(s2)) return -1;
  if (Date.parse(s1) > Date.parse(s2)) return 1;
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
