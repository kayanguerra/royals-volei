"""Reduz fotos grandes em assets/gallery sem mudar nome nem formato.

Roda automaticamente pelo GitHub Actions quando alguém sobe foto nova.
Fotos acima de LIMITE_KB ou maiores que LADO_MAX px são reduzidas.
"""
import os
import sys
from PIL import Image, ImageOps

PASTA = "assets/gallery"
LADO_MAX = 1600
LIMITE_KB = 400
alteradas = []

for nome in sorted(os.listdir(PASTA)):
    caminho = os.path.join(PASTA, nome)
    ext = nome.lower().rsplit(".", 1)[-1]
    if ext not in ("jpg", "jpeg", "png", "webp"):
        continue
    tamanho_kb = os.path.getsize(caminho) / 1024
    with Image.open(caminho) as im:
        im = ImageOps.exif_transpose(im)  # corrige foto de celular "deitada"
        grande = max(im.size) > LADO_MAX
        if not grande and tamanho_kb <= LIMITE_KB:
            continue
        im.thumbnail((LADO_MAX, LADO_MAX), Image.LANCZOS)
        if ext in ("jpg", "jpeg"):
            im.convert("RGB").save(caminho, "JPEG", quality=82, optimize=True, progressive=True)
        elif ext == "webp":
            im.save(caminho, "WEBP", quality=80, method=6)
        else:
            im.save(caminho, "PNG", optimize=True)
    novo_kb = os.path.getsize(caminho) / 1024
    alteradas.append(f"{nome}: {tamanho_kb:.0f} KB -> {novo_kb:.0f} KB")

print("\n".join(alteradas) or "Nenhuma imagem precisou ser reduzida.")
sys.exit(0)
