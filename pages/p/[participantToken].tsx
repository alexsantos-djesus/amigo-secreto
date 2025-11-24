// pages/p/[participantToken].tsx
import { useRouter } from "next/router";
import useSWR from "swr";
import { useState } from "react";
import gsap from "gsap";
import Confetti from "../../components/Confetti";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ParticipantPage() {
  const router = useRouter();
  const { participantToken } = router.query;
  const { data, mutate } = useSWR(() => (participantToken ? `/api/p/${participantToken}` : null), fetcher, { revalidateOnFocus: false, refreshInterval: 5000 });
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // collect fields by id
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const payload: any = { participantToken };
    for (const [k, v] of fd.entries()) payload[k] = v;
    setSaving(true);
    const res = await fetch("/api/participants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    setSaving(false);
    if (res.ok) {
      gsap.from(".saved", { opacity: 0, y: -10, duration: 0.4 });
      mutate();
    } else {
      alert(j.error || "Erro");
    }
  }

  if (!data) return <main className="p-4">Carregando...</main>;
  // data can be { awaiting: true } or { result: {...} }
  if (data.drawDone && data.me && data.me.drawnTarget) {
    const target = data.me.drawnTarget;
    return (
      <main className="p-4 max-w-md mx-auto">
        <h2 className="text-xl font-bold">Você tirou:</h2>
        <div className="mt-4 p-4 border rounded bg-white">
          <div className="font-semibold">{target.name}</div>
          <div className="text-sm">{target.whatsapp}</div>
          <div className="mt-2 text-sm text-gray-700">
            {target.gift1 && <div>• {target.gift1}</div>}
            {target.gift2 && <div>• {target.gift2}</div>}
            {target.gift3 && <div>• {target.gift3}</div>}
          </div>
        </div>
        <div className="mt-4">
          <a className="inline-block py-3 px-4 rounded bg-green-600 text-white" href={`https://wa.me/${target.whatsapp}?text=${encodeURIComponent(`Oi! Você foi tirado no Amigo Secreto — boa sorte!`)}`} target="_blank" rel="noreferrer">Mandar WhatsApp</a>
        </div>
        <Confetti />
      </main>
    );
  }

  // before draw: registration form
  const me = data.me;
  return (
    <main className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Cadastro</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" defaultValue={me?.name || ""} placeholder="Seu nome" className="w-full p-3 border rounded" required />
        <input name="whatsapp" defaultValue={me?.whatsapp || ""} placeholder="+55..." className="w-full p-3 border rounded" required />
        <input name="gift1" defaultValue={me?.gift1 || ""} placeholder="Sugestão 1 (opcional)" className="w-full p-3 border rounded" />
        <input name="gift2" defaultValue={me?.gift2 || ""} placeholder="Sugestão 2 (opcional)" className="w-full p-3 border rounded" />
        <input name="gift3" defaultValue={me?.gift3 || ""} placeholder="Sugestão 3 (opcional)" className="w-full p-3 border rounded" />
        <button disabled={saving} className="w-full py-3 rounded bg-indigo-600 text-white">{saving ? "Salvando..." : "Salvar cadastro"}</button>
      </form>
      <div className="mt-4 text-sm text-gray-500">Aguardando mais participantes para o sorteio.</div>
    </main>
  );
}
