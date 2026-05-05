import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, X, Play, Loader2, Save, Download, AlertCircle, Check, Image, FolderOpen, RefreshCw, User, Trash2 } from 'lucide-react'

function GradingPage({ devMode = false, onGradeComplete, onNavigate }) {
  const [gradingMode, setGradingMode] = useState('csv') // csv, handwritten, both
  const [responseFile, setResponseFile] = useState(null)
  const [metaFile, setMetaFile] = useState(null)
  const [handwrittenFiles, setHandwrittenFiles] = useState([])
  const [useStoredSubmissions, setUseStoredSubmissions] = useState(false)
  const [detectedSubmissions, setDetectedSubmissions] = useState([])
  const [isFetchingSubmissions, setIsFetchingSubmissions] = useState(false)
  
  // Local storage options
  const [metaFilesList, setMetaFilesList] = useState([])
  const [selectedMetaFile, setSelectedMetaFile] = useState(null)
  const [loadingMetaFiles, setLoadingMetaFiles] = useState(false)
  const [useLocalMeta, setUseLocalMeta] = useState(false)

  // Image resize controls for handwritten uploads
  const [imageResizeOption, setImageResizeOption] = useState(1600)
  const [resizeBeforeUpload, setResizeBeforeUpload] = useState(true)
  
  // Options
  const [strictness, setStrictness] = useState('moderate')
  const [outputFormat, setOutputFormat] = useState('json')
  const [debugMode, setDebugMode] = useState(false)
  const [saveToResults, setSaveToResults] = useState(false)
  
  // State
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [gradingProgress, setGradingProgress] = useState({ message: '', current: 0, total: 0, status: '' })
  
  const responseInputRef = useRef(null)
  const metaInputRef = useRef(null)
  const handwrittenInputRef = useRef(null)
  
  const getBackendUrl = () => {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = '3000'
    return `${protocol}//${hostname}:${port}`
  }
  
  const HOST_URL = getBackendUrl()

  const fetchMetaFiles = async () => {
    setLoadingMetaFiles(true)
    try {
      const response = await fetch(`${HOST_URL}/storage/meta/list`)
      const data = await response.json()
      if (data.success) {
        // Transform data to include display title for dropdown
        const transformed = (data.meta_files || []).map(meta => ({
          ...meta,
          // Use quiz display title if available, otherwise fall back to title
          displayName: meta.quiz_display_title || meta.quiz_title || 'Unknown Quiz'
        }))
        setMetaFilesList(transformed)
      }
    } catch (err) {
      console.error('Failed to fetch meta files:', err)
    } finally {
      setLoadingMetaFiles(false)
    }
  }

  useEffect(() => {
    fetchMetaFiles()
  }, [])

  const handleMetaFileSelect = async (metaFileId) => {
    if (!metaFileId) {
      setSelectedMetaFile(null)
      setUseLocalMeta(false)
      return
    }
    
    const meta = metaFilesList.find(m => m.id === metaFileId)
    if (!meta) return
    
    setSelectedMetaFile(meta)
    setUseLocalMeta(true)
    setMetaFile(null)
    
    try {
      const response = await fetch(`${HOST_URL}/storage/meta/${metaFileId}/content`)
      const blob = await response.blob()
      const filename = meta.file_name || 'meta.csv'
      const file = new File([blob], filename, { type: 'text/csv' })
      setMetaFile(file)
    } catch (err) {
      console.error('Failed to load meta file:', err)
      setError('Failed to load selected meta file')
    }
  }

  const handleFileChange = (type, e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (type === 'response') setResponseFile(file)
    else if (type === 'meta') {
      setMetaFile(file)
      setUseLocalMeta(false)
      setSelectedMetaFile(null)
    }
    
    e.target.value = ''
  }

  const handleHandwrittenChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setHandwrittenFiles(prev => [...prev, ...files])
    }
    e.target.value = ''
  }

  const removeFile = (type, index = null) => {
    if (type === 'response') setResponseFile(null)
    else if (type === 'meta') setMetaFile(null)
    else if (type === 'handwritten') {
      setHandwrittenFiles(prev => prev.filter((_, i) => i !== index))
    }
  }

  useEffect(() => {
    setDetectedSubmissions([])
  }, [selectedMetaFile])

  const fetchSubmissions = async () => {
    const quizId = selectedMetaFile?.quiz_id
    if (!quizId) return
    
    setIsFetchingSubmissions(true)
    setDetectedSubmissions([])
    try {
      const response = await fetch(`${HOST_URL}/storage/submissions/${quizId}/list`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      })
      const data = await response.json()
      if (Array.isArray(data.students)) {
        setDetectedSubmissions(data.students)
        if (data.students.length === 0 && data.info) {
          setError(data.info)
        }
      } else if (data.error) {
        setError(data.error)
      } else {
        setDetectedSubmissions([])
        setError('Received unexpected response from server')
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err)
      setError('Failed to connect to backend to fetch submissions')
    } finally {
      setIsFetchingSubmissions(false)
    }
  }

  const resizeImageFile = (file, maxDim) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()
      reader.onload = () => {
        img.onload = () => {
          const w = img.width
          const h = img.height
          const scale = Math.min(1, maxDim / Math.max(w, h))
          const nw = Math.max(1, Math.floor(w * scale))
          const nh = Math.max(1, Math.floor(h * scale))
          const canvas = document.createElement('canvas')
          canvas.width = nw; canvas.height = nh
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, nw, nh)
          try {
            canvas.toBlob((blob) => {
              const newName = file.name
              const newFile = new File([blob], newName, { type: blob.type || file.type })
              resolve(newFile)
            }, file.type || 'image/jpeg', 0.92)
          } catch (e) {
            resolve(file)
          }
        }
        img.onerror = () => resolve(file)
        img.src = reader.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleGrade = async () => {
    setError('')
    setSuccess('')
    
    // Validation
    if (gradingMode === 'handwritten' || gradingMode === 'both') {
      const perImageLimit = 3 * 1024 * 1024
      const totalLimit = 8 * 1024 * 1024
      let total = 0
      for (const f of handwrittenFiles) {
        const sz = f.size || 0
        total += sz
        if (sz > perImageLimit) {
          setError('Each handwritten image must be <= 3MB')
          setIsGrading(false)
          return
        }
      }
      if (total > totalLimit) {
        setError('Total handwritten submissions must be <= 8MB')
        setIsGrading(false)
        return
      }
    }
    if (gradingMode === 'csv' || gradingMode === 'both') {
      if (!responseFile) {
        setError('Please upload a response CSV file')
        return
      }
    }
    if (gradingMode === 'handwritten' || gradingMode === 'both') {
      if (!useStoredSubmissions && handwrittenFiles.length === 0) {
        setError('Please upload at least one handwritten image')
        return
      }
      if (useStoredSubmissions && detectedSubmissions.length === 0) {
        setError('No submissions detected. Please click "Fetch Submissions" first.')
        return
      }
    }
    if (!metaFile) {
      setError('Please upload a meta CSV file')
      return
    }

    setIsGrading(true)
    setError('')
    setSuccess('')
    setGradingProgress({ message: 'Starting grading process...', current: 0, total: 0, status: 'processing' })

    try {
      const formData = new FormData()
      formData.append('meta_file', metaFile)
      formData.append('grading_strictness', strictness)
      // Attach per-question scores blob placeholder for future inline editing integration
      try { formData.append('per_question_scores', JSON.stringify({})) } catch (e) {}
      
      // Dev mode options
      if (devMode) {
        formData.append('output_format', outputFormat)
        formData.append('debug_mode', debugMode)
        formData.append('save_to_results', saveToResults)
      } else {
        formData.append('output_format', 'json')
        formData.append('debug_mode', false)
        formData.append('save_to_results', false)
      }

      let endpoint = ''
      let quizIdForStatus = 'current_grading_task'

      if (gradingMode === 'csv') {
        formData.append('response_file', responseFile)
        endpoint = `${HOST_URL}/grade/csv`
      } else if (gradingMode === 'handwritten') {
        if (useStoredSubmissions) {
          const qId = selectedMetaFile?.quiz_id
          if (!qId) {
            setError('Please select a saved meta file first to use stored submissions')
            setIsGrading(false)
            return
          }
          quizIdForStatus = qId
          endpoint = `${HOST_URL}/grade/handwritten/stored/${qId}`
          const studentIds = detectedSubmissions.map(s => s.student_id).join(',')
          formData.append('selected_students', studentIds)
        } else {
          // Optional client-side resize before upload
          let imagesToSend = handwrittenFiles
          if (resizeBeforeUpload && imageResizeOption > 0) {
            imagesToSend = await Promise.all(handwrittenFiles.map((f) => resizeImageFile(f, imageResizeOption)))
          }
          imagesToSend.forEach(file => formData.append('images', file))
          endpoint = `${HOST_URL}/grade/handwritten`
        }
      } else if (gradingMode === 'both') {
        formData.append('response_file', responseFile)
        handwrittenFiles.forEach(file => {
          formData.append('images', file)
        })
        endpoint = `${HOST_URL}/grade/both`
      }

      // Start progress polling
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${HOST_URL}/grade/status/${quizIdForStatus}`)
          if (res.ok) {
            const data = await res.json()
            setGradingProgress(data)
            if (data.status === 'completed' || data.status === 'failed') {
              clearInterval(pollInterval)
            }
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 1500)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      
      clearInterval(pollInterval)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.detail || `HTTP ${response.status}: Grade failed`)
      }

      setSuccess('Grading completed successfully!')
      
      // Auto-save to history
      await saveResultsToHistory(data)
      
      onGradeComplete(data)
      if (!devMode && onNavigate) {
        onNavigate('dashboard')
      }
    } catch (err) {
      console.error('Grading error:', err)
      setError(err.message || 'An error occurred during grading')
    } finally {
      setIsGrading(false)
      setGradingProgress({ message: '', current: 0, total: 0, status: '' })
    }
  }

  const saveResultsToHistory = async (gradedData) => {
    try {
      const quizId = selectedMetaFile?.quiz_id
      let actualQuizId = quizId
      
      if (!actualQuizId) {
        // Create new quiz if no ID is selected (fallback)
        const quizResponse = await fetch(`${HOST_URL}/storage/quiz/create`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Graded Quiz', description: 'Automatically created from grading session' }),
        })
        const quizData = await quizResponse.json()
        if (quizData.success) {
          actualQuizId = quizData.quiz.id
        }
      }
      
      if (actualQuizId && gradedData) {
        // Convert graded data to the standard history CSV format
        const students = Array.isArray(gradedData) ? gradedData : (gradedData.results || [gradedData])
        
        let csvRows = [
          'Student Name,Email,Question ID,Question,Student Answer,Correct Answer,Score,Max Score,Percentage,Question Type,Feedback,Evidence Path,Source,Student ID,Quiz ID'
        ]
        
        students.forEach(student => {
          if (student.status === 'success' && student.grades) {
            const name = student.metadata?.Name || student.metadata?.name || 'Unknown'
            const email = student.metadata?.Email || student.metadata?.email || ''
            const studentId = student.metadata?.student_id || student.student_id || ''
            const source = student.source || 'handwritten'
            const percentage = student.grades.percentage || 0
            
            // Handle both flat array of grades and the results object
            const gradesList = Array.isArray(student.grades) ? student.grades : (student.grades.results || [])
            
            gradesList.forEach((result, idx) => {
              const qId = result.question_id || result.questionId || `Q${idx + 1}`
              const qText = (result.question_text || result.questionText || '').replace(/"/g, '""')
              const sAns = (result.student_answer || result.studentAnswer || '').replace(/"/g, '""')
              const cAns = (result.correct_answer || result.correctAnswer || '').replace(/"/g, '""')
              const feedback = (result.feedback || '').replace(/"/g, '""')
              const evPath = result.evidence_path || result.evidencePath || ''
              
              csvRows.push(`"${name}","${email}","${qId}","${qText}","${sAns}","${cAns}",${result.score || 0},${result.max_score || result.maxScore || 0},${percentage},${result.question_type || result.questionType || 'Short'},"${feedback}","${evPath}","${source}","${studentId}","${actualQuizId}"`)
            })
          }
        })
        
        const csvContent = csvRows.join('\n')
        const formData = new FormData()
        const csvFile = new File([csvContent], `graded_${actualQuizId}.csv`, { type: 'text/csv' })
        formData.append('graded_file', csvFile)
        // Attach per-question scores blob if available from in-memory edits (localStoragebridge)
        try {
          const perQuestionBlob = localStorage.getItem('quiz_scorer_per_question_scores')
          if (perQuestionBlob) {
            formData.append('per_question_scores', perQuestionBlob)
          }
        } catch (e) {
          // ignore
        }
        
        await fetch(`${HOST_URL}/storage/graded/save?quiz_id=${actualQuizId}`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true' },
          body: formData,
        })
      }
      // Fallback: if quiz id not defined, still save with UNKNWN id
      if (!actualQuizId && gradedData) {
        const fallbackQuizId = 'UNKNWN'
        await fetch(`${HOST_URL}/storage/graded/save?quiz_id=${fallbackQuizId}`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true' },
          body: formData,
        })
      }
    } catch (err) {
      console.error('Failed to save to history:', err)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 1rem',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
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
          <FileText size={24} />
          Grade Quiz
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload quiz responses and meta file to grade them using AI. Results will be saved and viewable in the dashboard.
        </p>
      </div>

      {/* Grading Mode Selection */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '500', color: 'var(--text-primary)' }}>
          Grading Mode
        </label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: 'csv', label: 'CSV Only', desc: 'Google Forms responses' },
            { value: 'handwritten', label: 'Handwritten Only', desc: 'Image answer sheets' },
            { value: 'both', label: 'Both CSV & Handwritten', desc: 'Combined grading' },
          ].map(mode => (
            <label
              key={mode.value}
              style={{
                flex: '1 1 200px',
                padding: '1rem',
                background: gradingMode === mode.value ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                border: `2px solid ${gradingMode === mode.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="radio"
                name="gradingMode"
                value={mode.value}
                checked={gradingMode === mode.value}
                onChange={(e) => {
                  setGradingMode(e.target.value)
                  setError('')
                  setSuccess('')
                }}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{mode.label}</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {mode.desc}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* File Upload Section */}
      <div style={{ display: 'grid', gridTemplateColumns: gradingMode === 'handwritten' ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Response CSV (CSV or Both mode) */}
        {(gradingMode === 'csv' || gradingMode === 'both') && (
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Response CSV File *
            </h3>
            {!responseFile ? (
              <div
                onClick={() => responseInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <Upload style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload Google Forms response CSV</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                  <FileText size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{responseFile.name}</span>
                </div>
                <button onClick={() => removeFile('response')} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.25rem' }}>
                  <X size={18} />
                </button>
              </div>
            )}
            <input
              ref={responseInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange('response', e)}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Handwritten Images (Handwritten or Both mode) */}
        {(gradingMode === 'handwritten' || gradingMode === 'both') && (
          <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                Handwritten Images {gradingMode === 'handwritten' ? '*' : '(Optional)'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="useStored" 
                  checked={useStoredSubmissions}
                  onChange={(e) => setUseStoredSubmissions(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="useStored" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Use Stored Submissions
                </label>
              </div>
            </div>
            
            {!useStoredSubmissions ? (
              <>
                <div
                  onClick={() => handwrittenInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <Image style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload handwritten answer images (PNG, JPG)</p>
                </div>
                {handwrittenFiles.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {handwrittenFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{file.name}</span>
                        <button onClick={() => removeFile('handwritten', idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                padding: '1.25rem', 
                background: 'var(--bg-tertiary)', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FolderOpen size={24} style={{ color: 'var(--accent-primary)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>
                        {selectedMetaFile?.quiz_id ? `Quiz ID: ${selectedMetaFile.quiz_id}` : 'Select Meta File first'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Looking in /submissions/{selectedMetaFile?.quiz_id || '...'}/students/
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); fetchSubmissions(); }}
                    disabled={!selectedMetaFile || isFetchingSubmissions}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.8rem' }}
                  >
                    {isFetchingSubmissions ? <RefreshCw size={14} className="animate-spin" /> : 'Fetch Submissions'}
                  </button>
                </div>

                {detectedSubmissions.length > 0 ? (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Detected {detectedSubmissions.length} student submissions</span>
                    </div>
                    <div style={{ 
                      maxHeight: '180px', 
                      overflowY: 'auto', 
                      background: 'var(--bg-secondary)', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}>
                      {detectedSubmissions.map((s, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '0.6rem 0.8rem',
                          borderBottom: idx === detectedSubmissions.length - 1 ? 'none' : '1px solid var(--border-color)',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={14} style={{ opacity: 0.7 }} />
                            <span style={{ fontWeight: '500' }}>{s.student_id}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {s.has_metadata && <span style={{ color: 'var(--accent-success)' }}>✓ Metadata</span>}
                            <span>{s.page_count} images</span>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                setDetectedSubmissions(prev => prev.filter((_, i) => i !== idx));
                              }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'var(--accent-danger)', 
                                cursor: 'pointer',
                                padding: '0.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.7
                              }}
                              title="Remove submission"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !isFetchingSubmissions && selectedMetaFile && (
                  <div style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.85rem',
                    background: 'rgba(239, 68, 68, 0.05)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px dashed rgba(239, 68, 68, 0.2)'
                  }}>
                    No submissions found yet. Click "Fetch Submissions" to scan.
                  </div>
                )}
              </div>
            )}
            <input
              ref={handwrittenInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleHandwrittenChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Meta CSV (Always required) */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Meta File (Quiz Questions) *
          </h3>
          
          {/* Local Storage Dropdown */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Select from saved meta files
              </label>
              <button
                onClick={fetchMetaFiles}
                disabled={loadingMetaFiles}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-primary)',
                  cursor: loadingMetaFiles ? 'not-allowed' : 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem',
                }}
              >
                {loadingMetaFiles ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh
              </button>
            </div>
            <select
              value={selectedMetaFile?.id || ''}
              onChange={(e) => handleMetaFileSelect(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              <option value="">-- Select a saved meta file --</option>
              {metaFilesList.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.displayName} ({new Date(meta.created_at * 1000).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ padding: '0 0.75rem' }}>OR</span>
            <span style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>
          
          {!metaFile ? (
            <div
              onClick={() => metaInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Upload style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Click to upload quiz meta CSV</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <FileText size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{metaFile.name}</span>
              </div>
              <button onClick={() => {
                removeFile('meta')
                setUseLocalMeta(false)
                setSelectedMetaFile(null)
              }} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.25rem' }}>
                <X size={18} />
              </button>
            </div>
          )}
          <input
            ref={metaInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileChange('meta', e)}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Options Section */}
      <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Grading Options
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Strictness - Always visible */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Grading Strictness
            </label>
            <select
              value={strictness}
              onChange={(e) => setStrictness(e.target.value)}
              style={selectStyle}
            >
              <option value="strict">Strict - Exact matching required</option>
              <option value="moderate">Moderate - Balanced scoring</option>
              <option value="lenient">Lenient - Flexible grading</option>
            </select>
          </div>

          {/* Dev Mode Options */}
          {devMode && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Output Format
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  style={selectStyle}
                >
                  <option value="json">JSON (Auto-process & view)</option>
                  <option value="csv">CSV (Download only)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  Debug Mode
                </label>
                <select
                  value={debugMode}
                  onChange={(e) => setDebugMode(e.target.value === 'true')}
                  style={selectStyle}
                >
                  <option value="false">Off - Process all students</option>
                  <option value="true">On - Limit to 3 students</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="saveToResults"
                  checked={saveToResults}
                  onChange={(e) => setSaveToResults(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="saveToResults" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Save to results folder
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Check size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span style={{ color: '#22c55e', fontSize: '0.9rem' }}>{success}</span>
        </div>
      )}

      {/* Progress Feedback */}
      {isGrading && gradingProgress.message && (
        <div style={{ 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: '1.25rem', 
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {gradingProgress.message}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {gradingProgress.total > 0 ? `${gradingProgress.current} / ${gradingProgress.total}` : ''}
            </span>
          </div>
          
          <div style={{ 
            height: '8px', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '4px', 
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}>
            <div style={{ 
              width: gradingProgress.total > 0 ? `${(gradingProgress.current / gradingProgress.total) * 100}%` : '20%',
              height: '100%',
              background: 'var(--accent-primary)',
              borderRadius: '4px',
              transition: 'width 0.5s ease-out',
              animation: gradingProgress.total === 0 ? 'pulse 2s infinite ease-in-out' : 'none'
            }} />
          </div>
          
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Loader2 size={12} className="animate-spin" />
            <span>AI is analyzing responses. This may take a few minutes...</span>
          </div>
        </div>
      )}

      {/* Grade Button */}
      <button
        onClick={handleGrade}
        disabled={
          isGrading || 
          !selectedMetaFile || 
          (gradingMode === 'handwritten' && !useStoredSubmissions && handwrittenFiles.length === 0) ||
          (gradingMode === 'handwritten' && useStoredSubmissions && detectedSubmissions.length === 0) ||
          (gradingMode === 'csv' && !responseFile) ||
          (gradingMode === 'both' && (!responseFile || (!useStoredSubmissions && handwrittenFiles.length === 0)))
        }
        style={{
          width: '100%',
          padding: '1rem',
          background: isGrading ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: isGrading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          opacity: isGrading ? 0.7 : 1,
        }}
      >
        {isGrading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Grading in progress...
          </>
        ) : (
          <>
            <Play size={20} />
            Grade & View Results
          </>
        )}
      </button>
    </div>
  )
}

export default GradingPage
