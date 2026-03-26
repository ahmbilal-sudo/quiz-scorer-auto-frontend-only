import { useState } from 'react'
import { Plus, Trash2, Download, Upload, Settings, Users, FileText, ChevronDown, ChevronUp, Eye, X } from 'lucide-react'

const QUESTION_TYPES = [
  { value: 'PI', label: 'Personal Info', needsAnswer: false },
  { value: 'Short', label: 'Short Answer', needsAnswer: true, defaultPoints: 3 },
  { value: 'Long', label: 'Long Answer', needsAnswer: true, defaultPoints: 10 },
  { value: 'MCQ', label: 'Multiple Choice', needsAnswer: true, defaultPoints: 1 },
  { value: 'Blank', label: 'Fill in the Blank', needsAnswer: true, defaultPoints: 1 },
  { value: 'One-Word Answer', label: 'One-Word Answer', needsAnswer: true, defaultPoints: 1 },
]

const DEFAULT_SECTIONS = ['Personal Info', 'Quiz', 'Section A', 'Section B', 'Mid-Term', 'Final Exam']

function MetaBuilder() {
  const [metaData, setMetaData] = useState([
    { id: 1, column_name: 'Name', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
    { id: 2, column_name: 'Email', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
    { id: 3, column_name: 'Enrollment Number', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
    { id: 4, column_name: 'Contact Number', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
  ])
  
  const [customSections, setCustomSections] = useState([])
  const [newSection, setNewSection] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [nextId, setNextId] = useState(5)

  const addRow = (type = 'Short') => {
    const typeInfo = QUESTION_TYPES.find(t => t.value === type) || QUESTION_TYPES[1]
    const newRow = {
      id: nextId,
      column_name: '',
      section: customSections[0] || 'Quiz',
      total_points: typeInfo.defaultPoints || 3,
      type: type,
      correct_answer: ''
    }
    setMetaData([...metaData, newRow])
    setNextId(nextId + 1)
  }

  const updateRow = (id, field, value) => {
    setMetaData(metaData.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const deleteRow = (id) => {
    setMetaData(metaData.filter(row => row.id !== id))
  }

  const moveRow = (id, direction) => {
    const index = metaData.findIndex(row => row.id === id)
    if (direction === 'up' && index > 0) {
      const newData = [...metaData]
      ;[newData[index - 1], newData[index]] = [newData[index], newData[index - 1]]
      setMetaData(newData)
    } else if (direction === 'down' && index < metaData.length - 1) {
      const newData = [...metaData]
      ;[newData[index], newData[index + 1]] = [newData[index + 1], newData[index]]
      setMetaData(newData)
    }
  }

  const addCustomSection = () => {
    if (newSection.trim() && !customSections.includes(newSection.trim())) {
      setCustomSections([...customSections, newSection.trim()])
      setNewSection('')
    }
  }

  const downloadCSV = () => {
    const headers = ['column_name', 'section', 'total_points', 'type', 'correct_answer']
    const csvContent = [
      headers.join(','),
      ...metaData.map(row => 
        headers.map(h => {
          const val = row[h]
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'quiz_metadata.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const loadSampleData = () => {
    setMetaData([
      { id: 1, column_name: 'Name', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 2, column_name: 'Email', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 3, column_name: 'Enrollment Number', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 4, column_name: 'What is Machine Learning?', section: 'Quiz', total_points: 3, type: 'Short', correct_answer: '' },
      { id: 5, column_name: 'Explain neural networks', section: 'Quiz', total_points: 10, type: 'Long', correct_answer: '' },
      { id: 6, column_name: 'Which is a supervised learning algorithm?', section: 'Quiz', total_points: 1, type: 'MCQ', correct_answer: 'A) Classification' },
    ])
    setNextId(7)
  }

  const getTotalPoints = () => {
    return metaData
      .filter(row => row.type !== 'PI')
      .reduce((sum, row) => sum + (parseFloat(row.total_points) || 0), 0)
  }

  const getQuestionCount = () => {
    return metaData.filter(row => row.type !== 'PI').length
  }

  const allSections = [...DEFAULT_SECTIONS, ...customSections]

  const inputStyle = {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    padding: '0.625rem 1rem',
    fontSize: '0.9rem',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    paddingRight: '2.5rem',
  }

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
          <Settings size={24} />
          Meta File Builder
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create and customize your quiz metadata file. Define personal info columns, questions, weightage, and correct answers.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users />
          </div>
          <div className="stat-value">{metaData.filter(r => r.type === 'PI').length}</div>
          <div className="stat-label">Personal Info Columns</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <FileText />
          </div>
          <div className="stat-value">{getQuestionCount()}</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Settings />
          </div>
          <div className="stat-value">{getTotalPoints()}</div>
          <div className="stat-label">Total Points</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        marginBottom: '1.5rem', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button 
          className="btn" 
          onClick={() => addRow('Short')}
          style={{ 
            background: 'var(--accent-primary)', 
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> Short
        </button>
        <button 
          className="btn" 
          onClick={() => addRow('Long')}
          style={{ 
            background: 'var(--accent-primary)', 
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> Long
        </button>
        <button 
          className="btn" 
          onClick={() => addRow('MCQ')}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> MCQ
        </button>
        <button 
          className="btn" 
          onClick={() => addRow('Blank')}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> Blank
        </button>
        <button 
          className="btn" 
          onClick={() => addRow('One-Word Answer')}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} /> One-Word
        </button>

        <div style={{ flex: 1 }}></div>

        <button 
          className="btn" 
          onClick={loadSampleData}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Upload size={16} /> Sample
        </button>
        <button 
          className="btn" 
          onClick={() => setShowPreview(!showPreview)}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Eye size={16} /> Preview
        </button>
        <button 
          className="btn" 
          onClick={downloadCSV}
          style={{ 
            background: 'var(--accent-primary)', 
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Download size={16} /> Download
        </button>
      </div>

      {/* Custom Section Input */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        marginBottom: '1.5rem',
        padding: '1.25rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Add custom section name..."
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomSection()}
          style={{ ...inputStyle, maxWidth: '280px' }}
        />
        <button 
          className="btn" 
          onClick={addCustomSection}
          style={{ 
            background: 'var(--bg-tertiary)', 
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={16} />
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: '0.5rem' }}>
          {customSections.map(s => (
            <span 
              key={s} 
              style={{ 
                background: 'var(--accent-primary)', 
                color: 'white',
                padding: '0.35rem 0.85rem', 
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '500'
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container" style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', padding: '1rem' }}>#</th>
                <th style={{ minWidth: '250px', padding: '1rem' }}>Column / Question</th>
                <th style={{ width: '160px', padding: '1rem' }}>Section</th>
                <th style={{ width: '100px', padding: '1rem' }}>Points</th>
                <th style={{ width: '160px', padding: '1rem' }}>Type</th>
                <th style={{ minWidth: '200px', padding: '1rem' }}>Correct Answer</th>
                <th style={{ width: '80px', padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {metaData.map((row, index) => (
                <tr key={row.id}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <button 
                        onClick={() => moveRow(row.id, 'up')}
                        disabled={index === 0}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.3 : 0.7,
                          padding: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        onClick={() => moveRow(row.id, 'down')}
                        disabled={index === metaData.length - 1}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: index === metaData.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === metaData.length - 1 ? 0.3 : 0.7,
                          padding: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      value={row.column_name}
                      onChange={(e) => updateRow(row.id, 'column_name', e.target.value)}
                      placeholder={row.type === 'PI' ? 'Field Name' : 'Enter question...'}
                      style={{ 
                        ...inputStyle,
                        background: row.type === 'PI' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        fontWeight: row.type === 'PI' ? '400' : '500'
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <select
                      value={row.section}
                      onChange={(e) => updateRow(row.id, 'section', e.target.value)}
                      style={selectStyle}
                    >
                      {allSections.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="number"
                      value={row.total_points}
                      onChange={(e) => updateRow(row.id, 'total_points', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.5"
                      disabled={row.type === 'PI'}
                      style={{ 
                        ...inputStyle, 
                        textAlign: 'center',
                        background: row.type === 'PI' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        opacity: row.type === 'PI' ? 0.6 : 1
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <select
                      value={row.type}
                      onChange={(e) => {
                        const typeInfo = QUESTION_TYPES.find(t => t.value === e.target.value)
                        updateRow(row.id, 'type', e.target.value)
                        if (typeInfo) {
                          updateRow(row.id, 'total_points', typeInfo.defaultPoints || 0)
                        }
                      }}
                      style={selectStyle}
                    >
                      {QUESTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input
                      type="text"
                      value={row.correct_answer}
                      onChange={(e) => updateRow(row.id, 'correct_answer', e.target.value)}
                      placeholder={row.type === 'PI' ? '-' : 'Reference answer...'}
                      disabled={row.type === 'PI'}
                      style={{ 
                        ...inputStyle,
                        background: row.type === 'PI' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        opacity: row.type === 'PI' ? 0.5 : 1
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => deleteRow(row.id)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.15)', 
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--accent-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>CSV Preview</h2>
              <button 
                onClick={() => setShowPreview(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '1.5rem', 
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <pre style={{ 
                background: 'var(--bg-tertiary)', 
                padding: '1.25rem', 
                borderRadius: 'var(--radius-md)',
                overflow: 'auto',
                fontSize: '0.8rem',
                maxHeight: '400px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                lineHeight: '1.6'
              }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>column_name,section,total_points,type,correct_answer</span>
{'\n'}
{metaData.map(row => 
  `"${row.column_name}","${row.section}",${row.total_points},${row.type},"${row.correct_answer || ''}"`
).join('\n')}
              </pre>
            </div>
            <div className="modal-footer">
              <button 
                className="btn" 
                onClick={() => { downloadCSV(); setShowPreview(false); }}
                style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={16} /> Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MetaBuilder
