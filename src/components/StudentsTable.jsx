import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, Eye, Download, GitCompare, Check, X } from 'lucide-react'
import StudentModal from './StudentModal'

function StudentsTable({ data, quizId: propQuizId, onUpdateStudent, onSaveToHistory, compareMode = false, onCompareSelect, onStartCompare, showCompareBtn = false, onNavigateToCompare }) {
  const { students } = data
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' })
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedForCompare, setSelectedForCompare] = useState([])

  const getGrade = (percentage) => {
    if (percentage >= 80) return { label: 'Excellent', class: 'excellent' }
    if (percentage >= 60) return { label: 'Good', class: 'good' }
    if (percentage >= 40) return { label: 'Average', class: 'average' }
    return { label: 'Poor', class: 'poor' }
  }

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'excellent'
    if (percentage >= 60) return 'good'
    if (percentage >= 40) return 'average'
    return 'poor'
  }

  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.email.toLowerCase().includes(term)
      )
    }

    // Filter by grade
    if (gradeFilter !== 'all') {
      result = result.filter(s => getGrade(s.percentage).class === gradeFilter)
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal
      
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'percentage':
          aVal = a.percentage
          bVal = b.percentage
          break
        case 'totalScore':
          aVal = a.totalScore
          bVal = b.totalScore
          break
        default:
          aVal = a.percentage
          bVal = b.percentage
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [students, searchTerm, gradeFilter, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) {
      return <span className="sort-icon"><ChevronUp size={14} /></span>
    }
    return (
      <span className="sort-icon" style={{ color: 'var(--accent-primary)' }}>
        {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    )
  }

  const handleRowClick = (student) => {
    setSelectedStudent(student)
  }

  const toggleStudentForCompare = (studentId) => {
    setSelectedForCompare(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      }
      if (prev.length >= 2) {
        return [prev[1], studentId]
      }
      return [...prev, studentId]
    })
  }

  const handleCompareSelected = () => {
    if (selectedForCompare.length === 2) {
      const selectedStudents = students.filter(s => selectedForCompare.includes(s.id))
      if (onCompareSelect) {
        onCompareSelect(selectedStudents)
      }
      if (onNavigateToCompare) {
        onNavigateToCompare()
      }
    }
  }

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Student ID', 'Quiz ID', 'Source', 'Total Score', 'Max Score', 'Percentage', 'Grade']
    const rows = (filteredAndSortedStudents || []).map(s => [
      s.name,
      s.email,
      s.studentId || '',
      s.quizId || quizId || '',
      s.source || 'csv',
      s.totalScore,
      s.maxScore,
      s.percentage.toFixed(2) + '%',
      getGrade(s.percentage).label
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'student_results.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="main-content">
      <div className="table-container">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3>
              <Download size={20} />
              Student Results
            </h3>
            {showCompareBtn && (
              <button
                className="btn btn-primary"
                onClick={onStartCompare}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <GitCompare size={16} />
                Compare
              </button>
            )}
          </div>
          
          <div className="table-filters">
            <div className="search-wrapper">
              <Search />
              <input
                type="text"
                className="search-input"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="filter-select"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="all">All Grades</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>

            {onSaveToHistory && (
              <button className="btn btn-primary" onClick={() => onSaveToHistory(data)}>
                <Check size={16} />
                Sync to History
              </button>
            )}
            <button className="btn btn-outline" onClick={exportToCSV}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {compareMode && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <Check size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Comparison mode: Select 2 students ({selectedForCompare.length}/2)</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleCompareSelected}
              disabled={selectedForCompare.length !== 2}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              Compare Selected
            </button>
          </div>
        )}

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {compareMode && <th style={{ width: '50px' }}></th>}
                <th className="sortable" onClick={() => handleSort('name')}>
                  Student Name
                  <SortIcon column="name" />
                </th>
                <th>Email</th>
                <th className="sortable" onClick={() => handleSort('totalScore')}>
                  Score
                  <SortIcon column="totalScore" />
                </th>
                <th className="sortable" onClick={() => handleSort('percentage')}>
                  Percentage
                  <SortIcon column="percentage" />
                </th>
                <th>Grade</th>
                {!compareMode && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.map((student) => {
                const grade = getGrade(student.percentage)
                const isSelected = selectedForCompare.includes(student.id)
                return (
                  <tr 
                    key={student.id}
                    onClick={() => compareMode ? toggleStudentForCompare(student.id) : handleRowClick(student)}
                    style={{ 
                      cursor: compareMode ? 'pointer' : 'default',
                      background: isSelected ? 'rgba(139, 92, 246, 0.1)' : undefined
                    }}
                  >
                    {compareMode && (
                      <td style={{ textAlign: 'center' }}>
                        {isSelected && <Check size={16} style={{ color: 'var(--accent-primary)' }} />}
                      </td>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {student.name}
                        {student.source === 'handwritten' && (
                          <span style={{ 
                            background: 'rgba(245, 158, 11, 0.15)', 
                            color: 'var(--accent-warning)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                          }}>
                            📝 Handwritten
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{student.email || '-'}</td>
                    <td>{student.totalScore.toFixed(1)} / {student.maxScore}</td>
                    <td>
                      <div className="progress-wrapper">
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${getProgressColor(student.percentage)}`}
                            style={{ width: `${Math.min(student.percentage, 100)}%` }}
                          ></div>
                        </div>
                        <span>{student.percentage.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`grade-badge ${grade.class}`}>
                        {grade.label}
                      </span>
                    </td>
                    {!compareMode && (
                      <td>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <StudentModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
          quizId={data.quiz_id || data.quizId || selectedStudent.quizId}
          onUpdateStudent={onUpdateStudent}
          onUpdateQuestionScore={(qid, newScore) => {
            // optimistic in-memory update: write to selectedStudent.grades
            if (selectedStudent && Array.isArray(selectedStudent.grades)) {
              const idx = selectedStudent.grades.findIndex(g => (g.questionId || g.question_id) === qid)
              if (idx !== -1) {
                selectedStudent.grades[idx].score = newScore
              }
              // trigger a re-render by mutating state and calling parent update if available
              // Note: this is in-memory only until final save
              if (typeof onUpdateStudent === 'function') {
                onUpdateStudent({ ...selectedStudent, grades: selectedStudent.grades })
              }
            }
          }}
        />
      )}
    </div>
  )
}

export default StudentsTable
