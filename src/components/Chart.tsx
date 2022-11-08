import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { SUPPORTED_COLUMNS, ALL_COLUMNS } from "../libs/garmin-transformer";

interface Props {
  charts: IChart[];
}

interface IChart {
  fileName: string;
  data: {
    [key in ALL_COLUMNS]?: string | number;
  }[];
  xDataKey: SUPPORTED_COLUMNS;
  yDataKey: SUPPORTED_COLUMNS;
}

export function Charts(props: Props) {
  if (props.charts.length === 0) {
    return null;
  }

  console.log("data", props.charts);

  return (
    <div style={{ width: "100%" }}>
      {props.charts.map((file, idx) => (
        <Plot data={file.data} key={idx} fileName={file.fileName} xDataKey={file.xDataKey} yDataKey={file.yDataKey} />
      ))}
    </div>
  );
}

function Plot(props: IChart) {
  const { data, xDataKey, yDataKey } = props;
  return (
    <>
      <h4
        style={{
          margin: "1rem 0 0 0",
        }}
      >
        {props.fileName}
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          width={500}
          height={200}
          data={data}
          syncId="anyId"
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis dataKey={xDataKey} />
          <YAxis dataKey={yDataKey} />
          <Tooltip
            labelStyle={{
              color: "black",
            }}
          />
          <Line
            type="monotone"
            dataKey={yDataKey}
            stroke="#8884d8" // TODO generate color
            fill="#8884d8"
            dot={true}
            activeDot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
