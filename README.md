# A fast, rich, and dynamic React Dropdown component

_note: this is not packaged for distribution, it is available here within this Next.js app for example only_

## Source for the component itself is at:

[/packages/components/dropdown](/packages/components/dropdown)

### Features

- Advanced searching that auto-sorts by most relevant results. [See info below](#searchsort-implementation)
- Dynamically calculates data property widths to determine if overflow and which columns should be hidden or truncated if needed
- Only hides or truncates the columns that it needs to in order to remove overflow
- Maintains a context over all dropdown instances in order to take them all into consideration when calculating the dynamic column widths
- Fast!

## Advanced typing definitions:

```ts
type ApplyMethodsType = {
  [K in keyof DropdownProps | keyof DropdownState as `apply_${string &
    K}Diff`]?: (
    self: InternalSecuritiesDD,
    options: Option[],
    diff?: ChangeSet
  ) => Option[];
};
```

[/packages/components/dropdown/drop_down.tsx#L215](/packages/components/dropdown/drop_down.tsx#L215)

## Search/Sort implementation:

[/packages/components/dropdown/search.ts](/packages/components/dropdown/search.ts)

### Features:

- A custom query parser that understands quotes in order to group words and spaces together as individual tokens
- Understands simple date formats
- Considers numbers as a first class citizen
- Fast!
- Sorts the most meaningful results first (see algorithm below)

### Search/Sort algorithm:

Filters the existing options collection by applying the `query` to `keywords`
for the option.

When there is a type ahead we should sort the results in ASC order by assigning
points to each record based on the terms in the tokenized search query.

Here is how we calculate the points that ultimately determine sort order:

```ts
const propertyList = [
  "defaultSecurityId", // 1 point
  "issuerCode", // 2 points
  "name", // 3 points
];
```

1. Parse the search query by the `/\s+/g` token into individual terms while respecting the space characters within quotes and treating each entire quoted text as a single term.
2. For each term in the parsed query (process left-to-right):
   1. For each record `a` and `b` (the left and right side of the sort respectively):
      1. For each property in the `propertyList` above, in positional order, find the lowest positioned `exact` match out of all the terms.
         Meaning, get the value of that property in the record and see if it's an `exact` match with the current term.
      2. For each property in the `propertyList` above, in positional order, find the lowest positioned `start` match out of all the terms.
         Meaning, get the value of that property in the record and see if it's an `start` match with the current term.
      3. For each property in the `propertyList` above, in positional order, find the lowest positioned `contains` match out of all the terms.
         Meaning, get the value of that property in the record and see if it's an `contains` match with the current term.
   2. Calculate the point value the term has based on if it found a match, which position in the `propertyList` was it, see `Points Chart` below
3. Add all of the points collected for all of the terms for record `a` together
4. Add all of the points collected for all of the terms for record `b` together
5. The record (`a` or `b`) that has the lowest points wins and goes to the left in the sort

`Points Chart`

```
no match => 1000 points
exact match => property points * 1 point
starts with match => property points * 5 points
fuzzy match => property points * 10 points
```
