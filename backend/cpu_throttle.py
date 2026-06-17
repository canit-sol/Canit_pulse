import psutil
import time
import threading
import sys
import os
import signal

TARGET = int(sys.argv[1]) / 100 if len(sys.argv) > 1 else 0.90
INTERVAL = 0.1  # seconds
BUSY_FRAC = TARGET * 0.98  # slight undershoot to avoid overshoot

_stop = threading.Event()

def burner():
    while not _stop.is_set():
        t0 = time.perf_counter()
        while time.perf_counter() - t0 < BUSY_FRAC * INTERVAL:
            _ = 0
        time.sleep(INTERVAL * (1 - BUSY_FRAC))

def main():
    cpus = psutil.cpu_count(logical=True) or 1
    threads = cpus - 1 if cpus > 1 else 1
    print(f"[cpu_throttle] Targeting {TARGET*100:.0f}% CPU on {threads} of {cpus} cores")
    print(f"[cpu_throttle] Remaining capacity: ~{(1 - TARGET)*100:.0f}% per core (simulating 0.1 vCPU)")
    for _ in range(threads):
        t = threading.Thread(target=burner, daemon=True)
        t.start()
    try:
        _stop.wait()
    except KeyboardInterrupt:
        _stop.set()
        print("\n[cpu_throttle] Stopped")

if __name__ == "__main__":
    main()
