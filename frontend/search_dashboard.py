with open("src/pages/AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "clients.map" in line or "client.id" in line or "canDeleteClient" in line or "Generate" in line:
        print(f"Line {i+1}: {line.strip()}")
        # print surrounding lines
        for idx in range(max(0, i-4), min(len(lines), i+20)):
            print(f"  {idx+1}: {lines[idx]}", end="")
        print("-" * 40)
