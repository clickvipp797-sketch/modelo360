'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert('Por favor, confirme que não é um robô marcando a caixa de verificação.');
      return;
    }

    setLoading(true);

    if (modoCadastro) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert('Erro ao criar conta: ' + error.message);
        setLoading(false);
      } else if (data.session) {
        router.push('/anunciar');
      } else {
        alert('Conta criada! Verifique o seu e-mail para confirmar o cadastro ou tente fazer login.');
        setModoCadastro(false);
        setLoading(false);
      }
    } else {
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
      redirectTo: `${window.location.origin}/atualizar-senha`,
    });

    setSendingReset(false);

    if (error) {
      alert('Erro ao enviar e-mail de recuperação: ' + error.message);
    } else {
      alert('Enviámos um link de recuperação para o seu e-mail! Verifique a caixa de entrada ou spam.');
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* LOGO MODELO 360 */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-rose-600/30">
              360
            </div>
            <span className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MODELO<span className="text-rose-500 ml-1">360</span>
            </span>
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white">Minha conta</h1>
          </div>

          {/* Seletor de Aba */}
          <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setModoCadastro(false)}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                !modoCadastro 
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setModoCadastro(true)}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                modoCadastro 
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-white focus:outline-none focus:border-rose-600 placeholder:text-zinc-500"
              />
            </div>

            <div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3.5 text-xs text-white focus:outline-none focus:border-rose-600 placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400 select-none">
                <input
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-600 cursor-pointer"
                />
                Lembrar-me
              </label>

              {!modoCadastro && (
                <button
                  type="button"
                  onClick={handleRecuperarSenha}
                  disabled={sendingReset}
                  className="text-rose-500 hover:underline cursor-pointer disabled:opacity-50 font-medium"
                >
                  {sendingReset ? 'A enviar...' : 'Esqueceu sua senha?'}
                </button>
              )}
            </div>

            {/* WIDGET RECAPTCHA ESTILO CLÁSSICO (COM O LOGO E CAIXA DE CLIQUE) */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between shadow-inner">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-6 h-6 rounded-md accent-rose-600 cursor-pointer"
                />
                <span className="text-xs font-medium text-zinc-200">Não sou um robô</span>
              </label>

              <div className="flex flex-col items-center justify-center pl-2 border-l border-zinc-800/80">
                <svg className="w-6 h-6 text-rose-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[9px] font-bold text-zinc-500 tracking-tighter mt-0.5">reCAPTCHA</span>
                <span className="text-[7px] text-zinc-600">Privacy - Terms</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isVerified}
              className="w-full rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 py-3.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-600/25"
            >
              {loading
                ? 'A processar...'
                : modoCadastro
                ? 'Criar Conta'
                : 'Entrar'}
            </button>
          </form>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </main>
  );
}