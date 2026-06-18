import { useState, useEffect, useCallback } from 'react';
import { Lock, User, LogOut, BarChart3, GraduationCap, History, CheckCircle2, ShieldAlert, Database } from 'lucide-react';

// ==========================================
// 0. STATIC FALLBACK DEFAULTS
// ==========================================
const DEFAULT_SUBJECTS = [
  { id: 1, subjectName: 'Mathematics', baseline: true },
  { id: 2, subjectName: 'Physics', baseline: true },
  { id: 3, subjectName: 'Chemistry', baseline: true },
  { id: 4, subjectName: 'Computer Science', baseline: true },
  { id: 5, subjectName: 'English Language', baseline: true }
];

const DEFAULT_SCORES = { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50 };

export default function App() {
  // ==========================================
  // 1. STATE MANAGEMENT MODULE
  // ==========================================
  
  // Checked localStorage directly using a lazy initialization function
  // This calculates the initial value BEFORE the component first renders, removing the linter warning.
  const [isInitialized, setIsInitialized] = useState(() => {
    const existingUser = localStorage.getItem('gce_admin_username');
    return existingUser !== null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupError, setSetupError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInUser, setLoggedInUser] = useState('');

  const [studentName, setStudentName] = useState('');
  
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [sliderScores, setSliderScores] = useState(DEFAULT_SCORES);
  
  const [historicalStudents, setHistoricalStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('predict');
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // 2. CORE UTILITY DATA FETCHERS
  // ==========================================
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/subjects');
      if (res.ok) {
        const backendSubjects = await res.json();
        const baselineOnly = backendSubjects.filter(sub => sub.baseline === true || sub.isBaseline === true);
        
        if (baselineOnly.length > 0) {
          setTimeout(() => {
            setSubjects(baselineOnly);
            const initialScores = {};
            baselineOnly.forEach(sub => { initialScores[sub.id] = 50; });
            setSliderScores(initialScores);
          }, 0);
        }
      }
    } catch {
      console.warn("Backend offline, using local metadata profiles configuration.");
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/students');
      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setHistoricalStudents(data);
        }, 0);
      }
    } catch (histErr) {
      console.error("Error fetching historical tables", histErr);
    }
  }, []);

  // ==========================================
  // 3. LIFECYCLE HOOKS
  // ==========================================
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubjects();
      fetchHistory();
    }
  }, [isAuthenticated, fetchSubjects, fetchHistory]);

  // ==========================================
  // 4. ACTION HANDLERS
  // ==========================================
  const handleSystemSetup = (e) => {
    e.preventDefault();
    setSetupError('');

    // Input security complexity checks
    if (setupPassword.length < 8) {
      setSetupError('Security Policy: Passwords must be at least 8 characters long.');
      return;
    }

    if (setupPassword !== confirmPassword) {
      setSetupError('Password mismatch verification error. Check entries again.');
      return;
    }

    // Persist administrative credentials to storage array layers
    localStorage.setItem('gce_admin_username', setupUsername.trim());
    localStorage.setItem('gce_admin_password', setupPassword); // Plain-text matching fallback logic
    
    setIsInitialized(true);
    alert('System initialization completed. Please log in using your newly created master parameters.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    const storedUser = localStorage.getItem('gce_admin_username');
    const storedPass = localStorage.getItem('gce_admin_password');

    try {
      // Validate inputs against customized initialization profile records
      if (username.trim() === storedUser && password === storedPass) {
        setIsAuthenticated(true);
        setLoggedInUser(storedUser);
      } else {
        setLoginError('Invalid administrative engine credentials');
      }
    } catch (loginCatchErr) {
      console.error("Authentication handling exception encountered:", loginCatchErr);
      setLoginError('Authentication handling exception encountered.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoggedInUser('');
    setUsername('');
    setPassword('');
    setReport(null);
  };

  const handleScoreChange = (id, val) => {
    setSliderScores(prev => ({ ...prev, [id]: parseInt(val) }));
  };

  // SPREADSHEET USER MATRIX CELL HANDLER
  const handleMatrixCellChange = async (studentId, subjectId, value) => {
    const numericScore = value === '' ? 0 : parseInt(value);
    
    setHistoricalStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          scores: { ...student.scores, [subjectId]: numericScore }
        };
      }
      return student;
    }));

    try {
      await fetch('http://localhost:8080/api/matrix/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentId,
          subjectId: subjectId,
          score: numericScore
        })
      });
    } catch (err) {
      console.error("Failed to save matrix cell record to backend:", err);
    }
  };

  const executeFilteringPrediction = async () => {
    if (!studentName.trim()) {
      alert("Please provide a Candidate Full Name before processing calculations.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        studentName: studentName,
        subjectScores: sliderScores
      };

      const res = await fetch('http://localhost:8080/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const resultData = await res.json();
        setReport(resultData);
        fetchHistory(); 
      } else {
        alert("The server encountered an issue processing the recommendation matrices.");
      }
    } catch (predictCatchErr) {
      console.error("Error parsing similarity recommendation array vectors:", predictCatchErr);
      alert("Error parsing similarity recommendation array vectors. Is the backend running?");
    } finally {
      loading(false);
      setLoading(false);
    }
  };

  // ==========================================
  // 5. USER INTERFACE RENDERING
  // ==========================================
  
  // CONDITIONAL LANDING SCREEN BLOCK A: APP HAS NO ROOT USER REGISTERED
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
          <div className="flex flex-col items-center mb-6">
            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-full mb-3">
              <ShieldAlert size={36} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">First-Time Deployment Setup</h1>
            <p className="text-xs text-slate-400 text-center mt-1">
              Initialize your administrative environment profile credentials before launching system navigation pipelines.
            </p>
          </div>

          <form onSubmit={handleSystemSetup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Create Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text"
                  value={setupUsername}
                  onChange={(e) => setSetupUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="e.g. MasterAdmin"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="password"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Confirm System Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>

            {setupError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
                {setupError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg shadow-indigo-600/10"
            >
              Generate System Profile
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CONDITIONAL LANDING SCREEN BLOCK B: SECURE STANDARD LOGIN INTERFACE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-indigo-600/10 text-indigo-400 rounded-full mb-3">
              <Lock size={36} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">GCE Performance Engine</h1>
            <p className="text-sm text-slate-400 mt-1">Please sign in to access control panels</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="Enter system username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs text-center">
                {loginError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 transition-colors py-3 rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-indigo-600/20"
            >
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CORE APPLICATION PIPELINE CONTENT ROUTER
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-3">
          <GraduationCap className="text-indigo-400" size={28} />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">GCE Predictive Recommender</h1>
            <p className="text-xs text-slate-500">Collaborative Filtering Engine Pipeline</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right mr-2">
            <p className="text-xs text-slate-400 font-medium">System Operator</p>
            <p className="text-sm font-bold text-indigo-400">@{loggedInUser}</p>
          </div>

          {/* H2 Database Console Shortcut Link Routing Option */}
          <a 
            href="http://localhost:8080/gce-secure-db-panel" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium border border-slate-800 hover:border-indigo-500/20 bg-slate-950 px-3 py-1.5 rounded-lg"
          >
            <Database size={14} />
            <span>Database Console</span>
          </a>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium border border-slate-800 hover:border-rose-500/20 bg-slate-950 px-3 py-1.5 rounded-lg"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-slate-900 p-1.5 rounded-xl flex border border-slate-800">
            <button 
              onClick={() => setActiveTab('predict')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'predict' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart3 size={15} />
              <span>Engine Simulator</span>
            </button>
            <button 
              onClick={() => {
                setActiveTab('history');
                fetchHistory(); 
              }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <History size={15} />
              <span>Historical Registry</span>
            </button>
          </div>

          {activeTab === 'predict' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-sm">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">Candidate Input Vector</h2>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Candidate Full Name</label>
                <input 
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Asongafac Desmond"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-800/60">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-400 mb-1">Baseline Subject Matrix</label>
                {subjects.map(sub => (
                  <div key={sub.id} className="bg-slate-950/60 border border-slate-800/40 p-3 rounded-lg">
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-300">{sub.subjectName}</span>
                      <span className="text-indigo-400 font-mono font-bold">{sliderScores[sub.id] || 0}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={sliderScores[sub.id] || 50}
                      onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                      className="w-full accent-indigo-500 bg-slate-800 h-1 rounded-lg cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={executeFilteringPrediction}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 transition-colors py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-md mt-2"
              >
                {loading ? 'Processing Vectors...' : 'Compute Recommendation'}
              </button>
            </div>
          ) : (
            /* INTERACTIVE SPREADSHEET SPARSITY GRID EDITOR PANEL */
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col h-[535px]">
              <div>
                <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">User-Item Sparsity Matrix</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Solid values are known. Empty fields automatically simulate an unmapped <strong className="text-indigo-400">"?"</strong> node gap.
                </p>
              </div>

              <div className="flex-1 mt-4 overflow-auto border border-slate-800 rounded-xl bg-slate-950 custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                    <tr>
                      <th className="p-3 bg-slate-900 min-w-[130px] sticky left-0 z-20 border-r border-slate-800">Student Profile</th>
                      <th className="p-2 text-center min-w-[50px]">M (1)</th>
                      <th className="p-2 text-center min-w-[50px]">P (2)</th>
                      <th className="p-2 text-center min-w-[50px]">C (3)</th>
                      <th className="p-2 text-center min-w-[50px]">CS (4)</th>
                      <th className="p-2 text-center min-w-[50px]">E (5)</th>
                      <th className="p-2 text-center min-w-[50px] bg-indigo-950/40 text-indigo-300 border-l border-indigo-900/40">FM (6)</th>
                      <th className="p-2 text-center min-w-[50px] bg-indigo-950/40 text-indigo-300">SE (7)</th>
                      <th className="p-2 text-center min-w-[50px] bg-indigo-950/40 text-indigo-300">NA (8)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historicalStudents.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8 text-slate-500 italic">
                          No vector cluster rows initialized inside local database.
                        </td>
                      </tr>
                    ) : (
                      historicalStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="p-3 font-semibold text-slate-300 sticky left-0 bg-slate-950 shadow-[2px_0_5px_rgba(0,0,0,0.4)] border-r border-slate-800/60">
                            <span className="truncate block max-w-[110px]">{student.studentName || student.name || "Unknown"}</span>
                            <span className="text-[9px] font-mono text-slate-600 block">Node ID: #{student.id}</span>
                          </td>
                          
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((subId) => {
                            const isTarget = subId > 5;
                            const currentScore = student.scores?.[subId];
                            
                            return (
                              <td key={subId} className={`p-1.5 text-center ${isTarget ? 'bg-indigo-950/5' : ''} ${subId === 6 ? 'border-l border-indigo-900/20' : ''}`}>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="?"
                                  value={currentScore === undefined || currentScore === 0 ? '' : currentScore}
                                  onChange={(e) => handleMatrixCellChange(student.id, subId, e.target.value)}
                                  className={`w-11 text-center py-1 rounded font-mono text-xs transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                    isTarget 
                                      ? 'bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 placeholder-indigo-500/40' 
                                      : 'bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-700'
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 my-auto">
              <div className="p-4 bg-indigo-600/5 text-indigo-500/40 rounded-full mb-4 border border-indigo-600/10">
                <BarChart3 size={40} />
              </div>
              <h3 className="text-base font-bold text-slate-300">Awaiting Simulation Variables</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                Adjust baseline entry performance levels, provide student name records, and execute calculation matrices.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-5 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">Recommended Alignment Path</span>
                  <h3 className="text-xl font-black mt-1.5 tracking-tight text-white">{report.recommendedTrack}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Similarity Core</p>
                  <p className="text-3xl font-black font-mono text-indigo-400">{Math.round(parseFloat(report.similarityScore) * 100)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Peer Vector Target Match</span>
                  <p className="text-sm font-bold text-slate-200">Historical Profile: <span className="text-indigo-400">@{report.basedOnCandidate}</span></p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Persistence Log Trace</span>
                    <p className="text-xs text-emerald-400 font-semibold">Row Written to DB Tables successfully</p>
                  </div>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unmapped Target Predictions</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.predictions && report.predictions.map((pred, idx) => {
                    const subjectLabel = pred.subjectName || pred.subject || "Unknown Subject";
                    const finalScore = pred.predictedScore !== undefined ? pred.predictedScore : (pred.score || 0);
                    const finalGrade = pred.gceGrade || pred.grade || (finalScore >= 50 ? 'C' : 'F');

                    return (
                      <div key={idx} className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-400">Predicted Score Outcome</p>
                          <p className="text-base font-bold text-slate-200 mt-0.5">{subjectLabel}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-mono font-bold text-slate-300">{finalScore}/100</span>
                          <span className={`text-lg font-black h-9 w-9 flex items-center justify-center rounded-lg ${finalGrade === 'F' ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            {finalGrade}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">K-Nearest Node Profile Scan List</h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-[180px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Historical Candidate Node</th>
                        <th className="p-3 text-right">Cosine Coefficient Index</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {report.similarities && report.similarities.map((sim, i) => (
                        <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-medium text-slate-300">{sim.name || sim.studentName}</td>
                          <td className="p-3 text-right font-mono font-bold text-indigo-400">{(sim.similarity * 100).toFixed(0)}% Match</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-[10px] text-slate-600 mt-6 pt-4 border-t border-slate-800/40">
            University of Buea Computer Science Project Core Architecture Module Verified.
          </div>
        </div>
      </main>
    </div>
  );
}