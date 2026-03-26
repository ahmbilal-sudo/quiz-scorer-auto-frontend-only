import { useState } from 'react'
import { HelpCircle, Users, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react'

function QuestionsAnalysis({ data }) {
  const { questions, students } = data
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')

  const getDifficulty = (percentage) => {
    if (percentage >= 70) return { label: 'Easy', class: 'easy' }
    if (percentage >= 40) return { label: 'Medium', class: 'medium' }
    return { label: 'Hard', class: 'hard' }
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    let aVal, bVal
    
    switch (sortBy) {
      case 'id':
        aVal = parseInt(a.id.replace(/\D/g, '')) || 0
        bVal = parseInt(b.id.replace(/\D/g, '')) || 0
        break
      case 'question':
        aVal = a.question.toLowerCase()
        bVal = b.question.toLowerCase()
        break
      case 'avgPercentage':
        aVal = a.avgPercentage
        bVal = b.avgPercentage
        break
      case 'totalResponses':
        aVal = a.totalResponses
        bVal = b.totalResponses
        break
      default:
        aVal = a.avgPercentage
        bVal = b.avgPercentage
    }

    if (sortOrder === 'asc') {
      return aVal < bVal ? -1 : 1
    } else {
      return aVal > bVal ? -1 : 1
    }
  })

  const SortButton = ({ label, sortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      style={{
        background: 'none',
        border: 'none',
        color: sortBy === sortKey ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {label}
      {sortBy === sortKey && (
        sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
      )}
    </button>
  )

  return (
    <div className="main-content">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={24} />
          Question Analysis
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Analyzing {questions.length} questions across {students.length} students
        </p>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <SortButton label="Question #" sortKey="id" />
        <SortButton label="Question Text" sortKey="question" />
        <SortButton label="Avg Score %" sortKey="avgPercentage" />
        <SortButton label="Responses" sortKey="totalResponses" />
      </div>

      <div className="questions-grid">
        {sortedQuestions.map((q) => {
          const difficulty = getDifficulty(q.avgPercentage)
          
          return (
            <div key={q.id} className="question-analysis-card">
              <div className="question-analysis-header">
                <div>
                  <div className="question-analysis-title">{q.id}</div>
                  <span className={`difficulty-badge ${difficulty.class}`}>
                    {difficulty.label}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 700,
                    color: q.avgPercentage >= 70 ? 'var(--accent-success)' :
                           q.avgPercentage >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                  }}>
                    {q.avgPercentage.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    avg score
                  </div>
                </div>
              </div>

              <div className="question-analysis-text">
                {q.question}
              </div>

              <div className="question-stats">
                <span>
                  <Users size={14} />
                  {q.totalResponses} responses
                </span>
                <span>
                  <TrendingUp size={14} />
                  {q.avgScore.toFixed(1)}/{q.maxScore} avg
                </span>
                {q.type && (
                  <span style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem'
                  }}>
                    {q.type}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="progress-bar" style={{ width: '100%', marginTop: '0.5rem' }}>
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${q.avgPercentage}%`,
                    background: q.avgPercentage >= 70 ? 'var(--accent-success)' :
                               q.avgPercentage >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)'
                  }}
                ></div>
              </div>

              {/* Reference Answer */}
              {q.correctAnswer && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--accent-success)', 
                    textTransform: 'uppercase',
                    marginBottom: '0.35rem',
                    fontWeight: 600
                  }}>
                    Reference Answer
                  </div>
                  <div style={{ 
                    padding: '0.6rem', 
                    background: 'rgba(34, 197, 94, 0.1)', 
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {q.correctAnswer}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default QuestionsAnalysis
