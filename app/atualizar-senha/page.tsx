'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AtualizarSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      alert('Erro ao atualizar a senha: ' + error.message);
    } else {
      alert('Senha atualizada com sucesso!');
      router.push('/login');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-2xl font-black tracking-widest text-red-600">
            CLICK<span className="text-white">VIP</span>
          </Link>
          <h1 className="text-sm font-bold text-zinc-300">Definir Nova Palavra-passe</h1>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nova Palavra-passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-red-600 py-3.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {loading ? 'A atualizar...' : 'Guardar Nova Senha'}
          </button>
        </form>
      </div>
    </main>
  );
}