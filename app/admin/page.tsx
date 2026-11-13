'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  // Estados para o modal de edição de suporte
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      if (!adminData) {
        alert('Acesso negado: Esta área é restrita a administradores.');
        router.push('/');
        return;
      }

      setIsAdmin(true);
      fetchProfiles();
    };

    checkAdminAccess();
  }, [router]);

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data);
    }
    setLoading(false);
  };

  // Função para excluir/derrubar um usuário e o seu perfil
  const handleDerrubarUsuario = async (profileId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja derrubar/excluir este cadastro da plataforma? Esta ação é irreversível.')) {
      return;
    }

    try {
      // 1. Apaga o perfil da tabela public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) {
        alert('Erro ao apagar perfil: ' + profileError.message);
        return;
      }

      // 2. Se houver user_id vinculado, remove também dos logins de auth (se permitido pelas policies/função admin)
      if (userId) {
        // Nota: A exclusão direta de auth.users via cliente web exige permissão de service_role ou função RPC no Supabase.
        // Caso o banco bloqueie por segurança do client, o perfil público foi removido e o anúncio sumirá da vitrine imediatamente.
        console.log('Perfil removido com sucesso. User ID associado:', userId);
      }

      alert('Cadastro derrubado com sucesso!');
      fetchProfiles();
    } catch (err) {
      alert('Erro ao processar exclusão.');
    }
  };

  // Função para salvar alterações feitas pelo suporte técnico
  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          artistic_name: editingProfile.artistic_name,
          city: editingProfile.city,
          neighborhood: editingProfile.neighborhood,
          whatsapp: editingProfile.whatsapp,
          category: editingProfile.category,
          price: editingProfile.price,
          bio: editingProfile.bio,
        })
        .eq('id', editingProfile.id);

      if (error) {
        alert('Erro ao atualizar cadastro: ' + error.message);
      } else {
        alert('Cadastro atualizado com sucesso pelo suporte!');
        setEditingProfile(null);
        fetchProfiles();
      }
    } catch (err) {
      alert('Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-xs text-zinc-500">A carregar painel de suporte técnico...</p>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-xl font-black tracking-widest text-red-600">
              CLICK<span className="text-white">VIP</span> <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded ml-2">Suporte Técnico / Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-zinc-400 hover:text-white transition">
              Ver Site
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-xs text-red-500 hover:underline cursor-pointer"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Gestão de Anunciantes e Cadastros</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Total de perfis na base: {profiles.length}</p>
            </div>
            <button
              onClick={fetchProfiles}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              Atualizar Lista
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] text-zinc-400 uppercase">
                  <th className="py-3 px-4">Nome Artístico</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Ações de Suporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs">
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhuma anunciante cadastrada até o momento.
                    </td>
                  </tr>
                ) : (
                  profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 px-4 font-bold text-white">{p.artistic_name || 'Sem Nome'}</td>
                      <td className="py-3.5 px-4 text-zinc-300">{p.city} - {p.neighborhood}</td>
                      <td className="py-3.5 px-4 text-zinc-300">{p.whatsapp || 'Não informado'}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-[10px]">
                          {p.category || 'Acompanhantes'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingProfile(p)}
                          className="bg-zinc-800 text-blue-400 px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition cursor-pointer font-bold"
                        >
                          Arrumar Cadastro
                        </button>
                        <button
                          onClick={() => handleDerrubarUsuario(p.id, p.user_id)}
                          className="bg-red-950/60 text-red-400 border border-red-900 px-3 py-1.5 rounded-lg text-xs hover:bg-red-900 transition cursor-pointer font-bold"
                        >
                          Derrubar / Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL DE EDIÇÃO DE SUPORTE */}
        {editingProfile && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg space-y-6">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white">Editar Cadastro (Suporte Técnico)</h3>
                <button 
                  onClick={() => setEditingProfile(null)}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>

              <form onSubmit={handleSalvarEdicao} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Nome Artístico</label>
                    <input
                      type="text"
                      value={editingProfile.artistic_name || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, artistic_name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editingProfile.whatsapp || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, whatsapp: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editingProfile.city || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, city: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={editingProfile.neighborhood || ''}
                      onChange={(e) => setEditingProfile({ ...editingProfile, neighborhood: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Biografia / Descrição</label>
                  <textarea
                    rows={3}
                    value={editingProfile.bio || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, bio: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProfile(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? 'A guardar...' : 'Guardar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}