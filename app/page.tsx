'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Profile {
  id: string;
  artistic_name: string;
  neighborhood: string;
  city: string;
  price: number;
  gender: string;
  category: string;
  photos: string[];
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros da vitrine
  const [selectedGender, setSelectedGender] = useState('Mulheres');
  const [selectedCategory, setSelectedCategory] = useState('Acompanhantes');

  useEffect(() => {
    fetchProfiles();
  }, [selectedGender, selectedCategory]);

  const fetchProfiles = async () => {
    setLoading(true);
    
    // Busca os perfis filtrando por gênero e categoria
    let query = supabase
      .from('profiles')
      .select('*');

    if (selectedGender) {
      query = query.eq('gender', selectedGender);
    }
    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as unknown as Profile[]);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-16">
      {/* CABEÇALHO DA VITRINE */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-4 py-6 border-b border-zinc-800">
        <Link href="/" className="text-xl font-black tracking-widest text-red-600">
          CLICK<span className="text-white">VIP</span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-xl text-xs font-bold transition text-zinc-300 hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/anunciar"
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/20 text-white"
          >
            Anunciar VIP
          </Link>
        </div>
      </header>

      {/* FILTROS DE GÊNERO E CATEGORIA */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {['Mulheres', 'Homens', 'Trans'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGender === g ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-4">
          {['Acompanhantes', 'Massagens', 'Videochamadas'].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === c ? 'text-red-500 font-bold border-b-2 border-red-600' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* VITRINE DE PERFIS */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-xs">A carregar anúncios...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-zinc-300">Nenhum anúncio encontrado nesta categoria.</p>
            <p className="text-xs text-zinc-500">Seja a primeira anunciante a destacar-se aqui!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((profile) => {
              const capaFoto = profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';

              return (
                <Link
                  key={profile.id}
                  href={`/perfil/${profile.id}`}
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-red-600 transition flex flex-col"
                >
                  <div className="aspect-[3/4] w-full bg-zinc-950 overflow-hidden relative">
                    <img
                      src={capaFoto}
                      alt={profile.artistic_name || 'Anunciante'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {profile.price && (
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-400">
                        R$ {profile.price} / h
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-xs font-bold text-white truncate">{profile.artistic_name || 'Sem Nome'}</h3>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        📍 {profile.neighborhood || 'Centro'} • {profile.city || 'São Paulo'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}