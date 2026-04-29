import { useState, useEffect } from 'react'
import { X, User, Mail, FileText, Award, FolderOpen, CheckCircle, MessageSquare, FileSignature, Eye, Save, Download } from 'lucide-react'

function StudentModal({ student, onClose, quizId, onUpdateStudent, onUpdateQuestionScore }) {
  const [viewingEvidence, setViewingEvidence] = useState(null)
  const [editedGrades, setEditedGrades] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  // Inline per-question score editing state
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [tempScore, setTempScore] = useState('')

  useEffect(() => {
    if (student && student.grades) {
      setEditedGrades(JSON.parse(JSON.stringify(student.grades)))
    }
  }, [student])

  // Inline editing helpers
  const startEditingScore = (qId, current) => {
    setEditingQuestionId(qId)
    setTempScore(String(current))
  }

  const saveInlineScore = (q, index) => {
    const newVal = parseFloat(tempScore)
    const clamped = Number.isFinite(newVal) ? Math.min(newVal, q.maxScore || 10) : 0
    // update local in-memory grades for immediate UI feedback
    const updated = [...editedGrades]
    if (typeof index === 'number' && updated[index]) updated[index].score = clamped
    setEditedGrades(updated)
    // push to parent memory if callback exists
    if (onUpdateQuestionScore) {
      const qid = q.questionId || q.question_id
      onUpdateQuestionScore(qid, clamped)
    }
    // Persist to localStorage for final bulk save wiring
    try {
      const quizKey = quizId
      const studentId = student?.studentId || student?.id || ''
      const scoresPayload = editedGrades.map((qq) => ({
        questionId: qq.questionId || qq.question_id,
        score: qq.score,
        maxScore: qq.maxScore
      }))
      const key = `${quizKey}:${studentId}`
      const blob = { quiz_id: quizKey, student_id: studentId, scores: scoresPayload, timestamp: Date.now() }
      const storageKey = 'quiz_scorer_per_question_scores'
      const existing = JSON.parse(localStorage.getItem(storageKey) || '{}')
      existing[key] = blob
      localStorage.setItem(storageKey, JSON.stringify(existing))
    } catch (e) {
      // ignore storage errors
    }
    setEditingQuestionId(null)
    setTempScore('')
    setHasChanges(true)
  }

  const cancelInlineScore = () => {
    setEditingQuestionId(null)
    setTempScore('')
  }

  const onInlineKeyDown = (e, q, idx) => {
    if (e.key === 'Enter') saveInlineScore(q, idx)
    if (e.key === 'Escape') cancelInlineScore()
  }

  const handleScoreChange = (index, newScore) => {
    const updated = [...editedGrades]
    updated[index].score = parseFloat(newScore) || 0
    setEditedGrades(updated)
    setHasChanges(true)
  }

  const handleSaveChanges = () => {
    if (onUpdateStudent) {
      onUpdateStudent({
        ...student,
        grades: editedGrades
      })
    }
    setHasChanges(false)
  }

  const exportToCSV = () => {
    const headers = [
      'Student Name', 'Email', 'Question ID', 'Question', 'Student Answer', 
      'Correct Answer', 'Score', 'Max Score', 'Percentage', 'Question Type', 
      'Feedback', 'Evidence Path', 'Source', 'Student ID', 'Quiz ID'
    ]
    
    const rows = editedGrades.map((q, idx) => [
      student.name,
      student.email,
      q.questionId || `Q${idx + 1}`,
      q.questionText || '',
      q.studentAnswer || '',
      q.correctAnswer || '',
      q.score,
      q.maxScore,
      student.percentage,
      q.questionType || 'Short',
      q.feedback || '',
      q.evidence_path || '',
      student.source || 'handwritten',
      student.studentId || '',
      quizId || student.quizId || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${student.name.replace(/\s+/g, '_')}_results.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
  
  const getBackendUrl = () => {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = '3000'
    return `${protocol}//${hostname}:${port}`
  }
  
  const HOST_URL = getBackendUrl()
  const getGrade = (percentage) => {
    if (percentage >= 80) return { label: 'Excellent', class: 'excellent' }
    if (percentage >= 60) return { label: 'Good', class: 'good' }
    if (percentage >= 40) return { label: 'Average', class: 'average' }
    return { label: 'Poor', class: 'poor' }
  }

  const grade = getGrade(student.percentage)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{student.name}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={exportToCSV}
              title="Download results as CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              CSV
            </button>
            {hasChanges && (
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleSaveChanges}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Save size={16} />
                Save Marks
              </button>
            )}
            <button className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Student Meta */}
          <div className="student-meta">
            <div className="meta-item">
              <span className="meta-label">
                <User size={14} style={{ marginRight: 4 }} />
                Name
              </span>
              <span className="meta-value">{student.name}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Mail size={14} style={{ marginRight: 4 }} />
                Email
              </span>
              <span className="meta-value">{student.email || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <FolderOpen size={14} style={{ marginRight: 4 }} />
                Source File
              </span>
              <span className="meta-value">{student.sourceFile}</span>
            </div>
            {/* Show handwritten indicator if source is handwritten */}
            {(student.source === 'handwritten') && (
              <div className="meta-item">
                <span className="meta-label">
                  <FileSignature size={14} style={{ marginRight: 4 }} />
                  Source Type
                </span>
                <span className="meta-value">
                  <span style={{ 
                    background: 'var(--accent-warning)', 
                    color: '#000',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}>
                    📝 Handwritten
                  </span>
                </span>
              </div>
            )}
            <div className="meta-item">
              <span className="meta-label">
                <Award size={14} style={{ marginRight: 4 }} />
                Grade
              </span>
              <span className="meta-value">
                <span className={`grade-badge ${grade.class}`}>{grade.label}</span>
              </span>
            </div>
          </div>

          {/* Score Summary */}
          <div className="score-summary">
            <div className="score-item">
              <div className="value">{student.totalScore?.toFixed(1) || 0}</div>
              <div className="label">Obtained</div>
            </div>
            <div className="score-item">
              <div className="value">/ {student.maxScore || 0}</div>
              <div className="label">Maximum</div>
            </div>
            <div className="score-item">
              <div className="value" style={{ color: 'var(--accent-primary)' }}>
                {student.percentage?.toFixed(1) || 0}%
              </div>
              <div className="label">Percentage</div>
            </div>
          </div>

          {/* Question-wise Results */}
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} />
            Question-wise Results
          </h4>

          <div className="question-cards">
            {student.grades && student.grades.length > 0 ? (
              student.grades.map((q, idx) => {
                const scorePercentage = q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0
                const scoreGrade = getGrade(scorePercentage)
                
                return (
                  <div key={idx} className="question-card">
                    <div className="question-card-header">
                      <div>
                        <div className="question-id">{q.questionId || q.question_id}</div>
                        {q.questionType && (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            background: 'var(--bg-elevated)', 
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            marginLeft: '0.5rem'
                          }}>
                            {q.questionType}
                          </span>
                        )}
                      </div>
                      <div className="question-score" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {editingQuestionId === (q.questionId || q.question_id) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--accent-primary)' }}>
                            <input
                              type="number"
                              autoFocus
                              value={tempScore}
                              onChange={(e) => setTempScore(e.target.value)}
                              onKeyDown={(e) => onInlineKeyDown(e, q, idx)}
                              style={{ width: '70px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', textAlign: 'center' }}
                              min={0}
                              step="0.5"
                              max={q.maxScore || 10}
                            />
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                              / {q.maxScore}
                            </span>
                            <button onClick={() => saveInlineScore(q, idx)} style={{ background: 'var(--accent-success)', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'white' }} title="Save (Enter)
">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={cancelInlineScore} style={{ background: 'var(--accent-danger)', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', color: 'white' }} title="Cancel (Esc)">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditingScore(q.questionId || q.question_id, q.score)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px',
                              background: q.score === q.maxScore ? 'rgba(34, 197, 94, 0.15)' : (q.score >= (q.maxScore || 10) * 0.6 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                              border: '1px solid ' + (q.score === q.maxScore ? 'rgba(34, 197, 94, 0.3)' : (q.score >= (q.maxScore || 10) * 0.6 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(239, 68, 68, 0.3)'))
                            }}
                            title="Click to edit score"
                          >
                            <div className="obtained" style={{ fontSize: '0.95rem', fontWeight: '700' }}>{q.score}</div>
                            <div className="max" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              / {q.maxScore}
                            </div>
                            <div style={{ color: 'var(--text-secondary)' }}>
                              <span style={{ display: 'inline-block', transform: 'translateY(1px)' }}>✎</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Text */}
                    {q.questionText && (
                      <div className="answer-section">
                        <div className="answer-label" style={{ color: 'var(--accent-primary)' }}>
                          <FileText size={12} style={{ marginRight: 4 }} />
                          Question
                        </div>
                        <div className="question-text">
                          {q.questionText}
                        </div>
                      </div>
                    )}

                    {/* Student Answer */}
                    <div className="answer-section">
                      <div className="answer-label">
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <MessageSquare size={12} style={{ marginRight: 4 }} />
                          Student's Answer
                          {(q.confidence || student.source === 'handwritten') && (
                            <span style={{ 
                              marginLeft: '0.5rem',
                              fontSize: '0.7rem',
                              color: q.confidence >= 0.9 ? 'var(--accent-success)' : 
                                     q.confidence >= 0.7 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                              fontWeight: 'normal',
                              opacity: 0.8
                            }}>
                              ({q.confidence ? Math.round(q.confidence * 100) + '%' : ''})
                            </span>
                          )}
                        </div>
                        
                        {/* Removed old score input box; inline header editing now handles updates. */}
                        {student.source === 'handwritten' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => setViewingEvidence(viewingEvidence === `RESOLVE:${q.questionId}` ? null : `RESOLVE:${q.questionId}`)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              background: viewingEvidence === `RESOLVE:${q.questionId}` ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                              border: 'none',
                              color: 'white',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '4px',
                              transition: 'all 0.2s',
                              fontWeight: '600',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Eye size={12} />
                            View Evidence
                          </button>
                        )}
                      </div>
                      <div className="student-answer">
                        {q.studentAnswer || q.student_answer || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}
                      </div>
                      </div>
                      
                      {/* Inline Evidence Display */}
                      {viewingEvidence === (student.source === 'handwritten' ? `RESOLVE:${q.questionId}` : (q.evidence_path || q.evidencePath)) && (
                        <div style={{ 
                          marginTop: '1rem', 
                          padding: '1rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                              Handwritten Evidence
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setViewingEvidence(null); }}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: 'var(--text-secondary)', 
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <img 
                            src={viewingEvidence.startsWith('RESOLVE:') 
                              ? `${HOST_URL}/storage/evidence/${quizId || 'unknown'}/${student.studentId || student.id}/resolve/${viewingEvidence.split(':')[1].replace(/\D/g, '')}`
                              : `${HOST_URL}/storage/evidence/${quizId || 'unknown'}/${viewingEvidence}`
                            } 
                            alt="Handwritten Evidence"
                            style={{ 
                              width: '100%', 
                              maxHeight: '400px', 
                              objectFit: 'contain', 
                              borderRadius: '4px',
                              background: '#000'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div style={{ 
                            display: 'none', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '2rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '4px',
                            border: '1px dashed var(--accent-danger)',
                            color: 'var(--accent-danger)',
                            gap: '0.5rem'
                          }}>
                            <X size={24} />
                            <span style={{ fontWeight: '600' }}>Evidence Not Found</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>No submission image found for this question.</span>
                          </div>
                        </div>
                      )}
                    
                    {/* Reference Answer (if available) */}
                    {(q.correctAnswer || q.correct_answer) && (
                      <div className="answer-section">
                        <div className="answer-label" style={{ color: 'var(--accent-success)' }}>
                          <CheckCircle size={12} style={{ marginRight: 4 }} />
                          Reference Answer
                        </div>
                        <div className="reference-answer">
                          {q.correctAnswer || q.correct_answer}
                        </div>
                      </div>
                    )}

                    {/* LLM Feedback */}
                    <div className="llm-feedback">
                      <strong>Feedback:</strong> {q.feedback || 'No feedback available'}
                    </div>
                  </div>
                )
              })
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No detailed grades available</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing {student.grades?.length || 0} questions
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentModal
