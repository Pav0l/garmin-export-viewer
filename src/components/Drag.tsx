import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
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
    </div>
  );
}
