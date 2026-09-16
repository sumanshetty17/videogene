export async function downloadProjectZip() {
  const res = await fetch("/reelmind-cinematic-studio.zip", { cache: "no-store" });
  if (!res.ok) throw new Error("zip missing");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reelmind-cinematic-studio.zip";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
