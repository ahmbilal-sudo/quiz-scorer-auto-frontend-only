import { useEffect, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { Users, TrendingUp, CheckCircle, HelpCircle, BarChart3, PieChart, Award, BarChart, ChevronDown, ChevronUp, BarChart2, Activity } from 'lucide-react'
import StudentsTable from './StudentsTable'
import QuestionsAnalysis from './QuestionsAnalysis'

Chart.register(...registerables)

function Dashboard({ data, devMode = false, onCompareSelect }) {
  const [perQuestionScores, setPerQuestionScores] = useState({})
  const handleUpdateQuestionScoreGlobal = (questionId, newScore) => {
    setPerQuestionScores(prev => ({ ...prev, [String(questionId)]: newScore }))
  }
  const scoreDistChartRef = useRef(null)
  const gradeDistChartRef = useRef(null)
  const topPerfChartRef = useRef(null)
  const questionTypeChartRef = useRef(null)
  const questionDiffChartRef = useRef(null)
  const allQuestionsChartRef = useRef(null)
  
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  const createChartSafe = (canvasId, chartConfig) => {
    if (!mountedRef.current) return null
    
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.warn(`Dashboard: Canvas "${canvasId}" not found in DOM`)
      return null
    }
    
    try {
      const existingChart = Chart.getChart(canvas)
      if (existingChart) {
        existingChart.destroy()
      }
      return new Chart(canvas, chartConfig)
    } catch (err) {
      console.error(`Dashboard: Failed to create chart "${canvasId}":`, err)
      return null
    }
  }

  const [compareMode, setCompareMode] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)

  const { students, questions } = data

  const totalStudents = students.length
  const avgScore = students.reduce((sum, s) => sum + s.percentage, 0) / totalStudents
  const passCount = students.filter(s => s.percentage >= 50).length
  const passRate = (passCount / totalStudents) * 100

  // Score distribution
  const scoreRanges = ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%']
  const scoreCounts = [0, 0, 0, 0, 0]
  
  students.forEach(s => {
    if (s.percentage <= 20) scoreCounts[0]++
    else if (s.percentage <= 40) scoreCounts[1]++
    else if (s.percentage <= 60) scoreCounts[2]++
    else if (s.percentage <= 80) scoreCounts[3]++
    else scoreCounts[4]++
  })

  // Grade distribution
  const excellent = students.filter(s => s.percentage >= 80).length
  const good = students.filter(s => s.percentage >= 60 && s.percentage < 80).length
  const average = students.filter(s => s.percentage >= 40 && s.percentage < 60).length
  const poor = students.filter(s => s.percentage < 40).length

  // Top performers
  const topStudents = [...students].sort((a, b) => b.percentage - a.percentage).slice(0, 5)

  // Question performance
  const sortedQuestions = [...questions].sort((a, b) => b.avgPercentage - a.avgPercentage)

  // Question type distribution
  const questionTypes = [...new Set(questions.map(q => q.type))].filter(Boolean)
  const questionTypeCounts = questionTypes.map(type => 
    questions.filter(q => q.type === type).length
  )

  // Question difficulty breakdown
  const easyCount = questions.filter(q => q.avgPercentage >= 70).length
  const mediumCount = questions.filter(q => q.avgPercentage >= 40 && q.avgPercentage < 70).length
  const hardCount = questions.filter(q => q.avgPercentage < 40).length

  useEffect(() => {
    // Guard: ensure we have valid data
    if (!data || !students || !questions || students.length === 0) {
      return
    }

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(58, 58, 58, 0.5)' },
          ticks: { color: '#a0a0a0' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#a0a0a0' }
        }
      }
    }

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#f0f0f0', padding: 15 }
        }
      }
    }

    // Score Distribution Chart
    const scoreCanvas = document.getElementById('scoreDistributionChart')
    if (!scoreCanvas) { return }
    if (scoreDistChartRef.current) scoreDistChartRef.current.destroy()
    scoreDistChartRef.current = createChartSafe('scoreDistributionChart', {
      type: 'bar',
      data: {
        labels: scoreRanges,
        datasets: [{
          label: 'Students',
          data: scoreCounts,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderRadius: 8
        }]
      },
      options: chartOptions
    })

      // Grade Distribution Chart
      gradeDistChartRef.current = createChartSafe('gradeDistributionChart', {
      type: 'doughnut',
      data: {
        labels: ['Excellent (≥80%)', 'Good (60-79%)', 'Average (40-59%)', 'Poor (<40%)'],
        datasets: [{
          data: [excellent, good, average, poor],
          backgroundColor: [
            'rgba(34, 197, 94, 0.9)',
            'rgba(59, 130, 246, 0.9)',
            'rgba(245, 158, 11, 0.9)',
            'rgba(239, 68, 68, 0.9)'
          ],
          borderWidth: 0
        }]
      },
      options: doughnutOptions
    })

    // Question Type Distribution Chart
    const typeCanvas = document.getElementById('questionTypeChart')
    if (typeCanvas) {
      if (questionTypeChartRef.current) questionTypeChartRef.current.destroy()
      const typeColors = {
        MCQ: 'rgba(59, 130, 246, 0.9)',
        Short: 'rgba(34, 197, 94, 0.9)',
        Long: 'rgba(168, 85, 247, 0.9)',
        PI: 'rgba(156, 163, 175, 0.9)',
        Blank: 'rgba(245, 158, 11, 0.9)',
        'One-Word Answer': 'rgba(239, 68, 68, 0.9)'
      }
      questionTypeChartRef.current = createChartSafe('questionTypeChart', {
        type: 'doughnut',
        data: {
          labels: questionTypes,
          datasets: [{
            data: questionTypeCounts,
            backgroundColor: questionTypes.map(t => typeColors[t] || 'rgba(99, 102, 241, 0.9)'),
            borderWidth: 0
          }]
        },
        options: doughnutOptions
      })
    }

    // Question Difficulty Breakdown Chart
    if (questionDiffChartRef.current) {
      questionDiffChartRef.current.destroy()
    }
    questionDiffChartRef.current = createChartSafe('questionDiffChart', {
      type: 'bar',
      data: {
        labels: ['Easy (≥70%)', 'Medium (40-69%)', 'Hard (<40%)'],
        datasets: [{
          label: 'Questions',
          data: [easyCount, mediumCount, hardCount],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderRadius: 8
        }]
      },
      options: chartOptions
    })

    // All Questions Performance Chart
    const allCanvas = document.getElementById('allQuestionsChart')
    if (allCanvas) {
      if (allQuestionsChartRef.current) allQuestionsChartRef.current.destroy()
      allQuestionsChartRef.current = createChartSafe('allQuestionsChart', {
        type: 'bar',
      data: {
        labels: sortedQuestions.map((q, idx) => `Q${idx + 1}`),
        datasets: [{
          label: 'Avg Score %',
          data: sortedQuestions.map(q => q.avgPercentage),
          backgroundColor: sortedQuestions.map(q => 
            q.avgPercentage >= 70 ? 'rgba(34, 197, 94, 0.6)' :
            q.avgPercentage >= 40 ? 'rgba(245, 158, 11, 0.6)' :
            'rgba(239, 68, 68, 0.6)'
          ),
          borderRadius: 4
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          x: {
            ...chartOptions.scales.x,
            ticks: { ...chartOptions.scales.x.ticks, maxRotation: 0, font: { size: 10 } }
          },
          y: {
            ...chartOptions.scales.y,
            max: 100
          }
        }
      }
    })
  }

    // Top Performers Chart
    if (topPerfChartRef.current) {
      topPerfChartRef.current.destroy()
    }
    topPerfChartRef.current = createChartSafe('topPerformersChart', {
      type: 'bar',
      data: {
        labels: topStudents.map(s => s.name.length > 12 ? s.name.substring(0, 12) + '...' : s.name),
        datasets: [{
          label: 'Score %',
          data: topStudents.map(s => s.percentage),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderRadius: 6
        }]
      },
      options: {
        ...chartOptions,
        scales: {
          ...chartOptions.scales,
          y: {
            ...chartOptions.scales.y,
            max: 100
          }
        }
      }
    })
    
    return () => {
      mountedRef.current = false
      ;[scoreDistChartRef, gradeDistChartRef, 
        topPerfChartRef, questionTypeChartRef, questionDiffChartRef, allQuestionsChartRef
      ].forEach(ref => {
        try {
          if (ref.current) {
            ref.current.destroy()
            ref.current = null
          }
        } catch (e) {
          console.warn('Dashboard: Error during chart cleanup:', e)
        }
      })
    }
  }, [data]);

  return (
    <div className="main-content">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users />
          </div>
          <div className="stat-value">{totalStudents}</div>
          <div className="stat-label">Total Students</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp />
          </div>
          <div className="stat-value">{avgScore.toFixed(1)}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">
            <CheckCircle />
          </div>
          <div className="stat-value">{passRate.toFixed(1)}%</div>
          <div className="stat-label">Pass Rate (≥50%)</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pink">
            <HelpCircle />
          </div>
          <div className="stat-value">{questions.length}</div>
          <div className="stat-label">Total Questions</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart3 />
              Score Distribution
            </div>
          </div>
          <div style={{ height: '250px' }}>
            <canvas id="scoreDistributionChart"></canvas>
          </div>
        </div>
        
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Award />
              Top Performers
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <canvas id="topPerformersChart"></canvas>
          </div>
        </div>

        {/* New Charts */}
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <PieChart />
              Question Type Distribution
            </div>
          </div>
          {questionTypes.length === 0 ? (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '0.5rem' }}>
              <PieChart size={32} style={{ opacity: 0.5 }} />
              <p>No question type data</p>
            </div>
          ) : (
            <div style={{ height: '250px' }}>
              <canvas id="questionTypeChart"></canvas>
            </div>
          )}
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart2 />
              Question Difficulty Breakdown
            </div>
          </div>
          <div style={{ height: '250px' }}>
            <canvas id="questionDiffChart"></canvas>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <Activity />
              All Questions Performance
            </div>
          </div>
          {questions.length === 0 ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '0.5rem' }}>
              <Activity size={32} style={{ opacity: 0.5 }} />
              <p>No questions data available</p>
            </div>
          ) : (
            <div style={{ height: '300px' }}>
              <canvas id="allQuestionsChart"></canvas>
            </div>
          )}
        </div>
      </div>

      {/* Dev Mode Info Panel */}
      {devMode && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px'
        }}>
          <h4 style={{ color: '#ef4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔧 Developer Mode Info
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <strong>Source Breakdown:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                <li>CSV Students: {students.filter(s => s.source === 'csv').length}</li>
                <li>Handwritten: {students.filter(s => s.source === 'handwritten').length}</li>
              </ul>
            </div>
            <div>
              <strong>Data Stats:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                <li>Total Files Processed: {new Set(students.map(s => s.sourceFile)).size}</li>
                <li>Total Questions: {questions.length}</li>
                <li>Total Students: {students.length}</li>
              </ul>
            </div>
            <div>
              <strong>Question Types:</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', padding: 0 }}>
                {[...new Set(questions.map(q => q.type))].map(t => (
                  <li key={t}>{t}: {questions.filter(q => q.type === t).length}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Students Table (non-devMode only) */}
      {!devMode && (
        <div style={{ marginTop: '2rem' }}>
          <StudentsTable 
            data={data} 
            showCompareBtn={true}
            onStartCompare={() => setCompareMode(true)}
            compareMode={compareMode}
            onUpdateQuestionScoreGlobal={handleUpdateQuestionScoreGlobal}
            onCompareSelect={(selectedStudents) => {
              setCompareMode(false)
              if (onCompareSelect) {
                onCompareSelect(selectedStudents)
              }
            }}
            onNavigateToCompare={() => {
              setCompareMode(false)
              if (onNavigateToCompare) {
                onNavigateToCompare()
              }
            }}
          />
        </div>
      )}

      {/* Questions Analysis (collapsed by default, non-devMode only) */}
      {!devMode && (
        <div style={{ marginTop: '2rem' }}>
          <div 
            onClick={() => setShowQuestions(!showQuestions)}
            style={{
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <HelpCircle size={20} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: '600' }}>Questions Analysis ({questions.length} questions)</span>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Easy: {questions.filter(q => q.avgPercentage >= 70).length}</span>
                <span>Medium: {questions.filter(q => q.avgPercentage >= 40 && q.avgPercentage < 70).length}</span>
                <span>Hard: {questions.filter(q => q.avgPercentage < 40).length}</span>
              </div>
            </div>
            {showQuestions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          
          {showQuestions && (
            <div style={{ marginTop: '1rem' }}>
              <QuestionsAnalysis data={data} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Dashboard
