import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  startSession, listSessions, getSession, streamChat,
  listAssets, sendFeedback, transcribeAudio, speakText,
} from "../lib/api";
import { Card, Spinner } from "../components/UI";
import {
  Send, Bot, User, ThumbsUp, ThumbsDown, Plus,
  Stethoscope, FileText, FileSignature, Settings2, Search, Mic, MicOff,
  Volume2, Square, Terminal, EyeOff, Eye,
} from "lucide-react";

const MODELS = [
  { id: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "gpt-5.2", label: "GPT-5.2", provider: "OpenAI" },
];

const SAMPLE_PROMPTS = [
  { icon: Search, label: "Diagnose Pump Issue", prompt: "Diagnose the most likely fault in the Hydraulic Pump HP-04 based on current sensor data, alerts, and history." },
  { icon: FileText, label: "Predict RUL failures", prompt: "Predict which assets are most likely to fail in the next 30 days and provide RUL with justification." },
  { icon: Stethoscope, label: "Priority Maintenance Plan", prompt: "Build a prioritized maintenance plan for the next 7 days across all critical assets." },
  { icon: FileSignature, label: "Generate Plant Report", prompt: "Generate a structured plant maintenance status report covering health, alerts, and actions." },
  { icon: Settings2, label: "Rolling Mill health", prompt: "Summarise the Hot Rolling Mill #1 (HRM-01) health and any inspection actions due." },
  { icon: FileText, label: "SOP Search", prompt: "Find the SOP for emergency bearing inspection on the Main Drive Motor and quote the key steps." },
];

function FeedbackRow({ sessionId, messageId }) {
  const [done, setDone] = useState(null);
  const submit = async (rating) => {
    setDone(rating);
    await sendFeedback({ session_id: sessionId, message_id: messageId, rating });
  };
  return (
    <div className="flex items-center gap-2 mt-2 text-mut">
      <span className="label">Was this helpful?</span>
      <button data-testid={`feedback-up-${messageId}`} onClick={() => submit("up")} disabled={done}
              className={`p-1 hover:text-healthy ${done === "up" ? "text-healthy" : ""}`}>
        <ThumbsUp size={13} />
      </button>
      <button data-testid={`feedback-down-${messageId}`} onClick={() => submit("down")} disabled={done}
              className={`p-1 hover:text-critical ${done === "down" ? "text-critical" : ""}`}>
        <ThumbsDown size={13} />
      </button>
      {done && <span className="text-xs font-mono text-mut">Recorded</span>}
    </div>
  );
}

export default function Wizard() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const presetAsset = params.get("asset");

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState(presetAsset || "");
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0].id);
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const [showConsole, setShowConsole] = useState(true);
  const [thoughtLog, setThoughtLog] = useState([
    { t: new Date().toLocaleTimeString(), msg: "console: awaiting transactions. submit a query in AI Console to scan logs." },
  ]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakBack, setSpeakBack] = useState(false);
  const scroller = useRef(null);
  const mediaRec = useRef(null);
  const audioPlayer = useRef(null);

  useEffect(() => {
    listAssets().then(setAssets);
    listSessions().then(setSessions);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamBuf]);

  const pushLog = (msg) =>
    setThoughtLog((l) => [...l.slice(-40), { t: new Date().toLocaleTimeString(), msg }]);

  const newSession = async () => {
    const s = await startSession({ asset_id: assetId || null, title: "New session" });
    setSession(s); setMessages([]); setThoughtLog([{ t: new Date().toLocaleTimeString(), msg: "[session] new diagnostic session created" }]);
    setSessions(await listSessions());
  };

  const loadSession = async (sid) => {
    const s = await getSession(sid);
    setSession(s); setAssetId(s.asset_id || ""); setMessages(s.messages || []);
  };

  const send = async (txt) => {
    const message = (txt ?? input).trim();
    if (!message) return;
    let active = session;
    if (!active) {
      active = await startSession({ asset_id: assetId || null, title: message.slice(0, 60) });
      setSession(active);
      setSessions(await listSessions());
    }
    pushLog(`[query] "${message.slice(0, 80)}${message.length > 80 ? "…" : ""}"`);
    if (assetId) pushLog(`[context] retrieving asset ${assetId}`);
    pushLog(`[model] ${MODELS.find(m => m.id === model)?.label}`);
    pushLog("[rag] injecting manuals, SOPs, sensors, alerts");

    setMessages((m) => [...m, {
      id: `u-${Date.now()}`, role: "user", content: message, model, ts: new Date().toISOString(),
    }]);
    setInput(""); setStreaming(true); setStreamBuf("");
    let final = ""; let asstId = null;
    try {
      pushLog("[stream] tokens incoming…");
      for await (const ev of streamChat({
        session_id: active.id, message, model, asset_id: assetId || null,
      })) {
        if (ev.type === "delta") {
          final += ev.content; setStreamBuf((b) => b + ev.content);
        } else if (ev.type === "done") {
          asstId = ev.message_id;
          pushLog(`[done] response complete · ${final.length} chars`);
        }
      }
    } catch (e) {
      final += `\n\n_⚠️ Network error: ${e.message}_`;
      pushLog(`[error] ${e.message}`);
    }
    const msgObj = {
      id: asstId || `a-${Date.now()}`, role: "assistant", content: final,
      model, ts: new Date().toISOString(),
    };
    setMessages((m) => [...m, msgObj]);
    setStreamBuf(""); setStreaming(false);

    if (speakBack && final) {
      try {
        pushLog("[tts] synthesising voice playback");
        const blob = await speakText(final.slice(0, 4000));
        const url = URL.createObjectURL(blob);
        if (audioPlayer.current) { audioPlayer.current.src = url; audioPlayer.current.play(); }
      } catch (e) { pushLog(`[tts:error] ${e.message}`); }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setTranscribing(true);
        pushLog("[stt] uploading audio to whisper-1");
        try {
          const r = await transcribeAudio(blob);
          if (r.text) {
            pushLog(`[stt] transcribed: "${r.text.slice(0, 80)}"`);
            setInput(r.text);
          }
        } catch (e) { pushLog(`[stt:error] ${e.message}`); }
        setTranscribing(false);
      };
      mr.start();
      mediaRec.current = mr; setRecording(true);
      pushLog("[mic] recording…");
    } catch (e) {
      pushLog(`[mic:error] ${e.message} — check microphone permissions`);
    }
  };

  const stopRecording = () => {
    if (mediaRec.current && recording) { mediaRec.current.stop(); setRecording(false); }
  };

  const selectedAsset = assets.find((a) => a.id === assetId);

  return (
    <div className="p-8 max-w-[1700px] mx-auto relative z-10" data-testid="wizard-page">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bot size={20} className="text-info" />
          <h2 className="text-xl font-bold text-pri">AI Decision-Support Console</h2>
        </div>
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="btn btn-primary"
          data-testid="toggle-console"
        >
          {showConsole ? <><EyeOff size={14} /> Hide Console</> : <><Eye size={14} /> Show Console</>}
        </button>
      </div>

      <div className={`grid gap-6 ${showConsole ? "grid-cols-12" : "grid-cols-1"}`}>
        {/* Chat */}
        <div className={showConsole ? "col-span-12 lg:col-span-8" : "col-span-1"}>
          <Card className="!p-0" testid="chat-card">
            <div className="card-header">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <button onClick={newSession} className="btn btn-secondary !py-1.5" data-testid="new-session-btn">
                    <Plus size={13} /> New
                  </button>
                </div>
                <select
                  data-testid="asset-select"
                  className="input !py-1.5 !w-56"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                >
                  <option value="">— Plant-wide —</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  {MODELS.map((m) => (
                    <button
                      key={m.id}
                      data-testid={`model-${m.id}`}
                      onClick={() => setModel(m.id)}
                      className={`btn !px-3 !py-1.5 !text-[11px] ${model === m.id ? "btn-primary" : "btn-secondary"}`}
                    >{m.label}</button>
                  ))}
                </div>
                <button
                  onClick={() => setSpeakBack(!speakBack)}
                  data-testid="tts-toggle"
                  className={`btn !py-1.5 ${speakBack ? "btn-primary" : "btn-secondary"}`}
                  title="Speak responses aloud"
                >
                  <Volume2 size={14} /> {speakBack ? "Voice ON" : "Voice OFF"}
                </button>
              </div>
            </div>

            <div
              ref={scroller}
              className="h-[58vh] overflow-y-auto scrollbar-thin p-6"
              data-testid="chat-messages"
            >
              {messages.length === 0 && !streaming && (
                <div className="relative max-w-2xl mx-auto py-8" data-testid="orbital-hero" style={{ minHeight: 480 }}>
                  {/* Central pulsing core */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    {/* concentric rings */}
                    <div className="absolute w-72 h-72 rounded-full border border-blue-500/15 animate-pulse" />
                    <div className="absolute w-56 h-56 rounded-full border border-purple-500/20 animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <div className="absolute w-40 h-40 rounded-full border border-cyan-400/30 animate-pulse" style={{ animationDelay: "0.8s" }} />
                    {/* core orb */}
                    <div className="w-24 h-24 rounded-full flex items-center justify-center relative"
                         style={{
                           background: "radial-gradient(circle at 30% 30%, #60A5FA, #8B5CF6 60%, #1E1B4B)",
                           boxShadow: "0 0 60px rgba(99,102,241,0.55), inset 0 0 30px rgba(34,211,238,0.35)",
                         }}>
                      <Bot size={36} className="text-white drop-shadow-lg" />
                    </div>
                    <div className="text-pri font-black text-2xl mt-5">Maintenance Wizard</div>
                    <div className="font-mono text-[10px] tracking-[0.28em] text-cyan mt-1 uppercase">Multi-Agent Decision Network</div>
                  </div>
                  {/* Orbital prompts arranged around the core */}
                  {SAMPLE_PROMPTS.map((p, i) => {
                    const angle = (i / SAMPLE_PROMPTS.length) * Math.PI * 2 - Math.PI / 2;
                    const radius = 230;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius * 0.55;
                    const Icon = p.icon;
                    return (
                      <button
                        key={i}
                        data-testid={`sample-prompt-${i}`}
                        onClick={() => send(p.prompt)}
                        className="absolute left-1/2 top-1/2 group"
                        style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                      >
                        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#0B1224]/90 border border-d hover:border-cyan-400/60 hover:bg-[#131C33] transition backdrop-blur-md whitespace-nowrap">
                          <Icon size={13} className="text-cyan group-hover:text-info" />
                          <span className="text-pri text-xs font-medium">{p.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} data-testid={`message-${m.role}`}
                       className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                           style={{background: "linear-gradient(135deg, #3B82F6, #8B5CF6)"}}>
                        <Bot size={14} className="text-white" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl ${
                      m.role === "user"
                        ? "bg-[#1E293B] border border-d px-4 py-3"
                        : "bg-[#131C33] border border-d border-l-2 border-l-blue-500 px-4 py-3"
                    }`}>
                      {m.role === "assistant" ? (
                        <div className="markdown"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                      ) : (
                        <div className="text-pri text-sm whitespace-pre-wrap">{m.content}</div>
                      )}
                      {m.role === "assistant" && session && (
                        <FeedbackRow sessionId={session.id} messageId={m.id} />
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0 mt-1">
                        <User size={14} className="text-sec" />
                      </div>
                    )}
                  </div>
                ))}

                {streaming && streamBuf && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                         style={{background: "linear-gradient(135deg, #3B82F6, #8B5CF6)"}}>
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="max-w-[80%] bg-[#131C33] border border-d border-l-2 border-l-blue-500 rounded-xl px-4 py-3">
                      <div className="markdown"><ReactMarkdown>{streamBuf}</ReactMarkdown></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-d p-3 bg-[#0B1224] flex gap-2 items-center">
              <button
                onClick={recording ? stopRecording : startRecording}
                data-testid="mic-btn"
                disabled={transcribing}
                className={`btn !py-2.5 !px-3 ${recording ? "btn-danger recording" : "btn-secondary"}`}
                title={recording ? "Stop recording" : "Record voice"}
              >
                {recording ? <Square size={14} /> : transcribing ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <input
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !streaming && send()}
                placeholder={transcribing ? "Transcribing audio…" : "Ask the AI about diagnostics, predictions, procedures, or incident summaries…"}
                className="input flex-1"
                disabled={streaming || transcribing}
              />
              <button
                data-testid="chat-send-btn"
                onClick={() => send()}
                className="btn btn-primary !py-2.5"
                disabled={streaming || !input.trim()}
              >
                <Send size={14} />
              </button>
            </div>
            <div className="text-center text-mut text-[10px] font-mono py-2 border-t border-d">
              Decision Support System. Verify critical maintenance recommendations with plant SOP guidelines.
            </div>
          </Card>
          <audio ref={audioPlayer} className="hidden" />
        </div>

        {/* Agent Console Thought Logs */}
        {showConsole && (
          <div className="col-span-12 lg:col-span-4">
            <Card className="!p-0 card-glow-purple">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </span>
                  <span className="label">AGENT CONSOLE THOUGHT LOGS</span>
                </div>
                <Terminal size={14} className="text-purple" />
              </div>
              <div className="p-4 h-[70vh] overflow-y-auto scrollbar-thin font-mono text-[11.5px] space-y-1">
                {thoughtLog.map((l, i) => (
                  <div key={i} className="text-sec">
                    <span className="text-mut">[{l.t}]</span>{" "}
                    <span className={
                      l.msg.includes("[error]") ? "text-critical" :
                      l.msg.includes("[done]") ? "text-healthy" :
                      l.msg.includes("[query]") ? "text-info" :
                      l.msg.includes("[model]") || l.msg.includes("[stream]") ? "text-purple" :
                      "text-pri"
                    }>{l.msg}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-d p-3">
                <div className="label mb-2">RECENT SESSIONS</div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                  {sessions.slice(0, 5).map((s) => (
                    <button key={s.id} onClick={() => loadSession(s.id)}
                            data-testid={`session-${s.id}`}
                            className={`text-left w-full px-2.5 py-1.5 rounded ${
                              session?.id === s.id ? "bg-blue-500/10 border border-blue-500/40" : "border border-d"
                            }`}>
                      <div className="text-pri text-xs truncate">{s.title}</div>
                      <div className="text-[10px] text-mut font-mono">
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
