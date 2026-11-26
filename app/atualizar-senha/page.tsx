'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export default function AtualizarSenhaPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (active && session) {
        setSessionReady(true);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || session)) {
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const validarSenha = (valor: string) => senhaForteRegex.test(valor);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionReady) {
      alert('Sessão inválida ou expirada. Solicite um novo link de recuperação em /login.');
      return;
    }

    if (!validarSenha(password)) {
      alert(
        'A nova senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula e um caractere especial.'
      );
      return;
    }

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      alert('Erro ao atualizar a senha: ' + error.message);
      return;
    }

    alert('Senha atualizada com sucesso!');
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-rose-600/30">
              360
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MODELO<span className="text-rose-500 ml-1">360</span>
            </span>
          </Link>
          <h1 className="text-sm font-bold text-zinc-300">Definir Nova Senha</h1>
          <p className="text-[11px] text-zinc-400">
            Mínimo de 8 caracteres com letra maiúscula, letra minúscula e caractere especial (ex.: @, #, !, $).
          </p>
          {!sessionReady && (
            <p className="text-[11px] text-amber-400">
              Validando link de recuperação... Se acessou direto sem o e-mail, peça o link em /login.
            </p>
          )}
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ex.: Senha@123"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="w-full rounded-xl bg-red-600 py-3.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </div>
    </main>
  );
}