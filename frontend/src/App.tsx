import { useEffect, useState } from "react";

function OnlineCounter() {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOnline(data.online);
    };

    return () => ws.close();
  }, []);

  return <div>Сейчас онлайн: {online}</div>;
}

export default OnlineCounter;
