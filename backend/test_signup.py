import requests

res = requests.post('http://127.0.0.1:5000/api/auth/signup', json={
    'name': 'Test User',
    'email': 'testuser12345@healx.com',
    'password': 'password123',
    'gender': 'Male',
    'phone': '1234567890',
    'address': 'Test Address'
})
print(res.status_code)
print(res.text)
