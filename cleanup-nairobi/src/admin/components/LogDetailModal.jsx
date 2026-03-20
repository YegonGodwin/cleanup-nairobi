import React from 'react';
import { X } from 'lucide-react';
import ReactJson from '@microlink/react-json-view';

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const LogDetailModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Audit Event Details</h2>
            <p className="mt-1 text-sm text-slate-500">Inspect actor, entity, and raw metadata for this event.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Timestamp</dt>
                    <dd className="font-medium text-slate-900">{formatDateTime(log.timestamp)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Action</dt>
                    <dd className="font-medium text-slate-900">{log.action || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Entity</dt>
                    <dd className="font-medium text-slate-900">{log.entityType || 'N/A'} ({log.entityId || 'N/A'})</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="font-medium capitalize text-slate-900">{String(log.status || 'n/a').replace(/_/g, ' ')}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actor</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium text-slate-900">{log.actor?.name || 'System'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium text-slate-900">{log.actor?.email || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Actor ID</dt>
                    <dd className="font-medium break-all text-slate-900">{log.actor?.id || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Target</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Title</dt>
                    <dd className="font-medium text-slate-900">{log.target?.title || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Subtitle</dt>
                    <dd className="font-medium text-slate-900">{log.target?.subtitle || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h3>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  {log.description || 'No description provided.'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Metadata</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                  <ReactJson src={log.metadata || {}} name={false} collapsed={false} enableClipboard={true} displayDataTypes={false} />
                </div>
              </div>

              {(log.beforeState || log.afterState) && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Before State</h3>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                      <ReactJson src={log.beforeState || {}} name={false} collapsed={false} enableClipboard={true} displayDataTypes={false} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">After State</h3>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
                      <ReactJson src={log.afterState || {}} name={false} collapsed={false} enableClipboard={true} displayDataTypes={false} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
