import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { SUPPORTED_COLUMNS } from "../libs/garmin-transformer";
import "./Drag.css";

interface Props {
  onUpload: (reader: FileReader, file: File) => void;
}

export function DragAndDrop({ onUpload }: Props) {
  const onDrop = useCallback((files: File[]) => {
    console.log("files to display:", files);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        onUpload(reader, file);
      };

      // read the file blob as text (the result will be in reader.result)
      reader.readAsText(file);
    });
  }, []);
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="drag" {...getRootProps()}>
      <input {...getInputProps()} />
      <p>Drop your Garmin Connect CSV exports here to visualize them</p>
      <p>Your data does not leave your browser and is removed when you reload the page</p>
      <p>
        Supported Garmin Connect reports: {SUPPORTED_COLUMNS.CLIMBED_FLOORS}, {SUPPORTED_COLUMNS.INTENSITY_MINUTES},{" "}
        {SUPPORTED_COLUMNS.STEPS}, {SUPPORTED_COLUMNS.SLEEP}, {SUPPORTED_COLUMNS.RESTING_HEART_RATE},{" "}
        {SUPPORTED_COLUMNS.STRESS} and {SUPPORTED_COLUMNS.VO2_MAX}
      </p>
    </div>
  );
}
