import { useEffect, useState } from "react";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "connected">("idle");
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [online, setOnline] = useState(0);
  const [msgBtnDisabled, setMsgBtnDisabled] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/chat");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setOnline(data.online);

      if (data.type === "status") {
        if (data.data === "waiting") setStatus("waiting");
        if (data.data === "connected") setStatus("connected");
        if (data.data === "partner_left") {
          setMessages((prev) => [...prev, "Chat has ended"]);
          setMsgBtnDisabled(true);
          //setStatus("idle");
        }
        if (data.data === "idle") setStatus("idle");
      }

      if (data.type === "message") {
        setMessages((prev) => [...prev, `Someone: ${data.data}`]);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const joinQueue = () => {
    ws?.send(JSON.stringify({ type: "join" }));
    setMsgBtnDisabled(false);
  };

  const sendMessage = () => {
    if (ws && input.trim()) {
      ws.send(JSON.stringify({ type: "message", data: input }));
      setMessages((prev) => [...prev, `Вы: ${input}`]);
      setInput("");
    }
  };

  const leaveChat = () => {
    ws?.send(JSON.stringify({ type: "leave" }));
    setMessages([]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>WebSocketChat</h2>

      <div>Connected now: {online}</div>

      <p>State: {status}</p>

      {status === "idle" && <button onClick={joinQueue}>Connect</button>}

      {status === "waiting" && <p>Waiting someone...</p>}

      {status === "connected" && (
        <div>
          <div style={{ border: "1px solid #ccc", padding: 10, height: 200, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i}>{m}</div>
            ))}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message..."
          />
          <button disabled={msgBtnDisabled} onClick={sendMessage}>Send</button>
          <button onClick={leaveChat}>Leave</button>
        </div>
      )}
    </div>
  );
}

export default App;
