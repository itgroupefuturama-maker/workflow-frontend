// hooks/useLastComment.ts
import { useState, useEffect } from 'react';
import axios from '../service/Axios'; // adapte le chemin

interface LastComment {
  commentaire: string;
  alerte: string;
  dateEnregistrement: string;
}

export function useLastComment(fournisseurId: string) {
  const [lastComment, setLastComment] = useState<LastComment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fournisseurId) {
      setLastComment(null);
      return;
    }

    let cancelled = false; // évite les race conditions

    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/commentaires-fournisseur/fournisseur/${fournisseurId}/last`
        );
        if (cancelled) return;

        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          setLastComment({
            commentaire: d.commentaire || '—',
            alerte: d.alerte || 'INCONNU',
            dateEnregistrement: d.dateEnregistrement
              ? new Date(d.dateEnregistrement).toLocaleString('fr-FR')
              : '—',
          });
        } else {
          setLastComment(null);
        }
      } catch {
        if (!cancelled) setLastComment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [fournisseurId]);

  return { lastComment, loading };
}