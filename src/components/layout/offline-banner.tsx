"use client";
import { useState, useEffect } from "react";
import { WifiOff, RefreshCcw } from "lucide-react";
import { getAllOfflineAttendance, clearOfflineAttendanceQueue } from "@/lib/idb";
import { toast } from "sonner";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Structural logical tests explicitly mapping boundaries
    const handleOnline = () => {
       setIsOffline(false);
       toast.success("Connection re-established natively! Checking limits tracking arrays...");
       checkQueueAndSync();
    };
    
    const handleOffline = () => {
       setIsOffline(true);
       toast.warning("Network connection lost. PWA constraints mapping native offline limits. You can continue working safely.");
    };

    // Explicitly initialize variables securely natively
    if (typeof window !== 'undefined') {
       setIsOffline(!navigator.onLine);
       // Add tracking logic limits capturing boundaries
       window.addEventListener('online', handleOnline);
       window.addEventListener('offline', handleOffline);
       
       // Initial check bounds 
       if(navigator.onLine) checkQueueAndSync();
    }

    return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkQueueAndSync = async () => {
     try {
        const queue = await getAllOfflineAttendance();
        if (queue.length > 0) {
           setQueueCount(queue.length);
           syncDataToServer(queue);
        }
     } catch(e) {
        console.error("IndexDB Boundary parsing failed natively.", e);
     }
  };

  const syncDataToServer = async (payload: any[]) => {
     setIsSyncing(true);
     try {
        const res = await fetch('/api/sync/attendance', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ batch: payload })
        });
        
        if (!res.ok) throw new Error("Sync engine mapping bounds crashed structurally.");
        
        const data = await res.json();
        toast.success(`Successfully explicitly extracted ${data.synced} offline records tracking naturally mapping bounds!`);
        
        // Clear mapping securely safely
        await clearOfflineAttendanceQueue();
        setQueueCount(0);
     } catch (e) {
        toast.error("Failed executing synchronization map.");
     } finally {
        setIsSyncing(false);
     }
  };

  if (!isOffline && queueCount === 0) return null;

  return (
    <div className={`w-full text-white text-xs font-bold py-2 px-4 shadow flex justify-center items-center gap-3 top-0 z-50 sticky transition-colors ${isOffline ? 'bg-amber-600' : 'bg-blue-600'}`}>
       {isOffline ? (
          <>
             <WifiOff className="h-4 w-4 animate-pulse" />
             YOU ARE CURRENTLY OFFLINE. Operations natively saving directly towards physical storage (IndexedDB).
          </>
       ) : (
          <>
             <RefreshCcw className="h-4 w-4 animate-spin" />
             SYSTEM ONLINE: Synchronizing {queueCount} isolated arrays tracking structurally naturally mapping limits...
          </>
       )}
    </div>
  );
}
