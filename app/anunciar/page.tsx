'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { applyWatermarkToFile } from '@/lib/watermark';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AnunciarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [formData, setFormData] = useState({
    artistic_name: '',
    neighborhood: '',
    city: 'São Paulo',
    category: 'Acompanhantes',
    gender: 'Mulheres',
    price: '',
    age: '',
    whatsapp: '',
    phone_call: false,
    telegram: false,
    atende_homens: false,
    atende_mulheres: false,
    atende_casais: false,
    atende_deficientes: false,
    verified_photos: false,
    visible_face: false,
    with_video: false,
    with_audio: false,
    etnia: 'Latinas',
    cabelo: 'Morenas',
    estatura: 'Altas',
    corpo: '',
    bio: '',
    photos: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [planoSelecionado, setPlanoSelecionado] = useState({
    id: 'mensal',
    title: 'Plano VIP Mensal',
    price: 50.00,
  });

  useEffect(() => {
    const loadUserDataAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileData && !error) {
        setProfileId(profileData.id);
        setFormData({
          artistic_name: profileData.artistic_name || '',
          neighborhood: profileData.neighborhood || '',
          city: profileData.city || 'São Paulo',
          category: profileData.category || 'Acompanhantes',
          gender: profileData.gender || 'Mulheres',
          price: profileData.price || '',
          age: profileData.age || '',
          whatsapp: profileData.whatsapp || '',
          phone_call: profileData.phone_call || false,
          telegram: profileData.telegram || false,
          atende_homens: profileData.atende_homens || false,
          atende_mulheres: profileData.atende_mulheres || false,
          atende_casais: profileData.atende_casais || false,
          atende_deficientes: profileData.atende_deficientes || false,
          verified_photos: profileData.verified_photos || false,
          visible_face: profileData.visible_face || false,
          with_video: profileData.with_video || false,
          with_audio: profileData.with_audio || false,
          etnia: profileData.etnia || 'Latinas',
          cabelo: profileData.cabelo || 'Morenas',
          estatura: profileData.estatura || 'Altas',
          corpo: profileData.corpo || '',
          bio: profileData.bio || '',
          photos: profileData.photos || [],
          latitude: profileData.latitude || null,
          longitude: profileData.longitude || null,
        });
      }

      setLoading(false);
    };

    loadUserDataAndProfile();
  }, [router]);

  // Função para detetar localização via GPS e Nominatim (OpenStreetMap)
  const handleDetectLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocalização não suportada pelo seu navegador.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const detectedCity = data.address.city || data.address.town || data.address.municipality || 'São Paulo';
            const detectedNeighborhood = data.address.suburb || data.address.neighbourhood || data.address.residential || '';

            setFormData(prev => ({
              ...prev,
              city: detectedCity,
              neighborhood: detectedNeighborhood || prev.neighborhood,
              latitude: lat,
              longitude: lon,
            }));
            alert('📍 Localização e coordenadas detectadas com sucesso!');
          }
        } catch (e) {
          alert('Não foi possível obter o endereço exato.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        alert('Permissão de localização negada ou indisponível.');
      },
      { timeout: 10000 }
    );
  };

  const getFileHash = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const hash = `${file.size}-${base64.substring(30, 80)}`;
        resolve(hash);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Erro ao comprimir imagem'));
            },
            'image/jpeg',
            0.75
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 15.5) {
          alert(`O vídeo "${file.name}" tem ${Math.round(video.duration)} segundos. O limite máximo é de 15 segundos!`);
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => resolve(false);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingMedia(true);
    const newPhotos = [...formData.photos];
    const codeText = `M360-${String(profileId || user.id).slice(0, 6).toUpperCase()}`;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith('video/');

      try {
        const fileHash = await getFileHash(file);
        const isAlreadyUploaded = newPhotos.some(
          url => url.includes(fileHash) || url.includes(file.name.replace(/\s+/g, '-'))
        );

        if (isAlreadyUploaded) {
          alert(`⚠️ A mídia "${file.name}" já está presente no seu perfil e foi rejeitada.`);
          continue;
        }

        if (isVideo) {
          const isValidDuration = await checkVideoDuration(file);
          if (!isValidDuration) continue;
        }

        let fileToUpload: Blob | File = file;
        let finalExt = file.name.split('.').pop() || 'bin';

        if (file.type.startsWith('image/')) {
          const compressedBlob = await compressImage(file);
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([compressedBlob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          fileToUpload = await applyWatermarkToFile(compressedFile, {
            brandText: 'MODEL360',
            codeText,
            quality: 0.88,
          });
          finalExt = 'jpg';
        }

        const fileName = `${user.id}-${fileHash}-${Date.now()}.${finalExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, fileToUpload);

        if (uploadError) {
          alert('Erro ao enviar ficheiro: ' + uploadError.message);
          continue;
        }

        const { data: publicUrlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
          newPhotos.push(publicUrlData.publicUrl);
        }
      } catch (err) {
        console.error('Erro ao processar arquivo:', err);
      }
    }

    setFormData({ ...formData, photos: newPhotos });
    setUploadingMedia(false);
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updatedPhotos = formData.photos.filter((_, index) => index !== indexToRemove);
    setFormData({ ...formData, photos: updatedPhotos });
  };

  const handleSalvarAnuncio = async (e: React.FormEvent) => {
    e.preventDefault();

    const uniquePhotos = Array.from(new Set(formData.photos));
    if (uniquePhotos.length !== formData.photos.length) {
      alert('⚠️ Foram detetadas mídias duplicadas. Por favor, remova as cópias.');
      setFormData({ ...formData, photos: uniquePhotos });
      return;
    }

    if (uniquePhotos.length < 5) {
      alert(`⚠️ Atenção: Precisa de enviar no mínimo 5 fotos ou vídeos únicos. Atualmente tem ${uniquePhotos.length}.`);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        user_id: user.id,
        artistic_name: formData.artistic_name,
        neighborhood: formData.neighborhood,
        city: formData.city,
        category: formData.category,
        gender: formData.gender,
        price: formData.price ? Number(formData.price) : null,
        age: formData.age ? Number(formData.age) : null,
        whatsapp: formData.whatsapp,
        phone_call: formData.phone_call,
        telegram: formData.telegram,
        atende_homens: formData.atende_homens,
        atende_mulheres: formData.atende_mulheres,
        atende_casais: formData.atende_casais,
        atende_deficientes: formData.atende_deficientes,
        verified_photos: formData.verified_photos,
        visible_face: formData.visible_face,
        with_video: formData.with_video,
        with_audio: formData.with_audio,
        etnia: formData.etnia,
        cabelo: formData.cabelo,
        estatura: formData.estatura,
        corpo: formData.corpo,
        bio: formData.bio,
        photos: uniquePhotos,
        latitude: formData.latitude,
        longitude: formData.longitude,
        last_seen_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' }).select().single();

      if (error) {
        alert('Erro ao guardar perfil: ' + error.message);
      } else {
        if (data) setProfileId(data.id);
        alert('✨ Perfil e mídias guardados com sucesso no Modelo 360!');
      }
    } catch (err) {
      alert('Erro de conexão com a base de dados.');
    } finally {
      setSaving(false);
    }
  };

  const handlePagarPlano = async () => {
    if (!formData.artistic_name.trim() || !profileId) {
      alert('⚠️ Preencha o Nome Artístico e guarde o perfil antes de pagar.');
      return;
    }
    if (formData.photos.length < 5) {
      alert('⚠️ É obrigatório ter pelo menos 5 fotos ou vídeos carregados.');
      return;
    }

    try {
      setPaying(true);
      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: planoSelecionado.title,
          price: planoSelecionado.price,
          profileId: profileId
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('Erro ao gerar link de pagamento: ' + (data.error || 'Erro desconhecido'));
        setPaying(false);
      }
    } catch (err) {
      alert('Erro de conexão com o servidor de pagamentos.');
      setPaying(false);
    }
  };

  const handleSimularPagamentoGratis = () => {
    if (!formData.artistic_name.trim() || !profileId) {
      alert('⚠️ Preencha o Nome Artístico e guarde o perfil antes de simular.');
      return;
    }
    if (formData.photos.length < 5) {
      alert('⚠️ É obrigatório ter pelo menos 5 fotos ou vídeos guardados.');
      return;
    }
    alert('🧪 [MODO DE TESTE] Pagamento simulado com sucesso no Modelo 360!');
    router.push('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-xs text-zinc-500">A carregar painel...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER MODELO 360 */}
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-md shadow-rose-600/30">
              360
            </div>
            <span className="text-base font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MODELO<span className="text-rose-500 ml-1">360</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400">{user?.email}</span>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/login');
              }}
              className="text-xs text-rose-500 hover:underline cursor-pointer"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-8 shadow-xl">
          <div>
            <h1 className="text-lg font-bold">Painel da Anunciante — Modelo 360</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Envie no mínimo 5 fotos ou vídeos únicos. Ative a geolocalização para os clientes encontrarem seu bairro com precisão.
            </p>
          </div>

          <form onSubmit={handleSalvarAnuncio} className="space-y-6 border-b border-zinc-800 pb-8">

            {/* GESTÃO DE FOTOS E VÍDEOS */}
            <div className="space-y-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Fotos e Vídeos (Mínimo 5 obrigatórios)</h2>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${formData.photos.length >= 5 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                  {formData.photos.length} / 5 enviados
                </span>
              </div>
              <p className="text-xs text-zinc-400">Pode carregar fotos ou vídeos curtos de até 15 segundos.</p>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {formData.photos.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    {url.includes('.mp4') || url.includes('.mov') || url.includes('video') ? (
                      <video src={url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={url} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center text-xs justify-center opacity-90 hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <label className="border-2 border-dashed border-zinc-800 hover:border-rose-600 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition bg-zinc-900/50">
                  <span className="text-2xl text-zinc-500">+</span>
                  <span className="text-[10px] text-zinc-400 mt-1 text-center px-1">{uploadingMedia ? 'A processar...' : 'Adicionar Mídia'}</span>
                  <input type="file" accept="image/*,video/*" multiple onChange={handleUploadMedia} className="hidden" disabled={uploadingMedia} />
                </label>
              </div>
            </div>

            {/* Informações Principais & Geolocalização */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Informações Principais & Localização</h2>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  📍 {detectingLocation ? 'Detectando GPS...' : 'Detectar minha localização atual'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Nome Artístico / Título *</label>
                  <input
                    type="text"
                    value={formData.artistic_name}
                    onChange={(e) => setFormData({ ...formData, artistic_name: e.target.value })}
                    placeholder="Ex: Fernanda Rocha"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bairro / Região *</label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    placeholder="Ex: Pinheiros"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Preço Base (R$)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Idade</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Meios de Contato</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="11999999999"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={formData.phone_call} onChange={(e) => setFormData({ ...formData, phone_call: e.target.checked })} className="accent-rose-600" /> Ligação
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={formData.telegram} onChange={(e) => setFormData({ ...formData, telegram: e.target.checked })} className="accent-rose-600" /> Telegram
                  </label>
                </div>
              </div>
            </div>

            {/* Atendimento a */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Atendimento a</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.atende_homens} onChange={(e) => setFormData({ ...formData, atende_homens: e.target.checked })} className="accent-rose-600" /> Homens
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.atende_mulheres} onChange={(e) => setFormData({ ...formData, atende_mulheres: e.target.checked })} className="accent-rose-600" /> Mulheres
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.atende_casais} onChange={(e) => setFormData({ ...formData, atende_casais: e.target.checked })} className="accent-rose-600" /> Casais
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.atende_deficientes} onChange={(e) => setFormData({ ...formData, atende_deficientes: e.target.checked })} className="accent-rose-600" /> Deficientes Físicos
                </label>
              </div>
            </div>

            {/* Selos & Aparência */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-rose-500 uppercase tracking-wider">Aparência e Selos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.verified_photos} onChange={(e) => setFormData({ ...formData, verified_photos: e.target.checked })} className="accent-rose-600" /> Fotos Verificadas
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.visible_face} onChange={(e) => setFormData({ ...formData, visible_face: e.target.checked })} className="accent-rose-600" /> Rosto Visível
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.with_video} onChange={(e) => setFormData({ ...formData, with_video: e.target.checked })} className="accent-rose-600" /> Com Vídeo
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 p-3 rounded-xl cursor-pointer">
                  <input type="checkbox" checked={formData.with_audio} onChange={(e) => setFormData({ ...formData, with_audio: e.target.checked })} className="accent-rose-600" /> Com Áudio
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Etnia</label>
                  <select value={formData.etnia} onChange={(e) => setFormData({ ...formData, etnia: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">
                    <option value="Brancas">Brancas</option>
                    <option value="Latinas">Latinas</option>
                    <option value="Mulatas">Mulatas</option>
                    <option value="Negras">Negras</option>
                    <option value="Orientais">Orientais</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Cabelo</label>
                  <select value={formData.cabelo} onChange={(e) => setFormData({ ...formData, cabelo: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">
                    <option value="Morenas">Morenas</option>
                    <option value="Loiras">Loiras</option>
                    <option value="Ruivas">Ruivas</option>
                    <option value="Pretos">Pretos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Estatura</label>
                  <select value={formData.estatura} onChange={(e) => setFormData({ ...formData, estatura: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white">
                    <option value="Altas">Altas</option>
                    <option value="Mignon">Mignon</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Biografia / Descrição Detalhada</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-rose-600"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-zinc-800 px-6 py-3 text-xs font-bold text-white hover:bg-zinc-700 transition cursor-pointer"
            >
              {saving ? 'A guardar...' : 'Guardar Informações e Mídias'}
            </button>
          </form>

          {/* Pagamento */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Ativação de Destaque (PIX e Cartão)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div onClick={() => setPlanoSelecionado({ id: 'semanal', title: 'Plano VIP Semanal', price: 20.00 })} className={`cursor-pointer border rounded-xl p-4 transition ${planoSelecionado.id === 'semanal' ? 'border-rose-600 bg-rose-950/20' : 'border-zinc-800 bg-zinc-950'}`}>
                <h3 className="text-xs font-bold text-zinc-400 uppercase">Semanal</h3>
                <p className="text-xl font-black text-white mt-2">R$ 20,00</p>
              </div>
              <div onClick={() => setPlanoSelecionado({ id: 'quinzenal', title: 'Plano VIP Quinzenal', price: 35.00 })} className={`cursor-pointer border rounded-xl p-4 transition ${planoSelecionado.id === 'quinzenal' ? 'border-rose-600 bg-rose-950/20' : 'border-zinc-800 bg-zinc-950'}`}>
                <h3 className="text-xs font-bold text-zinc-400 uppercase">Quinzenal</h3>
                <p className="text-xl font-black text-white mt-2">R$ 35,00</p>
              </div>
              <div onClick={() => setPlanoSelecionado({ id: 'mensal', title: 'Plano VIP Mensal', price: 50.00 })} className={`cursor-pointer border rounded-xl p-4 transition ${planoSelecionado.id === 'mensal' ? 'border-rose-600 bg-rose-950/20' : 'border-zinc-800 bg-zinc-950'}`}>
                <h3 className="text-xs font-bold text-zinc-400 uppercase">Mensal</h3>
                <p className="text-xl font-black text-white mt-2">R$ 50,00</p>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white">{planoSelecionado.title}</h3>
                  <p className="text-xs text-zinc-400">Ativação via Mercado Pago (PIX ou Cartão).</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-400">R$ {planoSelecionado.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <button
                onClick={handlePagarPlano}
                disabled={paying}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-600/20"
              >
                {paying ? 'A abrir checkout...' : `Pagar ${planoSelecionado.title} com PIX ou Cartão`}
              </button>

              <button
                type="button"
                onClick={handleSimularPagamentoGratis}
                className="w-full rounded-xl bg-zinc-800 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition cursor-pointer"
              >
                🧪 [TESTE LOCAL] Simular Pagamento Grátis (Ativar Perfil)
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}