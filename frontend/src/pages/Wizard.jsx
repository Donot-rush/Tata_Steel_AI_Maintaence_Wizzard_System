import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  getSession,
  listAssets,
  listSessions,
  sendFeedback,
  speakText,
  startSession,
  streamChat,
  transcribeAudio,
} from "../lib/api";
import { Card } from "../components/UI";
import {
  Activity,
  AlertTriangle,
  Bot,
  ClipboardCheck,
  Cpu,
  Eye,
  EyeOff,
  FileSignature,
  FileText,
  Gauge,
  Mic,
  MicOff,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Square,
  Stethoscope,
  Terminal,
  ThumbsDown,
  ThumbsUp,
  User,
  Volume2,
} from "lucide-react";

const ACTIVE_AGENT = {
  id: "forgeops-sentinel",
  label: "FORGEOPS Sentinel",
  role: "Steel Plant Reliability Agent",
  mode: "Sensor fusion + SOP reasoning + RUL triage",
};

const SAMPLE_PROMPTS = [
  {
    icon: Search,
    label: "Fault Triage",
    prompt:
      "Diagnose the most likely fault in the Hydraulic Pump HP-04 based on current sensor data, alerts, and history.",
  },
  {
    icon: Gauge,
    label: "RUL Watchlist",
    prompt:
      "Predict which assets are most likely to fail in the next 30 days and provide RUL with justification.",
  },
  {
    icon: Stethoscope,
    label: "7-Day Work Plan",
    prompt: "Build a prioritized maintenance plan for the next 7 days across all critical assets.",
  },
  {
    icon: FileSignature,
    label: "Plant Report",
    prompt:
      "Generate a structured plant maintenance status report covering health, alerts, and actions.",
  },
  {
    icon: Activity,
    label: "Rolling Mill Review",
    prompt: "Summarise the Hot Rolling Mill #1 (HRM-01) health and any inspection actions due.",
  },
  {
    icon: FileText,
    label: "SOP Lookup",
    prompt:
      "Find the SOP for emergency bearing inspection on the Main Drive Motor and quote the key steps.",
  },
];

function FeedbackRow({ sessionId, messageId }) {
  const [done, setDone] = useState(null);

  const submit = async (rating) => {
    setDone(rating);
    await sendFeedback({ session_id: sessionId, message_id: messageId, rating });
  };

  return (
    <div className="mt-3 flex items-center gap-2 text-mut">
      <span className="label">Helpful?</span>
      <button
        data-testid={`feedback-up-${messageId}`}
        onClick={() => submit("up")}
        disabled={done}
        className={`rounded border border-slate-700 p-1 hover:text-healthy ${
          done === "up" ? "text-healthy" : ""
        }`}
      >
        <ThumbsUp size={13} />
      </button>
      <button
        data-testid={`feedback-down-${messageId}`}
        onClick={() => submit("down")}
        disabled={done}
        className={`rounded border border-slate-700 p-1 hover:text-critical ${
          done === "down" ? "text-critical" : ""
        }`}
      >
        <ThumbsDown size={13} />
      </button>
      {done && <span className="font-mono text-xs text-mut">Recorded</span>}
    </div>
  );
}

function AgentBadge() {
  return (
    <div className="rounded-md border border-cyan-400/35 bg-cyan-400/10 px-3 py-2">
      <div className="flex items-center gap-2">
        <ShieldCheck size={15} className="text-cyan" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
          {ACTIVE_AGENT.label}
        </span>
      </div>
      <div className="mt-1 text-xs text-sec">{ACTIVE_AGENT.role}</div>
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
  const [streaming, setStreaming] = useState(false);
  const [streamBuf, setStreamBuf] = useState("");
  const [showConsole, setShowConsole] = useState(true);
  const [thoughtLog, setThoughtLog] = useState([
    {
      t: new Date().toLocaleTimeString(),
      msg: "sentinel: ready for reliability triage. choose an asset or submit a plant-wide query.",
    },
  ]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakBack, setSpeakBack] = useState(false);
  const scroller = useRef(null);
  const mediaRec = useRef(null);
  const audioPlayer = useRef(null);

  const model = ACTIVE_AGENT.id;

  useEffect(() => {
    listAssets().then(setAssets);
    listSessions().then(setSessions);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamBuf]);

  const selectedAsset = assets.find((a) => a.id === assetId);
  const pushLog = (msg) =>
    setThoughtLog((l) => [...l.slice(-40), { t: new Date().toLocaleTimeString(), msg }]);

  const newSession = async () => {
    const s = await startSession({ asset_id: assetId || null, title: "New Sentinel session" });
    setSession(s);
    setMessages([]);
    setThoughtLog([
      { t: new Date().toLocaleTimeString(), msg: "[session] new reliability session created" },
    ]);
    setSessions(await listSessions());
  };

  const loadSession = async (sid) => {
    const s = await getSession(sid);
    setSession(s);
    setAssetId(s.asset_id || "");
    setMessages(s.messages || []);
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

    pushLog(`[query] "${message.slice(0, 80)}${message.length > 80 ? "..." : ""}"`);
    pushLog(`[agent] ${ACTIVE_AGENT.label} - ${ACTIVE_AGENT.mode}`);
    if (assetId) pushLog(`[context] binding asset ${assetId}`);
    pushLog("[rag] loading SOPs, alerts, live sensors, logs");

    setMessages((m) => [
      ...m,
      {
        id: `u-${Date.now()}`,
        role: "user",
        content: message,
        model,
        ts: new Date().toISOString(),
      },
    ]);
    setInput("");
    setStreaming(true);
    setStreamBuf("");

    let final = "";
    let asstId = null;
    try {
      pushLog("[stream] response synthesis started");
      for await (const ev of streamChat({
        session_id: active.id,
        message,
        model,
        asset_id: assetId || null,
      })) {
        if (ev.type === "delta") {
          final += ev.content;
          setStreamBuf((b) => b + ev.content);
        } else if (ev.type === "done") {
          asstId = ev.message_id;
          pushLog(`[done] response complete - ${final.length} chars`);
        }
      }
    } catch (e) {
      final += `\n\n_Warning: network error: ${e.message}_`;
      pushLog(`[error] ${e.message}`);
    }

    const msgObj = {
      id: asstId || `a-${Date.now()}`,
      role: "assistant",
      content: final,
      model,
      ts: new Date().toISOString(),
    };
    setMessages((m) => [...m, msgObj]);
    setStreamBuf("");
    setStreaming(false);

    if (speakBack && final) {
      try {
        pushLog("[tts] synthesising voice playback");
        const blob = await speakText(final.slice(0, 4000));
        const url = URL.createObjectURL(blob);
        if (audioPlayer.current) {
          audioPlayer.current.src = url;
          audioPlayer.current.play();
        }
      } catch (e) {
        pushLog(`[tts:error] ${e.message}`);
      }
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
        pushLog("[stt] uploading voice note");
        try {
          const r = await transcribeAudio(blob);
          if (r.text) {
            pushLog(`[stt] transcribed: "${r.text.slice(0, 80)}"`);
            setInput(r.text);
          }
        } catch (e) {
          pushLog(`[stt:error] ${e.message}`);
        }
        setTranscribing(false);
      };

      mr.start();
      mediaRec.current = mr;
      setRecording(true);
      pushLog("[mic] recording voice query");
    } catch (e) {
      pushLog(`[mic:error] ${e.message} - check microphone permissions`);
    }
  };

  const stopRecording = () => {
    if (mediaRec.current && recording) {
      mediaRec.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="wizard-page">
      <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-md border border-slate-700/70 bg-[#08111f] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan">
                <Bot size={15} />
                Reliability Agent Workbench
              </div>
              <h2 className="text-3xl font-black leading-tight text-pri">AI Maintenance Command Chat</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-sec">
                Ask for diagnostics, RUL risk, SOP guidance, reports, and next-best maintenance actions.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={newSession} className="btn btn-secondary" data-testid="new-session-btn">
                <Plus size={14} /> New Session
              </button>
              <button
                onClick={() => setShowConsole(!showConsole)}
                className="btn btn-primary"
                data-testid="toggle-console"
              >
                {showConsole ? (
                  <>
                    <EyeOff size={14} /> Hide Logs
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Show Logs
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <AgentBadge />
      </div>

      <div className={`grid gap-5 ${showConsole ? "grid-cols-12" : "grid-cols-1"}`}>
        <div className={showConsole ? "col-span-12 xl:col-span-8" : "col-span-1"}>
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Cpu size={15} className="text-cyan" />
                  <span className="label text-cyan">Context Scope</span>
                </div>
                <select
                  data-testid="asset-select"
                  className="input !py-2"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                >
                  <option value="">Plant-wide</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>

                <div className="mt-3 rounded border border-slate-700/70 bg-[#08111f] p-3">
                  {selectedAsset ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-pri">{selectedAsset.name}</div>
                          <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mut">
                            {selectedAsset.code} - {selectedAsset.sector}
                          </div>
                        </div>
                        <span
                          className={`font-mono text-sm ${
                            selectedAsset.status === "critical"
                              ? "text-critical"
                              : selectedAsset.status === "warning"
                                ? "text-warning"
                                : "text-healthy"
                          }`}
                        >
                          {selectedAsset.health}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400"
                          style={{ width: `${selectedAsset.health}%` }}
                        />
                      </div>
                      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-mut">
                        RUL {selectedAsset.rul_days} days
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-sec">
                      Sentinel will reason across the full plant fleet and open alert set.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardCheck size={15} className="text-warning" />
                  <span className="label text-warning">Prompt Playbooks</span>
                </div>
                <div className="grid gap-2">
                  {SAMPLE_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.label}
                        data-testid={`sample-prompt-${i}`}
                        onClick={() => send(p.prompt)}
                        className="group rounded border border-slate-700/70 bg-[#08111f] px-3 py-2.5 text-left transition hover:border-cyan-400/60 hover:bg-cyan-400/10"
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={14} className="text-cyan group-hover:text-pri" />
                          <span className="text-sm font-semibold text-pri">{p.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            <Card className="!p-0 overflow-hidden" testid="chat-card">
              <div className="border-b border-d bg-[#101827] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="label text-cyan">Active Agent</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 pulse-dot text-emerald-300" />
                      <span className="font-mono text-sm uppercase tracking-[0.16em] text-pri">
                        {ACTIVE_AGENT.label}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSpeakBack(!speakBack)}
                    data-testid="tts-toggle"
                    className={`btn !py-2 ${speakBack ? "btn-primary" : "btn-secondary"}`}
                    title="Speak responses aloud"
                  >
                    <Volume2 size={14} /> {speakBack ? "Voice ON" : "Voice OFF"}
                  </button>
                </div>
              </div>

              <div
                ref={scroller}
                className="h-[62vh] overflow-y-auto p-5 scrollbar-thin"
                data-testid="chat-messages"
              >
                {messages.length === 0 && !streaming && (
                  <div className="grid min-h-[420px] content-center gap-4" data-testid="orbital-hero">
                    <div className="rounded-md border border-cyan-400/25 bg-cyan-400/10 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded border border-cyan-400/50 bg-[#08111f]">
                          <Radio size={24} className="text-cyan" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-pri">Sentinel Intake Board</div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                            Maintenance intelligence ready
                          </div>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-sec">
                        Select an asset, choose a playbook, or type a direct maintenance question.
                        The agent will combine alerts, sensor readings, logbook history, and SOP context.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["Evidence first", "Cites sensors, SOPs and logs"],
                        ["Action oriented", "Prioritizes immediate, short-term and long-term work"],
                        ["Voice capable", "Mic input and spoken responses remain available"],
                      ].map(([title, detail]) => (
                        <div key={title} className="rounded border border-slate-700/70 bg-[#08111f] p-3">
                          <div className="text-sm font-bold text-pri">{title}</div>
                          <div className="mt-1 text-xs text-mut">{detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      data-testid={`message-${m.role}`}
                      className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                    >
                      {m.role === "assistant" && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-cyan-400/40 bg-cyan-400/15">
                          <Bot size={15} className="text-cyan" />
                        </div>
                      )}
                      <div
                        className={`max-w-[82%] rounded-md border px-4 py-3 ${
                          m.role === "user"
                            ? "border-blue-400/35 bg-blue-500/10"
                            : "border-cyan-400/25 bg-[#101827]"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <div className="markdown">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm text-pri">{m.content}</div>
                        )}
                        {m.role === "assistant" && session && (
                          <FeedbackRow sessionId={session.id} messageId={m.id} />
                        )}
                      </div>
                      {m.role === "user" && (
                        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-700 bg-[#101827]">
                          <User size={15} className="text-sec" />
                        </div>
                      )}
                    </div>
                  ))}

                  {streaming && streamBuf && (
                    <div className="flex gap-3">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-cyan-400/40 bg-cyan-400/15">
                        <Bot size={15} className="text-cyan" />
                      </div>
                      <div className="max-w-[82%] rounded-md border border-cyan-400/25 bg-[#101827] px-4 py-3">
                        <div className="markdown">
                          <ReactMarkdown>{streamBuf}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-d bg-[#08111f] p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    data-testid="mic-btn"
                    disabled={transcribing}
                    className={`btn !px-3 !py-2.5 ${
                      recording ? "btn-danger recording" : "btn-secondary"
                    }`}
                    title={recording ? "Stop recording" : "Record voice"}
                  >
                    {recording ? <Square size={14} /> : transcribing ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <input
                    data-testid="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !streaming && send()}
                    placeholder={
                      transcribing
                        ? "Transcribing audio..."
                        : "Ask Sentinel for diagnosis, RUL, SOPs, incidents, or maintenance actions..."
                    }
                    className="input flex-1"
                    disabled={streaming || transcribing}
                  />
                  <button
                    data-testid="chat-send-btn"
                    onClick={() => send()}
                    className="btn btn-primary !px-4 !py-2.5"
                    disabled={streaming || !input.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
                <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-mut">
                  Verify critical recommendations with plant SOP and supervisor approval.
                </div>
              </div>
            </Card>
            <audio ref={audioPlayer} className="hidden" />
          </div>
        </div>

        {showConsole && (
          <div className="col-span-12 xl:col-span-4">
            <Card className="!p-0 overflow-hidden card-glow-teal">
              <div className="border-b border-d bg-[#101827] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Terminal size={15} className="text-cyan" />
                    <span className="label text-cyan">Sentinel Trace Log</span>
                  </div>
                  <span className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                    Online
                  </span>
                </div>
              </div>

              <div className="h-[49vh] overflow-y-auto p-4 font-mono text-[11.5px] scrollbar-thin">
                <div className="space-y-1">
                  {thoughtLog.map((l, i) => (
                    <div key={i} className="text-sec">
                      <span className="text-mut">[{l.t}]</span>{" "}
                      <span
                        className={
                          l.msg.includes("[error]")
                            ? "text-critical"
                            : l.msg.includes("[done]")
                              ? "text-healthy"
                              : l.msg.includes("[query]")
                                ? "text-info"
                                : l.msg.includes("[agent]") || l.msg.includes("[stream]")
                                  ? "text-cyan"
                                  : "text-pri"
                        }
                      >
                        {l.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-d p-4">
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-warning" />
                  <span className="label text-warning">Recent Sessions</span>
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto scrollbar-thin">
                  {sessions.slice(0, 5).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      data-testid={`session-${s.id}`}
                      className={`w-full rounded border px-3 py-2 text-left transition ${
                        session?.id === s.id
                          ? "border-cyan-400/50 bg-cyan-400/10"
                          : "border-slate-700/70 bg-[#08111f] hover:border-cyan-400/50"
                      }`}
                    >
                      <div className="truncate text-sm font-semibold text-pri">{s.title}</div>
                      <div className="mt-1 font-mono text-[10px] text-mut">
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
