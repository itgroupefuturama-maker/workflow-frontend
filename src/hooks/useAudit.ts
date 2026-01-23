import { useState, useEffect } from 'react';
import axiosInstance from '../service/Axios';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

export interface AuditEntry {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  userId: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
  user?: {  // ← Ajout du "?"
    id: string;
    email: string;
    nom: string;
    prenom: string;
  } | null; // Accepte explicitement null
}

export const useAudit = (entity: string, entityId: string | null) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId || !token) {
      setAuditData([]);
      return;
    }

    const fetchAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosInstance.get(`/audit/entity/${entity}/${entityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setAuditData(response.data.data);
        } else {
          setError('Impossible de charger l\'Tracer');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur réseau');
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [entity, entityId, token]);

  return { auditData, loading, error };
};