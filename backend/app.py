import json
import os
import threading
from flask import Flask, jsonify, request, send_from_directory

from planner import build_plan, tr

BASE = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(BASE, "..", "frontend")
DATA_FILE = os.path.join(BASE, "data.json")
lock = threading.Lock()

app = Flask(__name__, static_folder=FRONTEND, static_url_path="")


def load():
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.route("/api/plan", methods=["POST"])
def create_plan():
    body = request.get_json(silent=True) or {}
    lang = body.get("lang", "sr")
    plan, err = build_plan(
        body.get("subject"), body.get("exam_date"),
        body.get("hours_per_week"), lang,
    )
    if err:
        return jsonify({"error": err}), 400
    with lock:
        data = load()
        data[plan["id"]] = plan
        save(data)
    return jsonify(plan), 201


@app.route("/api/plan/<plan_id>", methods=["GET"])
def get_plan(plan_id):
    lang = request.args.get("lang", "sr")
    with lock:
        plan = load().get(plan_id)
    if not plan:
        return jsonify({"error": tr(lang, "err_notfound")}), 404
    return jsonify(plan)


@app.route("/api/plan/<plan_id>", methods=["DELETE"])
def delete_plan(plan_id):
    with lock:
        data = load()
        data.pop(plan_id, None)
        save(data)
    return jsonify({"ok": True})

@app.route("/api/plan/<plan_id>/finish", methods=["POST"])
def finish(plan_id):
    lang = request.args.get("lang", "sr")
    with lock:
        data = load()
        plan = data.get(plan_id)
        if not plan:
            return jsonify({"error": tr(lang, "err_notfound")}), 404
        plan["finished"] = not plan.get("finished", False)
        save(data)
    return jsonify(plan)

@app.route("/api/plan/<plan_id>/activity/<act_id>/toggle", methods=["POST"])
def toggle(plan_id, act_id):
    lang = request.args.get("lang", "sr")
    with lock:
        data = load()
        plan = data.get(plan_id)
        if not plan:
            return jsonify({"error": tr(lang, "err_notfound")}), 404
        for a in plan["activities"]:
            if a["id"] == act_id:
                a["done"] = not a["done"]
                save(data)
                return jsonify(plan)
    return jsonify({"error": tr(lang, "err_notfound")}), 404


if __name__ == "__main__":
    app.run(debug=True, port=5000)