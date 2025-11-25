// pages/p/[participantToken].tsx
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import gsap from "gsap";
import Confetti from "../../components/Confetti";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function isPlaceholderName(name?: string) {
  if (!name) return true;
  const trimmed = name.trim();
  if (trimmed.length === 0) return true;
  const lower = trimmed.toLowerCase();
  return lower === "convidado" || lower === "convidado(a)" || lower === "guest";
}

export default function ParticipantPage() {
  const router = useRouter();
  const { participantToken } = router.query;
  const { data, mutate } = useSWR(
    () => (participantToken ? `/api/p/${participantToken}` : null),
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5000 }
  );

  const [saving, setSaving] = useState(false);
  const [disabledFields, setDisabledFields] = useState(false);

  // Toast & waiting screen state
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState("");
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);

  // gsap context
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {}, containerRef);
    return () => ctx.revert();
  }, []);

  // helper to show toast (green background, white text)
  function showToast(text: string, duration = 1700) {
    setToastText(text);
    setToastVisible(true);
    requestAnimationFrame(() => {
      if (toastRef.current) {
        // ensure styling (opaque green)
        toastRef.current.style.backgroundColor = "#16a34a";
        toastRef.current.style.color = "#ffffff";
        toastRef.current.style.opacity = "1";
        gsap.from(toastRef.current, { opacity: 0, y: -10, duration: 0.35 });
      }
    });
    if (duration > 0) {
      setTimeout(() => setToastVisible(false), duration);
    }
  }

  // If draw done and we have target -> show result
  if (data && data.drawDone && data.me && data.me.drawnTarget) {
    const target = data.me.drawnTarget;
    return (
      <main className="p-6 min-h-screen flex items-start justify-center bg-slate-50">
        <div className="w-full max-w-lg mt-12 p-6 bg-white rounded-2xl shadow-xl text-center">
          <h2 className="text-2xl font-extrabold mb-2">Seu amigo secreto</h2>
          <p className="text-sm text-gray-500 mb-6">
            Veja com carinho as informações abaixo — só você pode ver isto.
          </p>

          <div className="mx-auto p-6 bg-gradient-to-b from-white to-indigo-50 rounded-xl shadow-inner">
            <div className="text-lg font-semibold">{target.name}</div>
            <div className="text-sm text-slate-600 mt-1">{target.whatsapp}</div>

            <div className="mt-4 text-left text-sm text-gray-700">
              <div className="font-medium mb-1">Sugestões de presente</div>
              <ul className="list-disc list-inside">
                {target.gift1 ? (
                  <li>{target.gift1}</li>
                ) : (
                  <li className="text-gray-400 italic">Sem sugestão 1</li>
                )}
                {target.gift2 ? (
                  <li>{target.gift2}</li>
                ) : (
                  <li className="text-gray-400 italic">Sem sugestão 2</li>
                )}
                {target.gift3 ? (
                  <li>{target.gift3}</li>
                ) : (
                  <li className="text-gray-400 italic">Sem sugestão 3</li>
                )}
              </ul>
            </div>

            <div className="mt-6 flex justify-center gap-3">
              <a
                className="px-4 py-2 rounded bg-green-600 text-white shadow"
                href={`https://wa.me/${
                  target.whatsapp
                }?text=${encodeURIComponent(
                  `Oi! Você foi tirado no Amigo Secreto — boa sorte!`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Mandar WhatsApp
              </a>
              <button
                className="px-4 py-2 rounded bg-gray-100 text-gray-800"
                onClick={() => {
                  const url =
                    typeof window !== "undefined" ? window.location.href : "";
                  navigator.clipboard?.writeText(url);
                  showToast("Link copiado para a área de transferência", 1500);
                }}
              >
                Copiar link
              </button>
            </div>
          </div>

          <div className="mt-6">
            <Confetti />
          </div>
        </div>

        {toastVisible && (
          <div
            ref={toastRef}
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              top: 24,
              zIndex: 9999,
              opacity: 1,
            }}
            className="px-4 py-2 rounded shadow-lg max-w-xl text-sm"
            role="status"
          >
            {toastText}
          </div>
        )}
      </main>
    );
  }

  // Waiting screen (after successful register) — no edit button, show loader instead
  if (showWaitingScreen) {
    const name = data?.me?.name || "participante";
    return (
      <main className="p-6 min-h-screen flex items-start justify-center bg-slate-50">
        <div className="w-full max-w-md mt-12 p-6 bg-white rounded-2xl shadow-md text-center">
          <div className="mb-4 flex items-center justify-center">
            {/* loader icon */}
            <svg
              className="w-14 h-14 animate-spin text-indigo-600"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="rgba(99,102,241,0.15)"
                strokeWidth="6"
              />
              <path
                d="M45 25a20 20 0 0 1-20 20"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Você já está inscrito</h3>
          <p className="text-sm text-gray-700">
            Você já está inscrito como <strong>{name}</strong>. Aguarde o admin
            realizar o sorteio — o resultado aparecerá nesta mesma tela.
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Esta tela será atualizada automaticamente quando o sorteio for
            executado.
          </p>
        </div>

        {toastVisible && (
          <div
            ref={toastRef}
            style={{
              position: "fixed",
              left: "50%",
              transform: "translateX(-50%)",
              top: 24,
              zIndex: 9999,
              opacity: 1,
            }}
            className="px-4 py-2 rounded shadow-lg max-w-xl text-sm"
            role="status"
          >
            {toastText}
          </div>
        )}
      </main>
    );
  }

  // Default: registration form
  const me = data?.me;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const payload: Record<string, any> = { participantToken };
    for (const [k, v] of fd.entries()) payload[k] = v;

    setSaving(true);
    setDisabledFields(true);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // read raw text then try parse, so we can show error bodies that are not strict JSON
      const raw = await res.text();
      let body: any = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch (e) {
        body = { raw };
      }

      setSaving(false);

      if (!res.ok) {
        const errMsg =
          body?.error ||
          body?.message ||
          (body?.raw ? String(body.raw) : `Erro ${res.status}`);
        // show green toast (same style as error you liked)
        showToast(`Erro ao salvar: ${errMsg}`, 6000);
        setDisabledFields(false);
        return;
      }

      // success: show the full toast message requested
      const fullMsg = `Cadastro realizado com sucesso — você já está participando. Aguarde o admin realizar o sorteio; o resultado aparecerá nesta mesma tela.`;
      showToast(fullMsg, 1700);

      // refresh server data
      await mutate();

      // small delay so the user perceives the toast, then show waiting screen
      setTimeout(() => setShowWaitingScreen(true), 700);
    } catch (err: any) {
      console.error(err);
      setSaving(false);
      setDisabledFields(false);
      showToast("Erro de rede. Tente novamente.", 4000);
    }
  }

  return (
    <main className="p-6 max-w-md mx-auto" ref={containerRef}>
      {/* top-center toast */}
      {toastVisible && (
        <div
          ref={toastRef}
          style={{
            position: "fixed",
            left: "50%",
            transform: "translateX(-50%)",
            top: 20,
            zIndex: 9999,
            opacity: 1,
          }}
          className="px-4 py-2 rounded shadow-lg max-w-xl text-sm"
          role="status"
        >
          {toastText}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Cadastro</h2>

      {/* show persistent message only if real name exists and is not placeholder */}
      {!isPlaceholderName(me?.name) && me?.name && !data?.drawDone && (
        <div className="mb-3 p-3 bg-blue-50 border rounded text-sm text-slate-700">
          Você já está inscrito como <strong>{me.name}</strong>. Aguarde o admin
          realizar o sorteio — o resultado aparecerá nesta mesma tela.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
        aria-labelledby="cadastro-title"
      >
        <input
          name="name"
          defaultValue={isPlaceholderName(me?.name) ? "" : me?.name || ""}
          placeholder="Nome"
          className="w-full p-3 border rounded"
          required
          disabled={disabledFields}
        />
        <input
          name="whatsapp"
          defaultValue={me?.whatsapp || ""}
          placeholder="+55..."
          className="w-full p-3 border rounded"
          required
          disabled={disabledFields}
        />
        <input
          name="gift1"
          defaultValue={me?.gift1 || ""}
          placeholder="Sugestão 1 (opcional)"
          className="w-full p-3 border rounded"
          disabled={disabledFields}
        />
        <input
          name="gift2"
          defaultValue={me?.gift2 || ""}
          placeholder="Sugestão 2 (opcional)"
          className="w-full p-3 border rounded"
          disabled={disabledFields}
        />
        <input
          name="gift3"
          defaultValue={me?.gift3 || ""}
          placeholder="Sugestão 3 (opcional)"
          className="w-full p-3 border rounded"
          disabled={disabledFields}
        />
        <button
          disabled={saving || disabledFields}
          className={`w-full py-3 rounded text-white ${
            saving || disabledFields ? "bg-gray-400" : "bg-indigo-600"
          }`}
          type="submit"
          aria-busy={saving}
        >
          {saving ? "Salvando..." : "Salvar cadastro"}
        </button>
      </form>

      <div className="mt-4 text-sm text-gray-500">
        Aguardando mais participantes para o sorteio.
      </div>
    </main>
  );
}
