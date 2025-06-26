
// This version uses the classic 'pages' router with fixed import paths
import { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
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
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Market Matcher</h1>
      <div className="grid grid-cols-1 gap-4">
        <Textarea
          placeholder="Describe the industry or business class"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
        <Input
          placeholder="State (e.g., NJ)"
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <Input
          placeholder="Lines of Coverage (e.g., GL, Property, Umb)"
          value={coverages}
          onChange={(e) => setCoverages(e.target.value)}
        />
        <Input
          placeholder="Estimated Premium ($)"
          value={premium}
          onChange={(e) => setPremium(e.target.value)}
        />
        <Button onClick={handleSubmit}>Find Markets</Button>
      </div>

      <div className="space-y-4">
        {results.map((r, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg">{r.Carrier}</h2>
              <p><strong>Contact:</strong> {r["Underwriter Name"] || r.Liaison}</p>
              <p><strong>Email:</strong> {r.Email}</p>
              <p><strong>Phone:</strong> {r.Phone}</p>
              <p><strong>Coverages:</strong> {["GL", "WC", "Auto", "Umb", "Prop", "IM", "Exec Risk", "Other", "CE"].filter(cov => r[cov] === "X").join(", ")}</p>
              <p><strong>Notes:</strong> {r.Notes}</p>
              <p><strong>Source:</strong> {r.Source} {r.Type && `(${r.Type})`}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
