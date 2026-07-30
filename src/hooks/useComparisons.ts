import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Comparison, GenerationJob } from '../types';

export const useComparisons = () => {
  const { user } = useAuthStore();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setComparisons([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'comparisons'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, 
      async (snapshot) => {
        try {
          const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Comparison[];
          
          // Fetch referenced assets
          const enrichedResults = await Promise.all(results.map(async (comp) => {
             const [assetA, assetB] = await Promise.all([
               getDoc(doc(db, 'generations', comp.assetAId)).then(d => d.exists() ? {id: d.id, ...d.data()} as GenerationJob : undefined),
               getDoc(doc(db, 'generations', comp.assetBId)).then(d => d.exists() ? {id: d.id, ...d.data()} as GenerationJob : undefined)
             ]);
             return { ...comp, assetA, assetB };
          }));

          enrichedResults.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
            const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
            return timeB - timeA;
          });

          setComparisons(enrichedResults);
          setLoading(false);
        } catch (err: any) {
           setError(err.message);
           setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching comparisons:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { comparisons, loading, error };
};
