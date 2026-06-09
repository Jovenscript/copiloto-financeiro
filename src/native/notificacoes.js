import { Capacitor } from '@capacitor/core';
import { recorrentesPendentes, vencimentoEfetivo, chaveMes } from '../core/calculos';

const nativo = () => Capacitor.isNativePlatform();

// Pede permissão (nativo: local notifications · web: Notification do navegador)
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

// Vibração tátil (nativo: Haptics · web: navigator.vibrate)
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

// Agenda notificações locais (só nativo). No web, usamos o sino + Google Agenda.
export async function agendarLembretes({ recorrentes = [], compromissos = [], ym = chaveMes() }) {
  if (!nativo()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.requestPermissions();

    // limpa as que já tínhamos agendado
    const pend = await LocalNotifications.getPending();
    if (pend.notifications?.length) {
      await LocalNotifications.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
    }

    const agora = new Date();
    const notifs = [];
    let id = 1;

    // CONTAS — escalonamento no dia do vencimento (09h e 18h)
    recorrentesPendentes(recorrentes, ym).forEach((r) => {
      const data = vencimentoEfetivo(r, ym);
      [9, 18].forEach((h) => {
        const at = new Date(data + 'T00:00:00'); at.setHours(h, 0, 0, 0);
        if (at > agora) notifs.push({
          id: id++, title: `💰 ${r.descricao} vence hoje`,
          body: `R$ ${Number(r.valor).toFixed(2)} — marque como pago no app`,
          schedule: { at }, smallIcon: 'ic_stat_icon',
        });
      });
    });

    // COMPROMISSOS — véspera e no dia
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

// Ajusta a status bar no nativo (tema escuro)
export async function ajustarStatusBar() {
  if (!nativo()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#14110e' });
  } catch (e) {}
}
