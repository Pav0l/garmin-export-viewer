import { csvParse, DSVRowString } from "d3-dsv";
import { ALL_COLUMNS, TransformedRow } from "./garmin-transformer";

type Transformer = (
  rawRow: DSVRowString<ALL_COLUMNS>,
  index: number,
  columns: ALL_COLUMNS[]
) => TransformedRow | undefined | null;

export function parseCSV(csvString: string, transformer: Transformer) {
  return csvParse<TransformedRow, ALL_COLUMNS>(csvString, transformer);
}
