"""Steel Plant Maintenance Wizard — Backend (FastAPI)."""
from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, Header
from fastapi.responses import StreamingResponse, Response
import asyncio
import io
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging
import json
import random
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from google import genai
from groq import Groq


try:    
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
    from emergentintegrations.llm.openai import OpenAISpeechToText, OpenAITextToSpeech
except ImportError:
    LlmChat = None
    UserMessage = None
    TextDelta = None
    StreamDone = None
    OpenAISpeechToText = None
    OpenAITextToSpeech = None

import seed_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

UTC = timezone.utc
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Steel Plant Maintenance Wizard API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s — %(message)s")
log = logging.getLogger("wizard")


# ---------- Models ----------
class ChatStartReq(BaseModel):
    asset_id: Optional[str] = None
    title: Optional[str] = None


class ChatSendReq(BaseModel):
    session_id: str
    message: str
    model: Literal["claude-sonnet-4-5-20250929", "gpt-5.2"] = "claude-sonnet-4-5-20250929"
    asset_id: Optional[str] = None


class FeedbackReq(BaseModel):
    session_id: str
    message_id: str
    rating: Literal["up", "down"]
    comment: Optional[str] = None


class AckAlertReq(BaseModel):
    alert_id: str


class LogbookCreateReq(BaseModel):
    asset_id: str
    action: str
    duration_min: int = 0
    spares_used: List[str] = []
    notes: str = ""
    performed_by: str = "Maintenance Engineer"


# ---------- Seeding ----------
async def ensure_seed():
    n = await db.assets.count_documents({})
    expected = len(seed_data.ASSETS)
    if n != expected:
        log.info(f"Re-seeding assets ({n} -> {expected})…")
        await db.assets.delete_many({})
        await db.alerts.delete_many({})
        await db.logbook.delete_many({})
        await db.knowledge.delete_many({})
        await db.assets.insert_many(seed_data.build_assets())
        await db.alerts.insert_many(seed_data.build_alerts())
        await db.logbook.insert_many(seed_data.build_logbook())
        await db.knowledge.insert_many(seed_data.build_knowledge())


@app.on_event("startup")
async def on_start():
    await ensure_seed()


@app.on_event("shutdown")
async def on_stop():
    client.close()


# ---------- Helpers ----------
def _clean(doc):
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


async def _get_asset(asset_id: str):
    a = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Asset not found")
    return a


def _live_sensor_snapshot(asset_id: str):
    """Generate a fresh in-memory live snapshot to simulate streaming."""
    return seed_data.build_sensor_series(asset_id)


def _kpi_summary(assets, alerts):
    total = len(assets)
    healthy = sum(1 for a in assets if a["status"] == "healthy")
    warning = sum(1 for a in assets if a["status"] == "warning")
    critical = sum(1 for a in assets if a["status"] == "critical")
    open_alerts = sum(1 for x in alerts if not x.get("acknowledged"))
    crit_alerts = sum(1 for x in alerts
                      if x["severity"] == "critical" and not x.get("acknowledged"))
    avg_health = round(sum(a["health"] for a in assets) / max(total, 1), 1)
    return {
        "total_assets": total,
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
        "open_alerts": open_alerts,
        "critical_alerts": crit_alerts,
        "avg_health": avg_health,
        "mtbf_hours": 412,
        "uptime_pct": 96.8,
    }


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"service": "maintenance-wizard", "status": "ok"}


@api.get("/dashboard/overview")
async def overview():
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    alerts = await db.alerts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {
        "kpis": _kpi_summary(assets, alerts),
        "assets": assets,
        "recent_alerts": alerts[:5],
    }


@api.get("/assets")
async def list_assets():
    return await db.assets.find({}, {"_id": 0}).to_list(100)


@api.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    a = await _get_asset(asset_id)
    # Recent alerts & logs for this asset
    alerts = await db.alerts.find({"asset_id": asset_id}, {"_id": 0}) \
                            .sort("created_at", -1).to_list(20)
    logs = await db.logbook.find({"asset_id": asset_id}, {"_id": 0}) \
                           .sort("created_at", -1).to_list(20)
    docs = await db.knowledge.find({"asset_id": asset_id}, {"_id": 0}).to_list(20)
    return {
        "asset": a,
        "sensors": _live_sensor_snapshot(asset_id),
        "alerts": alerts,
        "logbook": logs,
        "knowledge": docs,
    }


@api.get("/assets/{asset_id}/sensors")
async def get_sensors(asset_id: str):
    await _get_asset(asset_id)
    return _live_sensor_snapshot(asset_id)


# --- Alerts ---
@api.get("/alerts")
async def list_alerts(severity: Optional[str] = None,
                      acknowledged: Optional[bool] = None):
    q = {}
    if severity:
        q["severity"] = severity
    if acknowledged is not None:
        q["acknowledged"] = acknowledged
    return await db.alerts.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/alerts/acknowledge")
async def ack_alert(body: AckAlertReq, x_role: Optional[str] = Header(None)):
    _check_role(x_role, "ack_alert")
    r = await db.alerts.update_one({"id": body.alert_id},
                                   {"$set": {"acknowledged": True}})
    if r.matched_count == 0:
        raise HTTPException(404, "Alert not found")
    return {"ok": True}


# --- Logbook ---
@api.get("/logbook")
async def list_logbook(asset_id: Optional[str] = None):
    q = {"asset_id": asset_id} if asset_id else {}
    return await db.logbook.find(q, {"_id": 0}).sort("created_at", -1).to_list(200)


@api.post("/logbook")
async def create_logbook(body: LogbookCreateReq):
    asset = await _get_asset(body.asset_id)
    entry = {
        "id": str(uuid.uuid4()),
        "asset_id": body.asset_id,
        "asset_name": asset["name"],
        "action": body.action,
        "duration_min": body.duration_min,
        "spares_used": body.spares_used,
        "notes": body.notes,
        "performed_by": body.performed_by,
        "created_at": datetime.now(UTC).isoformat(),
    }
    await db.logbook.insert_one(entry)
    return _clean(entry)


# --- Knowledge ---
@api.get("/knowledge")
async def list_knowledge(asset_id: Optional[str] = None, q: Optional[str] = None):
    query = {}
    if asset_id:
        query["asset_id"] = asset_id
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"content": {"$regex": q, "$options": "i"}},
        ]
    return await db.knowledge.find(query, {"_id": 0}).to_list(200)


# --- Risk matrix ---
@api.get("/risk-matrix")
async def risk_matrix():
    """Plot assets on a 3x3 severity x urgency matrix."""
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    alerts = await db.alerts.find({"acknowledged": False}, {"_id": 0}).to_list(100)
    alert_by_asset = {}
    for al in alerts:
        alert_by_asset.setdefault(al["asset_id"], []).append(al)

    points = []
    sev_map = {"critical": 3, "warning": 2, "healthy": 1}
    for a in assets:
        sev = sev_map[a["status"]]
        rul = a["rul_days"]
        urg = 3 if rul <= 15 else 2 if rul <= 60 else 1
        points.append({
            "asset_id": a["id"],
            "asset_name": a["name"],
            "code": a["code"],
            "severity": sev,
            "urgency": urg,
            "status": a["status"],
            "rul_days": rul,
            "open_alerts": len(alert_by_asset.get(a["id"], [])),
        })
    return {"points": points}


# --- Recommendations (rule-based + LLM-narrated) ---
@api.get("/recommendations/{asset_id}")
async def recs(asset_id: str):
    a = await _get_asset(asset_id)
    al = await db.alerts.find({"asset_id": asset_id, "acknowledged": False},
                              {"_id": 0}).to_list(20)
    plan = []
    if a["status"] == "critical":
        plan.append({
            "priority": "immediate",
            "title": "Stop equipment within next safe window",
            "detail": "Risk of catastrophic failure. Coordinate with production to "
                      "schedule emergency stoppage.",
            "eta_hours": 4,
        })
        plan.append({
            "priority": "immediate",
            "title": "Inspect primary failure suspect components",
            "detail": "Refer to SOP and historical breakdown patterns.",
            "eta_hours": 6,
        })
    elif a["status"] == "warning":
        plan.append({
            "priority": "short-term",
            "title": "Schedule inspection at next planned stoppage",
            "detail": "Trend is degrading; intervene within 7 days.",
            "eta_hours": 48,
        })
    else:
        plan.append({
            "priority": "monitor",
            "title": "Continue normal monitoring",
            "detail": "All indicators within nominal ranges.",
            "eta_hours": 168,
        })
    plan.append({
        "priority": "long-term",
        "title": "Update predictive model with new data",
        "detail": "Feed last 30 days of sensor data and recent alerts to refine RUL.",
        "eta_hours": 72,
    })
    return {"asset": a, "open_alerts": al, "plan": plan}


# --- Reports (structured for client-side PDF rendering) ---
@api.get("/reports/{asset_id}")
async def asset_report(asset_id: str):
    a = await _get_asset(asset_id)
    al = await db.alerts.find({"asset_id": asset_id}, {"_id": 0}) \
                        .sort("created_at", -1).to_list(50)
    lb = await db.logbook.find({"asset_id": asset_id}, {"_id": 0}) \
                         .sort("created_at", -1).to_list(50)
    return {
        "generated_at": datetime.now(UTC).isoformat(),
        "asset": a,
        "alerts": al,
        "logbook": lb,
        "summary": {
            "health_score": a["health"],
            "rul_days": a["rul_days"],
            "status": a["status"],
            "open_alerts": sum(1 for x in al if not x.get("acknowledged")),
        },
    }


# ---------- AI Wizard ----------
SYSTEM_PROMPT = (
    "You are MAESTRO, an expert maintenance engineer AI for steel manufacturing "
    "plants. You assist engineers with diagnosis, root-cause analysis, predictive "
    "maintenance, and step-by-step recommendations. \n\n"
    "RULES:\n"
    "1. Always be concise, structured, and use markdown.\n"
    "2. When suggesting actions, label them with priority: [IMMEDIATE], [SHORT-TERM], "
    "or [LONG-TERM].\n"
    "3. Cite the source (sensor reading, log code, manual section, SOP id) in "
    "parentheses after every claim. Example: (sensor:vibration RMS 11.2 mm/s), "
    "(SOP MD-12-INSP-07), (manual ABB AMA 800 §4.2).\n"
    "4. If a sensor value crosses an ISO 10816 / industry threshold, mention the "
    "zone explicitly.\n"
    "5. Never fabricate spare-part numbers — only use those given in context.\n"
    "6. End every diagnostic answer with a short 'Why this matters' line for the "
    "operator.\n"
)


async def _build_context_for_asset(asset_id: str) -> str:
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        return ""
    alerts = await db.alerts.find({"asset_id": asset_id}, {"_id": 0}) \
                            .sort("created_at", -1).to_list(10)
    docs = await db.knowledge.find({"asset_id": asset_id}, {"_id": 0}).to_list(10)
    logs = await db.logbook.find({"asset_id": asset_id}, {"_id": 0}) \
                           .sort("created_at", -1).to_list(5)
    sensors = _live_sensor_snapshot(asset_id)
    latest = {k: (v[-1]["v"] if v else None) for k, v in sensors.items()}

    ctx = [f"### ASSET CONTEXT\n{json.dumps(asset, indent=2)}"]
    ctx.append(f"### LATEST SENSOR READINGS\n{json.dumps(latest, indent=2)}")
    if alerts:
        ctx.append("### RECENT ALERTS\n" + json.dumps(alerts[:6], indent=2))
    if logs:
        ctx.append("### RECENT MAINTENANCE LOG\n" + json.dumps(logs, indent=2))
    if docs:
        ctx.append("### KNOWLEDGE EXCERPTS (manuals + SOPs)")
        for d in docs:
            ctx.append(f"- ({d['type'].upper()}) {d['title']}: {d['content']}")
    return "\n\n".join(ctx)


@api.post("/wizard/sessions")
async def start_session(body: ChatStartReq):
    sid = str(uuid.uuid4())
    doc = {
        "id": sid,
        "asset_id": body.asset_id,
        "title": body.title or "New diagnostic session",
        "created_at": datetime.now(UTC).isoformat(),
        "messages": [],
    }
    await db.sessions.insert_one(doc)
    return _clean(doc)


@api.get("/wizard/sessions")
async def list_sessions():
    return await db.sessions.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)


@api.get("/wizard/sessions/{sid}")
async def get_session(sid: str):
    s = await db.sessions.find_one({"id": sid}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Session not found")
    return s


def _provider_for(model: str):
    if model.startswith("claude"):
        return "anthropic"
    return "openai"


@api.post("/wizard/chat/stream")
async def chat_stream(body: ChatSendReq):
    session = await db.sessions.find_one({"id": body.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(404, "Session not found")

    asset_id = body.asset_id or session.get("asset_id")
    rag_ctx = await _build_context_for_asset(asset_id) if asset_id else ""
    sys_prompt = SYSTEM_PROMPT + ("\n\n" + rag_ctx if rag_ctx else "")

    user_msg = {
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": body.message,
        "model": body.model,
        "ts": datetime.now(UTC).isoformat(),
    }
    await db.sessions.update_one(
        {"id": body.session_id},
        {"$push": {"messages": user_msg}}
    )

    history = session.get("messages", [])
    convo = ""
    if history:
        convo = "\n\n### PRIOR CONVERSATION\n"
        for m in history[-20:]:
            role = "ENGINEER" if m["role"] == "user" else "MAESTRO"
            convo += f"\n[{role}] {m['content']}\n"

    final_prompt = sys_prompt + convo + f"\n\nENGINEER QUESTION:\n{body.message}"

    assistant_id = str(uuid.uuid4())
    collected = {"text": ""}

    def call_gemini():
        client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
            contents=final_prompt,
        )
        return response.text or ""

    def call_groq():
        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        completion = client.chat.completions.create(
            model=os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant"),
            messages=[
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": convo + "\n\n" + body.message},
            ],
        )
        return completion.choices[0].message.content or ""

    async def gen():
        try:
            if body.model.startswith("claude"):
                text = await asyncio.to_thread(call_gemini)
            else:
                text = await asyncio.to_thread(call_groq)

            collected["text"] = text
            yield f"data: {json.dumps({'type': 'delta', 'content': text})}\n\n"

        except Exception as e:
            log.exception("LLM error")
            err = f"\n\n_⚠️ Model error: {str(e)[:300]}_"
            collected["text"] = err
            yield f"data: {json.dumps({'type': 'delta', 'content': err})}\n\n"

        finally:
            asst_msg = {
                "id": assistant_id,
                "role": "assistant",
                "content": collected["text"],
                "model": body.model,
                "ts": datetime.now(UTC).isoformat(),
                "asset_id": asset_id,
            }
            await db.sessions.update_one(
                {"id": body.session_id},
                {"$push": {"messages": asst_msg}},
            )
            yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_id})}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api.post("/wizard/feedback")
async def feedback(body: FeedbackReq):
    fb = {
        "id": str(uuid.uuid4()),
        "session_id": body.session_id,
        "message_id": body.message_id,
        "rating": body.rating,
        "comment": body.comment or "",
        "created_at": datetime.now(UTC).isoformat(),
    }
    await db.feedback.insert_one(fb)
    return _clean(fb)


# --- Voice (STT + TTS) ---
@api.post("/voice/transcribe")
async def voice_transcribe(file: UploadFile = File(...)):
    try:
        data = await file.read()

        ext = (file.filename or "audio.webm").split(".")[-1].lower()
        if ext not in {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"}:
            ext = "webm"

        buf = io.BytesIO(data)
        buf.name = f"input.{ext}"

        client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        result = client.audio.transcriptions.create(
            file=buf,
            model="whisper-large-v3-turbo",
            response_format="json",
            language="en",
        )

        return {"text": result.text}

    except Exception as e:
        log.exception("STT error")
        raise HTTPException(500, f"transcription failed: {str(e)[:200]}")


class TTSReq(BaseModel):
    text: str
    voice: str = "onyx"


@api.post("/voice/speak")
async def voice_speak(body: TTSReq):
    try:
        text = body.text.strip()
        if not text:
            raise HTTPException(400, "Empty text")
        if len(text) > 4096:
            text = text[:4090] + "…"
        tts = OpenAITextToSpeech(api_key=EMERGENT_LLM_KEY)
        audio = await tts.generate_speech(
            text=text, model="tts-1", voice=body.voice, speed=1.05,
        )
        return Response(content=audio, media_type="audio/mpeg")
    except HTTPException:
        raise
    except Exception as e:
        log.exception("TTS error")
        raise HTTPException(500, f"speech generation failed: {str(e)[:200]}")


# --- Inventory (spare parts) ---
SPARE_PARTS = [
    {"id": "sp-brg-001", "category": "Centrifugal Pump", "name": "SKF 6316 Deep Groove Bearing",
     "part_no": "SP-BRG-001", "stock": 4, "min_stock": 2, "unit_cost": 450, "lead_days": 7},
    {"id": "sp-sel-001", "category": "Centrifugal Pump", "name": "Mechanical Seal Type A (65mm)",
     "part_no": "SP-SEL-001", "stock": 2, "min_stock": 3, "unit_cost": 1200, "lead_days": 14},
    {"id": "sp-imp-001", "category": "Centrifugal Pump", "name": "SS316 Impeller Assembly",
     "part_no": "SP-IMP-001", "stock": 1, "min_stock": 2, "unit_cost": 3500, "lead_days": 30},
    {"id": "sp-cpl-001", "category": "Centrifugal Pump", "name": "Coupling Spider Element",
     "part_no": "SP-CPL-001", "stock": 6, "min_stock": 2, "unit_cost": 180, "lead_days": 5},
    {"id": "sp-tpb-001", "category": "Turbo Blower", "name": "Tilting Pad Journal Bearing",
     "part_no": "SP-TPB-001", "stock": 1, "min_stock": 2, "unit_cost": 8500, "lead_days": 45},
    {"id": "sp-bld-001", "category": "Turbo Blower", "name": "Impeller Blade Set",
     "part_no": "SP-BLD-001", "stock": 0, "min_stock": 1, "unit_cost": 15000, "lead_days": 60},
    {"id": "sp-thb-001", "category": "Turbo Blower", "name": "Thrust Bearing Assembly",
     "part_no": "SP-THB-001", "stock": 1, "min_stock": 2, "unit_cost": 6200, "lead_days": 30},
    {"id": "sp-wnd-001", "category": "AC Motor (2000kW)", "name": "Stator Winding Coil Set",
     "part_no": "SP-WND-001", "stock": 0, "min_stock": 1, "unit_cost": 25000, "lead_days": 90},
    {"id": "sp-gpr-001", "category": "Helical Gearbox", "name": "Gear Pair Set (Module 12)",
     "part_no": "SP-GPR-001", "stock": 0, "min_stock": 1, "unit_cost": 18000, "lead_days": 75},
    {"id": "sp-hpb-001", "category": "Steam Turbine", "name": "HP Blade Row Assembly",
     "part_no": "SP-HPB-001", "stock": 0, "min_stock": 1, "unit_cost": 45000, "lead_days": 120},
    {"id": "sp-cb-001", "category": "Helical Gearbox", "name": "Carbide Bushing Pair",
     "part_no": "SP-CB-001", "stock": 3, "min_stock": 2, "unit_cost": 2200, "lead_days": 14},
    {"id": "sp-stf-001", "category": "Steam Turbine", "name": "Steam Stop Valve",
     "part_no": "SP-STF-001", "stock": 5, "min_stock": 2, "unit_cost": 7800, "lead_days": 21},
    {"id": "sp-mot-024", "category": "AC Motor (2000kW)", "name": "DE Bearing SKF 6324 C3",
     "part_no": "SP-MOT-024", "stock": 2, "min_stock": 2, "unit_cost": 3400, "lead_days": 14},
    {"id": "sp-conv-101", "category": "Centrifugal Pump", "name": "Wear Ring Set",
     "part_no": "SP-CONV-101", "stock": 8, "min_stock": 4, "unit_cost": 540, "lead_days": 10},
    {"id": "sp-tb-014", "category": "Turbo Blower", "name": "Labyrinth Seal",
     "part_no": "SP-TB-014", "stock": 4, "min_stock": 2, "unit_cost": 2800, "lead_days": 20},
    {"id": "sp-gx-088", "category": "Helical Gearbox", "name": "Sun Gear (Stage 2)",
     "part_no": "SP-GX-088", "stock": 1, "min_stock": 1, "unit_cost": 9500, "lead_days": 35},
    {"id": "sp-st-220", "category": "Steam Turbine", "name": "Governor Valve Spindle",
     "part_no": "SP-ST-220", "stock": 2, "min_stock": 1, "unit_cost": 6400, "lead_days": 28},
]


@api.get("/inventory")
async def inventory():
    onhand = sum(p["unit_cost"] * p["stock"] for p in SPARE_PARTS)
    oos = sum(1 for p in SPARE_PARTS if p["stock"] == 0)
    low = sum(1 for p in SPARE_PARTS if 0 < p["stock"] <= p["min_stock"])
    items = []
    for p in SPARE_PARTS:
        if p["stock"] == 0:
            level = "out"
        elif p["stock"] <= p["min_stock"]:
            level = "low"
        else:
            level = "ok"
        items.append({**p, "level": level})
    # Risk exposure: assets with health<60 + missing spare
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    risk_rows = []
    risky_assets = [a for a in assets if a["health"] < 60]
    # Map asset -> a critical spare from list (heuristic by category)
    cat_map = {
        "Rolling Mill": ("sp-gpr-001", "Mill Gearbox #1", "Rolling Mill"),
        "Motor": ("sp-mot-024", "Rolling Mill Drive Motor", "Roughing Mill"),
        "Conveyor": ("sp-conv-101", "Raw Material Conveyor Belt", "Conveyor"),
        "Hydraulic Pump": ("sp-imp-001", "Hot Blast Blower", "Hydraulic"),
        "Furnace": ("sp-hpb-001", "Steam Turbine Generator", "Power Plant"),
        "Cooling System": ("sp-cb-001", "Blast Furnace Cooling Pump #1", "Blast Furnace"),
        "Crane": ("sp-tb-014", "EOT Crane #1 (250T)", "Steel Melt"),
        "Gearbox": ("sp-gpr-001", "Mill Gearbox #1", "Finishing"),
    }
    for a in risky_assets[:5]:
        sp_id, alias, loc = cat_map.get(a["category"], ("sp-bld-001", a["name"], a["location"]))
        sp = next((p for p in SPARE_PARTS if p["id"] == sp_id), SPARE_PARTS[0])
        risk = sp["unit_cost"] + sp["lead_days"] * 10000
        risk_rows.append({
            "asset_id": a["id"], "asset_name": alias, "location": loc,
            "health": a["health"], "spare_name": sp["name"], "part_no": sp["part_no"],
            "spare_cost": sp["unit_cost"], "lead_days": sp["lead_days"], "risk_inr": risk,
        })
    total_risk = sum(r["risk_inr"] for r in risk_rows)
    return {
        "kpis": {
            "cataloged": len(SPARE_PARTS),
            "out_of_stock": oos,
            "low_stock": low,
            "on_hand_value": onhand,
            "risk_exposure": total_risk,
            "degraded_assets": len(risky_assets),
        },
        "items": items,
        "risk_rows": risk_rows,
    }


@api.post("/inventory/purchase/{part_id}")
async def purchase(part_id: str, x_role: Optional[str] = Header(None)):
    _check_role(x_role, "purchase")
    p = next((x for x in SPARE_PARTS if x["id"] == part_id), None)
    if not p:
        raise HTTPException(404, "Part not found")
    p["stock"] += max(1, p["min_stock"])
    po = {
        "id": str(uuid.uuid4()),
        "part_id": part_id,
        "part_name": p["name"],
        "qty": max(1, p["min_stock"]),
        "value": p["unit_cost"] * max(1, p["min_stock"]),
        "created_at": datetime.now(UTC).isoformat(),
        "status": "dispatched",
    }
    await db.purchase_orders.insert_one(po)
    return _clean(po)


# --- Scheduler (Gantt) ---
@api.get("/scheduler")
async def scheduler():
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    tasks = []
    day_map = {0: "MON", 1: "TUE", 2: "WED", 3: "THU", 4: "FRI", 5: "SAT", 6: "SUN"}
    # Assign tasks based on status & rul
    schedule_seed = [
        ("ast-mot-12", 0, "Emergency Bearings Swap & Shaft Realignment", "critical", 8),
        ("ast-conv-07", 0, "Belt Tracking & Roller Replacement", "critical", 6),
        ("ast-rmill-01", 1, "Hydraulic Gap Control Cylinder Service", "warning", 4),
        ("ast-hpump-04", 2, "Seal Kit Replacement (P/N 2207-K)", "warning", 4),
        ("ast-bfurn-02", 3, "Tuyere Cooling Inspection", "info", 3),
        ("ast-gbox-09", 4, "Oil Sampling & Tribology Test", "info", 2),
        ("ast-cooler-03", 5, "Coolant Line Flush", "info", 3),
        ("ast-crane-05", 6, "Hoist Cable Inspection", "info", 2),
    ]
    for asset_id, day, scope, priority, hrs in schedule_seed:
        a = next((x for x in assets if x["id"] == asset_id), None)
        if not a:
            continue
        tasks.append({
            "id": str(uuid.uuid4()),
            "asset_id": asset_id,
            "asset_name": a["name"],
            "code": a["code"],
            "location": a["location"],
            "day": day_map[day],
            "day_idx": day,
            "scope": scope,
            "priority": priority,
            "downtime_hours": hrs,
            "engineer": "H. Prasad (Senior Lead Specialist)",
            "spares_status": "in_stock" if priority != "critical" else "verified",
        })
    return {"tasks": tasks}


# --- Analytics ---
@api.get("/analytics")
async def analytics():
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    rows = []
    for a in assets:
        trend = "worsening" if a["health"] < 50 else ("stable" if a["health"] < 80 else "improving")
        # tiny synthetic bar series
        base = a["health"]
        bars = [max(5, min(100, base + random.randint(-12, 8))) for _ in range(7)]
        rows.append({
            "asset_id": a["id"], "asset_name": a["name"], "code": a["code"],
            "score": a["health"] // 10, "health": a["health"], "trend": trend, "bars": bars,
        })
    rows.sort(key=lambda r: -r["score"])
    cost = {
        "prevented_downtime_hours": 124,
        "avoided_losses_usd": 982000,
        "maintenance_cost_usd": 184000,
        "unplanned_per_hr": 10000,
        "avg_planned_cost": 2500,
        "roi_multiplier": round(982000 / max(184000, 1), 1),
    }
    return {"rows": rows, "cost": cost}


# --- Simulate a new alert (for demo) ---
@api.post("/simulate/anomaly")
async def simulate_anomaly():
    assets = await db.assets.find({}, {"_id": 0}).to_list(100)
    a = random.choice(assets)
    sev = random.choice(["warning", "critical", "info"])
    titles = {
        "critical": "Critical vibration spike detected",
        "warning": "Temperature trending above nominal",
        "info": "Process indicator drift observed",
    }
    alert = {
        "id": str(uuid.uuid4()),
        "asset_id": a["id"],
        "asset_name": a["name"],
        "severity": sev,
        "title": titles[sev],
        "message": f"Simulated event on {a['name']} for demo.",
        "created_at": datetime.now(UTC).isoformat(),
        "acknowledged": False,
        "evidence": ["sensor:auto", "log:simulated"],
    }
    await db.alerts.insert_one(alert)
    return _clean(alert)


@api.get("/auth/permissions")
async def get_permissions(x_role: Optional[str] = Header(None)):
    role = (x_role or "engineer").lower()
    if role not in ROLE_PERMISSIONS:
        role = "engineer"
    return {"role": role, "permissions": sorted(ROLE_PERMISSIONS[role])}


app.include_router(api)


# ---------- WebSocket: Live sensor stream ----------
@app.websocket("/api/ws/sensors/{asset_id}")
async def ws_sensors(websocket: WebSocket, asset_id: str):
    await websocket.accept()
    try:
        # Verify asset exists
        a = await db.assets.find_one({"id": asset_id}, {"_id": 0})
        if not a:
            await websocket.send_json({"type": "error", "msg": "asset_not_found"})
            await websocket.close()
            return
        await websocket.send_json({"type": "hello", "asset": a["code"]})
        # Stream a new tick every 2s using seed_data.live_tick for any asset
        from seed_data import live_tick  # noqa
        while True:
            await asyncio.sleep(2)
            payload = {"type": "tick", "t": datetime.now(UTC).isoformat(),
                       **live_tick(asset_id)}
            await websocket.send_json(payload)
    except WebSocketDisconnect:
        return
    except Exception as e:
        log.exception("WS error")
        try:
            await websocket.send_json({"type": "error", "msg": str(e)[:120]})
        except Exception:
            pass


# ---------- Role-aware action gating ----------
ROLE_PERMISSIONS = {
    "engineer":  {"ack_alert", "create_log", "view"},
    "supervisor": {"ack_alert", "create_log", "view", "dispatch", "purchase"},
    "admin":     {"ack_alert", "create_log", "view", "dispatch", "purchase", "expedite", "admin"},
}


def _check_role(x_role: Optional[str], required: str):
    role = (x_role or "engineer").lower()
    perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["engineer"])
    if required not in perms:
        raise HTTPException(403, f"role '{role}' lacks permission '{required}'")
    return role


@api.get("/auth/permissions")
async def get_permissions(x_role: Optional[str] = Header(None)):
    role = (x_role or "engineer").lower()
    if role not in ROLE_PERMISSIONS:
        role = "engineer"
    return {"role": role, "permissions": sorted(ROLE_PERMISSIONS[role])}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
FRONTEND_BUILD_DIR = ROOT_DIR.parent / "frontend" / "build"

if FRONTEND_BUILD_DIR.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_DIR / "static"), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index_file = FRONTEND_BUILD_DIR / "index.html"
        return FileResponse(index_file)
