'use client';
import { Suspense, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  bio: string;
  whatsapp: string;
  etnia: string;
  cabelo: string;
  estatura: string;
  corpo: string;
  atende_homens: boolean;
  atende_mulheres: boolean;
  atende_casais: boolean;
  atende_deficientes: boolean;
  photos: string[];
}

interface Review {
  id: string;
  visitor_name: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
}

function ProfileDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [visitorName, setVisitorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const trackInteraction = async (
    interactionType: 'view' | 'whatsapp_click' | 'call_click' | 'telegram_click'
  ) => {
    if (!id) return;
    await supabase.from('profile_interactions').insert({
      profile_id: id,
      interaction_type: interactionType,
    });
  };

  useEffect(() => {
    if (id) {
      fetchProfileAndReviews();
      trackInteraction('view');
    }
  }, [id]);

  const fetchProfileAndReviews = async () => {
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (!profileError && profileData) {
      setProfile(profileData as unknown as Profile);
    }

    const { data: reviewsData } = await supabase
      .from('profile_reviews')
      .select('*')
      .eq('profile_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (reviewsData) {
      setReviews(reviewsData as Review[]);
    }

    setLoading(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);

    const { error } = await supabase.from('profile_reviews').insert({
      profile_id: id,
      visitor_name: visitorName.trim() || 'Cliente',
      rating: Number(rating),
      comment: comment.trim(),
      status: 'pending',
    });

    if (error) {
      alert('Erro ao enviar avaliação: ' + error.message);
    } else {
      alert('Avaliação enviada com sucesso! Ficará visível assim que for aprovada.');
      setVisitorName('');
      setComment('');
      setRating(5);
    }

    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs">
        A carregar perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 text-xs gap-4 p-4 text-center">
        <p>Perfil não encontrado ou desativado.</p>
        <Link href="/" className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-rose-600/25">
          Voltar à Vitrine
        </Link>
      </div>
    );
  }

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  return (
    <main className="min-h-screen bg-zinc-950 text-white pb-20">
      <header className="max-w-4xl mx-auto flex items-center justify-between px-4 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-600/30">
            360
          </div>
          <span className="text-base font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            MODELO<span className="text-rose-500 ml-1">360</span>
          </span>
        </Link>
        <Link href="/" className="text-xs text-zinc-400 hover:text-white transition">
          ← Voltar à vitrine
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-2 sm:px-4 py-6 space-y-6">
        <div className="w-full space-y-4">
          {profile.photos && profile.photos.length > 0 ? (
            profile.photos.map((url, idx) => (
              <div
                key={idx}
                className="w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl relative"
              >
                {url.includes('.mp4') || url.includes('.mov') ? (
                  <video src={url} className="w-full h-auto object-cover max-h-[600px]" controls muted />
                ) : (
                  <img src={url} alt={`Mídia ${idx + 1}`} className="w-full h-auto object-cover max-h-[600px]" />
                )}
                <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-zinc-300 border border-zinc-800">
                  {idx + 1} / {profile.photos.length}
                </span>
              </div>
            ))
          ) : (
            <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
                alt="Padrão"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{profile.artistic_name || 'Sem Nome'}</h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-lg font-bold">
                ⭐ {averageRating} ({totalReviews})
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              📍 {profile.neighborhood || 'Centro'} - {profile.city || 'São Paulo'}
            </p>
          </div>

          {profile.price && (
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-xs text-zinc-400">Preço Base</span>
              <span className="text-lg font-black text-emerald-400">R$ {profile.price} / h</span>
            </div>
          )}

          {profile.whatsapp && (
            <a
              href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(profile.artistic_name || '')},%20vi%20seu%20anúncio%20no%20Modelo360.`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackInteraction('whatsapp_click')}
              className="block w-full text-center rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/25"
            >
              💬 Contactar via WhatsApp
            </a>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h2 className="text-xs font-bold text-rose-500 uppercase tracking-wider">📋 Características</h2>
          <div className="flex flex-wrap gap-2">
            {profile.etnia && (
              <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">
                Etnia: <strong>{profile.etnia}</strong>
              </span>
            )}
            {profile.cabelo && (
              <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">
                Cabelo: <strong>{profile.cabelo}</strong>
              </span>
            )}
            {profile.estatura && (
              <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">
                Estatura: <strong>{profile.estatura}</strong>
              </span>
            )}
            {profile.corpo && (
              <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">
                Corpo: <strong>{profile.corpo}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
          <h2 className="text-xs font-bold text-rose-500 uppercase tracking-wider">✨ Atendimento a</h2>
          <div className="flex flex-wrap gap-1.5">
            {profile.atende_homens && <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">✓ Homens</span>}
            {profile.atende_mulheres && <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">✓ Mulheres</span>}
            {profile.atende_casais && <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">✓ Casais</span>}
            {profile.atende_deficientes && <span className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-3 py-1.5 rounded-xl">✓ Deficientes Físicos</span>}
          </div>
        </div>

        {profile.bio && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h2 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Sobre o Atendimento</h2>
            <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 pt-8 border-t border-zinc-800">
        <h2 className="text-lg font-bold mb-6">Avaliações Verificadas ({totalReviews})</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-zinc-500">Ainda não existem avaliações aprovadas para este perfil.</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{rev.visitor_name}</span>
                    <span className="text-xs text-amber-400">{'⭐'.repeat(rev.rating)}</span>
                  </div>
                  <p className="text-xs text-zinc-300">{rev.comment}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Deixe a sua avaliação</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Seu Nome / Apelido *</label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Ex: Carlos M."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Classificação (Estrelas) *</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Excelente)</option>
                  <option value={4}>⭐⭐⭐⭐ (Muito Bom)</option>
                  <option value={3}>⭐⭐⭐ (Bom)</option>
                  <option value={2}>⭐⭐ (Regular)</option>
                  <option value={1}>⭐ (Insatisfatório)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Comentário / Experiência *</label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte como foi o atendimento..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 py-3 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 shadow-lg shadow-rose-600/25"
              >
                {submittingReview ? 'A enviar...' : 'Enviar Avaliação para Moderação'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProfileDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs">
          A carregar perfil...
        </div>
      }
    >
      <ProfileDetailContent />
    </Suspense>
  );
}