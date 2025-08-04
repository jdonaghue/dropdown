export const maturityDateFormatter = (maturityDate: string) => {
  const datePart = maturityDate.split("T")[0];
  if (/\d{4}[\/_\-]\d{1,2}[\/\-_]\d{1,2}/.test(datePart)) {
    const parts = datePart.split(/[\/_\-]/g);
    return `${parts[1].padStart(2, "0")}/${parts[2].padStart(2, "0")}/${
      parts[0]
    }`;
  }
  if (/\d{1,2}[\/\-_]\d{1,2}[\/\-_]\d{4}/.test(datePart)) {
    const parts = datePart.split(/[/_-]/g);
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${
      parts[2]
    }`;
  }
  return datePart;
};
