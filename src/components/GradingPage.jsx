import { useState, useRef } from 'react'
import { Upload, FileText, X, Play, Loader2, Save, Download, AlertCircle, Check, Image } from 'lucide-react'

function GradingPage({ devMode = false, onGradeComplete, onNavigate }) {
  const [gradingMode, setGradingMode] = useState('csv') // csv, handwritten, both
  const [responseFile, setResponseFile] = useState(null)
  const [metaFile, setMetaFile] = useState(null)
  const [handwrittenFiles, setHandwrittenFiles] = useState([])
  
  // Options
  const [strictness, setStrictness] = useState('moderate')
  const [outputFormat, setOutputFormat] = useState('json')
  const [debugMode, setDebugMode] = useState(false)
  const [saveToResults, setSaveToResults] = useState(false)
  
  // State
  const [isGrading, setIsGrading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
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

  const handleFileChange = (type, e) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (type === 'response') setResponseFile(file)
    else if (type === 'meta') setMetaFile(file)
    
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

  const handleGrade = async () => {
    setError('')
    setSuccess('')
    
    // Validation
    if (gradingMode === 'csv' || gradingMode === 'both') {
      if (!responseFile) {
        setError('Please upload a response CSV file')
        return
      }
    }
    if (gradingMode === 'handwritten' || gradingMode === 'both') {
      if (handwrittenFiles.length === 0) {
        setError('Please upload at least one handwritten image')
        return
      }
    }
    if (!metaFile) {
      setError('Please upload a meta CSV file')
      return
    }

    setIsGrading(true)

    try {
      const formData = new FormData()
      formData.append('meta_file', metaFile)
      formData.append('grading_strictness', strictness)
      
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
      let response = null

      if (gradingMode === 'csv') {
        formData.append('response_file', responseFile)
        endpoint = `${HOST_URL}/grade/csv`
        response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      } else if (gradingMode === 'handwritten') {
        handwrittenFiles.forEach(file => {
          formData.append('images', file)
        })
        endpoint = `${HOST_URL}/grade/handwritten`
        response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      } else if (gradingMode === 'both') {
        formData.append('response_file', responseFile)
        handwrittenFiles.forEach(file => {
          formData.append('images', file)
        })
        endpoint = `${HOST_URL}/grade/both`
        response = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}: Grade failed`)
      }

      if (outputFormat === 'json' || !devMode) {
        const gradedData = await response.json()
        
        // Auto-process results
        if (onGradeComplete) {
          onGradeComplete(gradedData)
        }
        
        setSuccess('Grading complete! Redirecting to results...')
        
        // Navigate to dashboard after a short delay
		if (!devMode) {
			setTimeout(() => {
			  if (onNavigate) {
				onNavigate('dashboard')
			  }
			}, 1500)
		}
      } else {
        // CSV response - trigger download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `graded_results_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        setSuccess('Grading complete! File downloaded.')
      }

    } catch (err) {
      setError(err.message || 'Grading failed. Please check your files and try again.')
    } finally {
      setIsGrading(false)
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
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Handwritten Images {gradingMode === 'handwritten' ? '*' : '(Optional)'}
            </h3>
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
              <button onClick={() => removeFile('meta')} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.25rem' }}>
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

      {/* Grade Button */}
      <button
        onClick={handleGrade}
        disabled={isGrading || (!responseFile && !handwrittenFiles.length) || !metaFile}
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