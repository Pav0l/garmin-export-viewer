import { SUPPORTED_COLUMNS, ALL_COLUMNS } from "./garmin-transformer";

export interface Upload {
  fileName: string;
  data: {
    [key in ALL_COLUMNS]?: string | number;
  }[];
  xDataKey: SUPPORTED_COLUMNS;
  yDataKey: SUPPORTED_COLUMNS;
}
