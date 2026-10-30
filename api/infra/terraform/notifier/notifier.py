"""Forward CloudWatch alarm SNS messages to a Discord webhook.

WH_URL points at the same internal-notification webhook the worker uses
(`send_internal_notification`), so DLQ depth and other ops alarms land
in the same channel as package processing notices.
"""
import json
import os
import urllib.request


def handler(event, context):
    wh_url = os.environ["WH_URL"]

    for record in event.get("Records", []):
        msg = json.loads(record["Sns"]["Message"])
        state = msg.get("NewStateValue", "UNKNOWN")
        embed = {
            "title": f"[{state}] {msg.get('AlarmName', 'unknown alarm')}",
            "description": msg.get("NewStateReason") or msg.get("AlarmDescription") or "",
            "color": 0xE74C3C if state == "ALARM" else 0x2ECC71 if state == "OK" else 0xF1C40F,
        }
        body = json.dumps({"embeds": [embed]}).encode()
        req = urllib.request.Request(
            wh_url,
            data=body,
            headers={"content-type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=10).read()
