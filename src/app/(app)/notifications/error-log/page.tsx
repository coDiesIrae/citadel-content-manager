"use client";

import { errorLog } from "@/api/invoke";
import { useEffect, useState } from "react";

export default function ErrorLogPage() {
  const [log, setLog] = useState(errorLog);

  useEffect(() => {
    const i = setInterval(() => {
      setLog(errorLog);
    }, 1000);

    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col justify-start h-full">
      <div className="self-stretch flex flex-row justify-between p-4 items-center">
        <span className="font-extrabold text-3xl text-primary-200">
          Error log
        </span>
      </div>
      <div className="flex-1 flex flex-col gap-2 overflow-auto p-4 text-white overflow-y-auto scrollbar-thin scrollbar-thumb-primary-200 scrollbar-track-surface-600">
        {log.map((line, i) => (
          <pre className="text-sm p-1 bg-surface-400" key={i}>
            {JSON.stringify(line, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}
