import { X, User, Mail, FileText, Award, FolderOpen, CheckCircle, MessageSquare, FileSignature } from 'lucide-react'

function StudentModal({ student, onClose }) {
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
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
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
                      <div className="question-score">
                        <div className="obtained" style={{ 
                          color: q.score === q.maxScore ? 'var(--accent-success)' : 
                                 q.score >= q.maxScore * 0.6 ? 'var(--accent-info)' : 'var(--accent-danger)'
                        }}>
                          {q.score}
                        </div>
                        <div className="max">/ {q.maxScore}</div>
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
                        <MessageSquare size={12} style={{ marginRight: 4 }} />
                        Student's Answer
                        {/* Show confidence inline with student answer - subtle display */}
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
                      <div className="student-answer">
                        {q.studentAnswer || q.student_answer || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}
                      </div>
                    </div>

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
