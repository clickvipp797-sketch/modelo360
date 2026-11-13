'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Proteção anti-robô

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isVerified) {
      alert('Por favor, confirme que não é um robô.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verificar na tabela de perfis se o WhatsApp confere com o e-mail fornecido
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('whatsapp_number', whatsapp)
        .single();

      if (profileError || !profileData) {
        alert('Os dados de confirmação (WhatsApp) não conferem com este e-mail.');
        setLoading(false);
        return;
      }

      // 2. Se os dados baterem certo, dispara o e-mail de recuperação seguro do Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });

      if (error) {
        alert('Erro ao enviar e-mail de recuperação: ' + error.message);
      } else {
        setEnviado(true);
      }
    } catch (err) {
      alert('Ocorreu um erro inesperado.');
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
          <h1 className="text-sm font-bold text-zinc-300">Recuperação Segura de Conta</h1>
        </div>

        {enviado ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center space-y-3">
            <p className="text-xs text-emerald-400 leading-relaxed">
              Identidade confirmada com sucesso! Enviámos um link de recuperação para o e-mail <strong>{email}</strong>.
            </p>
            <Link
              href="/login"
              className="inline-block w-full rounded-xl bg-zinc-800 py-3 text-xs font-bold text-white hover:bg-zinc-700 transition"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Para sua segurança, além do e-mail, precisamos que confirme o número de WhatsApp cadastrado na sua conta.
            </p>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">E-mail da Conta</label>
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
              <label className="block text-xs text-zinc-400 mb-1">Nº do WhatsApp Cadastrado (Confirmação)</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Ex: 11999999999"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-xs text-white focus:outline-none focus:border-red-600"
              />
            </div>

            {/* WIDGET DO NÃO SOU UM ROBÔ */}
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
              {loading ? 'A validar segurança...' : 'Verificar e Enviar Recuperação'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-zinc-800">
          <Link href="/login" className="text-xs text-zinc-500 hover:text-white transition">
            ← Voltar para o Login
          </Link>
        </div>
      </div>
    </main>
  );
}