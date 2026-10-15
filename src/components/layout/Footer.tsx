import React, { useEffect, useState } from 'react';
import { ShieldCheck, Server, Database, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const Footer: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<{ status: string; type?: string; latencyMs?: number }>({
    status: 'checking',
  });

  useEffect(() => {
    api.getReadyHealth()
      .then((res) => {
        setDbStatus({
          status: res.status,
          type: res.database?.type || 'relational',
          latencyMs: res.database?.latencyMs || 1,
        });
      })
      .catch(() => {
        setDbStatus({ status: 'unhealthy' });
      });
  }, []);

  return (
    <footer id="app-footer" className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">PulseCare Health System (Cloud/DevOps Portfolio Project)</p>
            <p className="mt-0.5">
              Strictly for educational demonstration and AWS Terraform deployment planning. Contains 100% synthetic fictional records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Target: AWS ECS (Port 3000)</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>
                DB: {dbStatus.type === 'postgresql' ? 'PostgreSQL (RDS)' : 'Relational SQLite'}
              </span>
              {dbStatus.status === 'ready' || dbStatus.status === 'healthy' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>RBAC & Audit Trail Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
