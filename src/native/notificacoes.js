import { Capacitor } from '@capacitor/core';
import { recorrentesPendentes, parcelasPendentesNoMes, vencimentoEfetivo, dataVencimento, chaveMes } from '../core/calculos';

const nativo = () => Capacitor.isNativePlatform();

export async function pedirPermissao() {
  try {
    if (nativo()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.requestPermissions();
    } else if (typeof Notification !== 'undefined') {
      await Notification.requestPermission();
    }
  } catch (e) {}
}

export async function vibrar(forte = false) {
  try {
    if (nativo()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: forte ? ImpactStyle.Heavy : ImpactStyle.Medium });
    } else if (navigator.vibrate) {
      navigator.vibrate(forte ? [30, 20, 30] : 30);
    }
  } catch (e) {}
}

// Canal dedicado, importância máxima + vibração ativada.
// OBS: o plugin oficial do Capacitor não expõe um "padrão" de vibração customizado
// (isso exigiria código nativo Kotlin, fora do que dá pra injetar por resource).
// importance:5 + vibration:true já usa o padrão mais longo/insistente que o Android
// permite via canal — é o máximo alcançável sem escrever plugin nativo próprio.
async function garantirCanal() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.createChannel({
    id: 'vencimentos',
    name: 'Vencimentos e contas',
    description: 'Avisos de contas e parcelas perto do vencimento',
    importance: 5,
    sound: 'vencimento.ogg',
    visibility: 1,
    vibration: true,
  });
}

export async function testarNotificacao() {
  if (!nativo()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
    await garantirCanal();
    await LocalNotifications.schedule({
      notifications: [{
        id: 999999,
        title: '🔔 Teste — Copiloto Financeiro',
        body: 'Se você tá vendo (e ouvindo/sentindo) isso, tá tudo funcionando.',
        channelId: 'vencimentos',
        smallIcon: 'ic_stat_icon',
        schedule: { at: new Date(Date.now() + 2000) },
      }],
    });
    return true;
  } catch (e) { return false; }
}

export async function agendarLembretes({ recorrentes = [], parcelamentos = [], compromissos = [], ym = chaveMes() }) {
  if (!nativo()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();
    await garantirCanal();

    const pend = await LocalNotifications.getPending();
    if (pend.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    }

    const agora = new Date();
    const notifs = [];
    let id = 1;

    const contas = [
      ...recorrentesPendentes(recorrentes, ym).map((r) => ({
        id: `r${r.id}`, descricao: r.descricao, valor: Number(r.valor) || 0, data: vencimentoEfetivo(r, ym),
      })),
      ...parcelasPendentesNoMes(parcelamentos, ym).map((p) => ({
        id: `p${p.id}`,
        descricao: `${p.descricao} (${(Number(p.parcelasPagas) || 0) + 1}/${p.totalParcelas})`,
        valor: Number(p.valorParcela) || 0, data: dataVencimento(p.diaVencimento, ym),
      })),
    ];

    contas.forEach((c) => {
      const venc = new Date(c.data + 'T00:00:00');
      const dia = venc.getDate();
      const valorFmt = c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const d2 = new Date(venc); d2.setDate(d2.getDate() - 2); d2.setHours(9, 0, 0, 0);
      if (d2 > agora) notifs.push({ id: id++, title: `🔔 ${c.descricao} vence em 2 dias`, body: `${valorFmt} — dia ${dia}`, schedule: { at: d2 }, smallIcon: 'ic_stat_icon', channelId: 'vencimentos' });

      const d1 = new Date(venc); d1.setDate(d1.getDate() - 1); d1.setHours(9, 0, 0, 0);
      if (d1 > agora) notifs.push({ id: id++, title: `⚠️ ${c.descricao} vence amanhã`, body: `${valorFmt} — dia ${dia}`, schedule: { at: d1 }, smallIcon: 'ic_stat_icon', channelId: 'vencimentos' });

      [9, 18].forEach((h) => {
        const d0 = new Date(venc); d0.setHours(h, 0, 0, 0);
        if (d0 > agora) notifs.push({ id: id++, title: `🔴 ${c.descricao} vence hoje`, body: `${valorFmt} — já pagou? Marque no app`, schedule: { at: d0 }, smallIcon: 'ic_stat_icon', channelId: 'vencimentos' });
      });
    });

    compromissos.forEach((c) => {
      if (!c.data) return;
      const noDia = new Date(c.data + 'T09:00:00');
      if (c.hora) { const [hh, mm] = c.hora.split(':').map(Number); noDia.setHours(hh, mm, 0, 0); }
      const vespera = new Date(noDia.getTime() - 24 * 3600000);
      if (vespera > agora) notifs.push({ id: id++, title: `📌 Amanhã: ${c.titulo}`, body: c.hora ? `às ${c.hora}` : 'não esqueça', schedule: { at: vespera } });
      if (noDia > agora) notifs.push({ id: id++, title: `📌 Hoje: ${c.titulo}`, body: c.hora ? `às ${c.hora}` : '', schedule: { at: noDia } });
    });

    if (notifs.length) await LocalNotifications.schedule({ notifications: notifs });
  } catch (e) {}
}

// Status bar clara — ícones escuros, combina com o app agora claro.
export async function ajustarStatusBar() {
  if (!nativo()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#f6f7f8' });
  } catch (e) {}
}
