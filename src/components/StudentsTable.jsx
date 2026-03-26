import { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, Eye, Download } from 'lucide-react'
import StudentModal from './StudentModal'

function StudentsTable({ data }) {
  const { students } = data
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' })
  const [selectedStudent, setSelectedStudent] = useState(null)

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

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Total Score', 'Max Score', 'Percentage', 'Grade']
    const rows = filteredAndSortedStudents.map(s => [
      s.name,
      s.email,
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
          <h3>
            <Download size={20} />
            Student Results
          </h3>
          
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

            <button className="btn btn-outline" onClick={exportToCSV}>
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.map((student) => {
                const grade = getGrade(student.percentage)
                return (
                  <tr key={student.id}>
                    <td>{student.name}</td>
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
                    <td>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
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
        />
      )}
    </div>
  )
}

export default StudentsTable
