import React from 'react'
import { FolderOpen, Clock, History, RefreshCw, Loader2, Trash2 } from 'lucide-react'

// Clean history list component for graded results
const HistoryList = ({
  gradedResults,
  loadingResults,
  fetchGradedResults,
  loadGradedResult,
  deleteGradedResult,
  deletingResultId
}) => {
  return (
        <div className="main-content">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              <History size={24} />
              <span>Graded Results History</span>
            </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          View and load previously graded results from local storage.
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button
          onClick={fetchGradedResults}
          disabled={loadingResults}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 1rem',
            color: 'var(--text-primary)',
            cursor: loadingResults ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {loadingResults ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh
        </button>
      </div>

      {gradedResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <FolderOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>No graded results found.</p>
          <p style={{ fontSize: '0.85rem' }}>Grade a quiz to see results here.</p>
        </div>
      ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
              {gradedResults.map((result) => (
            <div key={result.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                <div style={{ flex: 1 }}>
              <h3 title={`Quiz ID: ${result.quiz_id ?? result.quizId ?? ''}`} style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'inline-block' }}>{result.quiz_display_title || result.quiz_title}</h3>
              <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: '11px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', marginLeft: 8 }}>
                {`ID: ${result.quiz_id ?? result.quizId ?? ''}`}
              </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} />
                    {new Date(result.graded_at * 1000).toLocaleString()}
                  </span>
                  <span>{result.total_students} student{result.total_students !== 1 ? 's' : ''}</span>
                  {result.average_score !== null && (<span>Avg: {result.average_score.toFixed(1)}%</span>)}
                  {result.pass_rate !== null && (<span>Pass: {result.pass_rate.toFixed(1)}%</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => loadGradedResult(result.id)} disabled={deletingResultId === result.id} style={{ background: deletingResultId === result.id ? 'var(--bg-tertiary)' : 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'white', cursor: deletingResultId === result.id ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {deletingResultId === result.id ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={16} />} Load
                </button>
                <button onClick={() => deleteGradedResult(result.id)} disabled={deletingResultId === result.id} style={{ background: deletingResultId === result.id ? 'var(--bg-tertiary)' : 'var(--accent-danger)', border: 'none', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', color: 'white', cursor: deletingResultId === result.id ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {deletingResultId === result.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryList
