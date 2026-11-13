import base64
import datetime as dt
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

AUTH = 'Basic ' + base64.b64encode(b'asesor:asesor-local-password').decode()

def request(port, path, method='GET', body=None, expected=200):
    req = urllib.request.Request(
        f'http://127.0.0.1:{port}{path}',
        data=json.dumps(body).encode() if body is not None else None,
        headers={'Authorization': AUTH, 'Content-Type': 'application/json'}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status, data = response.status, json.load(response)
    except urllib.error.HTTPError as error:
        status, data = error.code, json.load(error)
    assert status == expected, (method, path, status, data)
    return data.get('data', data)

def wait_for(check, label, seconds=100):
    deadline = time.time() + seconds
    last = None
    while time.time() < deadline:
        try:
            if check():
                print('OK:', label, flush=True)
                return
        except Exception as error:
            last = str(error)
        time.sleep(2)
    raise AssertionError(f'{label}: {last}')

for port in (8081, 8082):
    wait_for(lambda p=port: request(p, '/actuator/health')['status'] == 'UP', f'salud {port}')

for route in ('/acceso', '/agenda/franjas', '/ordenes'):
    with urllib.request.urlopen('http://127.0.0.1:4200' + route, timeout=10) as response:
        html = response.read().decode()
        assert '<app-root>' in html, route
print('OK: Nginx sirve rutas SPA directamente', flush=True)
assets = re.findall(r'(?:src|href)="([^" ]+\.js)"', html)
js = ''.join(urllib.request.urlopen('http://127.0.0.1:4200/' + name).read().decode() for name in assets)
assert 'http://localhost:8081' in js and 'http://localhost:8082' in js
assert '.up.railway.app' not in js
print('OK: ambiente Docker usa las APIs locales', flush=True)

order = request(8081, '/api/ordenes/crear', 'POST', {
    'cliente': {'nombre': 'QA Compose', 'documento': 'QA', 'telefono': '3000000000'},
    'vehiculo': {'placa': 'QA1234', 'marca': 'Prueba', 'modelo': '2026'},
    'descripcion': 'Prueba aislada de entrega'}, 201)['id']
version = 0
for state in ('EN_DIAGNOSTICO', 'EN_REPARACION', 'REPARADA'):
    request(8081, f'/api/ordenes/{order}/cambiar-estado', 'PATCH', {
        'estado': state, 'motivo': 'Verificacion Compose', 'version': version})
    version += 1
start = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=2)).replace(minute=0, second=0, microsecond=0)
slot = request(8082, '/api/franjas/crear', 'POST', {'inicio': start.isoformat(), 'cupo': 1}, 201)['id']
booking = request(8082, '/api/citas/agendar', 'POST', {'ordenId': order, 'franjaId': slot, 'tipo': 'ENTREGA'}, 201)['id']
query = urllib.parse.urlencode({'desde': start.isoformat(), 'hasta': (start + dt.timedelta(hours=1)).isoformat()})
assert request(8082, '/api/franjas/listar?' + query)['content'][0]['disponibles'] == 0
request(8081, f'/api/ordenes/{order}/cambiar-estado', 'PATCH', {
    'estado': 'CERRADA', 'motivo': 'Cierre desde Compose', 'version': version})
wait_for(lambda: request(8082, f'/api/citas/consultar/{booking}')['estado'] == 'CANCELADA', 'cancelacion automatica', 80)
cita = request(8082, f'/api/citas/consultar/{booking}')
assert cita['canceladaPor'] == 'sistema-cierre'
assert request(8082, '/api/franjas/listar?' + query)['content'][0]['disponibles'] == 1
notifications = lambda: request(8082, f'/api/notificaciones/listar?citaId={booking}')['content']
assert len(notifications()) == 1 and notifications()[0]['evento'] == 'AGENDADA'
wait_for(lambda: notifications()[0]['estado'] == 'SIMULADA', 'aviso de agendamiento procesado con LOG', 80)
assert len(notifications()) == 1
history = request(8081, f'/api/ordenes/{order}/historial')['content']
assert history[-1]['nuevo'] == 'CERRADA' and history[-1]['actor'] == 'asesor'
print('OK: cierre, cupo recuperado, auditoria y ausencia de aviso de cancelacion con MySQL real', flush=True)
