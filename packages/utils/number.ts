import numeral from "numeral";

global.numeral = numeral;

export const format = (value: number, localFormat = "0,000.00", precision = 2) => {
  if (isNaN(value)) {
    return value;
  }
  localFormat = localFormat.replace(/(%)/g, "");
  localFormat = localFormat.replace(/(bps)/gi, "BBPS");

  if (precision && !/precision/.test(localFormat)) {
    localFormat = `${localFormat} prsn-${precision}`;
  }
  if (isNaN(Number(value))) {
    return value;
  }
  return numeral(value).format(localFormat);
};

const FORMAT_REGEX_STR = "\\s*(BUY|SELL|buy|sell)?\\s*(?= mm|pct|bps|yrs|ctb|ctd|cts|cdts)?\\s*(prsn-(\\d)?)";

const getValSuffix = (unit: string) => {
  switch (unit) {
    case "pct":
      return "%";
    case "bps":
      return "bps";
    case "bbps":
      return "bps"; // note: the bbps is intentional for numeral will match on bps
    case "yrs":
      return "yrs";
    case "ctb":
      return "%ctb";
    case "ctd":
      return "%ctd";
    case "cts":
      return "%cts";
    case "cdts":
      return "%cdts";
    case "mm":
      return "MM";
    default:
      return "";
  }
}

numeral.register("format", "special_number", {
  regexps: {
    format: new RegExp(FORMAT_REGEX_STR),
    unformat: new RegExp(FORMAT_REGEX_STR),
  },
  format: function (value: string | number, format: string): string {
    if (isNaN(Number(value)) || value == null || String(value).trim() === "") {
      return String(value || "");
    }

    // if already formatted return
    if (/mm|pct|bbps|bps|yrs|ctb|ctd|cts|cdts/i.test(String(value))) {
      return String(value);
    }

    const isNegative = Number(value) < 0;
    const isSell = /SELL/i.test(format);
    const formatSplit = format.split(new RegExp(FORMAT_REGEX_STR));
    const suffixPart = formatSplit.find((f) => /mm|pct|bbps|bps|yrs|ctb|ctd|cts|cdts/i.test(f)) || "";
    const suffix = getValSuffix(suffixPart.trim());
    const precision = format.match(/prsn-(\d)/i)?.[1] ?? 2;

    const numeralFormat = /(0)/.test(formatSplit[0]) ? formatSplit[0] : `0,000.${"".padEnd(Number(precision), "0")}`;
    const numberPart = numeral(value).format(numeralFormat).replace(/^-/, "");
    let output = `${numberPart} ${suffix}`;

    if (isNegative || isSell) {
      output = `(${output})`;
    }

    return output;
  },
  unformat: function (value: string): number {
    return Number(String(value).replace(/\s|[^0-9.(-]/g, ""))
  }
});
