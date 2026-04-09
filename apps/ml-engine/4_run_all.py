import subprocess
import sys
import time

def run_master_pipeline():
    print("=" * 50 + "\n SMARTBIZ AI PURE ML PIPELINE\n" + "=" * 50)
    t0 = time.time()

    for script in ["1_build_pipeline.py", "2_train_model.py", "3_test_model.py"]:
        print(f"\n[EXEC] {script}...")
        subprocess.run([sys.executable, script], check=True)

    print(f"\n COMPLETED IN {time.time() - t0:.1f}s. Check the 'test/' folder.")

if __name__ == "__main__":
    run_master_pipeline()