import { useState, useCallback, useMemo, useEffect } from 'react'
import { GraduationCap, LayoutDashboard, Users, BookOpen, Upload, FileText, X, BarChart3, PieChart, TrendingUp, Award, CheckCircle, HelpCircle, Settings, GitCompare, CheckSquare, Home, History, FolderOpen, RefreshCw, Loader2, Clock, Trash2 } from 'lucide-react'
import FileUpload from './components/FileUpload'
import Dashboard from './components/Dashboard'
import StudentsTable from './components/StudentsTable'
import QuestionsAnalysis from './components/QuestionsAnalysis'
import MetaBuilder from './components/MetaBuilder'
import StudentCompare from './components/StudentCompare'
import GradingPage from './components/GradingPage'
import HomePage from './components/HomePage'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [files, setFiles] = useState([])
  const [processedData, setProcessedData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // History/Graded results from storage
  const [gradedResults, setGradedResults] = useState([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [lastGradedId, setLastGradedId] = useState(null)
  const [deletingResultId, setDeletingResultId] = useState(null) // For delete loading state
  const [compareStudents, setCompareStudents] = useState(null) // For compare tab integration

  const getBackendUrl = () => {
    const protocol = window.location.protocol
    const hostname = window.location.hostname
    const port = '3000'
    return `${protocol}//${hostname}:${port}`
  }

  const fetchGradedResults = async () => {
    setLoadingResults(true)
    try {
      const response = await fetch(`${getBackendUrl()}/storage/graded/list`)
      const data = await response.json()
      if (data.success) {
        setGradedResults(data.graded_results || [])
      }
    } catch (err) {
      console.error('Failed to fetch graded results:', err)
    } finally {
      setLoadingResults(false)
    }
  }

  const deleteGradedResult = async (gradedId) => {
    setDeletingResultId(gradedId)
    try {
      const response = await fetch(`${getBackendUrl()}/storage/graded/${gradedId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        // Remove from local state
        setGradedResults(prev => prev.filter(item => item.id !== gradedId))
        // If the deleted result was the last loaded one, clear processedData
        if (lastGradedId === gradedId) {
          setProcessedData(null)
          setLastGradedId(null)
          setActiveTab('history') // Stay on history tab after delete
        }
      }
    } catch (err) {
      console.error('Failed to delete graded result:', err)
      alert('Failed to delete result: ' + err.message)
    } finally {
      setDeletingResultId(null)
    }
  }

  const loadGradedResult = async (gradedId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/storage/graded/${gradedId}/content`)
      const text = await response.text()

      const { headers, rows } = parseCSV(text)
      if (headers.length < 2 || rows.length < 1) {
        throw new Error('Invalid CSV format')
      }

      const studentMap = new Map()
      const questionMap = new Map()

      for (let i = 0; i < rows.length; i++) {
        const values = rows[i]
        if (values.length !== headers.length) continue

        const row = {}
        headers.forEach((h, idx) => row[h] = values[idx])

        const name = row['Student Name'] || row['Name'] || 'Unknown'
        const email = row['Email'] || ''
        const studentKey = `${name}-${email}`.toLowerCase()

        if (!studentMap.has(studentKey)) {
          studentMap.set(studentKey, {
            id: studentKey,
            name,
            email,
            totalScore: 0,
            maxScore: 0,
            percentage: parseFloat(row['Percentage'] || row['percentage'] || 0),
            source: row['Source'] || row['source'] || 'csv',
            studentId: row['Student ID'] || row['student_id'] || '',
            quizId: row['Quiz ID'] || row['quiz_id'] || '',
            grades: [],
            metadata: { Name: name, Email: email, student_id: row['Student ID'] || row['student_id'] || '' }
          })
        }

        const student = studentMap.get(studentKey)
        const qId = row['Question ID'] || row['question_id'] || `Q${student.grades.length + 1}`
        const qText = row['Question'] || row['question'] || qId
        const qType = row['Question Type'] || row['question_type'] || 'Short'

        const qScore = parseFloat(row['Score'] || row['score'] || 0)
        const qMaxScore = parseFloat(row['Max Score'] || row['max_score'] || 0)

        // Accumulate scores
        student.totalScore += qScore
        student.maxScore += qMaxScore

        const question = {
          questionId: qId,
          questionText: qText,
          studentAnswer: row['Student Answer'] || row['student_answer'] || '',
          correctAnswer: row['Correct Answer'] || row['correct_answer'] || '',
          score: qScore,
          maxScore: qMaxScore,
          feedback: row['Feedback'] || row['feedback'] || '',
          questionType: qType,
          evidence_path: row['Evidence Path'] || row['evidence_path'] || ''
        }

        student.grades.push(question)

        if (!questionMap.has(qId)) {
          questionMap.set(qId, {
            id: qId,
            question: qText,
            scores: [],
            maxScore: question.maxScore,
            correctAnswer: question.correctAnswer,
            type: qType
          })
        }
        questionMap.get(qId).scores.push(question.score)
      }

      const allStudents = Array.from(studentMap.values())
      const allQuestions = Array.from(questionMap.values()).map(q => ({
        ...q,
        avgScore: q.scores.length > 0 ? q.scores.reduce((a, b) => a + b, 0) / q.scores.length : 0,
        avgPercentage: q.maxScore > 0 ? ((q.scores.reduce((a, b) => a + b, 0) / q.scores.length) / q.maxScore) * 100 : 0,
        totalResponses: q.scores.length
      }))

      setProcessedData({
        students: allStudents,
        questions: allQuestions.sort((a, b) => {
          const aNum = parseInt(a.id.replace(/\D/g, '')) || 0
          const bNum = parseInt(b.id.replace(/\D/g, '')) || 0
          return aNum - bNum
        })
      })

      setActiveTab('dashboard')
    } catch (err) {
      console.error('Failed to load graded result:', err)
      alert('Failed to load graded result: ' + err.message)
    }
  }

  // Handle OAuth callback - redirect to meta builder after auth
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('auth') === 'success') {
      setActiveTab('meta')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // Auto-fetch graded results on mount
  useEffect(() => {
    fetchGradedResults()
  }, [])

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

  // Process graded data from API response (for GradingPage)
  const processGradedData = (gradedData) => {
    const allStudents = []
    const questionMap = new Map()

    const students = Array.isArray(gradedData) ? gradedData : (gradedData.results || [gradedData])
    const quizId = gradedData.quiz_id || null

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
            questionType: result.question_type || result.questionType || '',
            evidence_path: result.evidence_path || result.evidencePath || ''
          }
        })

        const studentKey = `${name}-${email}`.toLowerCase()
        allStudents.push({
          id: `graded-${allStudents.length}`,
          name,
          email,
          totalScore,
          maxScore,
          percentage,
          grades: studentQuestions,
          sourceFile: 'graded',
          metadata,
          source: student.source || (quizId ? 'handwritten' : 'csv'),
          studentId: metadata.student_id || student.student_id || '',
          quizId: student.quiz_id || gradedData.quiz_id || '',
          confidence: student.confidence || null
        })
      }
    })

    // Build questions array from questionMap
    const questions = Array.from(questionMap.values()).map(q => ({
      id: q.id,
      question: q.question,
      avgScore: q.scores.length > 0 ? q.scores.reduce((a, b) => a + b, 0) / q.scores.length : 0,
      maxScore: q.maxScore,
      avgPercentage: q.maxScore > 0 ? ((q.scores.reduce((a, b) => a + b, 0) / q.scores.length) / q.maxScore) * 100 : 0,
      totalResponses: q.scores.length,
      correctAnswer: q.correctAnswer,
      type: q.type
    }))

    return { students: allStudents, questions, quizId }
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

      // Save uploaded files to storage
      try {
        const backendUrl = getBackendUrl()

        // Create a quiz for this upload
        const quizResponse = await fetch(`${backendUrl}/storage/quiz/create`, {
          method: 'POST',
          headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Uploaded Results', description: '' }),
        })
        const quizData = await quizResponse.json()

        if (quizData.success) {
          const quizId = quizData.quiz.id

          // Save each uploaded file as graded result
          for (const file of files) {
            const text = await file.text()

            // Convert to proper CSV format if JSON
            let csvContent = text
            if (file.name.endsWith('.json')) {
              const data = JSON.parse(text)
              const students = Array.isArray(data) ? data : [data]
              csvContent = 'Student Name,Email,Question ID,Question,Student Answer,Correct Answer,Score,Max Score,Percentage,Question Type,Feedback,Evidence Path,Source,Student ID\n'

              students.forEach(student => {
                if (student.status === 'success' && student.grades) {
                  const name = student.metadata?.Name || student.metadata?.name || 'Unknown'
                  const email = student.metadata?.Email || student.metadata?.email || ''
                  const studentId = student.metadata?.student_id || student.student_id || ''
                  const source = student.source || 'handwritten'
                  const results = student.grades.results || []

                  results.forEach((result, idx) => {
                    const evPath = result.evidence_path || result.evidencePath || ''
                    csvContent += `"${name}","${email}","${result.question_id || 'Q' + (idx + 1)}","${(result.question_text || result.questionText || '').replace(/"/g, '""')}","${(result.student_answer || result.studentAnswer || '').replace(/"/g, '""')}","${(result.correct_answer || result.correctAnswer || '').replace(/"/g, '""')}",${result.score || 0},${result.max_score || result.maxScore || 0},${student.grades.percentage || 0},${result.question_type || result.questionType || 'Short'},"${(result.feedback || '').replace(/"/g, '""')}","${evPath}","${source}","${studentId}"\n`
                  })
                }
              })
            }

            const formData = new FormData()
            const csvFile = new File([csvContent], file.name.replace('.json', '.csv'), { type: 'text/csv' })
            formData.append('graded_file', csvFile)

            await fetch(`${backendUrl}/storage/graded/save?quiz_id=${quizId}`, {
              method: 'POST',
              headers: { 'ngrok-skip-browser-warning': 'true' },
              body: formData,
            })
          }

          // Refresh graded results list
          fetchGradedResults()
          console.log('Uploaded files saved to storage')
        }
      } catch (err) {
        console.error('Failed to save to storage:', err)
      }
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

  const handleNavigate = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage data={processedData} onNavigate={handleNavigate} />
      case 'grade':
        return (
          <div className="content-area">
            <GradingPage
              devMode={devMode}
              onGradeComplete={(gradedData) => {
                const processed = processGradedData(gradedData)
                setProcessedData(processed)
              }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          </div>
        )
      case 'meta':
        return <MetaBuilder devMode={devMode} />
      case 'dashboard':
        return processedData ? <Dashboard
          data={processedData}
          devMode={devMode}
          onCompareSelect={(students) => {
            setCompareStudents(students)
            setActiveTab('compare')
          }}
          onNavigateToCompare={() => setActiveTab('compare')}
        /> : (
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
        return processedData ? <StudentCompare data={processedData} initialStudents={compareStudents} /> : (
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
      case 'history':
        return (
          <div className="main-content">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
                <History size={24} />
                Graded Results History
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                View and load previously graded results from local storage.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <button
                onClick={fetchGradedResults}
                disabled={loadingResults}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 1rem',
                  color: 'var(--text-primary)',
                  cursor: loadingResults ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {loadingResults ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Refresh
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {gradedResults.length} result{gradedResults.length !== 1 ? 's' : ''} stored
              </span>
            </div>

            {gradedResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <FolderOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>No graded results found.</p>
                <p style={{ fontSize: '0.85rem' }}>Grade a quiz to see results here.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {gradedResults.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {result.quiz_display_title || result.quiz_title}
                      </h3>
                      <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: '11px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 6px', display: 'inline-block', marginTop: '4px' }}>
                        {`Quiz ID: ${result.quiz_id ?? result.quizId ?? ''}`}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          {new Date(result.graded_at * 1000).toLocaleString()}
                        </span>
                        <span>{result.total_students} student{result.total_students !== 1 ? 's' : ''}</span>
                        {result.average_score !== null && (
                          <span>Avg: {result.average_score.toFixed(1)}%</span>
                        )}
                        {result.pass_rate !== null && (
                          <span>Pass: {result.pass_rate.toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => loadGradedResult(result.id)}
                        disabled={deletingResultId === result.id}
                        style={{
                          background: deletingResultId === result.id ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 1rem',
                          color: 'white',
                          cursor: deletingResultId === result.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {deletingResultId === result.id ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={16} />}
                        Load
                      </button>
                      <button
                        onClick={() => deleteGradedResult(result.id)}
                        disabled={deletingResultId === result.id}
                        style={{
                          background: deletingResultId === result.id ? 'var(--bg-tertiary)' : 'var(--accent-danger)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 1rem',
                          color: 'white',
                          cursor: deletingResultId === result.id ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {deletingResultId === result.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={18} />
            Home
          </button>
          <button
            className={`nav-tab ${activeTab === 'meta' ? 'active' : ''}`}
            onClick={() => setActiveTab('meta')}
          >
            <Settings size={18} />
            Meta Builder
          </button>
          <button
            className={`nav-tab ${activeTab === 'grade' ? 'active' : ''}`}
            onClick={() => setActiveTab('grade')}
          >
            <CheckSquare size={18} />
            Grade
          </button>

          {processedData && devMode && (
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
          {processedData && !devMode && (
            <>
              <button
                className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setCompareStudents(null); setActiveTab('dashboard'); }}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              {activeTab === 'compare' && (
                <button
                  className={`nav-tab active`}
                >
                  <GitCompare size={18} />
                  Compare
                </button>
              )}
            </>
          )}
          <button
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            History
            {gradedResults.length > 0 && (
              <span style={{
                marginLeft: '0.35rem',
                background: 'var(--accent-primary)',
                color: 'white',
                borderRadius: '10px',
                padding: '0.1rem 0.4rem',
                fontSize: '0.65rem',
                fontWeight: '600'
              }}>
                {gradedResults.length}
              </span>
            )}
          </button>
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
