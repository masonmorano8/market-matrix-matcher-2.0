
// Clean version using plain HTML inputs and buttons to ensure compatibility
import { useState, useEffect } from "react";
import Papa from "papaparse";

export default function Home() {
  const [industry, setIndustry] = useState("");
  const [state, setState] = useState("");
  const [coverages, setCoverages] = useState("");
  const [premium, setPremium] = useState("");
  const [results, setResults] = useState([]);
  const [matrixData, setMatrixData] = useState([]);

  useEffect(() => {
    fetch("/market_matrix_structured.csv")
      .then((res) => res.text())
      .then((text) => {
        const parsed = Papa.parse(text, { header: true });
        setMatrixData(parsed.data);
      });
  }, []);

  const handleSubmit = () => {
    const requestedCoverages = coverages.toLowerCase().split(/,\s*/);
    const lowerIndustry = industry.toLowerCase();
    const lowerState = state.toLowerCase();
    const numericPremium = parseFloat(premium.replace(/[^\d.]/g, ""));

    const filtered = matrixData.filter((row) => {
      const availableCoverages = ["GL", "WC", "Auto", "Umb", "Prop", "IM", "Exec Risk", "Other", "CE"]
        .filter((cov) => row[cov] === "X")
        .map((cov) => cov.toLowerCase());

      const coverageMatch = requestedCoverages.every((cov) => availableCoverages.includes(cov));
      const industryMatch = row.Notes.toLowerCase().includes(lowerIndustry);
      const premiumMatch = !isNaN(numericPremium)
        ? row.Notes.includes("$") && row.Notes.match(/\$[\d,]+/)
        : true;

      return coverageMatch && (industryMatch || premiumMatch);
    });

    setResults(filtered);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Market Matcher</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
        <textarea
          placeholder="Describe the industry or business class"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <input
          type="text"
          placeholder="State (e.g., NJ)"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <input
          type="text"
          placeholder="Lines of Coverage (e.g., GL, Property, Umb)"
          value={coverages}
          onChange={(e) => setCoverages(e.target.value)}
        />
        <input
          type="text"
          placeholder="Estimated Premium ($)"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
        />
        <button onClick={handleSubmit}>Find Markets</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {results.map((r, i) => (
          <div key={i} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "12px" }}>
            <h2 style={{ fontWeight: "bold" }}>{r.Carrier}</h2>
            <p><strong>Contact:</strong> {r["Underwriter Name"] || r.Liaison}</p>
            <p><strong>Email:</strong> {r.Email}</p>
            <p><strong>Phone:</strong> {r.Phone}</p>
            <p><strong>Coverages:</strong> {["GL", "WC", "Auto", "Umb", "Prop", "IM", "Exec Risk", "Other", "CE"].filter(cov => r[cov] === "X").join(", ")}</p>
            <p><strong>Notes:</strong> {r.Notes}</p>
            <p><strong>Source:</strong> {r.Source} {r.Type && `(${r.Type})`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
