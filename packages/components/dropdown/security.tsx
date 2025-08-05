import * as React from "react";
import styled from "styled-components";
import { Popup, PopupContentProps, SemanticShorthandItem } from "semantic-ui-react";
import numeral from "numeral";
import { type Security, SecurityField, TemplateConfig} from "@/packages/types/types";

import DynamicRow, {
  formatAsString,
  StyledCell,
  calculateColumnTemplate as origCalcTemplate,
} from "./dynamic_row";

export type SecurityComponentProps = {
  security: Security;
  template: string[];
  className?: string;
  fields?: SecurityField[];
  onClick?: React.MouseEventHandler<HTMLElement>;
  emptyAble?: boolean;
}

const hasRule144a = (sec: Security): boolean => {
  return Boolean(sec.rule144a);
};

const ratingFormatter = (val: string) => {
  return val ? val : "";
};

const couponFormatter = (val: number) => {
  const stringVal = val?.toString() ?? "";
  const decimalPoints = stringVal.length - 1 - stringVal.indexOf(".");
  let formatValue = "0";
  let n = 0;

  while (n < decimalPoints) {
    if (n === 0) {
      formatValue += ".0";
    } else {
      formatValue += "0";
    }
    n++;
  }

  const coupon = val ? numeral(val).format(formatValue) + "%" : "";
  return coupon;
};

const stripDate = (val: string) => {
  return val.replace(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/g, "").trim();
};

const strip144A = (val: string, security: Security) => {
  const newVal = hasRule144a(security) ? val.replace("144A", "").trim() : val;
  return newVal;
};

const buildName = (name: string , sec: Security) => {
  let newName = name;

  if (sec.maturityDate) {
    newName = stripDate(newName);
  }

  if (sec.coupon) {
    newName = newName.replace(new RegExp(String(sec.coupon), "g"), "").trim();
    if (sec.coupon < 1 && sec.coupon > 0) {
      const smallCoupon = "." + String(sec.coupon).split(".")[1];
      newName = newName.replace(new RegExp(smallCoupon, "g"), "").trim();
    }

    newName = strip144A(newName, sec);
  }

  return newName;
};

const secIdFormatter = (val: string, security: Security) => {
  return security.isSynthetic ? "Multi Sec" : val ? val : "";
};

const issuerCodeFormatter = (val: string) => {
  return val ? val : "";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rule144aFormatter = (_: any, security: Security) => {
  if (security.isSynthetic) return "";

  const isRule144a = hasRule144a(security);

  const combos: string[] = [];
  if (isRule144a) {
    const rule144Val = "144A";
    combos.push(rule144Val);
  }

  return combos.join(" ").trim();
};

function formatMaturityDate(maturityDate: string) {
  const datePart = maturityDate.split("T")[0];
  if (/\d{4}[-_]\d{1,2}[-_]\d{1,2}/.test(datePart)) {
    const parts = datePart.split(/[_-]/g);
    return `${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}/${parts[0]}`;
  }
  if (/\d{1,2}[/-_]\d{1,2}[/-_]\d{4}/.test(datePart)) {
    const parts = datePart.split(/[/_-]/g);
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
  }
  return datePart;
}

const maturityDateFormatter = (val: string) => {
  return val ? formatMaturityDate(val) : "";
};

function getSecurityTooltipText(security: Security, fieldName?: keyof Security) {
  if (security) {
    let tooltip = security[fieldName || "name"];

    const extra = rule144aFormatter(tooltip, security);

    tooltip = `${tooltip} ${extra}`.trim();

    if (security.moodyRating && !new RegExp(`\\s${security.moodyRating}\\s`).test(tooltip)) {
      tooltip = `${tooltip} ${security.moodyRating}`;
    }

    if (security.maturityDate != null) {
      tooltip = `${tooltip.replace(/\d{1,2}[/_-]\d{1,2}[/_-]\d{4}/g, "")} ${formatMaturityDate(security.maturityDate)}`;
    }

    return tooltip;
  }
  return "";
}

const withPopup = (trigger: React.ReactNode, content: SemanticShorthandItem<PopupContentProps>) => {
  return <Popup flowing hoverable hideOnScroll trigger={trigger} content={content} />;
};

const nameFormatter = (val: string, sec: Security) => {
  if (sec) {
    const newVal = buildName(val, sec);
    const content = getSecurityTooltipText(sec);

    const item = withPopup(<div style={{ textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden" }}>{newVal}</div>, content);
    return item;
  } else {
    return null;
  }
};

const SECURITY_COLUMNS: SecurityField[] = [
  {
    field: "defaultSecurityId",
    header: "Id",
    formatter: secIdFormatter,
    exists: () => true,
  },
  {
    field: "issuerCode",
    header: "Issuer Code",
    formatter: issuerCodeFormatter,
    exists: (val) => val != null,
  },
  {
    field: "name",
    header: "Security Name",
    formatter: nameFormatter,
    truncateOnOverflow: true,
    exists: () => true,
  },
  {
    field: "rule144a",
    header: "144A",
    formatter: rule144aFormatter,
    hideOnOverflow: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exists: (value: any) => value === true,
  },
  {
    field: "coupon",
    header: "Coupon",
    formatter: couponFormatter,
    hideOnOverflow: true,
    exists: (val) => val != null,
  },
  {
    field: "maturityDate",
    header: "Maturity",
    formatter: maturityDateFormatter,
    hideOnOverflow: true,
    exists: (val) => val != null,
  },
  {
    field: "moodyRating",
    header: "Rating",
    formatter: ratingFormatter,
    hideOnOverflow: true,
    exists: (val) => val != null,
  },
];

const SECURITY_COLUMNS_MAP:  Record<string, SecurityField> = SECURITY_COLUMNS.reduce((
  acc: Record<string, SecurityField>,
  column: SecurityField
) => {
  acc[column.field] = column;
  return acc;
}, {});

export const calculateColumnTemplateFromMap = (config: TemplateConfig) => {
  const {
    securities = [],
    width,
    fields = SECURITY_COLUMNS,
    node,
    contain = true,
    showHeaders = false,
    uuid = "",
  } = config;

  return origCalcTemplate(securities, width, fields, uuid, node, showHeaders, contain);
};

export const Cell = styled(StyledCell)`
  display: inline-block;
  vertical-align: middle;
  position: relative;

  ${(props) => {
    if (props.sort) {
      if (props.direction === "ASC") {
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
` as typeof StyledCell;

export default function Security({ security, template, className, onClick, fields, emptyAble }: SecurityComponentProps) {
  return (
    <DynamicRow
      title={getSecurityTooltipText(security)}
      className={className ?? ""}
      onClick={onClick}
      security={security}
      Cell={Cell}
      fields={fields ?? SECURITY_COLUMNS}
      template={template}
      emptyAble={emptyAble}
    />
  );
};

export { formatAsString, SECURITY_COLUMNS, SECURITY_COLUMNS_MAP };
