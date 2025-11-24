// pages/index.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Amigo Secreto — Painel</h1>
        <p className="text-sm text-gray-600 mb-6">
          Crie um grupo ou acesse seu painel/admin ou link de participante.
        </p>
        <div className="space-y-3">
          <Link
            href="/create"
            className="block py-3 rounded bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-center"
          >
            Criar novo grupo
          </Link>
          <div className="text-xs text-gray-500">
            ou abra um painel admin pelo token em{" "}
            <code>/admin/[adminToken]</code>
          </div>
          <div className="text-xs text-gray-500">
            página de participante: <code>/p/[participantToken]</code>
          </div>
        </div>
      </div>
    </main>
  );
}
