import urllib.request

try:
    f_res = urllib.request.urlopen("http://127.0.0.1:3000/", timeout=3)
    print("Frontend Port 3000 Status:", f_res.status)
except Exception as e:
    print("Frontend Port 3000 Error:", e)

try:
    b_res = urllib.request.urlopen("http://127.0.0.1:8000/api/decision/today", timeout=3)
    print("Backend API Port 8000 Status:", b_res.status)
except Exception as e:
    print("Backend API Port 8000 Error:", e)
