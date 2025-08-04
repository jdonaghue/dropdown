import * as React from "react";
import styled from "styled-components";
import { Popup, PopupContentProps, SemanticShorthandItem } from "semantic-ui-react";
import numeral from "numeral";
import { format as numFormat } from "@/packages/utils/number";

import DynamicRow, {
  formatAsString,
  StyledCell,
  calculateColumnTemplate as origCalcTemplate,
} from "./dynamic_row";
import { type Security } from "./types";

export type SecurityField = {
  field: keyof Security;
  header: string;
  truncateOnOverflow?: boolean;
  hideOnOverflow?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (val: any, security: Security) => string | React.JSX.Element | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exists?: (val: any, security: Security) => boolean;
}

export type TemplateConfig = {
  securities: Security[];
  width: string;
  fields: SecurityField[];
  node?: HTMLElement | null;
  contain?: boolean;
  showHeaders?: boolean;
  uuid: string;
};

export type SecurityComponentProps = {
  security: Security;
  template: string[];
  className?: string;
  fields?: SecurityField[];
  onClick?: React.MouseEventHandler<HTMLElement>;
  emptyAble?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNull = (val: any) => typeof val === "undefined" || val === null;

export const isNonEmptyStr = (str?: string) => !isNull(str) && typeof str === "string" && str.trim().length > 0;

const DEFAULT_WIDTH = "550px";

const hasRule144a = (sec: Security): boolean => {
  return Boolean(sec.rule144a);
};

const hasRegS = (sec: Security) => {
  return Boolean(sec.regS);
};

const has144AStatus = (sec: Security) => {
  return isNonEmptyStr(sec.rule144aStatus);
};
const getRule144aStatus = (sec: Security, truncate?: boolean) => {
  if (sec.rule144aStatus) {
    return truncate ? sec.rule144aStatus.replace(/rights/i, "R") : sec.rule144aStatus;
  }
  return "";
};

//formatters
const ratingFormatter = (val: string) => {
  return val ? val : "";
};

/**
 * Convert and format security coupon value to a percentage string.
 */
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
  //strims out following date formats
  // 2010-1-1
  // 2010-6-01
  // 2010-06-1
  // 10-10-2010
  // 10/10/2010
  // 2010/10/10
  // 1/1/2010
  // 01/01/2010

  return val.replace(/\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/g, "").trim();
};

const withPopup = (trigger: React.ReactNode, content: SemanticShorthandItem<PopupContentProps>) => {
  return <Popup flowing hoverable hideOnScroll trigger={trigger} content={content} />;
};

const strip144AStatus = (val: string, security: Security) => {
  //strip 144a rights related substring only
  //
  const pattern = /W RTS|W\/O RTS|W RIGHTS|W\/O RIGHTS/gi;
  const newVal = val && hasRule144a(security) && has144AStatus(security) ? val.replace(pattern, "") : val;
  return newVal;
};
const strip144A = (val: string, security: Security) => {
  const newVal = hasRule144a(security) ? val.replace("144A", "").trim() : val;
  return newVal;
};

const stripRegS = (val: string, security: Security) => {
  const pattern = /REG S/gi;
  const newVal = hasRegS(security) ? val.replace(pattern, "").trim() : val;
  return newVal;
};

const buildName = (name: string , sec: Security) => {
  let newName = "";

  if (sec.isSynthetic) {
    if ((sec.industryLevelOneCode?.toUpperCase() === 'D' || sec.assetBacked) && sec.bbShortName) {
      newName = `${sec.bbShortName} ${sec.currencyCode}`;
    } else {
      newName = `${sec.issuerName} ${sec.currencyCode}`;
    }
  } else {
    newName = name;
    // strip out from name: coupon, maturityDate
    if (sec.maturityDate) {
      newName = stripDate(newName);
    }

    if (sec.coupon) {
      newName = newName.replace(new RegExp(String(sec.coupon), "g"), "").trim();
      if (sec.coupon < 1 && sec.coupon > 0) {
        //just get the decimal part.
        //Ex: Some name strings contain both 0.3 and .3
        //need to replace both
        const smallCoupon = "." + String(sec.coupon).split(".")[1];
        newName = newName.replace(new RegExp(smallCoupon, "g"), "").trim();
      }

      newName = stripRegS(newName, sec);
      newName = strip144A(newName, sec);
      newName = strip144AStatus(newName, sec);
    }
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
    const rule144Val = "144A " + getRule144aStatus(security);
    combos.push(rule144Val);
  }
  if (hasRegS(security)) {
    combos.push("REG S");
  }

  return combos.join(" ").trim();
};

function formatCurrency(currencyCode: string) {
  if (/USD/i.test(currencyCode)) {
    return "$";
  }
  if (/EUR/.test(currencyCode)) {
    return "€";
  }
  if (/GBP/i.test(currencyCode)) {
    return "£";
  }
  if (/JPY/i.test(currencyCode)) {
    return "¥";
  }
  return "$";
}

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

    tooltip = stripRegS(String(tooltip), security);
    tooltip = strip144A(tooltip, security);
    tooltip = strip144AStatus(tooltip, security);

    const extra = rule144aFormatter(tooltip, security);

    tooltip = `${tooltip} ${extra}`.trim();

    if (security.moodyRating && !new RegExp(`\\s${security.moodyRating}\\s`).test(tooltip)) {
      tooltip = `${tooltip} ${security.moodyRating}`;
    }

    if (security.price != null && !new RegExp(`\\s${String(security.price).replace(".", "\\.")}\\s`).test(tooltip)) {
      tooltip = `${tooltip} ${formatCurrency(security.currencyCode)}${numFormat(security.price)}`;
    }

    if (security.spread != null && !new RegExp(`\\s${Math.round(security.spread)}oas\\s`).test(tooltip)) {
      tooltip = `${tooltip} ${Math.round(security.spread)}oas`;
    }

    if (security.currencyCode != null) {
      tooltip = `${tooltip.replace(new RegExp(`\\s${security.currencyCode}\\s`), " ")} ${security.currencyCode}`;
    }

    if (security.maturityDate != null) {
      tooltip = `${tooltip.replace(/\d{1,2}[/_-]\d{1,2}[/_-]\d{4}/g, "")} ${formatMaturityDate(security.maturityDate)}`;
    }

    if (security.bookCloseDate != null) {
      tooltip = `${tooltip} Book Close Date: ${security.bookCloseDate}`;
    }

    return tooltip;
  }
  return "";
}

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
    exists: (val) => val != null,
  },
  {
    field: "moodyRating",
    header: "Rating",
    formatter: ratingFormatter,
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
    width = DEFAULT_WIDTH,
    fields = SECURITY_COLUMNS,
    node,
    contain = true,
    showHeaders = false,
    uuid = "",
  } = config ?? {};

  console.log("calculate", { securities, width, fields, uuid, node, showHeaders, contain });

  return origCalcTemplate(securities, width, fields, uuid, node, showHeaders, contain);
};

export const calculateColumnTemplate = (data: Security[], width: string, uuid: string, node?: HTMLElement, showHeaders: boolean = true, contains: boolean = true) =>
  origCalcTemplate(data, width, SECURITY_COLUMNS, uuid, node, showHeaders, contains);

export const Cell = styled(StyledCell)`

  &.trucateable {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }

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

export { formatAsString, DEFAULT_WIDTH, SECURITY_COLUMNS, SECURITY_COLUMNS_MAP };
