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
  latitude?: number;
  longitude?: number;
  last_seen_at?: string;
}

export default function HomePage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [isAdultConfirmed, setIsAdultConfirmed] = useState(false);
  const [cookiesAccepted, setCookiesAccepted] = useState(true);

  const [selectedGender, setSelectedGender] = useState('Mulheres');
  const [selectedCategory, setSelectedCategory] = useState('Acompanhantes');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState<{ city: string; neighborhood: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user ?? null);
      }
    });

    const confirmedAdult = localStorage.getItem('modelo360_adult_confirmed');
    const acceptedCookies = localStorage.getItem('modelo360_cookies_accepted');

    if (confirmedAdult === 'true') {
      setIsAdultConfirmed(true);
      requestUserGeolocation();
    }
    if (acceptedCookies === 'true') {
      setCookiesAccepted(true);
    } else if (confirmedAdult === 'true') {
      setCookiesAccepted(false);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdultConfirmed) {
      fetchProfiles();
    }
  }, [selectedGender, selectedCategory, userCoords, isAdultConfirmed]);

  const handleConfirmAge = () => {
    localStorage.setItem('modelo360_adult_confirmed', 'true');
    setIsAdultConfirmed(true);
    setCookiesAccepted(false);
    requestUserGeolocation();
  };

  const handleAcceptCookies = () => {
    localStorage.setItem('modelo360_cookies_accepted', 'true');
    setCookiesAccepted(true);
  };

  const requestUserGeolocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserCoords({ lat, lon });

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
            const data = await res.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.municipality || 'São Paulo';
              const neighborhood = data.address.suburb || data.address.neighbourhood || data.address.residential || '';
              setUserLocationName({ city, neighborhood });
            }
          } catch (e) {
            console.error('Erro na geolocalização reversa', e);
          }
        },
        (error) => {
          console.warn('Geolocalização negada:', error.message);
        },
        { timeout: 10000 }
      );
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const fetchProfiles = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');

    if (selectedGender) query = query.eq('gender', selectedGender);
    if (selectedCategory) query = query.eq('category', selectedCategory);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (!error && data) {
      setProfiles(data as unknown as Profile[]);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-16 relative">

      {/* 1. MODAL 18+ */}
      {!isAdultConfirmed && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg shadow-rose-600/30">
              18+
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">Conteúdo Exclusivo para Maiores</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Este site contém material adulto. Você deve ter pelo menos 18 anos para continuar.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button
                onClick={handleConfirmAge}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Sim, tenho mais de 18 anos
              </button>
              <a
                href="https://www.google.com"
                className="block w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition text-center"
              >
                Não, sair
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 2. AVISO DE COOKIES */}
      {!cookiesAccepted && isAdultConfirmed && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-40 bg-zinc-900/95 border border-zinc-800 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-300 text-center sm:text-left leading-relaxed">
            🍪 Utilizamos cookies e geolocalização para calcular distâncias e sugerir perfis próximos a você.
          </div>
          <button
            onClick={handleAcceptCookies}
            className="whitespace-nowrap bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
          >
            Aceitar e Continuar
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-4 py-6 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-rose-600/30">
            360
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MODELO<span className="text-rose-500 ml-1">360</span>
            </span>
            {userLocationName && (
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wide flex items-center gap-1">
                📍 {userLocationName.neighborhood ? `${userLocationName.neighborhood}, ` : ''}{userLocationName.city}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-zinc-400 truncate max-w-[180px]">{user.email}</span>
              <Link href="/anunciar" className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2 rounded-xl text-xs font-bold transition text-white shadow-lg shadow-rose-600/25">
                Meu Painel
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                }}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-xl text-xs font-bold transition text-zinc-300 hover:text-white cursor-pointer"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-xl text-xs font-bold transition text-zinc-300 hover:text-white">
                Entrar
              </Link>
              <Link href="/anunciar" className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2 rounded-xl text-xs font-bold transition text-white shadow-lg shadow-rose-600/25">
                Anunciar 360
              </Link>
            </>
          )}
        </div>
      </header>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {['Mulheres', 'Homens', 'Trans'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGender === g ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/25' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
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
                selectedCategory === c ? 'text-rose-500 font-bold border-b-2 border-rose-600 bg-rose-500/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* VITRINE */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-xs">A carregar anúncios...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-zinc-300">Nenhum anúncio encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profiles.map((profile) => {
              const capaFoto = profile.photos?.[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600';

              const isOnline = profile.last_seen_at
                ? (new Date().getTime() - new Date(profile.last_seen_at).getTime()) < 5 * 60 * 1000
                : false;

              let distanciaKm = null;
              if (userCoords && profile.latitude && profile.longitude) {
                distanciaKm = calculateDistance(userCoords.lat, userCoords.lon, profile.latitude, profile.longitude);
              }

              return (
                <Link
                  key={profile.id}
                  href={`/perfil/${profile.id}`}
                  className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:border-rose-600 transition flex flex-col relative"
                >
                  <div className="aspect-[3/4] w-full bg-zinc-950 overflow-hidden relative">
                    <img
                      src={capaFoto}
                      alt={profile.artistic_name || 'Anunciante'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {isOnline && (
                      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white flex items-center gap-1 shadow-lg shadow-emerald-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span> ONLINE
                      </div>
                    )}

                    {profile.price && (
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-zinc-800">
                        R$ {profile.price} / h
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-xs font-bold text-white truncate">{profile.artistic_name || 'Sem Nome'}</h3>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5 flex items-center justify-between">
                        <span>📍 {profile.neighborhood || 'Centro'}</span>
                        {distanciaKm !== null && (
                          <span className="text-rose-400 font-semibold">{distanciaKm} km de você</span>
                        )}
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