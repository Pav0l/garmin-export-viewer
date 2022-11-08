export function isValidDateValue(value: string | number): boolean {
  // when you enter invalid value to Date constructor, the result will be "Invalid Date"
  const maybeDate = new Date(value);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return !isNaN(maybeDate);
}

export function tryToFixDateYear(value: string | number): string {
  const now = new Date();
  // try adding current year
  let maybeValidDateValue = `${value} ${now.getFullYear()}`;
  if (!isValidDateValue(maybeValidDateValue)) {
    // did not work, it can still be just 3 letter month ("Nov", ...)
    // make it into "Nov 1 YYYY"
    maybeValidDateValue = `${value} 1 ${now.getFullYear()}`;

    if (!isValidDateValue(maybeValidDateValue)) {
      return typeof value === "string" ? value : value.toString();
    }
  }

  // now it seems to be a valid date
  const validDate = new Date(maybeValidDateValue);
  // but it might be a future date, which we do not expect
  if (validDate > now) {
    // so just take one year from current year
    validDate.setFullYear(validDate.getFullYear() - 1);
  }

  // and return UTC timestamp
  return validDate.getTime().toString();
}
