import { useState, useMemo, useEffect } from 'react'
import { ArrowLeftRight, Trophy, Target, TrendingUp, Minus, ArrowRight } from 'lucide-react'

function StudentCompare({ data, initialStudents = null }) {
  const { students, questions } = data
  const [student1Id, setStudent1Id] = useState('')
  const [student2Id, setStudent2Id] = useState('')

  useEffect(() => {
    if (initialStudents && initialStudents.length === 2) {
      setStudent1Id(initialStudents[0].id)
      setStudent2Id(initialStudents[1].id)
    }
  }, [initialStudents])

  const student1 = students.find(s => s.id === student1Id)
  const student2 = students.find(s => s.id === student2Id)

  const getScoreClass = (percentage) => {
    if (percentage >= 80) return 'excellent'
    if (percentage >= 60) return 'good'
    if (percentage >= 40) return 'average'
    return 'poor'
  }

  const swapStudents = () => {
    const temp = student1Id
    setStudent1Id(student2Id)
    setStudent2Id(temp)
  }

  const comparisonData = useMemo(() => {
    if (!student1 || !student2) return null

    let wins1 = 0, wins2 = 0, ties = 0
    const questionComparisons = []

    questions.forEach((q, idx) => {
      const grade1 = student1.grades.find(g => g.questionId === q.id) || {}
      const grade2 = student2.grades.find(g => g.questionId === q.id) || {}
      
      const score1 = grade1.score || 0
      const score2 = grade2.score || 0
      const maxScore = grade1.maxScore || grade2.maxScore || q.maxScore || 1
      
      let winner = 'tie'
      if (score1 > score2) {
        winner = 'student1'
        wins1++
      } else if (score2 > score1) {
        winner = 'student2'
        wins2++
      } else {
        ties++
      }

      questionComparisons.push({
        questionId: q.id,
        questionText: q.question,
        questionType: grade1.questionType || q.type || '',
        maxScore,
        score1,
        score2,
        answer1: grade1.studentAnswer || '',
        answer2: grade2.studentAnswer || '',
        feedback1: grade1.feedback || '',
        feedback2: grade2.feedback || '',
        confidence1: grade1.confidence || student1.confidence || null,
        confidence2: grade2.confidence || student2.confidence || null,
        winner
      })
    })

    return {
      wins1,
      wins2,
      ties,
      questions: questionComparisons
    }
  }, [student1, student2, questions])

  return (
    <div className="main-content">
      <div className="compare-header">
        <h2>
          <Target size={24} />
          Student Comparison
        </h2>
        <p>Select two students to compare their quiz answers side by side</p>
      </div>

      <div className="compare-selectors">
        <div className="compare-selector">
          <label>Student 1</label>
          <select 
            value={student1Id} 
            onChange={(e) => setStudent1Id(e.target.value)}
            className="student-select"
          >
            <option value="">Select a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id} disabled={s.id === student2Id}>
                {s.name} ({s.percentage.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>

        <button className="swap-btn" onClick={swapStudents} title="Swap students">
          <ArrowLeftRight size={20} />
        </button>

        <div className="compare-selector">
          <label>Student 2</label>
          <select 
            value={student2Id} 
            onChange={(e) => setStudent2Id(e.target.value)}
            className="student-select"
          >
            <option value="">Select a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id} disabled={s.id === student1Id}>
                {s.name} ({s.percentage.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {student1 && student2 && comparisonData && (
        <>
          <div className="compare-summary">
            <div className={`summary-card student1-card ${getScoreClass(student1.percentage)}`}>
              <div className="summary-avatar">
                {student1.name.charAt(0).toUpperCase()}
              </div>
              <div className="summary-info">
                <div className="summary-name">{student1.name}</div>
                <div className="summary-score">{student1.percentage.toFixed(1)}%</div>
                <div className="summary-raw">{student1.totalScore.toFixed(1)} / {student1.maxScore}</div>
              </div>
            </div>

            <div className="summary-stats">
              <div className="stat-win">
                <Trophy size={20} />
                <span>{comparisonData.wins1} Wins</span>
              </div>
              <div className="stat-tie">
                <Minus size={20} />
                <span>{comparisonData.ties} Ties</span>
              </div>
              <div className="stat-win">
                <Trophy size={20} />
                <span>{comparisonData.wins2} Wins</span>
              </div>
            </div>

            <div className={`summary-card student2-card ${getScoreClass(student2.percentage)}`}>
              <div className="summary-info">
                <div className="summary-name">{student2.name}</div>
                <div className="summary-score">{student2.percentage.toFixed(1)}%</div>
                <div className="summary-raw">{student2.totalScore.toFixed(1)} / {student2.maxScore}</div>
              </div>
              <div className="summary-avatar">
                {student2.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="compare-table-container">
            <table className="compare-table">
              <thead>
                <tr>
                  <th className="question-col">Question</th>
                  <th className="answer-col student1-col">
                    {student1.name.split(' ')[0]}
                    <span className="score-total">{student1.totalScore.toFixed(1)}</span>
                  </th>
                  <th className="result-col"></th>
                  <th className="answer-col student2-col">
                    {student2.name.split(' ')[0]}
                    <span className="score-total">{student2.totalScore.toFixed(1)}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.questions.map((q, idx) => (
                  <tr key={q.questionId} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="question-cell">
                      <div className="q-id">{q.questionId}</div>
                      <div className="q-text">{q.questionText}</div>
                      <div className="q-meta">
                        <span className="q-type">{q.questionType}</span>
                        <span className="q-max">{q.maxScore} pts</span>
                      </div>
                    </td>
                    
                    <td className={`answer-cell ${q.winner === 'student1' ? 'winner' : ''} ${q.score1 === 0 ? 'zero-score' : ''}`}>
                      <div className="answer-content">
                        <div className="answer-text">
                          {q.answer1 || <span className="no-answer">No answer</span>}
                        </div>
                        <div className="answer-score">
                          <span className="score-obtained">{q.score1.toFixed(1)}</span>
                          <span className="score-divider">/</span>
                          <span className="score-max">{q.maxScore}</span>
                        </div>
                        {q.confidence1 !== null && (
                          <div className="confidence-badge" title="Parsing Confidence">
                            Conf: {(q.confidence1 * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      {q.feedback1 && (
                        <div className="feedback-preview" title={q.feedback1}>
                          <TrendingUp size={12} /> {q.feedback1.substring(0, 60)}...
                        </div>
                      )}
                    </td>

                    <td className="result-cell">
                      {q.winner === 'tie' ? (
                        <div className="result-tie">
                          <Minus size={16} />
                          <span>Tie</span>
                        </div>
                      ) : (
                        <div className={`result-indicator ${q.winner === 'student1' ? 'left' : 'right'}`}>
                          <ArrowRight size={16} />
                        </div>
                      )}
                    </td>

                    <td className={`answer-cell ${q.winner === 'student2' ? 'winner' : ''} ${q.score2 === 0 ? 'zero-score' : ''}`}>
                      <div className="answer-content">
                        <div className="answer-text">
                          {q.answer2 || <span className="no-answer">No answer</span>}
                        </div>
                        <div className="answer-score">
                          <span className="score-obtained">{q.score2.toFixed(1)}</span>
                          <span className="score-divider">/</span>
                          <span className="score-max">{q.maxScore}</span>
                        </div>
                        {q.confidence2 !== null && (
                          <div className="confidence-badge" title="Parsing Confidence">
                            Conf: {(q.confidence2 * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                      {q.feedback2 && (
                        <div className="feedback-preview" title={q.feedback2}>
                          <TrendingUp size={12} /> {q.feedback2.substring(0, 60)}...
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(!student1 || !student2) && (
        <div className="compare-placeholder">
          <div className="placeholder-icon">
            <Target size={48} />
          </div>
          <h3>Select Two Students to Compare</h3>
          <p>Choose students from the dropdowns above to see a detailed side-by-side comparison of their answers</p>
        </div>
      )}
    </div>
  )
}

export default StudentCompare
