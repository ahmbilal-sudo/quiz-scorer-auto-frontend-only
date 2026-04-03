import { useState, useCallback, useMemo } from 'react'
import { GraduationCap, LayoutDashboard, Users, BookOpen, Upload, FileText, X, BarChart3, PieChart, TrendingUp, Award, CheckCircle, HelpCircle, Settings, GitCompare } from 'lucide-react'
import FileUpload from './components/FileUpload'
import Dashboard from './components/Dashboard'
import StudentsTable from './components/StudentsTable'
import QuestionsAnalysis from './components/QuestionsAnalysis'
import MetaBuilder from './components/MetaBuilder'
import StudentCompare from './components/StudentCompare'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [files, setFiles] = useState([])
  const [processedData, setProcessedData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [devMode, setDevMode] = useState(false)

  const handleFilesAdded = useCallback((newFiles) => {
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearAll = useCallback(() => {
    setFiles([])
    setProcessedData(null)
  }, [])

  const processCSVRow = (row) => {
    // Map CSV columns to standard format
    return {
      questionId: row['Question ID'] || row['question_id'] || '',
      questionText: row['Question'] || row['question_text'] || row['Question Text'] || '',
      studentAnswer: row['Student Answer'] || row['student_answer'] || '',
      correctAnswer: row['Correct Answer'] || row['correct_answer'] || '',
      score: parseFloat(row['Score'] || row['score'] || 0),
      maxScore: parseFloat(row['Max Score'] || row['max_score'] || 0),
      feedback: row['Feedback'] || row['feedback'] || '',
      questionType: row['Question Type'] || row['question_type'] || '',
      source: row['Source'] || row['source'] || '',  // CSV or Handwritten
      confidence: row['Confidence'] || row['confidence'] || null  // Parsing confidence
    }
  }

  const handleProcess = useCallback(async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    
    try {
      const allStudents = []
      const allQuestions = []
      const questionMap = new Map()
      const studentMap = new Map() // Track students across multiple files

      for (const file of files) {
        const text = await file.text()
        
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text)
          const students = Array.isArray(data) ? data : [data]
          
          students.forEach(student => {
            if (student.status === 'success' && student.grades) {
              const grades = student.grades
              const results = grades.results || []
              const metadata = student.metadata || {}
              
              const name = metadata.Name || metadata.name || metadata.student_name || 'Unknown'
              const email = metadata.Email || metadata.email || ''
              
              const totalScore = grades.total_score || 0
              const maxScore = grades.max_total_score || results.reduce((sum, r) => sum + (r.max_score || r.maxScore || 0), 0)
              const percentage = grades.percentage || (maxScore > 0 ? (totalScore / maxScore) * 100 : 0)

              const studentQuestions = results.map((result, idx) => {
                const qId = result.question_id || result.questionId || `Q${idx + 1}`
                const qText = result.question_text || result.questionText || qId
                const sAnswer = result.student_answer || result.studentAnswer || ''
                const cAnswer = result.correct_answer || result.correctAnswer || ''
                const scr = result.score || 0
                const mScr = result.max_score || result.maxScore || 0
                
                if (!questionMap.has(qId)) {
                  questionMap.set(qId, {
                    id: qId,
                    question: qText,
                    scores: [],
                    maxScore: mScr,
                    correctAnswer: cAnswer,
                    type: result.question_type || result.questionType || 'Short'
                  })
                }
                
                const qData = questionMap.get(qId)
                qData.scores.push(scr)
                qData.maxScore = Math.max(qData.maxScore, mScr)
                
                return {
                  questionId: qId,
                  questionText: qText,
                  studentAnswer: sAnswer,
                  score: scr,
                  maxScore: mScr,
                  feedback: result.feedback || '',
                  correctAnswer: cAnswer,
                  questionType: result.question_type || result.questionType || ''
                }
              })

              const studentKey = `${name}-${email}`.toLowerCase()
              if (!studentMap.has(studentKey)) {
                studentMap.set(studentKey, allStudents.length)
                allStudents.push({
                  id: `${file.name}-${allStudents.length}`,
                  name,
                  email,
                  totalScore,
                  maxScore,
                  percentage,
                  grades: studentQuestions,
                  sourceFile: file.name,
                  metadata,
                  source: student.source || 'csv',  // Track source: csv or handwritten
                  confidence: student.confidence || null  // For handwritten parsing confidence
                })
              }
            }
          })
        } else if (file.name.endsWith('.csv')) {
          // Parse CSV with improved multi-line handling
          const { headers, rows } = parseCSV(text)
          if (headers.length < 2 || rows.length < 1) continue
          
          for (let i = 0; i < rows.length; i++) {
            const values = rows[i]
            if (values.length !== headers.length) continue
            
            const row = {}
            headers.forEach((h, idx) => row[h] = values[idx])
            
            const name = row['Student Name'] || row['Name'] || 'Unknown'
            const email = row['Email'] || ''
            const qData = processCSVRow(row)
            const source = row['Source'] || ''  // Get source from CSV
            
            const studentKey = `${name}-${email}`.toLowerCase()
            
            if (!studentMap.has(studentKey)) {
              studentMap.set(studentKey, allStudents.length)
              allStudents.push({
                id: `${file.name}-${allStudents.length}`,
                name,
                email,
                totalScore: 0,
                maxScore: 0,
                percentage: 0,
                grades: [],
                sourceFile: file.name,
                source: source,  // Store source (csv or handwritten)
                metadata: { Name: name, Email: email }
              })
            }
            
            const studentIdx = studentMap.get(studentKey)
            const student = allStudents[studentIdx]
            
            // Add question to student
            student.grades.push(qData)
            
            // Update totals
            student.totalScore += qData.score
            student.maxScore += qData.maxScore
            
            // Track question for analysis
            if (!questionMap.has(qData.questionId)) {
              questionMap.set(qData.questionId, {
                id: qData.questionId,
                question: qData.questionText,
                scores: [],
                maxScore: qData.maxScore,
                correctAnswer: qData.correctAnswer,
                type: qData.questionType
              })
            }
            questionMap.get(qData.questionId).scores.push(qData.score)
          }
          
          // Recalculate percentages for CSV students
          allStudents.forEach(s => {
            if (s.maxScore > 0) {
              s.percentage = (s.totalScore / s.maxScore) * 100
            }
          })
        }
      }

      // Calculate question analysis
      questionMap.forEach((q) => {
        const avgScore = q.scores.reduce((a, b) => a + b, 0) / q.scores.length
        allQuestions.push({
          id: q.id,
          question: q.question,
          avgScore,
          maxScore: q.maxScore,
          avgPercentage: q.maxScore > 0 ? (avgScore / q.maxScore) * 100 : 0,
          totalResponses: q.scores.length,
          correctAnswer: q.correctAnswer,
          type: q.type
        })
      })

      setProcessedData({
        students: allStudents,
        questions: allQuestions.sort((a, b) => {
          // Sort by numeric part of question ID
          const aNum = parseInt(a.id.replace(/\D/g, '')) || 0
          const bNum = parseInt(b.id.replace(/\D/g, '')) || 0
          return aNum - bNum
        })
      })
    } catch (error) {
      console.error('Error processing files:', error)
      alert('Error processing files: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }, [files])

  const parseCSVLine = (line) => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // Proper CSV parser that handles multi-line quoted fields (RFC 4180 compliant)
  const parseCSV = (text) => {
    const lines = text.split('\n')
    if (lines.length < 2) return { headers: [], rows: [] }
    
    const rows = []
    let currentRow = []
    let currentField = ''
    let inQuotes = false
    
    // Parse header from first line
    let i = 0
    while (i < lines[0].length) {
      const char = lines[0][i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
      i++
    }
    currentRow.push(currentField.trim())
    const headers = currentRow
    currentRow = []
    
    // Parse data rows - handle multi-line fields properly
    inQuotes = false
    currentField = ''
    
    for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      if (!line.trim() && lineIdx === lines.length - 1) continue
      
      let j = 0
      while (j < line.length) {
        const char = line[j]
        
        if (char === '"') {
          // Check if this is an escaped quote (double quote inside quoted field)
          if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
            currentField += '"'
            j++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField.trim())
          currentField = ''
        } else {
          currentField += char
        }
        j++
      }
      
      // If we're still inside quotes, this line continues the current field
      if (inQuotes) {
        currentField += '\n'
      } else {
        // End of row
        currentRow.push(currentField.trim())
        if (currentRow.length > 0 && currentRow.some(f => f !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
        currentField = ''
      }
    }
    
    return { headers, rows }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="main-content">
            <FileUpload
              files={files}
              onFilesAdded={handleFilesAdded}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </div>
        )
      case 'meta':
        return <MetaBuilder />
      case 'dashboard':
        return processedData ? <Dashboard data={processedData} devMode={devMode} /> : (
          <div className="main-content">
            <div className="empty-state">
              <div className="empty-icon">
                <Upload />
              </div>
              <h3>No Data Available</h3>
              <p>Upload graded result files to view the dashboard</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload Files
              </button>
            </div>
          </div>
        )
      case 'students':
        return processedData ? <StudentsTable data={processedData} /> : (
          <div className="main-content">
            <div className="empty-state">
              <div className="empty-icon">
                <Users />
              </div>
              <h3>No Data Available</h3>
              <p>Upload graded result files to view students</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload Files
              </button>
            </div>
          </div>
        )
      case 'questions':
        return processedData ? <QuestionsAnalysis data={processedData} /> : (
          <div className="main-content">
            <div className="empty-state">
              <div className="empty-icon">
                <BookOpen />
              </div>
              <h3>No Data Available</h3>
              <p>Upload graded result files to view questions analysis</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload Files
              </button>
            </div>
          </div>
        )
      case 'compare':
        return processedData ? <StudentCompare data={processedData} /> : (
          <div className="main-content">
            <div className="empty-state">
              <div className="empty-icon">
                <GitCompare />
              </div>
              <h3>No Data Available</h3>
              <p>Upload graded result files to compare students</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                Upload Files
              </button>
            </div>
          </div>
        )
      default:
        return <FileUpload files={files} onFilesAdded={handleFilesAdded} onRemoveFile={handleRemoveFile} onClearAll={handleClearAll} onProcess={handleProcess} isProcessing={isProcessing} />
    }
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <a className="navbar-brand" href="#">
          <GraduationCap />
          Quiz Grader
        </a>
        
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            Upload
          </button>
          <button 
            className={`nav-tab ${activeTab === 'meta' ? 'active' : ''}`}
            onClick={() => setActiveTab('meta')}
          >
            <Settings size={18} />
            Meta Builder
          </button>
          {processedData && (
            <>
              <button 
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button 
                className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
              >
                <Users size={18} />
                Students
              </button>
              <button 
                className={`nav-tab ${activeTab === 'questions' ? 'active' : ''}`}
                onClick={() => setActiveTab('questions')}
              >
                <BookOpen size={18} />
                Questions
              </button>
              <button 
                className={`nav-tab ${activeTab === 'compare' ? 'active' : ''}`}
                onClick={() => setActiveTab('compare')}
              >
                <GitCompare size={18} />
                Compare
              </button>
            </>
          )}
        </div>
        
        {devMode && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginLeft: 'auto',
            padding: '0.25rem 0.5rem',
            background: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '4px',
            border: '1px solid rgba(239, 68, 68, 0.5)'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '600' }}>DEV MODE</span>
          </div>
        )}
        
        <button
          onClick={() => setDevMode(!devMode)}
          style={{
            background: devMode ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '0.4rem 0.6rem',
            marginLeft: '0.5rem',
            cursor: 'pointer',
            color: devMode ? '#ef4444' : 'var(--text-secondary)',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          title="Toggle Developer Mode"
        >
          <Settings size={14} />
          {devMode ? 'ON' : 'OFF'}
        </button>
      </nav>

      {renderContent()}
    </div>
  )
}

export default App
