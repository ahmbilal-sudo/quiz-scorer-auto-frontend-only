import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Download, Upload, Settings, Users, FileText, ChevronDown, ChevronUp, Eye, X, Sparkles, Loader2, FilePlus, ExternalLink, Check, Copy, Undo, Redo, Copy as CopyIcon, GripVertical, Sun, Moon } from 'lucide-react'

// MCQ Option Editor - Moved outside to prevent re-renders
function MCQOptionEditor({ value, onChange, rowId }) {
  const [options, setOptions] = useState(() => {
    if (!value) return Array(4).fill(null).map((_, i) => ({ text: '', isCorrect: i === 0 }))
    try {
      const parsed = JSON.parse(value)
      return parsed.length ? parsed : Array(4).fill(null).map((_, i) => ({ text: '', isCorrect: i === 0 }))
    } catch {
      return Array(4).fill(null).map((_, i) => ({ text: '', isCorrect: i === 0 }))
    }
  })
  
  const [optionCount, setOptionCount] = useState(options.length)
  const [correctIndex, setCorrectIndex] = useState(() => options.findIndex(o => o.isCorrect))

  const syncToParent = (opts) => {
    onChange(JSON.stringify(opts))
  }

  const handleCountChange = (newCount) => {
    const newOpts = [...options]
    while (newOpts.length < newCount) newOpts.push({ text: '', isCorrect: false })
    while (newOpts.length > newCount) newOpts.pop()
    setOptionCount(newCount)
    setCorrectIndex(0)
    setOptions(newOpts)
    syncToParent(newOpts)
  }

  const handleCorrectChange = (idx) => {
    const newOpts = options.map((o, i) => ({ ...o, isCorrect: i === idx }))
    setCorrectIndex(idx)
    setOptions(newOpts)
    syncToParent(newOpts)
  }

  const handleTextChange = (idx, text) => {
    const newOpts = [...options]
    newOpts[idx] = { ...newOpts[idx], text }
    setOptions(newOpts)
    syncToParent(newOpts)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Options:</span>
        <select
          value={optionCount}
          onChange={(e) => handleCountChange(parseInt(e.target.value))}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            padding: '0.25rem 0.5rem',
            fontSize: '0.8rem',
          }}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
          <option value={6}>6</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {options.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="radio"
              name={`mcq-${rowId}`}
              checked={correctIndex === idx}
              onChange={() => handleCorrectChange(idx)}
              style={{ width: '14px', height: '14px' }}
            />
            <input
              type="text"
              value={opt.text}
              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                padding: '0.35rem 0.5rem',
                fontSize: '0.8rem',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Dynamic backend URL - will be fetched from API config on load
//let HOST_URL = 'http://localhost:3000'
//let API_URL = 'http://localhost:3000'

const HOST_URL = import.meta.env.VITE_FRONTEND_URL;
const API_URL = import.meta.env.VITE_BACKEND_URL;
console.log(HOST_URL); // Should log "http://localhost:5147"
console.log(API_URL); // Should log "http://localhost:3000"

const QUESTION_TYPES = [
  { value: 'PI', label: 'Personal Info', needsAnswer: false },
  { value: 'Short', label: 'Short Answer', needsAnswer: true, defaultPoints: 3 },
  { value: 'Long', label: 'Long Answer', needsAnswer: true, defaultPoints: 10 },
  { value: 'MCQ', label: 'Multiple Choice', needsAnswer: true, defaultPoints: 1 },
  { value: 'Blank', label: 'Fill in the Blank', needsAnswer: true, defaultPoints: 1 },
  { value: 'One-Word Answer', label: 'One-Word Answer', needsAnswer: true, defaultPoints: 1 },
]

const DEFAULT_SECTIONS = ['Personal Info']

// Helper to get current sections based on quiz title
const getCurrentSections = (quizTitleValue) => {
  return ['Personal Info', quizTitleValue.trim() || 'Quiz']
}

function MetaBuilder({ devMode = false }) {
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
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [aiError, setAiError] = useState('')
  
  // Quiz Title (topic name) - NEW FIELD
  const [quizTitle, setQuizTitle] = useState('')
  const [quizId, setQuizId] = useState('')
  const [isQuizIdManuallyEdited, setIsQuizIdManuallyEdited] = useState(false)
  
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
  
  // Current quiz for storage
  const [currentQuizId, setCurrentQuizId] = useState(null)
  
  // Hidden file input for uploading meta files
  const fileInputRef = useRef(null)
  
  // Undo/Redo state
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Dark/Light theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('metaBuilderTheme')
    return saved ? saved === 'dark' : true
  })
  
  // Drag and drop state
  const [draggedRowId, setDraggedRowId] = useState(null)

  // Save to history for undo/redo
  const saveToHistory = (newData) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.stringify(newData))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevData = JSON.parse(history[historyIndex - 1])
      setMetaData(prevData)
      setHistoryIndex(historyIndex - 1)
    }
  }

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextData = JSON.parse(history[historyIndex + 1])
      setMetaData(nextData)
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('metaBuilderTheme', newMode ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light')
  }

  // Update row with history save
  const updateRow = (id, field, value) => {
    const newData = metaData.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    )
    saveToHistory(newData)
    setMetaData(newData)
  }

  // Delete row with history save
  const deleteRow = (id) => {
    saveToHistory(metaData.filter(row => row.id !== id))
    setMetaData(metaData.filter(row => row.id !== id))
  }

  // Move row with history save
  const moveRow = (id, direction) => {
    const index = metaData.findIndex(row => row.id === id)
    const newData = [...metaData]
    if (direction === 'up' && index > 0) {
      ;[newData[index - 1], newData[index]] = [newData[index], newData[index - 1]]
      saveToHistory(newData)
      setMetaData(newData)
    } else if (direction === 'down' && index < metaData.length - 1) {
      ;[newData[index], newData[index + 1]] = [newData[index + 1], newData[index]]
      saveToHistory(newData)
      setMetaData(newData)
    }
  }

  // Duplicate row
  const duplicateRow = (id) => {
    const row = metaData.find(r => r.id === id)
    if (row) {
      const newRow = {
        ...row,
        id: nextId,
        column_name: row.column_name + ' (copy)'
      }
      const newData = [...metaData]
      const index = metaData.findIndex(r => r.id === id)
      newData.splice(index + 1, 0, newRow)
      saveToHistory(newData)
      setMetaData(newData)
      setNextId(nextId + 1)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e, rowId) => {
    setDraggedRowId(rowId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, rowId) => {
    e.preventDefault()
    if (draggedRowId === rowId) return
    
    const newData = [...metaData]
    const draggedIndex = metaData.findIndex(r => r.id === draggedRowId)
    const targetIndex = metaData.findIndex(r => r.id === rowId)
    
    const [draggedItem] = newData.splice(draggedIndex, 1)
    newData.splice(targetIndex, 0, draggedItem)
    
    setMetaData(newData)
  }

  const handleDragEnd = () => {
    if (draggedRowId) {
      saveToHistory(metaData)
    }
    setDraggedRowId(null)
  }

  // // Generate Quiz ID from title
  // const generateQuizId = (title) => {
  //   return title
  //     .toLowerCase()
  //     .replace(/[^a-z0-9\s]/g, '')
  //     .replace(/\s+/g, '_')
  //     .slice(0, 50)
  // }

  // Generate short, readable, unique Quiz ID from title
  const generateQuizId = (title) => {
    if (!title || !title.trim()) return `QUIZ_${Date.now().toString(36).toUpperCase()}`
    
    // Step 1: Extract meaningful words (remove common filler words)
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'quiz', 'test', 'exam', 'assessment']
    
    const words = title
      .trim()
      .split(/[\s\-_]+/)
      .filter(w => w.length > 2) // Skip very short words
      .filter(w => !fillerWords.includes(w.toLowerCase()))
      .map(w => w.replace(/[^a-zA-Z0-9]/g, '')) // Remove special chars
      .filter(w => w.length > 0)
    
    // Step 2: Build abbreviation from first 2-3 significant words
    const abbrevParts = words.slice(0, 3).map(w => {
      // Take first 4 chars of each word, uppercase
      return w.substring(0, 4).toUpperCase()
    })
    
    const abbrev = abbrevParts.join('_')
    
    // Step 3: Add short date suffix (YYMMDD) for uniqueness
    const now = new Date()
    const dateSuffix = now.toISOString().slice(2, 10).replace(/-/g, '').slice(0, 6) // "260423"
    
    // Step 4: Combine and ensure reasonable length
    const quizId = `${abbrev}_${dateSuffix}`
    
    // Fallback if abbreviation is empty
    return quizId.length > 3 && quizId.length <= 20 
      ? quizId 
      : `QZ_${abbrev || 'GEN'}_${dateSuffix}`
  }

  // Update quiz title and sync all question sections
  const handleQuizTitleChange = (newTitle) => {
    setQuizTitle(newTitle)
    
    // Auto-generate Quiz ID if not manually edited
    if (!isQuizIdManuallyEdited) {
      setQuizId(generateQuizId(newTitle))
    }

    const sectionName = newTitle.trim() || 'Quiz'
    const newData = metaData.map(row => 
      row.type !== 'PI' ? { ...row, section: sectionName } : row
    )
    saveToHistory(newData)
    setMetaData(newData)
  }

  // Load from localStorage on mount
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    const savedMeta = localStorage.getItem('metaBuilderData')
    if (savedMeta) {
      try {
        const parsed = JSON.parse(savedMeta)
        setMetaData(parsed.metaData || parsed)
        setNextId(parsed.nextId || 5)
        setQuizTitle(parsed.quizTitle || '')
        setQuizId(parsed.quizId || '')
        setIsQuizIdManuallyEdited(parsed.isQuizIdManuallyEdited || false)
      } catch (e) {
        console.error('Failed to load saved meta:', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage when data changes (only after initial load)
  useEffect(() => {
    if (!isLoaded) return
    const dataToSave = { metaData, nextId, quizTitle, quizId, isQuizIdManuallyEdited }
    localStorage.setItem('metaBuilderData', JSON.stringify(dataToSave))
  }, [metaData, nextId, quizTitle, quizId, isQuizIdManuallyEdited, isLoaded])

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const downloadCSV = async () => {
    // Check if quiz title is set
    if (!quizTitle.trim()) {
      alert('Please enter a Quiz Title before downloading.')
      document.getElementById('quiz-title-input')?.focus()
      return
    }
    
    const headers = ['column_name', 'section', 'total_points', 'type', 'correct_answer', 'mcq_options']
    const csvContent = [
      headers.join(','),
      ...metaData.map(row => {
        const values = [
          row.column_name,
          row.section,
          row.total_points,
          row.type,
          row.type === 'MCQ' ? '' : row.correct_answer, // Don't put correct answer in old field for MCQ
          row.type === 'MCQ' ? (row.correct_answer || '') : '' // MCQ options go in new column
        ]
        return values.map(val => {
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val
        }).join(',')
      })
    ].join('\n')

    // Generate filename from quiz id or fallback
    const titleForFilename = quizId.trim() || quizTitle.trim() || 'Untitled_Quiz'
    const safeTitle = titleForFilename
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
    const timestamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')
    const downloadFilename = `${safeTitle}_${timestamp}.csv`

    // Download file locally
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = downloadFilename
    link.click()
    URL.revokeObjectURL(url)
    
    // Save to storage
    try {
      let targetQuizId = currentQuizId
      
      if (!targetQuizId) {
        // Create new quiz first using the entered quiz title and custom ID
        const createQuizTitle = quizTitle.trim() || 'Untitled Quiz'
        const createResponse = await fetch(`${API_URL}/storage/quiz/create`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: createQuizTitle,
            description: formDescription || '',
            id: quizId.trim() || null
          }),
        })
        const quizData = await createResponse.json()
        if (quizData.success) {
          targetQuizId = quizData.quiz.id
          setCurrentQuizId(targetQuizId)
        }
      }
      
      if (targetQuizId) {
        // Save meta file to storage
        const formData = new FormData()
        const csvFile = new File([csvContent], downloadFilename, { type: 'text/csv' })
        formData.append('meta_file', csvFile)
        
        await fetch(`${API_URL}/storage/meta/save?quiz_id=${targetQuizId}`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true' },
          body: formData,
        })
        console.log('Meta file saved to storage')
      }
    } catch (err) {
      console.error('Failed to save to storage:', err)
    }
}

  const loadSampleData = () => {
    setQuizTitle('Machine Learning Basics')
    setMetaData([
      { id: 1, column_name: 'Name', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 2, column_name: 'Email', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 3, column_name: 'Enrollment Number', section: 'Personal Info', total_points: 0, type: 'PI', correct_answer: '' },
      { id: 4, column_name: 'What is Machine Learning?', section: 'Machine Learning Basics', total_points: 3, type: 'Short', correct_answer: '' },
      { id: 5, column_name: 'Explain neural networks', section: 'Machine Learning Basics', total_points: 10, type: 'Long', correct_answer: '' },
      { 
        id: 6, 
        column_name: 'Which is a supervised learning algorithm?', 
        section: 'Machine Learning Basics', 
        total_points: 1, 
        type: 'MCQ', 
        correct_answer: JSON.stringify([
          { text: 'Classification', isCorrect: true },
          { text: 'Clustering', isCorrect: false },
          { text: 'K-Means', isCorrect: false },
          { text: 'PCA', isCorrect: false }
        ])
      },
    ])
    setNextId(7)
  }
  
  const validateMCQOptions = (jsonString) => {
    try {
      const opts = JSON.parse(jsonString)
      if (!Array.isArray(opts)) return false
      if (opts.length === 0) return false
      if (!opts.some(o => o.isCorrect)) return false
      return opts.every(o => typeof o.text === 'string' && typeof o.isCorrect === 'boolean')
    } catch {
      return false
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target.result
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          alert('File appears to be empty or invalid')
          return
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

        const colIndex = {
          column_name: headers.indexOf('column_name'),
          section: headers.indexOf('section'),
          total_points: headers.indexOf('total_points'),
          type: headers.indexOf('type'),
          correct_answer: headers.indexOf('correct_answer'),
          mcq_options: headers.indexOf('mcq_options')
        }
        
        const newMetaData = []
        let newId = 1
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          if (values.length < headers.length) continue
          
          const row = {}
          headers.forEach((h, idx) => {
            row[h] = values[idx] ? values[idx].trim().replace(/^"|"$/g, '') : ''
          })
          
          if (row.column_name) {
            let correctAnswer = row.correct_answer || ''
            
            if (row.type === 'MCQ' && colIndex.mcq_options >= 0 && values[colIndex.mcq_options]) {
              try {
                const mcqOptions = JSON.parse(values[colIndex.mcq_options])
                if (Array.isArray(mcqOptions) && mcqOptions.length > 0) {
                  if (validateMCQOptions(values[colIndex.mcq_options])) {
                    correctAnswer = values[colIndex.mcq_options]
                  } else {
                    console.warn(`Invalid MCQ options for "${row.column_name}"`)
                  }
                }
              } catch (parseErr) {
                console.warn(`Failed to parse MCQ options for "${row.column_name}":`, parseErr)
              }
            }
            
            newMetaData.push({
              id: newId++,
              column_name: row.column_name || '',
              section: row.section || 'Quiz',
              total_points: parseFloat(row.total_points) || 0,
              type: row.type || 'Short',
              correct_answer: correctAnswer
            })
          }
        }
        
        if (newMetaData.length > 0) {
          // Extract quiz title from first non-PI row's section
          const nonPIRows = newMetaData.filter(r => r.type !== 'PI')
          const extractedTitle = nonPIRows.length > 0 ? nonPIRows[0].section : ''
          const mcqCount = newMetaData.filter(r => r.type === 'MCQ').length
          
          // Set quiz title and auto-generate quiz ID
          if (extractedTitle) {
            handleQuizTitleChange(extractedTitle)
          }
          
          setMetaData(newMetaData)
          setNextId(newId)
          alert(`✅ Loaded ${newMetaData.length} questions (${mcqCount} MCQ) for quiz: "${extractedTitle}"`)
        } else {
          alert('No valid questions found in file')
        }
      } catch (err) {
        console.error('Error parsing file:', err)
        alert('Failed to parse file: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  
  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',' && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }
    }
    result.push(current)
    return result
  }

  const addRow = (type = 'Short') => {
    const typeInfo = QUESTION_TYPES.find(t => t.value === type) || QUESTION_TYPES[1]
    const sectionName = quizTitle.trim() || 'Quiz'
    const newRow = {
      id: nextId,
      column_name: '',
      section: sectionName,
      total_points: typeInfo.defaultPoints || 3,
      type: type,
      correct_answer: ''
    }
    const newData = [...metaData, newRow]
    saveToHistory(newData)
    setMetaData(newData)
    setNextId(nextId + 1)
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
    if (!quizTitle.trim()) {
      setCreateFormError('Please enter a quiz topic/title')
      return
    }

    const questions = metaData
      //.filter(row => row.type !== 'PI') send all questions including personal info
      .map(row => ({
        question_text: row.column_name,
        type: row.type,
        correct_answer: row.correct_answer || '',
        total_points: row.total_points || 0,
        required: true,
      }))

     if (questions.length === 0) {
       setCreateFormError('Please add at least one question to the meta file')
       return
     }

// Use the quiz title from the Meta Builder as the form title
      const formTitleToUse = quizTitle.trim()

     setIsCreating(true)
     setCreateFormError('')

     try {
       // Step 1: Create form with title only
       const createResponse = await fetch(`${API_URL}/forms/create`, {
         method: 'POST',
         headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify({
           title: formTitleToUse,
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
       
       // Save quiz and meta file to storage
       try {
         const quizResponse = await fetch(`${API_URL}/storage/quiz/create`, {
           method: 'POST',
           headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
           body: JSON.stringify({
             title: formTitleToUse,
             description: formDescription || '',
             google_form_id: createData.form_id,
             google_form_url: createData.form_url,
             id: quizId.trim() || null
           }),
         })
         const quizData = await quizResponse.json()
         if (quizData.success) {
           const targetQuizId = quizData.quiz.id
           setCurrentQuizId(targetQuizId)
           
           // Save meta file
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
           
           const metaFormData = new FormData()
           const csvFile = new File([csvContent], `${formTitleToUse.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').toLowerCase()}_meta.csv`, { type: 'text/csv' })
           metaFormData.append('meta_file', csvFile)
           
           const metaSaveUrl = `${API_URL}/storage/meta/save?quiz_id=${targetQuizId}`
           await fetch(metaSaveUrl, {
             method: 'POST',
             headers: { 'ngrok-skip-browser-warning': 'true' },
             body: metaFormData,
           })
           console.log('Quiz and meta file saved to storage')
         }
       } catch (err) {
         console.error('Failed to save quiz to storage:', err)
       }
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
        headers: {
		'ngrok-skip-browser-warning': 'true',
		'Content-Type': 'application/json',
		}, body: JSON.stringify({
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

  const parseMCQOptions = (mcqOptionsStr, correctAnswerStr) => {
    if (!mcqOptionsStr) return ''
    try {
      const options = []
      const lines = mcqOptionsStr.split('\n').filter(l => l.trim())
      
      lines.forEach((line) => {
        const match = line.match(/^([A-D])\)\s*(.*)/)
        if (match) {
          const letter = match[1]
          const text = match[2].trim()
          options.push({
            text: text,
            isCorrect: false,
            letter: letter
          })
        }
      })
      
      // Find correct option by matching text
      if (correctAnswerStr && options.length > 0) {
        const correctText = correctAnswerStr.trim().toLowerCase()
        let matched = false
        
        // Try exact letter match first (if correctAnswer is just "A", "B", etc.)
        if (correctText.length === 1 && /^[abcd]$/.test(correctText)) {
          const correctOpt = options.find(opt => opt.letter === correctText.toUpperCase())
          if (correctOpt) {
            correctOpt.isCorrect = true
            matched = true
          }
        }
        
        // Try to find matching option by text content
        if (!matched) {
          const correctIdx = options.findIndex(opt => {
            const optText = opt.text.toLowerCase()
            return optText === correctText || 
                   optText.includes(correctText) || 
                   correctText.includes(optText)
          })
          if (correctIdx >= 0) {
            options[correctIdx].isCorrect = true
            matched = true
          }
        }
      }
      
      // Ensure at least one option is marked correct
      if (!options.some(o => o.isCorrect) && options.length > 0) {
        options[0].isCorrect = true
      }
      
      // Remove helper letter property before stringifying
      const cleanOptions = options.map(({ letter, ...rest }) => rest)
      
      return JSON.stringify(cleanOptions)
    } catch {
      return ''
    }
  }

  const addSuggestionToMeta = (suggestion) => {
    const questionType = suggestion.type || aiQuestionType
    let correctAnswer = ''

    if (questionType === 'MCQ' && suggestion.mcq_options) {
      correctAnswer = parseMCQOptions(suggestion.mcq_options, suggestion.correct_answer)
    } else {
      correctAnswer = suggestion.correct_answer || ''
    }

    const newRow = {
      id: nextId,
      column_name: suggestion.question_text,
      section: customSections[0] || 'Quiz',
      total_points: suggestion.suggested_points || 3,
      type: questionType,
      correct_answer: correctAnswer,
    }
    setMetaData([...metaData, newRow])
    setNextId(nextId + 1)
    setAiSuggestions(aiSuggestions.filter(s => s !== suggestion))
  }

  const addAllSuggestions = () => {
    const newRows = aiSuggestions.map(s => {
      const questionType = s.type || aiQuestionType
      let correctAnswer = ''

      if (questionType === 'MCQ' && s.mcq_options) {
        correctAnswer = parseMCQOptions(s.mcq_options, s.correct_answer)
      } else {
        correctAnswer = s.correct_answer || ''
      }

      return {
        id: nextId + aiSuggestions.indexOf(s),
        column_name: s.question_text,
        section: customSections[0] || 'Quiz',
        total_points: s.suggested_points || 3,
        type: questionType,
        correct_answer: correctAnswer,
      }
    })
    setMetaData([...metaData, ...newRows])
    setNextId(nextId + newRows.length)
    setAiSuggestions([])
  }

  const allSections = getCurrentSections(quizTitle)

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

        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          <button 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: historyIndex <= 0 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <Undo size={16} />
          </button>
          <button 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              cursor: historyIndex >= history.length - 1 ? 'not-allowed' : 'pointer',
              opacity: historyIndex >= history.length - 1 ? 0.4 : 1,
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <Redo size={16} />
          </button>
          <button 
            onClick={toggleTheme}
            title="Toggle Theme"
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{ flex: 1 }}></div>

        <button 
          className="btn" 
          onClick={() => fileInputRef.current?.click()}
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
          <Upload size={16} /> Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        {devMode && (
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
        )}
        {devMode && (
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
        )}
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

{/* Quiz Title & ID Fields - Below Stats */}
       <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          padding: '1.5rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          justifyContent: 'center',
          alignItems: 'flex-end',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '2', minWidth: '300px', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="quiz-title-input" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
              Quiz Topic / Title *
            </label>
            <input
              id="quiz-title-input"
              type="text"
              placeholder="Enter quiz topic (e.g., Machine Learning Basics)"
              value={quizTitle}
              onChange={(e) => handleQuizTitleChange(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%',
                background: 'var(--bg-primary)',
                padding: '0.75rem 1rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ flex: '1', minWidth: '200px', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="quiz-id-input" style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
              Quiz ID (Auto-generated)
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="quiz-id-input"
                type="text"
                placeholder="quiz_id"
                value={quizId}
                onChange={(e) => {
                  setQuizId(e.target.value)
                  setIsQuizIdManuallyEdited(true)
                }}
                style={{
                  ...inputStyle,
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  color: isQuizIdManuallyEdited ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}
              />
              {isQuizIdManuallyEdited && (
                <button
                  onClick={() => {
                    setIsQuizIdManuallyEdited(false)
                    setQuizId(generateQuizId(quizTitle))
                  }}
                  title="Reset to auto-generated ID"
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <Undo size={14} />
                </button>
              )}
            </div>
          </div>
       </div> 


      {/* Data Table */}
      <div className="table-container" style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', padding: '0.5rem' }}></th>
                <th style={{ width: '70px', padding: '0.5rem' }}>Actions</th>
                <th style={{ minWidth: '250px', padding: '0.5rem' }}>Column / Question</th>
                <th style={{ width: '140px', padding: '0.5rem' }}>Section</th>
                <th style={{ width: '80px', padding: '0.5rem' }}>Points</th>
                <th style={{ width: '140px', padding: '0.5rem' }}>Type</th>
                <th style={{ minWidth: '180px', padding: '0.5rem' }}>Correct Answer</th>
                <th style={{ width: '50px', padding: '0.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {metaData.map((row, index) => (
                <tr 
                  key={row.id} 
                  onDragOver={(e) => handleDragOver(e, row.id)}
                  style={{ 
                    background: draggedRowId === row.id ? 'rgba(99, 102, 241, 0.1)' : undefined,
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td 
                    draggable
                    onDragStart={(e) => handleDragStart(e, row.id)}
                    onDragEnd={handleDragEnd}
                    style={{ 
                      padding: '0.5rem', 
                      cursor: 'grab', 
                      textAlign: 'center',
                      color: 'var(--text-tertiary)'
                    }}
                    title="Drag to reorder"
                  >
                    <GripVertical size={18} />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button 
                          onClick={() => moveRow(row.id, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.3 : 0.7,
                            padding: '2px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button 
                          onClick={() => moveRow(row.id, 'down')}
                          disabled={index === metaData.length - 1}
                          title="Move Down"
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: index === metaData.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === metaData.length - 1 ? 0.3 : 0.7,
                            padding: '2px',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button 
                          onClick={() => duplicateRow(row.id)}
                          title="Duplicate Question"
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            padding: '2px',
                            color: 'var(--accent-primary)'
                          }}
                        >
                          <CopyIcon size={14} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <textarea
                      value={row.column_name}
                      onChange={(e) => updateRow(row.id, 'column_name', e.target.value)}
                      placeholder={row.type === 'PI' ? 'Field Name' : 'Enter question...'}
                      rows={1}
                      style={{ 
                        ...inputStyle,
                        minHeight: '38px',
                        height: 'auto',
                        resize: 'vertical',
                        background: row.type === 'PI' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        fontWeight: row.type === 'PI' ? '400' : '500',
                        overflow: 'hidden',
                        wordWrap: 'break-word'
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
                        minWidth: '70px',
                        width: '75px',
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
					  {row.type === 'MCQ' ? (
						<MCQOptionEditor
						  value={row.correct_answer}
						  onChange={(val) => updateRow(row.id, 'correct_answer', val)}
						  rowId={row.id}
						/>
					  ) : (
						<textarea
						  value={row.correct_answer}
						  onChange={(e) => updateRow(row.id, 'correct_answer', e.target.value)}
						  placeholder={row.type === 'PI' ? '-' : 'Reference answer...'}
						  disabled={row.type === 'PI'}
						  rows={1}
						  style={{
							...inputStyle,
							minHeight: '38px',
							height: 'auto',
							resize: 'vertical',
							background: row.type === 'PI' ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
							opacity: row.type === 'PI' ? 0.5 : 1,
							overflow: 'hidden',
							wordWrap: 'break-word'
						  }}
						/>
					  )}
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
                <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>column_name,section,total_points,type,correct_answer,mcq_options</span>
{'\n'}
{metaData.map(row => 
  `"${row.column_name}","${row.section}",${row.total_points},${row.type},"${row.type === 'MCQ' ? '' : row.correct_answer || ''}","${row.type === 'MCQ' ? row.correct_answer || '' : ''}"`
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
