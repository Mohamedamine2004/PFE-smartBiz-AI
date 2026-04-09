"""
SEC Financial Data — Resumable Download
=====================================================
"""

import os, sys, time, zipfile, urllib.request, urllib.error

YOUR_NAME  = "Mohamed Lamine"
YOUR_EMAIL = "saidanemohamedamine72@gmail.com"

OUTPUT_DIR = "./sec_data_raw"
BASE_URL   = "https://www.sec.gov/files/dera/data/financial-statement-data-sets/{year}{quarter}.zip"
MAX_RETRIES = 20      # Augmenté à 20 puisque le téléchargement reprend là où il s'est arrêté
RETRY_WAIT  = 5       # Attente réduite à 5s

FILES = [
    ("2024", "q1"), ("2024", "q4"),
    ("2023", "q1"), ("2023", "q4"),
    ("2022", "q1"), ("2022", "q4"),
    ("2021", "q1"), ("2021", "q4"),
    ("2020", "q1"), ("2020", "q4"),
    ("2019", "q1"), ("2019", "q4"),
    ("2018", "q1"), ("2018", "q4"),
    ("2017", "q1"), ("2017", "q4"),
]

def download_with_retry(url, dest):
    """Téléchargement avec reprise automatique (HTTP Range)"""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            if attempt > 1:
                print(f"   🔄 Tentative {attempt}/{MAX_RETRIES} — Reprise dans {RETRY_WAIT}s...")
                time.sleep(RETRY_WAIT)

            headers = {
                "User-Agent": f"{YOUR_NAME} {YOUR_EMAIL}",
                "Accept": "application/zip, */*",
                "Connection": "keep-alive"
            }

            # Si le fichier existe déjà, on vérifie sa taille pour demander la suite
            initial_size = 0
            mode = "wb"
            if os.path.exists(dest):
                initial_size = os.path.getsize(dest)
                if initial_size > 0:
                    headers["Range"] = f"bytes={initial_size}-"
                    mode = "ab" # "ab" = Append Binary (Ajouter à la fin)

            req = urllib.request.Request(url, headers=headers)

            with urllib.request.urlopen(req, timeout=120) as r:
                status_code = r.getcode()
                
                if status_code == 206: # 206 = Partial Content (La reprise fonctionne)
                    remaining_size = int(r.headers.get("Content-Length", 0))
                    total_size = initial_size + remaining_size
                    print(f"   ⏯️  Reprise du téléchargement à partir de {initial_size/1048576:.1f} MB...")
                elif status_code == 200: # 200 = Le serveur refuse la reprise, on recommence
                    total_size = int(r.headers.get("Content-Length", 0))
                    initial_size = 0
                    mode = "wb"
                else:
                    print(f"   ⚠️  Statut HTTP inattendu: {status_code}")
                    continue

                done = initial_size
                start = time.time()

                with open(dest, mode) as f:
                    while True:
                        chunk = r.read(131072)   # 128KB chunks
                        if not chunk:
                            break
                        f.write(chunk)
                        done += len(chunk)

                        if total_size > 0:
                            pct = done / total_size * 100
                            bar = "█" * int(28 * pct / 100) + "░" * (28 - int(28 * pct / 100))
                            ela = time.time() - start
                            # La vitesse est calculée sur ce qu'on vient de télécharger
                            spd = (done - initial_size) / ela / 1048576 if ela > 0 else 0
                            sys.stdout.write(
                                f"\r   [{bar}] {pct:5.1f}%  "
                                f"{done/1048576:.1f}/{total_size/1048576:.1f} MB  "
                                f"{spd:.1f} MB/s  "
                            )
                            sys.stdout.flush()
                print()

            # Vérifier si on a bien tout le fichier
            final_size = os.path.getsize(dest)
            if total_size > 0 and final_size < total_size * 0.99:
                print(f"   ⚠️  Coupure à {final_size/1048576:.1f} MB. Le script va reprendre...")
                continue

            # Vérifier que le ZIP n'est pas corrompu
            try:
                with zipfile.ZipFile(dest, "r") as zf:
                    zf.testzip()
                print(f"   ✅ Téléchargé et vérifié ({final_size/1048576:.1f} MB)")
                return True
            except zipfile.BadZipFile:
                print(f"   ⚠️  Fichier ZIP corrompu. Suppression et redémarrage à zéro...")
                os.remove(dest)
                continue

        except urllib.error.HTTPError as e:
            # Erreur 416 : Le fichier est probablement déjà entier mais mal vérifié
            if e.code == 416:
                print("   ⚠️  Erreur 416. Suppression du fichier pour recommencer propre...")
                if os.path.exists(dest): os.remove(dest)
                continue
            print(f"\n   ❌ HTTP {e.code}: {e.reason}")
            if e.code in (403, 404):
                return False
        except Exception as e:
            print(f"\n   ⚠️  Coupure réseau : {e}")

    print(f"   ❌ Échec après {MAX_RETRIES} tentatives.")
    return False

def process(year, quarter):
    folder   = os.path.join(OUTPUT_DIR, f"{year}_{quarter}")
    zip_path = os.path.join(OUTPUT_DIR, f"{year}{quarter}.zip")
    done_mrk = os.path.join(folder, ".done")

    if os.path.exists(done_mrk):
        print(f"   ✅ Déjà extrait — passage au suivant")
        return True

    os.makedirs(folder, exist_ok=True)
    url = BASE_URL.format(year=year, quarter=quarter)
    print(f"   🔗 {url}")

    if not download_with_retry(url, zip_path):
        return False

    print(f"   📂 Extraction...")
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(folder)
            for name in zf.namelist():
                fp = os.path.join(folder, name)
                sz = os.path.getsize(fp) / 1048576
                print(f"      ✅ {name:<15} {sz:.1f} MB")
    except zipfile.BadZipFile:
        print(f"   ❌ ZIP corrompu lors de l'extraction.")
        os.remove(zip_path)
        return False
    except Exception as e:
        print(f"   ❌ Erreur d'extraction: {e}")
        if os.path.exists(zip_path): os.remove(zip_path)
        return False

    os.remove(zip_path)
    open(done_mrk, "w").close()
    return True

def main():
    print("=" * 55)
    print("   SEC Financial Data — Resumable Downloader")
    print("=" * 55 + "\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    ok, failed = 0, []

    for i, (year, quarter) in enumerate(FILES, 1):
        print(f"\n[{i}/{len(FILES)}] {year} {quarter.upper()}")
        if process(year, quarter):
            ok += 1
        else:
            failed.append(f"{year} {quarter.upper()}")

    if failed:
        print(f"\n   ❌ Échecs : {len(failed)} fichiers.")
    else:
        print("\n   🎉 Tout est prêt ! Vous pouvez lancer build_pipeline_production.py")

if __name__ == "__main__":
    main()