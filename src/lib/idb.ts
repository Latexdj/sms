"use client";

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Interface mapping physical Database definitions natively 
 */
interface OfflineSMSDB extends DBSchema {
  attendance_queue: {
    key: string;
    value: {
      id: string; // Unique transient hash 
      student_id: string;
      date: string;
      status: string; // "PRESENT" | "ABSENT"
      marked_by: string; // teacher_id
      timestamp: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineSMSDB>> | null = null;

export const initOfflineDB = () => {
  if (typeof window === 'undefined') return null; // Avoid running on Server explicitly 

  if (!dbPromise) {
    dbPromise = openDB<OfflineSMSDB>('sms_offline_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('attendance_queue')) {
          db.createObjectStore('attendance_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

// Insert logical arrays handling tracking safely
export const saveOfflineAttendance = async (attendanceParams: Omit<OfflineSMSDB['attendance_queue']['value'], "id" | "timestamp">) => {
   const db = await initOfflineDB();
   if (!db) return;

   const id = crypto.randomUUID();
   const tx = db.transaction('attendance_queue', 'readwrite');
   
   await tx.store.put({
      id,
      timestamp: Date.now(),
      ...attendanceParams
   });
   
   await tx.done;
   return id;
};

// Retrieve mapping limits executing array bounds correctly natively
export const getAllOfflineAttendance = async () => {
   const db = await initOfflineDB();
   if (!db) return [];
   return await db.getAll('attendance_queue');
};

// Purge completely mapping structures correctly gracefully
export const clearOfflineAttendanceQueue = async () => {
   const db = await initOfflineDB();
   if (!db) return;
   const tx = db.transaction('attendance_queue', 'readwrite');
   await tx.store.clear();
   await tx.done;
};
