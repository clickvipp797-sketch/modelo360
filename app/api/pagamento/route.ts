import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

export async function POST(request: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Token do Mercado Pago em falta.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: accessToken.trim() });
    const { title, price, profileId } = await request.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: String(profileId || 'ativacao-perfil'),
            title: String(title || 'Ativação de Perfil VIP'),
            quantity: 1,
            unit_price: Number(price || 50.00),
          },
        ],
        back_urls: {
          success: 'http://localhost:3000/anunciar?status=sucesso',
          failure: 'http://localhost:3000/anunciar?status=erro',
          pending: 'http://localhost:3000/anunciar?status=pendente',
        },
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error: any) {
    console.error("ERRO DETALHADO MERCADO PAGO:", error);
    return NextResponse.json({ error: error.message || 'Erro desconhecido' }, { status: 500 });
  }
}