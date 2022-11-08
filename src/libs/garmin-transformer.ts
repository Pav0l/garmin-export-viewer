import { DSVRowString, DSVParsedArray } from "d3-dsv";
import { isValidDateValue, tryToFixDateYear } from "./dates";

export interface TransformedRow {
  columns: ALL_COLUMNS[];
  type: SUPPORTED_COLUMNS;
  row: {
    [key in ALL_COLUMNS]?: string;
  };
}

export type ALL_COLUMNS = SUPPORTED_COLUMNS | UNSUPPORTED_COLUMNS;

export enum SUPPORTED_COLUMNS {
  UNKNOWN = "Unknown",

  DATE = "Date",
  CLIMBED_FLOORS = "Climbed Floors",
  STRESS = "Stress",
  RESTING_HEART_RATE = "Resting Heart Rate",
  INTENSITY_MINUTES = "Intensity Minutes",
  STEPS = "Steps",
  ACTUAL = "Actual", // column of Intensity minutes and also Steps table
  SLEEP = "Sleep",
  VO2_MAX = "VO₂ Max",
}

export enum UNSUPPORTED_COLUMNS {
  DESCENDED_FLOORS = "Descended Floors",
  GOAL = "Goal",
  ACTIVITY = "Activity",

  EMPTY = "",
}

export function transformGarminCSV(
  row: DSVRowString<ALL_COLUMNS>,
  columns: ALL_COLUMNS[]
): TransformedRow | undefined | null {
  const type = attemptDataRecognition(columns);

  // clean up Dates first
  const result = transformMissingDate(row, columns);

  switch (type) {
    case SUPPORTED_COLUMNS.CLIMBED_FLOORS: {
      return transformGarminFloorsClimbed(row, columns);
    }
    case SUPPORTED_COLUMNS.INTENSITY_MINUTES: {
      return transformGarminIntensityMinutes(row, columns);
    }
    case SUPPORTED_COLUMNS.VO2_MAX: {
      return transformGarminVO2Max(row, columns);
    }
    case SUPPORTED_COLUMNS.STEPS: {
      return transformGarminSteps(row, columns);
    }
    case SUPPORTED_COLUMNS.SLEEP: {
      return transformGarminSleep(row, columns);
    }
    case SUPPORTED_COLUMNS.STRESS:
    case SUPPORTED_COLUMNS.RESTING_HEART_RATE:
      return { ...result, type };
    default:
      break;
  }

  console.log("UNKNOWN DATA TYPE", type, columns);
  return null;
}

export function transformDSVArrayToArray(dsvArr: DSVParsedArray<TransformedRow>): TransformedRow[] {
  if (dsvArr.columns) {
    delete (dsvArr as Partial<DSVParsedArray<TransformedRow>>).columns;
  }

  return dsvArr as TransformedRow[];
}

// use columns to try and figure out which export are we reading
function attemptDataRecognition(columns: string[]): SUPPORTED_COLUMNS {
  let hasActual = false;
  let hasGoal = false;

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    switch (column) {
      case SUPPORTED_COLUMNS.CLIMBED_FLOORS:
      case UNSUPPORTED_COLUMNS.DESCENDED_FLOORS:
        return SUPPORTED_COLUMNS.CLIMBED_FLOORS;
      case SUPPORTED_COLUMNS.STRESS:
        return SUPPORTED_COLUMNS.STRESS;
      case SUPPORTED_COLUMNS.RESTING_HEART_RATE:
        return SUPPORTED_COLUMNS.RESTING_HEART_RATE;
      case SUPPORTED_COLUMNS.SLEEP:
        return SUPPORTED_COLUMNS.SLEEP;
      case SUPPORTED_COLUMNS.VO2_MAX:
      case UNSUPPORTED_COLUMNS.ACTIVITY:
        return SUPPORTED_COLUMNS.VO2_MAX;
      case UNSUPPORTED_COLUMNS.GOAL:
        hasGoal = true;
        break;
      case SUPPORTED_COLUMNS.ACTUAL:
        hasActual = true;
        break;
    }
  }

  if (hasGoal && hasActual) {
    // Intensity minutes and Steps have the same column -> "Actual"
    // but Intensity minutes also have "Goal"
    return SUPPORTED_COLUMNS.INTENSITY_MINUTES;
  }

  if (hasActual && !hasGoal) {
    return SUPPORTED_COLUMNS.STEPS;
  }

  return SUPPORTED_COLUMNS.UNKNOWN;
}

function transformGarminVO2Max(row: DSVRowString<ALL_COLUMNS>, columns: ALL_COLUMNS[]): TransformedRow | null {
  /**
   * A1: VO₂ Max // removed before parsing CSV
   * A2: empty  B2: Activity                   C2: VO₂ Max
   * A3: MONTH  B3: activity type (running)    C3: VALUES
   */
  const VO2_MAX_COLUMNS = [SUPPORTED_COLUMNS.DATE, UNSUPPORTED_COLUMNS.ACTIVITY, SUPPORTED_COLUMNS.VO2_MAX];
  if (!hasValidColumns(columns, VO2_MAX_COLUMNS)) {
    console.log("Unexpected columns in VO2 MAX table. Expected:", VO2_MAX_COLUMNS, "\nReceived:", columns);
    return null;
  }

  // TODO row keys validation?
  delete row[UNSUPPORTED_COLUMNS.ACTIVITY];
  columns = columns.filter((c) => c !== UNSUPPORTED_COLUMNS.ACTIVITY);

  return { row, columns, type: SUPPORTED_COLUMNS.VO2_MAX };
}

function transformGarminFloorsClimbed(row: DSVRowString<ALL_COLUMNS>, columns: ALL_COLUMNS[]): TransformedRow | null {
  /**
   * A1: EMPTY   B1: Climbed Floors   C1: Descended Floors
   * A2: MMM/DD  B2: VALUE            C2: VALUE
   */
  const FLOORS_CLIMBED_COLUMNS = [
    SUPPORTED_COLUMNS.DATE,
    UNSUPPORTED_COLUMNS.DESCENDED_FLOORS,
    SUPPORTED_COLUMNS.CLIMBED_FLOORS,
  ];

  if (!hasValidColumns(columns, FLOORS_CLIMBED_COLUMNS)) {
    console.log(
      "Unexpected columns in Floors Climbed table. Expected:",
      FLOORS_CLIMBED_COLUMNS,
      "\nReceived:",
      columns
    );
    return null;
  }

  delete row[UNSUPPORTED_COLUMNS.DESCENDED_FLOORS];
  columns = columns.filter((c) => c !== UNSUPPORTED_COLUMNS.DESCENDED_FLOORS);

  return { row, columns, type: SUPPORTED_COLUMNS.CLIMBED_FLOORS };
}

function transformGarminIntensityMinutes(
  row: DSVRowString<ALL_COLUMNS>,
  columns: ALL_COLUMNS[]
): TransformedRow | null {
  /**
   * A1: Intensity Minutes Weekly Total // removed before parsing the CSV
   * A2: empty                            B2: Actual C2: Goal
   * A3: yyyy-mm-dd                           B3: VALUE  C3: VALUE
   */
  const INTENSITY_COLUMNS = [SUPPORTED_COLUMNS.DATE, UNSUPPORTED_COLUMNS.GOAL, SUPPORTED_COLUMNS.ACTUAL];
  if (!hasValidColumns(columns, INTENSITY_COLUMNS)) {
    console.log("Unexpected columns in Intensity Minutes table. Expected:", INTENSITY_COLUMNS, "\nReceived:", columns);
    return null;
  }

  // delete unsupported column value from row
  delete row[UNSUPPORTED_COLUMNS.GOAL];
  // and rename Actual to Intensity minutes
  row[SUPPORTED_COLUMNS.INTENSITY_MINUTES] = row[SUPPORTED_COLUMNS.ACTUAL];
  delete row[SUPPORTED_COLUMNS.ACTUAL];

  // do the same for columns array
  columns = columns
    .filter((c) => c !== UNSUPPORTED_COLUMNS.GOAL)
    .map((c) => {
      // change the Actual column to Intensity minutes
      if (c === SUPPORTED_COLUMNS.ACTUAL) {
        return SUPPORTED_COLUMNS.INTENSITY_MINUTES;
      }
      return c;
    });

  return { row, columns, type: SUPPORTED_COLUMNS.INTENSITY_MINUTES };
}

function transformGarminSteps(row: DSVRowString<ALL_COLUMNS>, columns: ALL_COLUMNS[]): TransformedRow | null {
  /**
   * A1: empty                            B1: Actual
   * A2: MMM/DD                           B2: VALUE
   */
  const SLEEP_COLUMNS = [SUPPORTED_COLUMNS.DATE, SUPPORTED_COLUMNS.ACTUAL];
  if (!hasValidColumns(columns, SLEEP_COLUMNS)) {
    console.log("Unexpected columns in Steps table. Expected:", SLEEP_COLUMNS, "\nReceived:", columns);
    return null;
  }

  // and rename Actual to Steps
  row[SUPPORTED_COLUMNS.STEPS] = row[SUPPORTED_COLUMNS.ACTUAL];
  delete row[SUPPORTED_COLUMNS.ACTUAL];

  // do the same for columns array
  columns = columns.map((c) => {
    // change the Actual column to Intensity minutes
    if (c === SUPPORTED_COLUMNS.ACTUAL) {
      return SUPPORTED_COLUMNS.STEPS;
    }
    return c;
  });

  return { row, columns, type: SUPPORTED_COLUMNS.STEPS };
}

function transformGarminSleep(row: DSVRowString<ALL_COLUMNS>, columns: ALL_COLUMNS[]): TransformedRow | null {
  const SLEEP_COLUMNS = [SUPPORTED_COLUMNS.DATE, SUPPORTED_COLUMNS.SLEEP];
  if (!hasValidColumns(columns, SLEEP_COLUMNS)) {
    console.log("Unexpected columns in Sleep table. Expected:", SLEEP_COLUMNS, "\nReceived:", columns);
    return null;
  }

  // sleep value is in "H:MM hrs" format, but we also want to have minutes value
  const values = row[SUPPORTED_COLUMNS.SLEEP]?.split(" hrs")[0].split(":");
  if (values) {
    const result = Number(values[0]) * 60 + Number(values[1]);
    row[SUPPORTED_COLUMNS.SLEEP] = result.toString();
  }

  return { row, columns, type: SUPPORTED_COLUMNS.SLEEP };
}

function transformMissingDate(row: DSVRowString<ALL_COLUMNS>, columns: ALL_COLUMNS[]): TransformedRow {
  // Garmin Connect exports do not have column name for Dates
  if (columns[0] === UNSUPPORTED_COLUMNS.EMPTY) {
    columns[0] = SUPPORTED_COLUMNS.DATE;
  }
  // also need to update the row key name
  if (row[UNSUPPORTED_COLUMNS.EMPTY]) {
    row[SUPPORTED_COLUMNS.DATE] = row[UNSUPPORTED_COLUMNS.EMPTY];
    delete row[UNSUPPORTED_COLUMNS.EMPTY];
  }

  // check if year is in Dates value, since Garmin exports do not have years in dates 🤦‍♂️
  const possibleDateValue = row[SUPPORTED_COLUMNS.DATE];
  if (!possibleDateValue) {
    return { row, columns, type: SUPPORTED_COLUMNS.UNKNOWN };
  }

  if (!isValidDateValue(possibleDateValue)) {
    row[SUPPORTED_COLUMNS.DATE] = tryToFixDateYear(possibleDateValue);
  } else {
    // we have a valid date, so we need to make sure it is UTC format
    row[SUPPORTED_COLUMNS.DATE] = new Date(possibleDateValue).getTime().toString();
  }

  return { row, columns, type: SUPPORTED_COLUMNS.UNKNOWN };
}

function hasValidColumns(receivedColumn: ALL_COLUMNS[], expectedColumn: ALL_COLUMNS[]): boolean {
  return receivedColumn.every((item) => expectedColumn.includes(item));
}
