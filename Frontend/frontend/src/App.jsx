// frontend/src/App.jsx
import { useState } from 'react';
import axios from 'axios';

function App() {
  const [text, setText] = useState("");
  const [patterns, setPatterns] = useState([""]);
  const [results, setResults] = useState([]);

  const handlePatternChange = (index, value) => {
    const newPatterns = [...patterns];
    newPatterns[index] = value;
    setPatterns(newPatterns);
  };

  const addPattern = () => setPatterns([...patterns, ""]);

  const handleSubmit = async () => {
    try {
      const response = await axios.post("http://localhost:8000/match", {
        text,
        patterns,
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error matching patterns:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Greedy Pattern Matcher</h1>

      <textarea
        rows="6"
        className="w-full p-2 border rounded mb-4"
        placeholder="Enter source text..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <h2 className="font-semibold mb-2">Phrase Patterns</h2>
      {patterns.map((pattern, idx) => (
        <input
          key={idx}
          className="block w-full p-2 border rounded mb-2"
          placeholder={`Pattern ${idx + 1}`}
          value={pattern}
          onChange={(e) => handlePatternChange(idx, e.target.value)}
        />
      ))}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        onClick={addPattern}
      >
        + Add Pattern
      </button>

      <button
        className="bg-green-600 text-white px-4 py-2 rounded"
        onClick={handleSubmit}
      >
        Match Patterns
      </button>

      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Results:</h3>
          <table className="w-full border">
            <thead>
              <tr>
                <th className="border p-2">Pattern</th>
                <th className="border p-2">Index</th>
              </tr>
            </thead>
            <tbody>
              {results.map((res, i) => (
                <tr key={i}>
                  <td className="border p-2">{res.pattern}</td>
                  <td className="border p-2">{res.index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
