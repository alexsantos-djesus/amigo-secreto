// pages/create.tsx
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import gsap from "gsap";

type ParticipantLink = { token: string; url: string };

export default function CreatePage(): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adminParticipates, setAdminParticipates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [adminUrl, setAdminUrl] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [participantLinks, setParticipantLinks] = useState<ParticipantLink[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cardRef.current)
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 18,
        duration: 0.55,
        ease: "power3.out",
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Digite o nome do grupo");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), adminParticipates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar grupo");
      // set admin URL and groupId (API returns id)
      const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      setAdminUrl(data.adminUrl || `${base}/admin/${data.adminToken}`);
      setGroupId(data.id || null);

      if (formRef.current)
        gsap.to(formRef.current, { opacity: 0, y: -8, duration: 0.35 });
      gsap.fromTo(
        "#admin-card",
        { scale: 0.98, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1,0.6)" }
      );
    } catch (err: any) {
      setError(err.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    gsap.fromTo(
      "#copy-tip",
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.28, repeat: 1, yoyo: true }
    );
  }

  async function createParticipantLink() {
    if (!groupId)
      return alert("groupId não encontrado. Crie o grupo primeiro.");
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro criando link");
      const url =
        j.url ||
        `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/p/${
          j.participantToken
        }`;
      const entry = { token: j.participantToken, url };
      setParticipantLinks((s) => [entry, ...s]);
      gsap.fromTo(
        ".participant-row",
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 }
      );
    } catch (err: any) {
      alert(err.message || "Erro");
    }
  }

  function shareViaWhatsApp(url: string) {
    const text = `Você foi convidado para o Amigo Secreto — Cadastre-se aqui: ${url}`;
    const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      <div
        ref={cardRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 sm:p-8 border"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Criar Grupo — Amigo Secreto
            </h1>
          </div>
        </div>

        {!adminUrl ? (
          <form ref={formRef} onSubmit={handleCreate} className="space-y-5">
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700"
              >
                Nome do grupo
              </label>
              <input
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                placeholder="ex.: Amigo Secreto da Equipe"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  O admin vai participar?
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se sim, o admin só verá o próprio resultado após o sorteio.
                </p>
              </div>

              {/* Robust custom switch (keyboard accessible) */}
              <div className="flex items-center">
                <div
                  role="switch"
                  aria-checked={adminParticipates}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setAdminParticipates((v) => !v);
                      gsap.fromTo(
                        ".toggle-thumb",
                        { x: -4 },
                        { x: 0, duration: 0.18 }
                      );
                    }
                  }}
                  onClick={() => {
                    setAdminParticipates((v) => !v);
                    gsap.fromTo(
                      ".toggle-thumb",
                      { x: -4 },
                      { x: 0, duration: 0.18 }
                    );
                  }}
                  style={{
                    width: 64,
                    height: 36,
                    borderRadius: 999,
                    background: adminParticipates
                      ? "rgb(79, 70, 229)"
                      : "#e5e7eb",
                    position: "relative",
                    display: "inline-block",
                    cursor: "pointer",
                    outline: "none",
                    border: "none",
                    padding: 4,
                  }}
                  className="focus:outline-none"
                  aria-label="O admin vai participar?"
                >
                  <div
                    className="toggle-thumb"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: "#fff",
                      boxShadow: "0 2px 6px rgba(16,24,40,0.08)",
                      position: "absolute",
                      top: 4,
                      left: adminParticipates ? 32 : 4,
                      transition: "left 180ms cubic-bezier(.2,.8,.2,1)",
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="submit"
                disabled={loading}
                className="col-span-1 sm:col-span-2 inline-flex justify-center items-center py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow hover:brightness-105 disabled:opacity-60"
              >
                {loading ? "Criando..." : "Criar grupo"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setName("");
                  setAdminParticipates(true);
                }}
                className="col-span-1 inline-flex justify-center items-center py-3 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Ao criar, serão gerados links únicos para admin e participantes.
              Você poderá enviá-los por WhatsApp.
            </p>
          </form>
        ) : (
          <div
            id="admin-card"
            className="space-y-4 p-4 rounded-lg border border-dashed border-indigo-100 bg-indigo-50"
          >
            <div>
              <p className="text-sm text-gray-700">Painel do admin criado:</p>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <code className="break-all text-sm bg-white px-3 py-2 rounded-lg shadow-sm">
                  {adminUrl}
                </code>
                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => router.push(adminUrl!)}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                  >
                    Abrir painel
                  </button>
                  <button
                    onClick={() => copyToClipboard(adminUrl!)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <div
                id="copy-tip"
                className="invisible text-xs text-green-600 mt-2"
              >
                Link copiado!
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  Links de participantes
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={createParticipantLink}
                    className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                  >
                    Gerar link
                  </button>
                  <button
                    onClick={() => setParticipantLinks([])}
                    className="px-3 py-2 rounded border text-sm"
                  >
                    Limpar lista
                  </button>
                </div>
              </div>

              {participantLinks.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum link gerado ainda — clique em "Gerar link" para criar
                  um link único de participante.
                </p>
              ) : (
                <ul className="space-y-2">
                  {participantLinks.map((p) => (
                    <li
                      key={p.token}
                      className="participant-row flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <code className="break-all text-sm bg-gray-50 px-3 py-2 rounded">
                          {p.url}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(p.url)}
                          className="px-3 py-2 rounded border text-sm"
                        >
                          Copiar
                        </button>
                        <button
                          onClick={() => shareViaWhatsApp(p.url)}
                          className="px-3 py-2 rounded bg-green-600 text-white text-sm"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-4 rounded-lg bg-white border shadow-sm">
              <p className="text-sm text-gray-700 font-medium">
                Próximos passos
              </p>
              <ol className="mt-2 text-sm text-gray-600 list-decimal list-inside space-y-1">
                <li>Crie links para participantes e envie via WhatsApp.</li>
                <li>
                  Aguarde cadastros e depois execute o sorteio no painel do
                  admin.
                </li>
                <li>
                  Após o sorteio, cada participante verá apenas quem tirou —
                  nada mais.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
