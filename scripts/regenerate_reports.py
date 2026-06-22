import requests
import sys
import time

API_BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "report@canit.in"
ADMIN_PASSWORD = "canit#123"
MONTH = "May"
YEAR = "2026"


def login():
    resp = requests.post(f"{API_BASE_URL}/api/auth/login", json={
        "identifier": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    })
    resp.raise_for_status()
    data = resp.json()
    print(f"Logged in as {data['name']} ({data['role']})")
    return data["access_token"]


def get_clients(token):
    resp = requests.get(f"{API_BASE_URL}/api/clients", headers={
        "Authorization": f"Bearer {token}",
    })
    resp.raise_for_status()
    return resp.json()


def generate_report(token, client_id, client_name):
    resp = requests.post(f"{API_BASE_URL}/api/reports/generate", json={
        "client_id": client_id,
        "month": MONTH,
        "year": YEAR,
    }, headers={
        "Authorization": f"Bearer {token}",
    })
    return resp


def main():
    token = login()
    clients = get_clients(token)
    print(f"Found {len(clients)} client(s)")

    success = 0
    failed = 0

    for client in clients:
        cid = client["id"]
        cname = client["name"]
        print(f"\n[{success + failed + 1}/{len(clients)}] Generating report for {cname} ({cid})...", end=" ")

        try:
            resp = generate_report(token, cid, cname)
            if resp.ok:
                print("OK")
                success += 1
            else:
                detail = resp.json().get("detail", resp.text)
                print(f"FAILED: {detail}")
                failed += 1
        except requests.RequestException as e:
            print(f"ERROR: {e}")
            failed += 1

        time.sleep(0.5)

    print(f"\nDone. {success} succeeded, {failed} failed")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        API_BASE_URL = sys.argv[1]
    main()
