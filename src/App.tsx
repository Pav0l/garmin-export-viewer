import { useState } from "react";
import "./App.css";
import { DragAndDrop } from "./components/Drag";
import {
  transformGarminCSV,
  SUPPORTED_COLUMNS,
  TransformedRow,
  transformDSVArrayToArray,
} from "./libs/garmin-transformer";
import { cleanupCsvBeforeParsing } from "./libs/garmin-csv-cleaner";
import { parseCSV } from "./libs/csv-parser";
import { Upload } from "./libs/upload";

function App() {
  const [uploadsList, setUploadsList] = useState<Upload[]>([]);

  const onUploadHandler = (reader: FileReader, file: File) => {
    let binaryStr = reader.result;
    if (!binaryStr) {
      return;
    }

    if (typeof binaryStr === "string") {
      binaryStr = cleanupCsvBeforeParsing(binaryStr);

      const parsedData = parseCSV(binaryStr, (row, _idx, columns) => {
        const r = transformGarminCSV(row, columns);
        if (!r) {
          return null;
        }

        return r;
      });

      const data = transformDSVArrayToArray(parsedData);

      setUploadsList((prev: Upload[]) => [...prev, transformedRowToUploadData(data, file.name)]);
    }
  };

  return (
    <div>
      <DragAndDrop onUpload={onUploadHandler} />
    </div>
  );
}

export default App;

function transformedRowToUploadData(data: TransformedRow[], fileName: string): Upload {
  const sorted = data.sort((a, b) => Number(a.row[SUPPORTED_COLUMNS.DATE]) - Number(b.row[SUPPORTED_COLUMNS.DATE]));

  return {
    fileName,
    xDataKey: SUPPORTED_COLUMNS.DATE,
    yDataKey: data[0].type,
    data: sorted.map((d) => {
      const date = new Date(Number(d.row[SUPPORTED_COLUMNS.DATE]));
      return {
        [data[0].type]: toNumberIfPossible(d.row[data[0].type]),
        [SUPPORTED_COLUMNS.DATE]: `${date.getMonth() + 1}/${date.getFullYear()}`,
      };
    }),
  };
}

function toNumberIfPossible(value: string | undefined): string | number | undefined {
  const num = Number(value);
  return isNaN(num) ? value : num;
}
