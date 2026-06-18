import requests

res = requests.post('http://127.0.0.1:5000/api/auth/login', json={
    'email': 'superadmin@healx.com',
    'password': 'superpassword'
})
token = res.json().get('token')
print("Login:", res.status_code)

headers = {'Authorization': f'Bearer {token}'}

# Test dashboard
r = requests.get('http://127.0.0.1:5000/api/superadmin/dashboard', headers=headers)
print("Dashboard:", r.status_code, r.json())

# Test get hospitals
r = requests.get('http://127.0.0.1:5000/api/superadmin/hospitals', headers=headers)
print("GET Hospitals:", r.status_code, "count:", len(r.json()) if r.ok else r.text)

# Test create hospital
r = requests.post('http://127.0.0.1:5000/api/superadmin/hospitals', headers=headers, json={
    "name": "KIIMS Bhubaneswar",
    "address": "Bhubaneswar, Odisha",
    "location": {"city": "Bhubaneswar", "state": "Odisha", "lat": 20.3533, "lng": 85.8156}
})
print("POST Hospital:", r.status_code, r.json().get('message'))

# Test get admins
r = requests.get('http://127.0.0.1:5000/api/superadmin/admins', headers=headers)
print("GET Admins:", r.status_code, "count:", len(r.json()) if r.ok else r.text)
