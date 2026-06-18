import requests

print("Testing Root URL:")
try:
    res = requests.get('https://healx-e1qe.onrender.com/')
    print(res.status_code)
    print(res.text[:200])
except Exception as e:
    print(e)

print("\nTesting Login Endpoint:")
try:
    res = requests.post('https://healx-e1qe.onrender.com/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrong'
    })
    print(res.status_code)
    print(res.text[:200])
    print("Headers:", res.headers)
except Exception as e:
    print(e)
