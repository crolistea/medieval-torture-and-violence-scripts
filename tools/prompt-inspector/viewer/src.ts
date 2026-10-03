const input = document.querySelector<HTMLInputElement>("#file")!;
const out = document.querySelector<HTMLPreElement>("#out")!;

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) return;
  const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
  const records = lines.map((line) => JSON.parse(line));
  const messages = records.flatMap((r) => Array.isArray(r.messages) ? r.messages : []);
  const roles = new Map<string, number>();
  for (const message of messages) {
    const role = String(message.role ?? "unknown");
    roles.set(role, (roles.get(role) ?? 0) + 1);
  }
  out.textContent = JSON.stringify({
    records: records.length,
    messages: messages.length,
    roles: Object.fromEntries(roles)
  }, null, 2);
});
