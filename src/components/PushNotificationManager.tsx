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
      const vapidPublicKey = "BALaMVsvTLzWt3OESGQevk88tUvpNwEG6Ou20ssGg2mmnOauhPlbqmKCjIPF8wdD3vjzgxhdFtXl23S_9pUwWE8";

      const applicationServerKey = urlB64ToUint8Array(vapidPublicKey);
      
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
    <>
      {!subscription ? (
        <button 
          onClick={subscribeToPush}
          title="Attiva Notifiche Push"
          className="p-2 rounded-full bg-card hover:bg-card/80 border border-border text-primary transition-colors flex items-center justify-center animate-pulse"
        >
          <Bell className="w-5 h-5" />
        </button>
      ) : (
        <button 
          title="Notifiche Attive"
          disabled
          className="p-2 rounded-full bg-card/50 border border-border text-green-500 flex items-center justify-center opacity-70"
        >
          <BellRing className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
