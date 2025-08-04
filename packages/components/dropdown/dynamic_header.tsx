"use client"

import React, { memo } from "react";
import styled from "styled-components";
import { v1 as uuidv1 } from "uuid";
import { Security, Sortable } from "@/packages/types/types";
import { SecurityField } from "./security";

type GridProps = {
  width: string;
  $template: string[];
}

type CellProps = {
  width: string;
  "data-sort"?: string | boolean;
  "data-sort-direction": 'ASC' | 'DESC';
}

type DynamicHeaderProps = {
  template: string[];
  className?: string;
  onClick: (field: SecurityField) => void;
  sort: keyof Security | undefined;
  direction: 'ASC' | 'DESC';
  Cell?: typeof StyledCell;
  Grid?: typeof StyledGrid;
  fields: SecurityField[];
}

export const StyledGrid = styled.div<GridProps>`
  font-size: 13px;
  @media only screen and (max-width: 1028px) {
    font-size: 16px;
    line-height: 16px;
  }
  display: grid;
  grid-template-columns: ${(props) => {
    return props.$template?.join(" ");
  }};
  cursor: pointer;
`;

export const StyledCell = styled.div<CellProps>`
  display: inline-block;
  vertical-align: middle;
  position: relative;
  overflow: hidden;

  ${(props) => {
    if (props["data-sort"] === "true" || props["data-sort"] === true) {
      if (props["data-sort-direction"] === "ASC") {
        return `
          &:after {
            content: '▲';
            color: black;
          }
        `;
      }
      return `
        &:after {
          content: '▼';
          color: black;
        }
      `;
    }
  }}
`;

function renderHeader(
  position: number,
  onClick: (field: SecurityField) => void = () => null,
  template: string[],
  Cell: typeof StyledCell,
  field: SecurityField,
  sort: keyof Security | undefined,
  direction: 'ASC' | 'DESC' = 'ASC'
) {
  const sortParams: Sortable = { sort: false, direction: 'ASC' };
  if (sort && sort === field.field) {
    sortParams.sort = true;
    sortParams.direction = direction;
  }

  return (
    <Cell
      key={uuidv1()}
      data-header={field.field}
      data-sort={sortParams.sort}
      data-sort-direction={sortParams.direction}
      width={template[position]}
      onClick={() => onClick(field)}
    >
      {field.header}
    </Cell>
  );
}

export default memo(function DynamicHeader({
  template,
  className,
  onClick,
  sort,
  direction,
  Cell = StyledCell,
  Grid = StyledGrid,
  fields,
}: DynamicHeaderProps) {
  if (!template) {
    return null;
  }

  const width = template.reduce((acc, w) => acc + Number(w.replace("px", "")), 0);

  return (
    <Grid width={`${width}px`} className={className} $template={template}>
      {fields.map((field, index) => renderHeader(index, onClick, template, Cell, field, sort, direction))}
    </Grid>
  );
});
