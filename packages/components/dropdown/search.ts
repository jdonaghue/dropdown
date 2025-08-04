import validator from "validator";
import {
  KeyWordType,
  Option,
  Security as SecurityType,
} from "@/packages/types/types";
import { maturityDateFormatter } from "@/packages/utils/date";

type FieldCollectionType = {
  field: keyof SecurityType;
  type: "string" | "date" | "float";
  shouldCheck: (value: string) => boolean;
};

const memoSecurity = (
  method: (security: SecurityType, term: string) => number
) => {
  const cache: {
    [key: string]: number;
  } = {};
  return (security: SecurityType, term: string) => {
    const serialized = JSON.stringify({ security, term });
    cache[serialized] = cache[serialized] || method.call(this, security, term);
    return cache[serialized];
  };
};

const memoKeywords = (
  method: (keywords: KeyWordType[], term: string) => number
) => {
  const cache: {
    [key: string]: number;
  } = {};
  return (keywords: KeyWordType[], term: string) => {
    const serialized = JSON.stringify({ keywords, term });
    cache[serialized] = cache[serialized] || method.call(this, keywords, term);
    return cache[serialized];
  };
};

const getMatcher = (type: "string" | "float" | "date") => {
  if (type === "string") {
    return stringMatcher;
  } else if (type === "float") {
    return numberMatcher;
  } else {
    return dateMatcher;
  }
};

const sortMatcher = (
  security?: SecurityType,
  term?: string,
  options?: { exact?: boolean; startsWith?: boolean; contains?: boolean }
) =>
  security && term
    ? memoSecurity((security, term) => {
        return SORT_BY_SECURITY_SEARCH_KEYWORD_PROPERTIES.findIndex(
          ({ field, type, shouldCheck }) =>
            security[field] &&
            shouldCheck(term) &&
            getMatcher(type)(
              term,
              String(security[field]).toLowerCase().trim(),
              options
            )
        );
      })(security, term)
    : -1;

const securityExactMatch = (parsedQuery: string[], security?: SecurityType) => {
  return parsedQuery.reduce((acc, term) => {
    const index = sortMatcher(security, term, { exact: true });

    if (index > -1 && (index < acc || acc === -1)) {
      acc = index;
    }

    return acc;
  }, -1);
};

const securityStartsWith = (parsedQuery: string[], security?: SecurityType) => {
  return parsedQuery.reduce((acc, term) => {
    const index = sortMatcher(security, term, { startsWith: true });

    if (index > -1 && (index < acc || acc === -1)) {
      acc = index;
    }

    return acc;
  }, -1);
};

const securityContains = (parsedQuery: string[], security?: SecurityType) => {
  return parsedQuery.reduce((acc, term) => {
    const index = sortMatcher(security, term, { contains: true });

    if (index > -1 && (index < acc || acc === -1)) {
      acc = index;
    }

    return acc;
  }, -1);
};

const matcher = (keywords: KeyWordType[], term: string) =>
  memoKeywords((keywords, term) => {
    return keywords.findIndex(
      ({ keyword, type, shouldCheck }) =>
        keyword != null &&
        shouldCheck(term) &&
        getMatcher(type)(term, String(keyword).toLowerCase().trim(), {
          contains: true,
        })
    );
  })(keywords, term);

const keywordsContainTerm = (keywords: KeyWordType[], term: string) => {
  return matcher(keywords, term);
};

const parseQuery = (query: string) => {
  const trimmedQuery = query.trim();
  const stack: string[] = [];
  let word = "";
  let withinQuotes = false;
  let previousChar = undefined;
  for (let i = 0; i < trimmedQuery.length; i++) {
    const char = trimmedQuery.charAt(i);
    const isLastCharacter = i === trimmedQuery.length - 1;

    if (withinQuotes || !/\s/.test(char)) {
      word += char;
    }

    const notWithinQuotesAndNotSpace =
      !withinQuotes && /\s/.test(char) && !/\s/.test(previousChar ?? "");

    if (
      (isLastCharacter || notWithinQuotesAndNotSpace) &&
      !/^['"]$/.test(word)
    ) {
      if (/['"][^'"]+['"]/.test(word)) {
        word = word.slice(1, -1);
      } else if (/['"][^'"]+$/.test(word)) {
        word = word.slice(1);
      }

      stack.push(word);
      word = "";
    }

    if (/['"']/.test(char)) {
      withinQuotes = !withinQuotes;
    }

    previousChar = char;
  }

  return stack;
};

const points = (value: number, points: number) =>
  value === -1 ? 1000 : (value + 1) * points;

const isDefinitelyDate = (value: string | number) =>
  /^[0-9]+([\-\(\)\/][0-9]?)+$/g.test(String(value));
const isDefinitelyFloat = (value: string | number) =>
  /^[$.\-]?[0-9]+[.]{1}[0-9]?$/g.test(String(value));
const isLikelyDate = (value: string | number) =>
  /^[0-9\-\(\)\/]+$/g.test(String(value));
const isLikelyFloat = (value: string | number) =>
  /^[0-9.$\-\(\)]+$/g.test(String(value));
const isString = (value: string | number) =>
  !isDefinitelyDate(value) && !isDefinitelyFloat(value);

export const SECURITY_SEARCH_KEYWORD_PROPERTIES: FieldCollectionType[] = [
  { field: "defaultSecurityId", type: "string", shouldCheck: isString },
  { field: "securityIdentifiers", type: "string", shouldCheck: isString },
  { field: "childSecurityIdentifiers", type: "string", shouldCheck: isString },
  { field: "name", type: "string", shouldCheck: isString },
  { field: "issuerCode", type: "string", shouldCheck: isString },
  { field: "issuerName", type: "string", shouldCheck: isString },
  {
    field: "coupon",
    type: "float",
    shouldCheck: (value) => isLikelyFloat(value) || isDefinitelyFloat(value),
  },
  {
    field: "maturityDate",
    type: "date",
    shouldCheck: (value) => isLikelyDate(value) || isDefinitelyDate(value),
  },
  { field: "moodyRating", type: "string", shouldCheck: isString },
  { field: "currencyCode", type: "string", shouldCheck: isString },
];

const SORT_BY_SECURITY_SEARCH_KEYWORD_PROPERTIES: FieldCollectionType[] = [
  { field: "defaultSecurityId", type: "string", shouldCheck: isString },
  { field: "securityIdentifiers", type: "string", shouldCheck: isString },
  { field: "childSecurityIdentifiers", type: "string", shouldCheck: isString },
  { field: "name", type: "string", shouldCheck: isString },
  { field: "issuerCode", type: "string", shouldCheck: isString },
  {
    field: "coupon",
    type: "float",
    shouldCheck: (value) => isLikelyFloat(value) || isDefinitelyFloat(value),
  },
  {
    field: "maturityDate",
    type: "date",
    shouldCheck: (value) => isLikelyDate(value) || isDefinitelyDate(value),
  },
];

type MatcherOptions = {
  exact?: boolean;
  startsWith?: boolean;
  contains?: boolean;
};

const stringMatcher = (
  left: string,
  right: string,
  options: MatcherOptions = {}
) => {
  const optionsEmpty = Object.keys(options).length === 0;

  if (left == null && right == null) {
    return false;
  }

  if (optionsEmpty || options.exact) {
    return left === right;
  } else if (options.startsWith) {
    return right.startsWith(left);
  } else {
    return right.includes(left);
  }
};

const numberMatcher = (
  left: string,
  right: number | string,
  options: MatcherOptions = {}
) => {
  const optionsEmpty = Object.keys(options).length === 0;

  if (left == null && right == null) {
    return false;
  }

  if (optionsEmpty || options.exact) {
    return Number(left) === Number(right);
  } else if (options.startsWith) {
    return String(right).startsWith(String(left));
  } else {
    return String(right).includes(String(left));
  }
};

const dateMatcher = (
  left: string,
  right: number | string,
  options: MatcherOptions = {}
) => {
  const optionsEmpty = Object.keys(options).length === 0;

  if (left == null && right == null) {
    return false;
  }

  if (!validator.isDate(left) && !/^[0-9\-\(\)\/]+$/g.test(left)) {
    return false;
  }

  const rightDate = maturityDateFormatter(String(right));
  const [month, day, year] = rightDate.split("/");
  const leftParts = left
    .split(/[\/\-]/g)
    .filter((part) => /[0-9]+/g.test(part));

  if (optionsEmpty || options.exact) {
    if (leftParts[0].length === 4) {
      return (
        leftParts[0] === year &&
        leftParts[1]?.padStart(2, "0") === month &&
        leftParts[2]?.padStart(2, "0") === day
      );
    } else {
      return (
        leftParts[0]?.padStart(2, "0") === month &&
        leftParts[1]?.padStart(2, "0") === day &&
        leftParts[2] === year
      );
    }
  } else {
    return leftParts.every((part) => {
      if (part.length <= 3) {
        return (
          String(year).endsWith(part) ||
          String(year).startsWith(part) ||
          String(day).padStart(2, "0") === part.padStart(2, "0") ||
          String(month).padStart(2, "0") === part.padStart(2, "0")
        );
      } else if (part.length === 4) {
        return String(year) === part;
      }
      return false;
    });
  }
};

/**
 * Filters the existing options collection by applying the `query` to `keywords`
 * for the option.
 *
 * When there is a type ahead we should sort the results in ASC order by assigning
 * points to each record based on the terms in the tokenized search query.
 *
 * Here is how we calculate the points:
 *
 * ```ts
 * const propertyList = [
 *   "defaultSecurityId",  // 1 point
 *   "securityIdentifiers", // 2 points
 *   "childSecurityIdentifiers", // 3 points
 *   "issuerCode", // 4 points
 *   "name", // 5 points
 * ]
 * ```
 *
 * 1. Parse the search query by the `/\s+/g` token into individual terms while respecting the space characters within quotes and treating each entire quoted text as a single term.
 * 2. For each term in the parsed query (process left-to-right):
 *     1. For each record `a` and `b` (the left and right side of the sort respectively):
 *        1. For each property in the `propertyList` above, in positional order, find the lowest positioned `exact` match out of all the terms.
 *               Meaning, get the value of that property in the record and see if it's an `exact` match with the current term.
 *        2. For each property in the `propertyList` above, in positional order, find the lowest positioned `start` match out of all the terms.
 *               Meaning, get the value of that property in the record and see if it's an `start` match with the current term.
 *        3. For each property in the `propertyList` above, in positional order, find the lowest positioned `contains` match out of all the terms.
 *               Meaning, get the value of that property in the record and see if it's an `contains` match with the current term.
 *     2. Calculate the point value the term has based on if it found a match, which position in the `propertyList` was it, see `Points Chart` below
 * 3. Add all of the points collected for all of the terms for record `a` together
 * 4. Add all of the points collected for all of the terms for record `b` together
 * 5. The record (`a` or `b`) that has the lowest points wins and goes to the left in the sort
 *
 *
 * `Points Chart`
 * ```
 * * no match => 1000 points
 * * exact match => property points * 1 point
 * * starts with match => property points * 5 points
 * * fuzzy match => property points * 10 points
 * ```
 */
export const search = (query: string, options: Option[]) => {
  if (query) {
    const parsedQuery = parseQuery(query.replace("%", " ").toLowerCase());

    return options
      .filter(
        ({ disabled, $keywords }) =>
          !disabled &&
          parsedQuery.every(
            (term) => $keywords && keywordsContainTerm($keywords, term) > -1
          )
      )
      .sort(
        (
          { disabled: aDisabled, $security: aSecurity },
          { disabled: bDisabled, $security: bSecurity }
        ) => {
          if (aDisabled && bDisabled) {
            return 0;
          } else if (aDisabled) {
            return -1;
          } else if (bDisabled) {
            return 1;
          } else {
            const aExactMatchPoints = securityExactMatch(
              parsedQuery,
              aSecurity
            );
            const bExactMatchPoints = securityExactMatch(
              parsedQuery,
              bSecurity
            );
            const aStartMatchPoints = securityStartsWith(
              parsedQuery,
              aSecurity
            );
            const bStartMatchPoints = securityStartsWith(
              parsedQuery,
              bSecurity
            );
            const aFuzzyMatchPoints = securityContains(parsedQuery, aSecurity);
            const bFuzzyMatchPoints = securityContains(parsedQuery, bSecurity);

            const aPoints =
              points(aExactMatchPoints, 1) +
              points(aStartMatchPoints, 5) +
              points(aFuzzyMatchPoints, 10);
            const bPoints =
              points(bExactMatchPoints, 1) +
              points(bStartMatchPoints, 5) +
              points(bFuzzyMatchPoints, 10);

            if (aPoints === bPoints) {
              return 0;
            } else if (aPoints < bPoints) {
              return -1;
            } else {
              return 1;
            }
          }
        }
      );
  }
  return options;
};
