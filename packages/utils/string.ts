import * as _ from "lodash";

export const truncAgName = (name: string) =>
  _.truncate(name, {
    length: 11,
    omission: "..",
  });

export const fuzzyMatch = (stringToSearch: string = "", query: string = "") => {
  // escape special characters (like +, \, -) by adding a backslash in front of them
  const words = query.split(/\s+/).map((w) => w.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
  const regex = words.reduce((acc, word) => (acc += `(?=.*${word})`), "").concat(".*");

  return stringToSearch?.match(new RegExp(regex, "i"));
};

export const randomId = (length = 12) => [...Array(length)].map(() => Math.random().toString(36)[3]).join("");

export const isEmailValid = (email: string) => {
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const capitalize = (str: string) => {
  return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
};

export const trimmedOrUndefined = (str: string) => {
  const trimmed = _.trim(str);
  return trimmed === "" ? undefined : trimmed;
};
