"use client"

import _ from "lodash";
import React, { memo } from "react";
import { renderToString } from "react-dom/server";
import styled from "styled-components";
import { Security, Sortable, WithWidth, SecurityField } from "@/packages/types/types";

const MARGIN = 20;

export const StyledGrid = styled.div<Partial<WithWidth>>`
  white-space: nowrap;
  display: grid;
  grid-template-columns: ${(props) => {
    return props.$template?.join(" ");
  }};

  cursor: pointer;
`;

export const StyledCell = styled.div<Partial<WithWidth & Sortable>>`
  display: inline-block;
  vertical-align: middle;

  &.truncatable {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

  &.empty-able {
    visibility: hidden;
    margin-right: 0;
  }

  .selected & {
    font-weight: bold;
  }
`;

const formatCache: Record<string, string> = {};
const templateCache: Record<string, string[]> = {};
const widthCache: Record<string, string> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const formatAsString = (formatter: SecurityField['formatter'], value: any, security: Security): string => {
  const key = value + security.defaultSecurityId;

  if (formatCache[key]) return formatCache[key];

  let formatted = formatter ? formatter(value, security) : value;
  if (_.isObject(formatted)) {
    const container = document.createElement("div");
    container.innerHTML = renderToString(formatted as React.ReactNode);
    formatted = container.textContent;
  }
  formatCache[key] = String(formatted);
  return formatCache[key];
};

export function calculateColumnTemplate(data: Security[], width: string, fontSize: string = "", fields: SecurityField[], uuid: string, currentNode?: (HTMLElement | null), includeHeaders = false, contain = false) {
  const sortedData = data.map(({ defaultSecurityId }: Partial<Security> = { defaultSecurityId: "empty" }) => defaultSecurityId).sort();
  const cacheKey = `${width}-${JSON.stringify(sortedData)}-${includeHeaders === true ? "true" : "false"}-${contain === true ? "true" : "false"}`;

  if (templateCache[cacheKey]) {
    return templateCache[cacheKey];
  }

  let dropdownWidth = widthCache[`${width}-${uuid}-${contain}`] ?? (contain && width
    ? `${Number((width).replace("px", "")) - (fields.length * 10)}px`
    : "");

  const fieldsWithNoData = fields.reduce((acc, field) => {
    if (field.exists) {
      if (!data.some((security) => field.exists?.(security[field.field as keyof Security], security))) {
        acc.push(field);
      }
    } else {
      if (!data.some((security) => security.hasOwnProperty(field.field))) {
        acc.push(field);
      }
    }
    return acc;
  }, [] as SecurityField[]);

  if (widthCache[`${width}-${uuid}-${contain}`] == null) {
    if (currentNode) {
      const computed = window.getComputedStyle(currentNode);

      fontSize = computed.fontSize;
      const rect = currentNode.getBoundingClientRect();
      dropdownWidth = `${rect.width}px`;
      widthCache[`${width}-${uuid}-${contain}`] = dropdownWidth;
    } else {
      widthCache[`${width}-${uuid}-${contain}`] = width;
      dropdownWidth = width;
    }
  }

  const node = document.createElement("div");
  node.style.visibility = "hidden";
  node.style.display = "inline";
  node.style.paddingRight = `${MARGIN}px`;
  node.style.fontSize = fontSize;
  node.dataset.uuid = uuid;
  document.body.appendChild(node);

  // if (window.getComputedStyle(node).fontSize === "12px") {
  //   console.log({ here: "12px", uuid, fontSize, currentNode, node, contain, includeHeaders, width });
  // } else {
  //   console.log({ here: "not12px", uuid, fontSize, currentNode, node, contain, includeHeaders, width });
  // }

  const widths = fields.map((field, i) => {
    if (field == null) {
      return 0;
    }

    let minWidth = 0;

    if (includeHeaders && field.header) {
      node.innerText = field.header;
      minWidth = node.offsetWidth;
    }

    const longestWidth = data.reduce((acc, security) => {
      if (security && security.hasOwnProperty(field.field)) {
        node.innerText = formatAsString(field.formatter, security[field.field as keyof Security], security);
        if (node.offsetWidth > acc) {
          acc = node.offsetWidth;
        }
      }
      return acc;
    }, minWidth);

    return longestWidth;
  });

  node.remove();

  if (!includeHeaders) {
    let index = 0;
    for (const field of fields) {
      if (fieldsWithNoData.includes(field)) {
        widths[index] = 0;
      }
      index++;
    }
  }

  if (contain) {
    const totalWidths = widths.reduce((acc, w) => acc + w, 0);
    let overflow =  totalWidths - Number((dropdownWidth as string).replace("px", ""));
    if (overflow > 0) {
      const sortedHideFields = fields.slice().sort((a, b) => {
        if (a.hideOnOverflow == null && b.hideOnOverflow == null) {
          return 0;
        } else if (a.hideOnOverflow == null) {
          return -1;
        } else if (b.hideOnOverflow == null) {
          return -1;
        } else {
          return b.hideOnOverflow - a.hideOnOverflow;
        }
      });
      for (const field of sortedHideFields) {
        if (field.hideOnOverflow != null) {
          if (overflow < 0) {
            break;
          }

          const index = fields.findIndex((f) => f.field === field.field);
          const zeroedOut = widths[index];
          widths[index] = 0;

          if (overflow - zeroedOut === 0) {
            break;
          }

          if (overflow - zeroedOut < 0 && field.truncateOnOverflow != null) {
            widths[index] = Math.abs(overflow - zeroedOut);
            overflow = 0;
            break;
          }
          overflow -= zeroedOut;
        }
      }

      if (overflow > 0) {
         const sortedTruncateFields = fields.slice().sort((a, b) => {
          if (a.truncateOnOverflow == null && b.truncateOnOverflow == null) {
            return 0;
          } else if (a.truncateOnOverflow == null) {
            return -1;
          } else if (b.truncateOnOverflow == null) {
            return -1;
          } else {
            return b.truncateOnOverflow - a.truncateOnOverflow;
          }
        });
        const reductableIndices = sortedTruncateFields.reduce((acc, field, i) => {
          const index = fields.findIndex((f) => f.field === field.field);
          if (field && (field.truncateOnOverflow != null || fieldsWithNoData.includes(field)) && widths[index] > 0) {
            acc.push(index);
          }
          return acc;
        }, [] as number[]);

        let iterations = 0;
        while (overflow > 0 && iterations < 3) {
          for (const index of reductableIndices) {
            const widthToReduce = widths[index] * .3;
            widths[index] -= widthToReduce;
            overflow -= widthToReduce;

            if (overflow < 0) {
              widths[index] += Math.abs(overflow);
            }

            if (overflow <= 0) {
              break;
            }
          }
          iterations++;
        }
      }
    }
  }

  templateCache[cacheKey] = widths.map((width) => {
    return `${width}px`;
  });

  return templateCache[cacheKey];
}

export type CellContainerProps = {
  field: SecurityField;
  position: number;
  security: Security;
  Cell: typeof StyledCell;
  template: string[];
  emptyAble?: boolean;
};

const CellContainer = function ({ field, position, security, template, Cell, emptyAble }: CellContainerProps) {
  let className = field.truncateOnOverflow != null ? "truncatable" : "";
  className = `${className} ${template[position] === "0px" && emptyAble ? "empty-able" : ""}`;

  return (
    <Cell data-field={field.field} width={template[position]} className={className}>
      {(field.formatter ? field.formatter(security[field.field as keyof Security], security) : security[field.field as keyof Security]) as string}
    </Cell>
  );
};

export type DynamicRowProps = {
  security: Security;
  template: string[];
  className: string;
  title: string;
  Cell?: typeof StyledCell;
  Grid?: typeof StyledGrid;
  fields: SecurityField[];
  onClick?: React.MouseEventHandler<HTMLElement>;
  emptyAble?: boolean;
}

const DynamicRow = memo(({
  security,
  template,
  className,
  onClick,
  title,
  Cell = StyledCell,
  Grid = StyledGrid,
  fields,
  emptyAble,
}: DynamicRowProps) => {
  if (!security || !template) {
    return null;
  }

  const widthNumber = template.reduce((acc, w) => acc + Number(w.replace("px", "")), 0);

  return (
    <Grid width={`${widthNumber}px`} title={title} className={`${emptyAble ? `${className} empty-able` : className}`} onClick={onClick} $template={template}>
      {fields.map((field, index) => (
        <CellContainer key={field.field as string} field={field} position={index} security={security} template={template} Cell={Cell} emptyAble={emptyAble} />
      ))}
    </Grid>
  );
});

export default DynamicRow;
