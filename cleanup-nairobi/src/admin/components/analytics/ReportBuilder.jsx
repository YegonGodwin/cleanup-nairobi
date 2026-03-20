import React, { useMemo, useState } from 'react';

const ReportBuilder = ({
  dateRange = '30',
  zone = 'All Zones',
  filteredReports = [],
  collectionsByZone = [],
  reportsByCategory = [],
  reportStatusDistribution = [],
  peakActivityTimes = [],
  topZones = [],
  topOperators = [],
}) => {
  const [datasetKey, setDatasetKey] = useState('reports');
  const [format, setFormat] = useState('json');

  const datasetMap = useMemo(() => ({
    reports: {
      label: 'Filtered Reports',
      rows: filteredReports.map((report) => ({
        id: report.id,
        created_at: report.created_at,
        location: report.location,
        status: report.status,
        waste_type: report.waste_type,
      })),
    },
    zones: { label: 'Collections By Zone', rows: collectionsByZone },
    categories: { label: 'Reports By Category', rows: reportsByCategory },
    statuses: { label: 'Status Distribution', rows: reportStatusDistribution },
    peak_times: { label: 'Peak Activity Times', rows: peakActivityTimes },
    top_zones: { label: 'Top Performing Zones', rows: topZones },
    top_operators: { label: 'Top Performing Operators', rows: topOperators },
  }), [
    filteredReports,
    collectionsByZone,
    reportsByCategory,
    reportStatusDistribution,
    peakActivityTimes,
    topZones,
    topOperators,
  ]);

  const selectedDataset = datasetMap[datasetKey] || datasetMap.reports;
  const previewRows = selectedDataset.rows.slice(0, 5);

  const convertToCsv = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const lines = rows.map((row) => headers.map((header) => {
      const value = row[header] ?? '';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','));
    return [headers.join(','), ...lines].join('\n');
  };

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: { dateRangeDays: Number(dateRange), zone },
      dataset: selectedDataset.label,
      count: selectedDataset.rows.length,
      rows: selectedDataset.rows,
    };

    const filenameBase = `report-builder-${datasetKey}-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') {
      const csv = convertToCsv(selectedDataset.rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filenameBase}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Report Builder</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Dataset</label>
          <select
            value={datasetKey}
            onChange={(e) => setDatasetKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {Object.entries(datasetMap).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleExport}
            className="w-full p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Export {selectedDataset.label}
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-3">
        Scope: {zone} | Last {dateRange} days | Rows: {selectedDataset.rows.length}
      </div>

      <div className="border border-gray-200 rounded-md p-3 bg-gray-50 overflow-auto">
        {previewRows.length === 0 ? (
          <p className="text-sm text-gray-500">No rows available for this dataset and filter.</p>
        ) : (
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
            {JSON.stringify(previewRows, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ReportBuilder;
