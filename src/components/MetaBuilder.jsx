import { useState, useEffect } from 'react'
import { Plus, Trash2, Download, Upload, Settings, Users, FileText, ChevronDown, ChevronUp, Eye, X, Sparkles, Loader2, FilePlus, ExternalLink, Check, Copy } from 'lucide-react'

// Dynamic backend URL - will be fetched from API config on load
//let HOST_URL = 'http://localhost:3000'
//let API_URL = 'http://localhost:3000'

const HOST_URL = import.meta.env.VITE_FRONTEND_URL;
const API_URL = import.meta.env.VITE_BACKEND_URL;
console.log(HOST_URL); // Should log "http://localhost:8000"
console.log(API_URL); // Should log "http://localhost:8000"

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
  const [showAiSuggest, setShowAiSuggest] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiQuestionType, setAiQuestionType] = useState('Short')
  const [aiCount, setAiCount] = useState(1)
  const [aiPassword, setAiPassword] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Google Form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [formCreated, setFormCreated] = useState(false)
  const [formUrl, setFormUrl] = useState('')
  const [createFormError, setCreateFormError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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
    link.download = 'quiz_meta.csv'
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

  // Check auth status on mount and handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authStatus = params.get('auth')
    
    if (authStatus === 'success') {
      // Store that we're waiting for auth before redirect
      sessionStorage.setItem('pending_auth', 'true')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (authStatus === 'error') {
      const message = params.get('message') || 'Authentication failed'
      setCreateFormError(decodeURIComponent(message.replace(/%20/g, ' ')))
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    // Check if we just completed auth
    const pendingAuth = sessionStorage.getItem('pending_auth')
    if (pendingAuth === 'true') {
      sessionStorage.removeItem('pending_auth')
      // Check auth status from backend
      checkAuthStatus().then(() => {
        setShowCreateForm(true)
      })
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/status`, { credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true', // Add this header
        },
      });
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch (err) {
      console.error('Failed to check auth status:', err)
    }
  }

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true)
    setCreateFormError('')
    
    // Get backend URL for OAuth
    const configResponse = await fetch(`${API_URL}/auth/config`, {
    headers: {
      'ngrok-skip-browser-warning': 'true', // Add this header
    },
  });
    const config = await configResponse.json()
    const state = Math.random().toString(36).substring(7)
    sessionStorage.setItem('oauth_state', state)
    
    // Open popup window for Google OAuth
    const authUrl = `${config.redirect_uri.replace('/auth/callback', '')}/auth/authorize?state=${state}`
    const popup = window.open(
      authUrl,
      'Google OAuth',
      'width=500,height=600,scrollbars=yes'
    )
    
    // Poll for auth completion
    const checkAuth = setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/auth/status`, { credentials: 'include',
        headers: {
          'ngrok-skip-browser-warning': 'true', // Add this header
        },
      });
        const data = await response.json()
        
        if (data.authenticated) {
          clearInterval(checkAuth)
          setIsAuthenticated(true)
          setIsAuthenticating(false)
          popup.close()
        }
      } catch (err) {
        console.error('Auth check error:', err)
      }
    }, 2000)
    
    // Cleanup on popup close
    const popupCheck = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkAuth)
        clearInterval(popupCheck)
        setIsAuthenticating(false)
        // Check final auth status
        checkAuthStatus()
      }
    }, 500)
  }

  const handleCreateForm = async () => {
    if (!formTitle.trim()) {
      setCreateFormError('Please enter a form title')
      return
    }

    const questions = metaData
      //.filter(row => row.type !== 'PI') send all questions including personal info
      .map(row => ({
        question_text: row.column_name,
        type: row.type,
        correct_answer: row.correct_answer || '',
        required: true,
      }))

    if (questions.length === 0) {
      setCreateFormError('Please add at least one question to the meta file')
      return
    }

    setIsCreating(true)
    setCreateFormError('')

    try {
      // Step 1: Create form with title only
      const createResponse = await fetch(`${API_URL}/forms/create`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
        }),
      })

      const createData = await createResponse.json()

      if (!createResponse.ok) {
        throw new Error(createData.detail || 'Failed to create form')
      }

      // Step 2: Add questions to the form
      const questionsResponse = await fetch(`${API_URL}/forms/${createData.form_id}/questions`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(questions),
      })

      const questionsData = await questionsResponse.json()

      if (!questionsResponse.ok) {
        throw new Error(questionsData.detail || 'Failed to add questions to form')
      }

      setFormUrl(createData.form_url)
      setFormCreated(true)
    } catch (err) {
      if (err.message.includes('Not authenticated')) {
        setIsAuthenticated(false)
        setCreateFormError('Please authenticate with Google first')
      } else {
        setCreateFormError(err.message)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const copyFormUrl = () => {
    navigator.clipboard.writeText(formUrl)
    alert('Form URL copied to clipboard!')
  }

  const handleAiSuggest = async () => {
    if (!aiTopic.trim()) {
      setAiError('Please enter a topic')
      return
    }
    if (!aiPassword.trim()) {
      setAiError('Please enter the authorization password')
      return
    }

    setAiLoading(true)
    setAiError('')
    setAiSuggestions([])

    try {
      const existingQuestions = metaData
        .filter(row => row.type !== 'PI')
        .map(row => ({ question_text: row.column_name }))

      const response = await fetch(`${API_URL}/suggest/questions`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          question_type: aiQuestionType,
          count: aiCount,
          existing_questions: existingQuestions,
          password: aiPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate suggestions')
      }

      setAiSuggestions(data.suggestions)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const addSuggestionToMeta = (suggestion) => {
    const newRow = {
      id: nextId,
      column_name: suggestion.question_text,
      section: customSections[0] || 'Quiz',
      total_points: suggestion.suggested_points || 3,
      type: suggestion.type || aiQuestionType,
      correct_answer: suggestion.correct_answer || '',
    }
    setMetaData([...metaData, newRow])
    setNextId(nextId + 1)
    setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))
  }

  const addAllSuggestions = () => {
    const newRows = aiSuggestions.map(s => ({
      id: nextId + aiSuggestions.indexOf(s),
      column_name: s.question_text,
      section: customSections[0] || 'Quiz',
      total_points: s.suggested_points || 3,
      type: s.type || aiQuestionType,
      correct_answer: s.correct_answer || '',
    }))
    setMetaData([...metaData, ...newRows])
    setNextId(nextId + newRows.length)
    setAiSuggestions([])
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

        <button 
          className="btn" 
          onClick={() => setShowAiSuggest(true)}
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', 
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Sparkles size={16} /> AI Suggest
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

        <button 
          className="btn" 
          onClick={() => setShowCreateForm(true)}
          style={{ 
            background: 'linear-gradient(135deg, #4285f4, #34a853)', 
            color: 'white',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <FilePlus size={16} /> Create Google Form
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

      {/* AI Suggest Modal */}
      {showAiSuggest && (
        <div className="modal-overlay" onClick={() => { setShowAiSuggest(false); setAiSuggestions([]); setAiError(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: '#8b5cf6' }} />
                AI Question Suggestions
              </h2>
              <button 
                onClick={() => { setShowAiSuggest(false); setAiSuggestions([]); setAiError(''); }}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Quiz Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Machine Learning Basics, Python Programming"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Question Type
                    </label>
                    <select
                      value={aiQuestionType}
                      onChange={(e) => setAiQuestionType(e.target.value)}
                      style={{ ...selectStyle, width: '100%' }}
                    >
                      <option value="Short">Short Answer</option>
                      <option value="Long">Long Answer</option>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="Blank">Fill in the Blank</option>
                      <option value="One-Word Answer">One-Word Answer</option>
                    </select>
                  </div>
                  <div style={{ width: '80px' }}>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                      style={{ ...inputStyle, width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    Authorization Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter AI_SUGGEST_PASSWORD"
                    value={aiPassword}
                    onChange={(e) => setAiPassword(e.target.value)}
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  style={{
                    background: aiLoading ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: aiLoading ? 0.7 : 1,
                  }}
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {aiLoading ? 'Generating...' : 'Generate Suggestions'}
                </button>
              </div>

              {aiError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                }}>
                  {aiError}
                </div>
              )}

              {aiSuggestions.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Generated Suggestions ({aiSuggestions.length})
                    </h3>
                    <button
                      onClick={addAllSuggestions}
                      style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Plus size={14} /> Add All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                    {aiSuggestions.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <p style={{ fontWeight: '500', color: 'var(--text-primary)', flex: 1, marginRight: '0.75rem' }}>
                            {s.question_text}
                          </p>
                          <button
                            onClick={() => addSuggestionToMeta(s)}
                            style={{
                              background: 'var(--accent-primary)',
                              color: 'white',
                              border: 'none',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              flexShrink: 0,
                            }}
                          >
                            <Plus size={12} /> Add
                          </button>
                        </div>
                        {s.correct_answer && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            <strong>Answer:</strong> {s.correct_answer}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                          <span style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#818cf8',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontWeight: '500',
                          }}>
                            {s.type}
                          </span>
                          <span style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#22c55e',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontWeight: '500',
                          }}>
                            {s.suggested_points} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Create Google Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => { setShowCreateForm(false); setFormCreated(false); setFormUrl(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FilePlus size={20} style={{ color: '#4285f4' }} />
                Create Google Form
              </h2>
              <button 
                onClick={() => { setShowCreateForm(false); setFormCreated(false); setFormUrl(''); }}
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
              {!isAuthenticated ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    You need to sign in with your Google account to create a form.
                  </p>
                  <button
                    onClick={handleGoogleAuth}
                    disabled={isAuthenticating}
                    style={{
                      background: '#4285f4',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: isAuthenticating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                    }}
                  >
                    {isAuthenticating ? <Loader2 size={16} className="animate-spin" /> : 'Sign in with Google'}
                  </button>
                </div>
              ) : formCreated ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ 
                    background: 'rgba(34, 197, 94, 0.15)', 
                    borderRadius: '50%', 
                    width: '60px', 
                    height: '60px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <Check size={32} style={{ color: '#22c55e' }} />
                  </div>
                  <p style={{ fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    Form Created Successfully!
                  </p>
                  <div style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    wordBreak: 'break-all',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {formUrl}
                  </div>
                  <button
                    onClick={copyFormUrl}
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
                      justifyContent: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                    }}
                  >
                    <Copy size={16} /> Copy Link
                  </button>
                  <a
                    href={formUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      marginTop: '0.75rem',
                      color: '#4285f4',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                    }}
                  >
                    <ExternalLink size={14} /> Open Form
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                      Form Title *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter form title"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <div style={{ 
                    background: 'var(--bg-tertiary)', 
                    padding: '0.75rem', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <strong>{getQuestionCount()}</strong> questions will be added to the form
                  </div>
                  {createFormError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      color: '#ef4444',
                      fontSize: '0.9rem',
                    }}>
                      {createFormError}
                    </div>
                  )}
                  <button
                    onClick={handleCreateForm}
                    disabled={isCreating}
                    style={{
                      background: isCreating ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #4285f4, #34a853)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '600',
                      cursor: isCreating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      opacity: isCreating ? 0.7 : 1,
                    }}
                  >
                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : <FilePlus size={16} />}
                    {isCreating ? 'Creating...' : 'Create Form'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MetaBuilder
