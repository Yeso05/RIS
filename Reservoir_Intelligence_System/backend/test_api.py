import urllib.request
import json

url = "http://127.0.0.1:8000/api/simulation/assess"
payload = {
    "reservoir_level_m": 22.0,
    "inflow_cusecs": 2500,
    "rainfall_mm": 2.0,
    "electricity_demand_mw": 3400
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
data = json.loads(res.read().decode('utf-8'))
print("SCENARIO 2 (DROUGHT CONSERVATION) RESPONSE:")
print(json.dumps(data, indent=2))
