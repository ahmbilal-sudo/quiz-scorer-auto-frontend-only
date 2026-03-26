import { useState, useRef } from 'react'
import { Upload, FileText, X, Play, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react'

function FileUpload({ files, onFilesAdded, onRemoveFile, onClearAll, onProcess, isProcessing }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [showFormatHelp, setShowFormatHelp] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.json') || file.name.endsWith('.csv')
    )
    
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.name.endsWith('.json') || file.name.endsWith('.csv')
    )
    
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles)
    }
    
    e.target.value = ''
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      <div 
        className={`upload-section ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        <div className="upload-icon">
          <Upload />
        </div>
        
        <h2>Upload Graded Results</h2>
        <p>Drag and drop JSON or CSV files here, or click to browse</p>
        <small>You can upload multiple files. Each file can contain results for multiple students.</small>
      </div>

      {/* Sample Format Help Section */}
      <div className="format-help-section" style={{ marginTop: '1.5rem' }}>
        <button 
          className="format-help-toggle"
          onClick={() => setShowFormatHelp(!showFormatHelp)}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontWeight: '600' }}>Expected File Format</span>
          </div>
          {showFormatHelp ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showFormatHelp && (
          <div className="format-help-content" style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '1rem',
            marginTop: '-8px'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Upload a CSV or JSON file with graded quiz results. The file must contain the following columns:
            </p>
            
            <div style={{ fontSize: '0.8rem' }}>
              <strong style={{ color: 'var(--accent-primary)' }}>CSV Columns Required:</strong>
              <div style={{ 
                background: 'var(--bg-primary)', 
                padding: '0.75rem', 
                borderRadius: '6px',
                marginTop: '0.5rem',
                fontFamily: 'monospace',
                overflowX: 'auto'
              }}>
                Student Name, Email, Source, Question ID, Question, Student Answer, Correct Answer, Score, Max Score, Percentage, Feedback, Question Type, Confidence
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
              <strong style={{ color: 'var(--accent-primary)' }}>JSON Format:</strong>
              <div style={{ 
                background: 'var(--bg-primary)', 
                padding: '0.75rem', 
                borderRadius: '6px',
                marginTop: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflowX: 'auto',
                whiteSpace: 'pre'
              }}>
{`[
  {
    "status": "success",
    "source": "csv" | "handwritten",
    "metadata": {
      "Name": "Student Name",
      "Email": "email@example.com"
    },
    "grades": {
      "results": [
        {
          "question_id": "Q1",
          "question_text": "What is ML?",
          "student_answer": "Learning from data",
          "correct_answer": "To learn from data",
          "score": 3,
          "max_score": 3,
          "feedback": "Good answer",
          "question_type": "Short",
          "confidence": 0.95
        }
      ],
      "total_score": 25,
      "max_total_score": 34,
      "percentage": 73.5
    }
  }
]`}
              </div>
            </div>

            <div style={{ 
              fontSize: '0.8rem', 
              marginTop: '1rem', 
              padding: '0.5rem',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '6px',
              borderLeft: '3px solid var(--accent-primary)'
            }}>
              <strong>Notes:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                <li><strong>Student Name</strong> (required): Student's name</li>
                <li><strong>Email</strong> (optional): Student's email</li>
                <li><strong>Source</strong> (optional): "csv" for Google Forms, "handwritten" for scanned images</li>
                <li><strong>Question ID</strong> (required): e.g., Q1, Q2, etc.</li>
                <li><strong>Question</strong> (required): The question text</li>
                <li><strong>Student Answer</strong> (required): Student's submitted answer</li>
                <li><strong>Score</strong> (required): Points earned</li>
                <li><strong>Max Score</strong> (required): Maximum possible points</li>
                <li><strong>Question Type</strong> (optional): Short, Long, MCQ, Blank, One-Word Answer</li>
                <li><strong>Feedback</strong> (optional): Grading feedback</li>
                <li><strong>Confidence</strong> (optional, handwritten only): Parsing confidence (0.0 - 1.0)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <h4>Uploaded Files ({files.length})</h4>
            <button className="btn btn-outline btn-sm" onClick={onClearAll}>
              <Trash2 size={16} />
              Clear All
            </button>
          </div>

          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <div className="file-icon">
                  <FileText />
                </div>
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button 
                className="btn-icon" 
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFile(index)
                }}
              >
                <X size={18} />
              </button>
            </div>
          ))}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={onProcess}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18 }}></span>
                Processing...
              </>
            ) : (
              <>
                <Play size={18} />
                Process Files & Generate Dashboard
              </>
            )}
          </button>
        </div>
      )}
    </>
  )
}

export default FileUpload
