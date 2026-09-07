import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileText, RefreshCw, Send, X } from 'lucide-react';
import { adminApiRequest } from '../api/client';

export default function DefaulterImport({ onImportSuccess }) {
  const [subject, setSubject] = useState('Computer Networks');
  const [rawText, setRawText] = useState(
    'Seat Number, Student Name, Attendance %\nS2026023, Rahul Sharma, 62%\nS2026031, Riya Shah, 58%\nS2026048, Aditya Patil, 64%'
  );
  const [parsing, setParsing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [stagingResults, setStagingResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle Parse with Seat Number Enforcement
  const handleParse = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!rawText.trim()) {
      setErrorMessage('Please paste or upload CSV data containing Seat Number, Student Name, and Attendance %');
      return;
    }

    setParsing(true);
    try {
      const res = await adminApiRequest('/defaulters/parse', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          rawText
        })
      });

      if (res.data?.stagingResults) {
        setStagingResults(res.data.stagingResults);
        setSummary(res.data.summary);
      } else {
        setErrorMessage(res.message || 'File parsing rejected.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Parsing failed. Missing required Seat Number column.');
    } finally {
      setParsing(false);
    }
  };

  // Commit Verified Records
  const handlePublish = async () => {
    const verifiedRows = stagingResults.filter(r => r.verified && r.selectedForPublish);
    if (verifiedRows.length === 0) {
      setErrorMessage('No verified students with valid Seat Numbers selected to publish.');
      return;
    }

    setPublishing(true);
    try {
      const res = await adminApiRequest('/defaulters/publish', {
        method: 'POST',
        body: JSON.stringify({
          subject,
          noticeTitle: `${subject} Official Shortage Circular`,
          reason: 'Attendance below 75% threshold',
          records: verifiedRows
        })
      });

      if (res.success) {
        setSuccessMessage(`Successfully published ${res.data?.count} verified student(s). Real-time targeted socket alerts dispatched.`);
        setStagingResults([]);
        setSummary(null);
        onImportSuccess?.();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to publish records.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-400" />
            Batch Defaulter Import & Seat Number Verification
          </h3>
          <p className="text-xs text-slate-400">
            Files must contain official <strong>Seat Number (PRN)</strong>, <strong>Student Name</strong>, and <strong>Attendance %</strong>
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">Subject Curriculum</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-300">File Content / CSV Data</label>
            <span className="text-[10px] text-blue-400 font-semibold">Column Rule: Seat Number, Student Name, Attendance %</span>
          </div>
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Seat Number, Student Name, Attendance %&#10;S2026023, Rahul Sharma, 62%"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={handleParse}
          disabled={parsing}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Validate Seat Numbers in Database
        </button>
      </div>

      {/* Staging Verification Table */}
      {stagingResults.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-white text-sm">Database Verification Staging</h4>
            {summary && (
              <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {summary.matched} Verified • {summary.invalidSeatNumbers} Invalid
              </span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Seat Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {stagingResults.map((r, i) => (
                  <tr key={i} className={r.verified ? 'hover:bg-slate-800/40' : 'bg-red-950/20'}>
                    <td className="py-2.5 px-3 font-mono font-bold text-white">#{r.seatNumber}</td>
                    <td className="py-2.5 px-3">{r.studentName}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-400">{r.attendancePercentage}%</td>
                    <td className="py-2.5 px-3">
                      {r.verified ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ DB Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          ❌ Invalid Seat No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Confirm & Broadcast Targeted Defaulter Alerts
          </button>
        </div>
      )}
    </div>
  );
}
