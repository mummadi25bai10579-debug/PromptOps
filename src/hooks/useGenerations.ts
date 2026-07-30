import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { GenerationJob } from '../types';

export const useGenerations = () => {
  const { user } = useAuthStore();
  const [generations, setGenerations] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'generations'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GenerationJob[];
        // Sort client-side
        results.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return timeB - timeA;
        });
        setGenerations(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching generations:', err);
        if (err.message.includes('Missing or insufficient permissions')) {
          setError('Permission denied. If you are using the preview URL, make sure it is added to your Firebase Authorized Domains.');
        } else {
          setError(err.message);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { generations, loading, error };
};
