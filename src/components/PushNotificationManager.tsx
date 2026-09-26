'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, BellRing } from 'lucide-react';

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  function urlB64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function subscribeToPush() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert("Devi concedere il permesso per le notifiche nelle impostazioni del tuo browser.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
        alert("Chiave VAPID pubblica mancante.");
        return;
      }

      const applicationServerKey = urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      
      setSubscription(sub);
      
      // Salva la subscription su Supabase
      const { error } = await supabase.from('push_subscriptions').insert({
        subscription: JSON.parse(JSON.stringify(sub))
      });
      
      if (error) {
        console.error('Errore nel salvataggio su Supabase:', error);
      } else {
        alert('Notifiche attivate con successo! 🎉');
      }
    } catch (error) {
      console.error('Errore iscrizione push:', error);
    }
  }

  if (!isSupported) return null;

  return (
    <div className="flex justify-center p-4">
      {!subscription ? (
        <button 
          onClick={subscribeToPush}
          className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 rounded-full text-sm font-semibold transition-colors"
        >
          <Bell className="w-4 h-4" />
          Attiva Notifiche Push
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-full text-sm font-semibold opacity-70">
          <BellRing className="w-4 h-4 text-green-500" />
          Notifiche Attive
        </div>
      )}
    </div>
  );
}
