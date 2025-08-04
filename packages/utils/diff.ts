type DiffPart = {
  name: string;
  value: unknown;
  type: string;
};

type Diff = {
  path: string;
  left?: DiffPart;
  right?: DiffPart;
};

type DiffOptions = {
  filterSelectors?: string[];
  filterOutSelectors?: string[];
};

/**
 * check to see if at least one of the selectors found
 * within the `selectors` collection will match on the
 * current `graphPath`.
 *
 * arr.0.field.2.id
 * arr.*.field.*
 */
export const graphPathSelectorMatcher = (
  graphHierarchy: string[] = [],
  selectors: string[] = []
) => {
  let filteredSelectors = selectors;

  return graphHierarchy.every((graphPart, i) => {
    filteredSelectors = filteredSelectors.filter((selector) => {
      const selectorParts = selector.split(".");
      return (
        selectorParts[i] === graphPart ||
        selectorParts[i] === "*" ||
        (selectorParts.length - 1 < i && selectorParts.slice(-1)[0] === "*")
      );
    });
    return filteredSelectors.length > 0;
  });
};

/**
 * as a higher order comparator, this considers the following two collections
 * the following options to compose on top of the `comparator`:
 *
 *   1.) `filterSelectors`:
 *     a.) for all paths that are matched against these selectors, a value of
 *         `true` is returned.
 *     b.) for all paths that are NOT matched against these selectors, a value
 *         of `false` is returned
 *
 *   2.) `filterOutSelectors`:
 *     a.) for all paths that are matched against these selectors, a value of
 *         `false` will be returned
 *     b.) for all paths that are NOT matched against these selectors, a value
 *         of `true` will be returned.
 *
 */
export const testPathAgainstSelectors = (
  options: DiffOptions | undefined,
  graphHierarchy: string[]
) => {
  const { filterSelectors = [], filterOutSelectors = [] } = options || {};

  if (
    filterSelectors.length &&
    graphPathSelectorMatcher(graphHierarchy, filterSelectors)
  ) {
    return true;
  }

  if (
    filterOutSelectors.length &&
    graphPathSelectorMatcher(graphHierarchy, filterOutSelectors)
  ) {
    return false;
  }
  return false;
};

/**
 * constructs an array containing a single object which is used to capture
 * the current `hierarchy`, the `left` value, the `right` value.
 */
const constructDifferenceInfo = (
  hierarchy: string[] = [],
  left: unknown,
  right: unknown
): Diff[] => {
  const name = hierarchy.slice(-1)[0];
  return [
    {
      path: hierarchy.join("."),
      left: {
        name,
        value: left,
        type: left ? left.constructor?.name : "undefined",
      },
      right: {
        name,
        value: right,
        type: right ? right.constructor?.name : "undefined",
      },
    },
  ];
};

/**
 * recursively composes a list of the differences between `a`, and `b`,
 */
const computeDifferences: (
  a: unknown,
  b: unknown,
  options?: DiffOptions,
  graphHierarchy?: string[],
  shortCircuitWhenPossible?: boolean,
  bailObject?: { failQuick?: boolean }
) => Diff[] = (
  a,
  b,
  options,
  graphHierarchy = [],
  shortCircuitWhenPossible = false,
  bailObject = {}
) => {
  if (bailObject.failQuick) {
    return [];
  }
  if (a == null) {
    if (b != null) {
      if (shortCircuitWhenPossible && bailObject) {
        bailObject.failQuick = true;
      }
      return constructDifferenceInfo(graphHierarchy, a, b);
    }
    return [];
  }
  if (b == null) {
    if (shortCircuitWhenPossible && bailObject) {
      bailObject.failQuick = true;
    }
    return constructDifferenceInfo(graphHierarchy, a, b);
  }
  if (a === b) {
    return [];
  }

  if (typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) {
      if (shortCircuitWhenPossible && bailObject) {
        bailObject.failQuick = true;
      }
      return constructDifferenceInfo(graphHierarchy, a, b);
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        bailObject.failQuick = true;
        return constructDifferenceInfo(graphHierarchy, a, b);
      }
    }

    const { filterOutSelectors = [], filterSelectors = [] } = options || {};

    const a_ = Object.keys(a);
    const b_ = Object.keys(b);
    let keysToCheck = a_.concat(b_);

    const keyTestCache: Record<string, boolean> = {};
    keysToCheck = keysToCheck.filter((key) => {
      if (keyTestCache[key] != null) {
        return false;
      }
      let value = true;
      if (filterOutSelectors.length || filterSelectors.length) {
        value = testPathAgainstSelectors(options, [...graphHierarchy, key]);
      }
      keyTestCache[key] = value;
      return value;
    });

    if (shortCircuitWhenPossible) {
      const diffsCollection: Diff[] = [];
      if (
        keysToCheck.every((key) => {
          const localDifferences = computeDifferences(
            a[key as keyof typeof a],
            b[key as keyof typeof b],
            options,
            [...graphHierarchy, key],
            shortCircuitWhenPossible,
            bailObject
          );
          diffsCollection.push(...localDifferences);
          return localDifferences.length > 0;
        })
      ) {
        if (diffsCollection.length) {
          bailObject.failQuick = true;
        }
        return diffsCollection;
      }
      return [];
    }
    return keysToCheck.reduce((acc, key) => {
      return acc.concat(
        computeDifferences(
          a[key as keyof typeof a],
          b[key as keyof typeof b],
          options,
          [...graphHierarchy, key]
        )
      );
    }, [] as Diff[]);
  }
  if (shortCircuitWhenPossible && bailObject) {
    bailObject.failQuick = true;
  }
  return constructDifferenceInfo(graphHierarchy, a, b);
};

/**
 * recursively compare two object graphs
 *
 */
const internalDeepEqual: (
  a: unknown,
  b: unknown,
  options?: DiffOptions,
  graphHierarchy?: string[],
  keysToCheck?: string[]
) => boolean = (a, b, options, graphHierarchy = [], keysToCheck) => {
  if (a == null) {
    if (b != null) {
      return false;
    }
    return true;
  }
  if (b == null) {
    return false;
  }
  if (a === b) {
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    if (a.constructor !== b.constructor) {
      return false;
    }

    if (a.constructor?.name === "Date") {
      return false; // if it were the same it would have passed above at `===`
    }

    const isArrayA = Array.isArray(a);
    const isArrayB = Array.isArray(b);

    if (isArrayA != isArrayB) {
      return false;
    }

    if (isArrayA && isArrayB) {
      if (a.length !== b.length) {
        return false;
      }
    }

    if (keysToCheck == null || !isArrayA) {
      const { filterOutSelectors = [], filterSelectors = [] } = options || {};

      const a_ = Object.keys(a);
      const b_ = Object.keys(b);
      keysToCheck = a_.concat(b_);

      const keyTestCache: Record<string, boolean> = {};

      keysToCheck = keysToCheck.filter((key) => {
        if (keyTestCache[key] != null) {
          return false;
        }
        let value = true;
        if (filterOutSelectors.length || filterSelectors.length) {
          value = testPathAgainstSelectors(options, [
            ...(graphHierarchy ?? []),
            key,
          ]);
        }
        keyTestCache[key] = value;
        return value;
      });
    }

    return keysToCheck.every((key) => {
      return internalDeepEqual(
        a[key as keyof typeof a],
        b[key as keyof typeof b],
        options,
        [...(graphHierarchy ?? []), key]
      );
    });
  }
  return false;
};

/**
 * calculate if two structures are equivalent in depth and content
 */
export const deepEqual: (
  a: unknown,
  b: unknown,
  options?: DiffOptions,
  diffs?: Diff[],
  shortCircuitWhenPossible?: boolean
) => boolean = (a, b, options, diffs, shortCircuitWhenPossible = false) => {
  const bailObject = {};

  if (diffs) {
    diffs.push(
      ...computeDifferences(
        a,
        b,
        options,
        undefined,
        shortCircuitWhenPossible,
        bailObject
      )
    );
    return diffs.length === 0;
  }
  return internalDeepEqual(a, b, options);
};
