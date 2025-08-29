'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock Judge context data
const mockJudgeContext = {
  totalCases: 12,
  activeCases: 7,
  pendingHearings: 5,
  judges: [{ id: 1, name: "Judge Mwansa" }],
  lawyers: [{ id: 101, name: "Lawyer Banda" }, { id: 102, name: "Lawyer Tembo" }],
  cases: [
    { id: "C-001", title: "State vs John Doe", status: "Pending" },
    { id: "C-002", title: "Mwape vs Phiri", status: "Active" },
    { id: "C-003", title: "ZRA vs Chanda", status: "Ruling Pending" },
  ],
  documents: [
    { title: "Case Brief - State vs John Doe" },
    { title: "Evidence Bundle - Mwape vs Phiri" },
  ],
};

export default function JudgesDashboard() {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  async function handleTestAI() {
    setLoading(true);
    setAiResponse(null);
    setDebugInfo("🔄 Starting AI request...");
    
    try {
      console.log("📤 Sending request to /api/ai with payload:", {
        query: "Summarize my pending cases and hearings",
        context: mockJudgeContext,
      });
      
      setDebugInfo("🌐 Making fetch request to /api/ai...");
      
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: "Summarize my pending cases and hearings",
          context: mockJudgeContext,
        }),
      });

      console.log("📥 Response received:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries()),
        url: res.url,
      });

      setDebugInfo(`📊 Response Status: ${res.status} (${res.statusText}), OK: ${res.ok}`);

      if (!res.ok) {
        let errorDetails;
        try {
          const errorJson = await res.json();
          errorDetails = JSON.stringify(errorJson, null, 2);
          console.error("❌ HTTP Error Response (JSON):", errorJson);
          
          // More detailed error message based on the server response
          if (errorJson.error && errorJson.details) {
            setAiResponse(`❌ Server Error: ${errorJson.error}\nDetails: ${errorJson.details}\n\nThis suggests your /api/ai endpoint has a URL configuration issue.`);
          } else {
            setAiResponse(`❌ HTTP Error ${res.status}:\n${errorDetails}`);
          }
        } catch (jsonParseErr) {
          errorDetails = await res.text();
          console.error("❌ HTTP Error Response (Text):", errorDetails);
          setAiResponse(`❌ HTTP Error ${res.status}: ${errorDetails}`);
        }
        
        setDebugInfo(`❌ HTTP Error ${res.status}: Server-side issue detected`);
        return;
      }

      let data;
      try {
        setDebugInfo("🔍 Parsing JSON response...");
        data = await res.json();
        console.log("✅ Parsed JSON data:", data);
        console.log("🔍 Data keys:", Object.keys(data));
        console.log("🔍 Data types:", Object.keys(data).map(key => `${key}: ${typeof data[key]}`));
        
        setDebugInfo(`✅ JSON parsed successfully. Keys: [${Object.keys(data).join(', ')}]`);
        
        // Try multiple possible response fields
        let responseText = null;
        const possibleFields = ['text', 'response', 'message', 'result', 'content', 'answer', 'summary'];
        
        for (const field of possibleFields) {
          if (data[field]) {
            responseText = data[field];
            console.log(`✅ Found response in field '${field}':`, responseText);
            setDebugInfo(`✅ Using response from field: '${field}'`);
            break;
          }
        }
        
        if (!responseText) {
          console.warn("⚠️ No recognized response field found. Full data:", data);
          responseText = `⚠️ Response received but no recognized field found.\n\nFull response:\n${JSON.stringify(data, null, 2)}`;
          setDebugInfo("⚠️ No recognized response field found in JSON");
        }
        
        setAiResponse(responseText);
        
      } catch (jsonErr) {
        const text = await res.text();
        console.error("❌ JSON Parse Error:", jsonErr);
        console.error("📄 Raw response text:", text);
        setAiResponse(`❌ Invalid JSON response:\n\n${text}`);
        setDebugInfo(`❌ JSON parse failed. Raw response length: ${text.length} chars`);
      }
    } catch (networkErr) {
      console.error("🌐 Network/Fetch Error:", networkErr);
      setAiResponse(`❌ Network Error: ${networkErr.message}`);
      setDebugInfo(`❌ Network error: ${networkErr.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zambia-black">Judge Dashboard</h1>
          <p className="text-zambia-black/70">Manage your cases and hearings</p>
        </div>
        <Badge variant="outline" className="bg-zambia-green text-white">
          Judge
        </Badge>
      </div>

      {/* AI Testing Button */}
      <div className="my-4">
        <Button onClick={handleTestAI} disabled={loading}>
          {loading ? "Thinking..." : "Ask AI for Case Summary"}
        </Button>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700 text-sm">🔧 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono text-blue-600">{debugInfo}</div>
          </CardContent>
        </Card>
      )}

      {/* AI Response */}
      {aiResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-zambia-green">AI Case Summary</CardTitle>
            <CardDescription>Generated by Gemini AI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-line">{aiResponse}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
