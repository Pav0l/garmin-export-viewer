import { useState } from "react";
import "./App.css";
import { DragAndDrop } from "./components/Drag";

interface Upload {
  name: string;
  type: string;
}

function App() {
  const [uploadsList, setUploadsList] = useState<Upload[]>([]);

  // TODO do something with the data
  const onUploadHandler = (_reader: FileReader, file: File) => {
    setUploadsList((prev: Upload[]) => [...prev, { name: file.name, type: file.type }]);
  };

  return (
    <div>
      Healthy
      <DragAndDrop onUpload={onUploadHandler} />
      {uploadsList.length === 0 ? null : (
        <div className="uploadsList">
          {uploadsList.map((item, idx) => (
            <div className="listItem" key={idx}>
              {item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
