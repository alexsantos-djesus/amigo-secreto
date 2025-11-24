// pages/admin/[adminToken].tsx
import { useRouter } from "next/router";
import useSWR from "swr";
import { useEffect, useState } from "react";
import Confetti from "../../components/Confetti";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPanel() {
  const router = useRouter();
  const { adminToken } = router.query;
  const { data, error, mutate } = useSWR(() => (adminToken ? `/api/groups/${adminToken}` : null), fetcher, { refreshInterval: 5000 });

  const [loadingDraw, setLoadingDraw] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  async function sendLink(participantId: string) {
    const res = await fetch(`/api/groups/${adminToken}?action=send-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId })
    });
    const payload = await res.json();
    if (res.ok) {
      const url = payload.url;
      const msg = encodeURIComponent(`Você foi convidado para o Amigo Secreto do *${data.name}* — Cadastre-se aqui: ${url}`);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    } else {
      alert(payload.error || "Erro");
    }
  }

  async function sendAll() {
    const res = await fetch(`/api/groups/${adminToken}?action=send-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: "all" })
    });
    const payload = await res.json();
    if (res.ok) {
      // open WhatsApp messages for each? better show copy
      alert("Links gerados. Use o console.");
      console.log(payload.urls);
    } else {
      alert(payload.error || "Erro");
    }
  }

  async function doDraw() {
    if (!confirm("Deseja realmente executar o sorteio?")) return;
    setLoadingDraw(true);
    const res = await fetch(`/api/groups/${adminToken}?action=draw`, { method: "POST" });
    const payload = await res.json();
    setLoadingDraw(false);
    if (res.ok) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 6000);
      mutate();
    } else {
      alert(payload.error || "Erro");
    }
  }

  if (!data) return <main className="p-4">Carregando...</main>;
  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">{data.name}</h1>
      <div className="mb-4 text-sm">Status: {data.drawDone ? "Sorteado" : "Pendente"}</div>
      <div className="space-y-2">
        {data.participants.map((p: any) => (
          <div key={p.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">cadastro: {new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => sendLink(p.id)} className="px-2 py-1 rounded bg-green-500 text-white text-xs">Enviar WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={loadingDraw || data.drawDone} onClick={doDraw} className="flex-1 py-3 rounded bg-indigo-600 text-white">{loadingDraw ? "Sorteando..." : "Sortear"}</button>
        <button onClick={sendAll} className="py-3 px-3 rounded border">Enviar Todos</button>
      </div>
      {showConfetti && <Confetti />}
    </main>
  );
}
