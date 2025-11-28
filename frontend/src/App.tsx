import { useEffect, useState } from "react";

function App() {
  const [response, setResponse] = useState(null);

  const handleClick = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/all_messages", {
        method: "GET",
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      console.error("Ошибка запроса:", error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>MainPage</h2>

      <button onClick={handleClick}>Send Request</button>

      {response && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}


export default App;
