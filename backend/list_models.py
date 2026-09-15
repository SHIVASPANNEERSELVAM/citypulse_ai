from google import genai

key = None
with open('.env') as f:
    for line in f:
        if line.startswith('GEMINI_API_KEY'):
            key = line.split('=', 1)[1].strip().strip('"')

client = genai.Client(api_key=key)
for m in client.models.list():
    if 'flash' in m.name.lower() or 'gemini' in m.name.lower():
        print(m.name)
