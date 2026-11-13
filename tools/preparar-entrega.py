from pathlib import Path
import zipfile

frontend = Path(__file__).resolve().parents[1]
infra = frontend.parent / 'subocol-infra'
publicos = [
    'README.md', 'CONTEXTO.md', 'DECISIONES.md', 'VERIFICACION.md', 'PRUEBA_CIERRE.md',
    'RAILWAY.md', 'compose.yaml', '.gitignore', '.env.local.example',
    'Subocol.postman_collection.json', 'database/init/01-databases.sql',
    'database/railway/01-bootstrap.example.sql',
]
(frontend / 'entrega').mkdir(exist_ok=True)
with zipfile.ZipFile(frontend / 'entrega/subocol-infra.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in publicos:
        path = infra / name
        if not path.is_file():
            raise FileNotFoundError(path)
        archive.write(path, 'subocol-infra/' + name)
for name in ('CONTEXTO.md', 'DECISIONES.md', 'VERIFICACION.md', 'PRUEBA_CIERRE.md'):
    (frontend / name).write_bytes((infra / name).read_bytes())
print('Paquete de infraestructura regenerado con lista explicita de archivos publicos.')
