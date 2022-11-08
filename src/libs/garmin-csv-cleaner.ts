import { SUPPORTED_COLUMNS } from "./garmin-transformer";

export function cleanupCsvBeforeParsing(csvString: string): string {
  let finalCsvString = csvString;

  // some exports are not valid CSVs and need special treatment
  if (finalCsvString.startsWith(SUPPORTED_COLUMNS.INTENSITY_MINUTES)) {
    const a = finalCsvString.split("\n");
    // remove the first row, which breaks the CSV format
    a.shift();

    finalCsvString = a.join("\n");
  } else if (finalCsvString.startsWith(SUPPORTED_COLUMNS.VO2_MAX)) {
    const a = finalCsvString.split("\n");
    // remove the first row, which breaks the CSV format
    a.shift();

    a[0] = `,Activity,${SUPPORTED_COLUMNS.VO2_MAX}`;

    finalCsvString = a.join("\n");
  }

  return finalCsvString;
}
