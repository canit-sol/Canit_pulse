with open("src/pages/AdminDashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "clients.map" in line or "client.id" in line or "canDeleteClient" in line or "Generate" in line or "Trash" in line or "Edit" in line or "Calendar" in line:
        print(f"Line {i+1}: {line.strip()}".encode('ascii', errors='replace').decode('ascii'))
        # print surrounding lines
        for idx in range(max(0, i-4), min(len(lines), i+30)):
            clean_line = f"  {idx+1}: {lines[idx]}".encode('ascii', errors='replace').decode('ascii')
            print(clean_line, end="")
        print("-" * 40)
