import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { Users, TrendingUp, CheckCircle, HelpCircle, BarChart3, PieChart, Award, BarChart } from 'lucide-react'

Chart.register(...registerables)

function Dashboard({ data }) {
  const scoreDistChartRef = useRef(null)
  const gradeDistChartRef = useRef(null)
  const questionPerfChartRef = useRef(null)
  const topPerfChartRef = useRef(null)

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

  useEffect(() => {
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

    // Score Distribution Chart
    if (scoreDistChartRef.current) {
      scoreDistChartRef.current.destroy()
    }
    scoreDistChartRef.current = new Chart(document.getElementById('scoreDistributionChart'), {
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
    if (gradeDistChartRef.current) {
      gradeDistChartRef.current.destroy()
    }
    gradeDistChartRef.current = new Chart(document.getElementById('gradeDistributionChart'), {
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
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#f0f0f0', padding: 15 }
          }
        }
      }
    })

    // Question Performance Chart
    if (questionPerfChartRef.current) {
      questionPerfChartRef.current.destroy()
    }
    questionPerfChartRef.current = new Chart(document.getElementById('questionPerformanceChart'), {
      type: 'bar',
      data: {
        labels: sortedQuestions.slice(0, 8).map(q => q.id),
        datasets: [{
          label: 'Avg Score %',
          data: sortedQuestions.slice(0, 8).map(q => q.avgPercentage),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderRadius: 6
        }]
      },
      options: {
        ...chartOptions,
        indexAxis: 'y'
      }
    })

    // Top Performers Chart
    if (topPerfChartRef.current) {
      topPerfChartRef.current.destroy()
    }
    topPerfChartRef.current = new Chart(document.getElementById('topPerformersChart'), {
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
      scoreDistChartRef.current?.destroy()
      gradeDistChartRef.current?.destroy()
      questionPerfChartRef.current?.destroy()
      topPerfChartRef.current?.destroy()
    }
  }, [data])

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
              <PieChart />
              Grade Distribution
            </div>
          </div>
          <div style={{ height: '250px' }}>
            <canvas id="gradeDistributionChart"></canvas>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <BarChart />
              Performance by Question
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <canvas id="questionPerformanceChart"></canvas>
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
      </div>
    </div>
  )
}

export default Dashboard
