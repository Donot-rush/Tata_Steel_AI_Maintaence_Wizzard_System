"""Backend API tests for MAESTRO Steel Plant Maintenance Wizard."""
import os
import json
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://industry-build-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# -------- Dashboard / Assets --------
class TestDashboard:
    def test_overview(self, s):
        r = s.get(f"{API}/dashboard/overview", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "kpis" in d and "assets" in d and "recent_alerts" in d
        assert d["kpis"]["total_assets"] == 8
        assert len(d["assets"]) == 8
        assert len(d["recent_alerts"]) <= 5
        # KPI shape
        for k in ["healthy", "warning", "critical", "open_alerts", "avg_health"]:
            assert k in d["kpis"]

    def test_assets_list(self, s):
        r = s.get(f"{API}/assets", timeout=30)
        assert r.status_code == 200
        assets = r.json()
        assert len(assets) == 8
        for a in assets:
            assert {"id", "code", "name", "status", "health", "rul_days"}.issubset(a.keys())

    def test_get_asset_detail(self, s):
        r = s.get(f"{API}/assets/ast-mot-12", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["asset", "sensors", "alerts", "logbook", "knowledge"]:
            assert k in d
        for sk in ["vibration", "temperature", "pressure", "current"]:
            assert sk in d["sensors"]
        # vibration must have data points
        assert len(d["sensors"]["vibration"]) > 0
        assert "t" in d["sensors"]["vibration"][0] and "v" in d["sensors"]["vibration"][0]

    def test_get_asset_404(self, s):
        r = s.get(f"{API}/assets/does-not-exist", timeout=30)
        assert r.status_code == 404

    def test_asset_sensors(self, s):
        r = s.get(f"{API}/assets/ast-mot-12/sensors", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "vibration" in d and "temperature" in d


# -------- Alerts --------
class TestAlerts:
    def test_list_all(self, s):
        r = s.get(f"{API}/alerts", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filter_critical(self, s):
        r = s.get(f"{API}/alerts?severity=critical", timeout=30)
        assert r.status_code == 200
        for a in r.json():
            assert a["severity"] == "critical"

    def test_filter_warning(self, s):
        r = s.get(f"{API}/alerts?severity=warning", timeout=30)
        assert r.status_code == 200
        for a in r.json():
            assert a["severity"] == "warning"

    def test_filter_unack(self, s):
        r = s.get(f"{API}/alerts?acknowledged=false", timeout=30)
        assert r.status_code == 200
        for a in r.json():
            assert a["acknowledged"] is False

    def test_acknowledge_flow(self, s):
        unack = s.get(f"{API}/alerts?acknowledged=false", timeout=30).json()
        assert len(unack) > 0, "Need at least one unacknowledged alert"
        target_id = unack[0]["id"]
        r = s.post(f"{API}/alerts/acknowledge", json={"alert_id": target_id}, timeout=30)
        assert r.status_code == 200
        # verify
        remaining = s.get(f"{API}/alerts?acknowledged=false", timeout=30).json()
        assert all(a["id"] != target_id for a in remaining)

    def test_ack_404(self, s):
        r = s.post(f"{API}/alerts/acknowledge", json={"alert_id": "nope"}, timeout=30)
        assert r.status_code == 404


# -------- Logbook --------
class TestLogbook:
    def test_list_all(self, s):
        r = s.get(f"{API}/logbook", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 3

    def test_filter_by_asset(self, s):
        r = s.get(f"{API}/logbook?asset_id=ast-mot-12", timeout=30)
        assert r.status_code == 200
        for e in r.json():
            assert e["asset_id"] == "ast-mot-12"

    def test_create_entry(self, s):
        payload = {
            "asset_id": "ast-conv-07",
            "action": "TEST_Belt inspection",
            "duration_min": 30,
            "spares_used": ["Roller 12mm"],
            "notes": "Routine",
        }
        r = s.post(f"{API}/logbook", json=payload, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "id" in d and d["asset_name"] and d["created_at"]
        assert d["action"] == "TEST_Belt inspection"
        # verify persistence
        listing = s.get(f"{API}/logbook?asset_id=ast-conv-07", timeout=30).json()
        assert any(x["id"] == d["id"] for x in listing)


# -------- Knowledge --------
class TestKnowledge:
    def test_list(self, s):
        r = s.get(f"{API}/knowledge", timeout=30)
        assert r.status_code == 200
        assert len(r.json()) >= 7

    def test_filter_asset(self, s):
        r = s.get(f"{API}/knowledge?asset_id=ast-mot-12", timeout=30)
        assert r.status_code == 200
        for d in r.json():
            assert d["asset_id"] == "ast-mot-12"

    def test_search(self, s):
        r = s.get(f"{API}/knowledge?q=bearing", timeout=30)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 1
        for d in docs:
            assert "bearing" in (d["title"] + d["content"]).lower()


# -------- Risk / Recs / Reports --------
class TestRiskRecsReports:
    def test_risk_matrix(self, s):
        r = s.get(f"{API}/risk-matrix", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "points" in d and len(d["points"]) == 8
        for p in d["points"]:
            assert 1 <= p["severity"] <= 3
            assert 1 <= p["urgency"] <= 3
            assert "rul_days" in p and "status" in p and "asset_id" in p

    def test_recommendations(self, s):
        r = s.get(f"{API}/recommendations/ast-mot-12", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "asset" in d and "open_alerts" in d and "plan" in d
        assert len(d["plan"]) >= 1
        assert any(p["priority"] == "immediate" for p in d["plan"])  # mot-12 is critical

    def test_report(self, s):
        r = s.get(f"{API}/reports/ast-mot-12", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ["generated_at", "asset", "alerts", "logbook", "summary"]:
            assert k in d
        for k in ["health_score", "rul_days", "status", "open_alerts"]:
            assert k in d["summary"]


# -------- Wizard sessions + streaming --------
class TestWizard:
    SESSION_ID = None

    def test_create_session(self, s):
        r = s.post(f"{API}/wizard/sessions", json={"asset_id": "ast-mot-12", "title": "TEST_session"}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] and d["asset_id"] == "ast-mot-12"
        assert d["title"] == "TEST_session"
        assert d["messages"] == []
        TestWizard.SESSION_ID = d["id"]

    def test_list_sessions(self, s):
        r = s.get(f"{API}/wizard/sessions", timeout=30)
        assert r.status_code == 200
        assert any(x["id"] == TestWizard.SESSION_ID for x in r.json())

    def test_get_session(self, s):
        r = s.get(f"{API}/wizard/sessions/{TestWizard.SESSION_ID}", timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == TestWizard.SESSION_ID

    def _stream(self, s, model):
        payload = {
            "session_id": TestWizard.SESSION_ID,
            "message": "What is the current vibration reading?",
            "model": model,
            "asset_id": "ast-mot-12",
        }
        with s.post(f"{API}/wizard/chat/stream", json=payload, stream=True, timeout=120) as r:
            assert r.status_code == 200
            ctype = r.headers.get("content-type", "")
            assert "text/event-stream" in ctype, f"bad content-type: {ctype}"
            collected = ""
            done_msg_id = None
            saw_delta = False
            for raw in r.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data: "):
                    payload_json = raw[len("data: "):]
                    try:
                        ev = json.loads(payload_json)
                    except Exception:
                        continue
                    if ev.get("type") == "delta":
                        saw_delta = True
                        collected += ev.get("content", "")
                    elif ev.get("type") == "done":
                        done_msg_id = ev.get("message_id")
                        break
            assert saw_delta, "no delta events received"
            assert done_msg_id, "no done event received"
            return done_msg_id, collected

    def test_stream_claude(self, s):
        mid, txt = self._stream(s, "claude-sonnet-4-5-20250929")
        assert mid and (len(txt) > 0)
        # persistence
        time.sleep(0.5)
        sess = s.get(f"{API}/wizard/sessions/{TestWizard.SESSION_ID}", timeout=30).json()
        roles = [m["role"] for m in sess["messages"]]
        assert "user" in roles and "assistant" in roles
        TestWizard.LAST_MSG_ID = mid

    def test_stream_gpt(self, s):
        mid, txt = self._stream(s, "gpt-5.2")
        assert mid

    def test_feedback(self, s):
        mid = getattr(TestWizard, "LAST_MSG_ID", None)
        assert mid
        r = s.post(f"{API}/wizard/feedback", json={
            "session_id": TestWizard.SESSION_ID,
            "message_id": mid,
            "rating": "up",
            "comment": "helpful",
        }, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["rating"] == "up" and d["comment"] == "helpful"


# -------- Simulate --------
class TestSimulate:
    def test_simulate(self, s):
        r = s.post(f"{API}/simulate/anomaly", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["id"] and d["asset_id"] and d["severity"] in ["warning", "critical", "info"]
        # appears in list
        all_alerts = s.get(f"{API}/alerts", timeout=30).json()
        assert any(a["id"] == d["id"] for a in all_alerts)
