'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const router = useRouter();
  const [modoCadastro, setModoCadastro] = useState(false); // Alterna entre Login e Cadastro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert('Por favor, confirme que não é um robô.');
      return;
    }

    setLoading(true);

    if (modoCadastro) {
      // Fluxo de Criação de Conta Nova
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert('Erro ao criar conta: ' + error.message);
        setLoading(false);
      } else if (data.session) {
        // Se a confirmação de e-mail estiver desligada no Supabase, entra direto
        router.push('/anunciar');
      } else {
        alert('Conta criada! Verifique o seu e-mail para confirmar o cadastro ou tente fazer login.');
        setModoCadastro(false);
        setLoading(false);
      }
    } else {
      // Fluxo de Login Existente
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert('Erro ao fazer login: ' + error.message);
        setLoading(false);
      } else {
        router.push('/anunciar');
      }
    }
  };

  const handleRecuperarSenha = async () => {
    if (!email) {
      alert('Digite o seu e-mail no campo acima primeiro para receber o link.');
      return;
    }

    setSendingReset(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setSendingReset(false);

    if (error) {
      alert('Erro ao enviar e-mail de recuperação: ' + error.message);
    } else {
      alert('Enviámos um link de recuperação para o seu e-mail! Verifique a caixa de entrada ou spam.');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-2xl font-black tracking-widest text-red-600">
            CLICK<span className="text-white">VIP</span>
          </Link>
          <h1 className="text-sm font-bold text-zinc-300">
            {modoCadastro ? 'Criar Conta de Anunciante' : 'Aceder ao Painel da Anunciante'}
          </h1>
        </div>

        {/* Seletor de Aba: Entrar vs Criar Conta */}
        <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setModoCadastro(false)}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              !modoCadastro ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => setModoCadastro(true)}
            className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
              modoCadastro ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Quero me cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@email.com"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1">Palavra-passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
            />
          </div>

          {!modoCadastro && (
            <div className="flex justify-end text-xs">
              <button
                type="button"
                onClick={handleRecuperarSenha}
                disabled={sendingReset}
                className="text-red-500 hover:underline cursor-pointer disabled:opacity-50"
              >
                {sendingReset ? 'A enviar link...' : 'Esqueceu-se da palavra-passe?'}
              </button>
            </div>
          )}

          <div className="flex justify-center py-2">
            <Turnstile
              siteKey="1x00000000000000000000AA"
              onSuccess={() => setIsVerified(true)}
              options={{ theme: 'dark' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isVerified}
            className="w-full rounded-xl bg-red-600 py-3.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-600/20"
          >
            {loading
              ? 'A processar...'
              : modoCadastro
              ? 'Criar Conta e Continuar'
              : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800">
          <Link href="/" className="text-xs text-zinc-500 hover:text-white transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}