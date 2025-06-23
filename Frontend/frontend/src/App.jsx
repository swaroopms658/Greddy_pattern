// frontend/src/App.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function App() {
  const [text, setText] = useState("");
  const [patterns, setPatterns] = useState([""]);
  const [resultsMap, setResultsMap] = useState({});
  const [algorithm, setAlgorithm] = useState("greedy");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [recommendedAlgo, setRecommendedAlgo] = useState(null);
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);
  const tableRef = useRef(null);

  const handlePatternChange = (index, value) => {
    const newPatterns = [...patterns];
    newPatterns[index] = value;
    setPatterns(newPatterns);
  };

  const addPattern = () => setPatterns([...patterns, ""]);

  const computeOverallRecommendation = (map) => {
    const averages = Object.entries(map).map(([algo, data]) => {
      const avg = data.reduce((sum, r) => sum + r.time_ms, 0) / data.length;
      return { algo, avg: parseFloat(avg.toFixed(3)) };
    });
    averages.sort((a, b) => a.avg - b.avg);
    setChartData(averages);
    if (averages.length > 0) {
      const best = averages[0];
      setRecommendedAlgo(
        `✅ Best performance: ${best.algo.toUpperCase()} (${best.avg} ms)`
      );
    }
  };

  const fetchResults = async (selectedAlgorithm) => {
    if (!text || patterns.every((p) => p.trim() === "")) return;
    try {
      const response = await axios.post("https://greddy-pattern1.onrender.com:8000/match", {
        text,
        patterns,
        algorithm: selectedAlgorithm,
        case_sensitive: caseSensitive,
      });

      setResultsMap((prev) => {
        const updated = { ...prev, [selectedAlgorithm]: response.data };
        computeOverallRecommendation(updated);
        return updated;
      });
    } catch (error) {
      console.error("Error matching patterns:", error);
    }
  };

  const handleSubmit = () => {
    fetchResults(algorithm);
  };

  const handleDownload = async () => {
    const input1 = chartRef.current;
    const input2 = tableRef.current;

    if (!input1 || !input2) return;

    // ⬇️ Apply temporary forced dark background for better visibility
    input1.style.backgroundColor = "#1e1e1e";
    input2.style.backgroundColor = "#1e1e1e";

    const canvas1 = await html2canvas(input1, {
      backgroundColor: "#1e1e1e",
      scale: 2,
    });
    const canvas2 = await html2canvas(input2, {
      backgroundColor: "#1e1e1e",
      scale: 2,
    });

    const imgData1 = canvas1.toDataURL("image/png");
    const imgData2 = canvas2.toDataURL("image/png");

    const pdf = new jsPDF();
    const width = pdf.internal.pageSize.getWidth();
    const ratio1 = canvas1.height / canvas1.width;
    const ratio2 = canvas2.height / canvas2.width;

    pdf.addImage(imgData1, "PNG", 10, 10, width - 20, (width - 20) * ratio1);
    pdf.addPage();
    pdf.addImage(imgData2, "PNG", 10, 10, width - 20, (width - 20) * ratio2);
    pdf.save("pattern-matching-results.pdf");

    // ✅ Clean up styles after export
    input1.style.backgroundColor = "";
    input2.style.backgroundColor = "";
  };

  useEffect(() => {
    fetchResults(algorithm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algorithm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white font-sans p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full space-y-6 text-center box-border">
        <header className="py-6">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Pattern Match Benchmark
          </h1>
          <p className="text-gray-400 text-center">
            Compare the performance of classic string matching algorithms
            visually
          </p>
        </header>

        <section className="bg-gray-900 rounded-3xl shadow-lg p-6 space-y-4 text-center flex flex-col items-center box-border">
          <h2 className="text-xl font-semibold">Input Text</h2>
          <textarea
            rows="6"
            className="w-full max-w-xl p-4 rounded-2xl bg-gray-800 text-white border border-gray-700 placeholder-gray-500 box-border"
            placeholder="Paste your input text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </section>

        <section className="bg-gray-900 rounded-3xl shadow-lg p-6 space-y-4 text-center flex flex-col items-center box-border">
          <h2 className="text-xl font-semibold">Pattern Inputs</h2>
          {patterns.map((pattern, idx) => (
            <input
              key={idx}
              className="w-full max-w-xl mb-3 p-3 rounded-xl bg-gray-800 text-white border border-gray-700 placeholder-gray-500 box-border"
              placeholder={`Pattern ${idx + 1}`}
              value={pattern}
              onChange={(e) => handlePatternChange(idx, e.target.value)}
            />
          ))}
          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition box-border"
            onClick={addPattern}
          >
            + Add Pattern
          </button>
        </section>

        <section className="bg-gray-900 rounded-3xl shadow-lg p-6 space-y-4 text-center flex flex-col items-center box-border">
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            {/* Algorithm dropdown */}
            <select
              className="w-full p-3 bg-gray-800 border border-gray-700 text-white rounded-xl box-border"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="greedy">Greedy</option>
              <option value="kmp">KMP</option>
              <option value="boyer_moore">Boyer-Moore</option>
            </select>

            {/* Label on one line */}
            <div className="w-full text-left text-sm text-white">
              Case Sensitive
            </div>

            {/* Checkbox on its own line, styled like a pro */}
            <label className="flex items-center gap-3 w-full mb-4 p-3 bg-gray-800 rounded-lg shadow border border-gray-700 transition hover:border-emerald-400">
              <input
                type="checkbox"
                id="caseSensitive"
                checked={caseSensitive}
                onChange={() => setCaseSensitive(!caseSensitive)}
                className="accent-emerald-500 w-5 h-5 transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-white text-base font-medium select-none">
                Case Sensitive
              </span>
            </label>
            {/* Button in its own block below the checkbox, styled */}
            <div className="w-full flex justify-center">
              <button
                className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-emerald-400 hover:from-blue-600 hover:to-emerald-500 text-white px-8 py-3 rounded-2xl shadow-lg font-bold text-lg tracking-wide transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 mt-4"
                onClick={handleSubmit}
              >
                Match Patterns
              </button>
            </div>
          </div>
        </section>

        {recommendedAlgo && (
          <div className="bg-yellow-800 text-yellow-200 border-l-4 border-yellow-500 p-4 rounded-xl shadow text-center box-border">
            {recommendedAlgo}
          </div>
        )}

        {chartData.length > 0 && (
          <div
            ref={chartRef}
            className="bg-gray-900 rounded-3xl shadow-lg p-6 text-center box-border"
          >
            <h3 className="text-xl font-semibold mb-4">
              Average Match Time (ms)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="algo" stroke="#ccc" />
                <YAxis unit=" ms" stroke="#ccc" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#222",
                    borderColor: "#555",
                  }}
                />
                <Legend wrapperStyle={{ color: "white" }} />
                <Bar dataKey="avg" fill="#60a5fa" name="Avg Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div ref={tableRef}>
          {Object.entries(resultsMap).map(([algo, results], idx) => (
            <div
              key={idx}
              className="bg-gray-900 rounded-3xl shadow-lg p-6 text-center box-border"
            >
              <h3 className="text-xl font-semibold mb-4">Results: {algo}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mx-auto border border-gray-600 table-auto text-white">
                  <thead className="bg-gray-800 text-gray-200">
                    <tr>
                      <th className="p-2 border border-gray-600">Pattern</th>
                      <th className="p-2 border border-gray-600">Index</th>
                      <th className="p-2 border border-gray-600">
                        Comparisons
                      </th>
                      <th className="p-2 border border-gray-600">Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res, i) => (
                      <tr key={i} className="hover:bg-gray-800">
                        <td className="p-2 border border-gray-600">
                          {res.pattern}
                        </td>
                        <td className="p-2 border border-gray-600">
                          {res.index}
                        </td>
                        <td className="p-2 border border-gray-600">
                          {res.comparisons}
                        </td>
                        <td className="p-2 border border-gray-600">
                          {res.time_ms}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {(chartData.length > 0 || Object.keys(resultsMap).length > 0) && (
          <div className="text-center">
            <button
              onClick={handleDownload}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg mt-4"
            >
              ⬇️ Download Results (Graph + Table)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
