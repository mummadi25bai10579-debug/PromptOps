import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { Project } from '../types';

export const useProjects = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        
        results.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
          const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
          return timeB - timeA;
        });

        setProjects(results);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching projects:', err);
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

  return { projects, loading, error };
};
