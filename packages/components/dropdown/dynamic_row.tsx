"use client"

import _ from "lodash";
import React, { memo } from "react";
import { renderToString } from "react-dom/server";
import styled from "styled-components";
import { Security, Sortable, WithWidth, SecurityField } from "@/packages/types/types";

const MARGIN = 10;

export const StyledGrid = styled.div<Partial<WithWidth>>`
  font-size: 13px;
  @media only screen and (max-width: 1028px) {
    font-size: 16px;
    line-height: 16px;
  }
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
  font-size: 13px;
  @media only screen and (max-width: 1028px) {
    font-size: 16px;
    line-height: 16px;
  }
  margin-right: 10px;

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

export function calculateColumnTemplate(data: Security[], width: string, fields: SecurityField[], uuid: string, currentNode?: (HTMLElement | null), showHeaders = false, contain = false) {
  const sortedData = data.map(({ defaultSecurityId }: Partial<Security> = { defaultSecurityId: "empty" }) => defaultSecurityId).sort();
  const cacheKey = `${JSON.stringify(sortedData)}-${showHeaders === true ? "true" : "false"}-${contain === true ? "true" : "false"}`;

  if (templateCache[cacheKey]) {
    return templateCache[cacheKey];
  }

  let dropdownWidth = widthCache[`${uuid}-${contain}`] ?? (contain && width
    ? `${Number((width).replace("px", "")) - (fields.length * 10)}px`
    : "");
  let fontSize = "13px";

  if (widthCache[`${uuid}-${contain}`] == null && currentNode) {
    const computed = window.getComputedStyle(currentNode);

    fontSize = computed.fontSize;
    const rect = currentNode.getBoundingClientRect();
    dropdownWidth = `${rect.width - (fields.length * 10)}px`;
    widthCache[`${uuid}-${contain}`] = dropdownWidth;
  }

  const node = document.createElement("div");
  node.style.visibility = "hidden";
  node.style.display = "inline-block";
  node.style.fontSize = fontSize;
  document.body.appendChild(node);

  const widths = fields.map((field, i) => {
    if (field == null) {
      return 0;
    }

    let minWidth = 0;

    if (showHeaders && field.header) {
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

    return (longestWidth + 18 + (!contain ? MARGIN : 0));
  });

  node.remove();

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

  let index = 0;
  for (const field of fields) {
    if (fieldsWithNoData.includes(field)) {
      widths[index] = 0;
    }
    index++;
  }

  if (contain) {
    const totalWidths = widths.reduce((acc, w) => acc + (showHeaders ? w + MARGIN : w > 0 ? w : 0), 0);
    let overflow =  totalWidths - Number((dropdownWidth as string).replace("px", ""));
    if (overflow > 0) {
      let zeroedOut = 0;
      let index = 0;
      for (const field of fields) {
        if (field.hideOnOverflow) {
          zeroedOut += widths[index];
          widths[index] = 0;

          if (overflow - zeroedOut <= 0) {
            break;
          }
        }
        index++;
      }

      overflow = Math.max(overflow - zeroedOut, 0);
      if (overflow) {
        const reductableIndices = fields.reduce((acc, field, i) => {
          if (field && (field.truncateOnOverflow || fieldsWithNoData.includes(field))) {
            acc.push(i);
          }
          return acc;
        }, [] as number[]);

        const totalReductableWidth = reductableIndices.reduce((acc, index) => acc + widths[index], 0);
        const redistributableWidth = Math.abs(totalReductableWidth - overflow);

        if (redistributableWidth > 0) {
          for (const index of reductableIndices) {
            const proportion = widths[index] / totalReductableWidth;
            widths[index] = redistributableWidth * proportion;
          }
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
  return (
    <Cell data-field={field.field} width={template[position]} className={`${template[position] === "0px" && emptyAble ? "empty-able" : ""}`}>
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
