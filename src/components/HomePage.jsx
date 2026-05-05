import { useState, useEffect } from 'react'
import { Home, Rocket, Download, BarChart3, Users, BookOpen, CheckSquare, Settings, GitCompare, ChevronDown, ChevronUp, ArrowRight, Sparkles, FileText, Play, GraduationCap } from 'lucide-react'

function HomePage({ data, onNavigate }) {
  const [showDetailed, setShowDetailed] = useState(false)

  const features = [
    {
      id: 'meta',
      icon: <Settings size={28} />,
      title: 'Meta Builder',
      description: 'Create quiz structure with questions, types, and point values. Add AI-suggested questions.',
      color: '#6366f1',
      buttonText: 'Build Quiz'
    },
    {
      id: 'grade',
      icon: <CheckSquare size={28} />,
      title: 'Grade',
      description: 'Upload responses, process through AI grading, get detailed feedback for each answer.',
      color: '#22c55e',
      buttonText: 'Grade Responses'
    },
    {
      id: 'dashboard',
      icon: <BarChart3 size={28} />,
      title: 'Dashboard',
      description: 'Overview charts showing score distribution, pass rates, and class performance.',
      color: '#f59e0b',
      buttonText: 'View Dashboard',
      requiresData: true
    },
    {
      id: 'students',
      icon: <Users size={28} />,
      title: 'Students',
      description: 'Browse individual student results with detailed answer breakdowns.',
      color: '#ec4899',
      buttonText: 'View Students',
      requiresData: true
    },
    {
      id: 'questions',
      icon: <BookOpen size={28} />,
      title: 'Questions',
      description: 'Analyze question difficulty, common mistakes, and class-wide performance.',
      color: '#3b82f6',
      buttonText: 'Analyze Questions',
      requiresData: true
    },
    {
      id: 'compare',
      icon: <GitCompare size={28} />,
      title: 'Compare',
      description: 'Select two students and compare their answers side-by-side.',
      color: '#a855f7',
      buttonText: 'Compare Students',
      requiresData: true
    }
  ]

  const workflowSteps = [
    { step: 1, icon: <Settings size={20} />, title: 'Create Quiz', desc: 'Build meta file with Meta Builder' },
    { step: 2, icon: <Download size={20} />, title: 'Collect Responses', desc: 'Share Google Form, gather answers' },
    { step: 3, icon: <BarChart3 size={20} />, title: 'Analyze Results', desc: 'View dashboards and insights' }
  ]

  const detailedSteps = [
    { num: 1, title: 'Build Quiz Structure', desc: 'Go to Meta Builder, add questions with types and correct answers' },
    { num: 2, title: 'Download Meta File', desc: 'Export the quiz structure as CSV for future use' },
    { num: 3, title: 'Create Google Form', desc: 'Authenticate with Google and auto-generate form from meta' },
    { num: 4, title: 'Share Form Link', desc: 'Distribute the form to your students' },
    { num: 5, title: 'Download Responses', desc: 'Export form submissions as CSV from Google Forms' },
    { num: 6, title: 'Grade Responses', desc: 'Upload responses, AI grades each answer with feedback' },
    { num: 7, title: 'View Results', desc: 'Explore dashboards, student details, and question analysis' },
    { num: 8, title: 'Compare Students', desc: 'Select two students for side-by-side answer comparison' }
  ]

  const handleFeatureClick = (feature) => {
    if (feature.requiresData && !data) {
      return
    }
    onNavigate(feature.id)
  }

  return (
    <div className="main-content homepage">
      <div className="homepage-hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          AI-Powered Quiz Platform
        </div>
        <h1 className="hero-title">
          <GraduationCap size={48} />
          Welcome to Quiz Grader
        </h1>
        <p className="hero-subtitle">
          Create quizzes, automate grading with AI, and visualize results. 
          Build once, analyze endlessly.
        </p>
      </div>

      {data && (
        <div className="data-loaded-banner">
          <div className="banner-content">
            <CheckSquare size={24} />
            <div>
              <strong>Graded data loaded!</strong>
              <span> {data.students?.length || 0} students, {data.questions?.length || 0} questions</span>
            </div>
          </div>
          <button className="banner-btn" onClick={() => onNavigate('dashboard')}>
            View Dashboard <ArrowRight size={16} />
          </button>
        </div>
      )}

      <div className="workflow-section">
        <div className="workflow-header">
          <h2>How It Works</h2>
          <button 
            className="toggle-details-btn"
            onClick={() => setShowDetailed(!showDetailed)}
          >
            {showDetailed ? (
              <>Hide Details <ChevronUp size={16} /></>
            ) : (
              <>View Detailed Steps <ChevronDown size={16} /></>
            )}
          </button>
        </div>

        <div className="workflow-steps">
          {workflowSteps.map((step) => (
            <div key={step.step} className="workflow-step">
              <div className="step-number">{step.step}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {showDetailed && (
          <div className="detailed-steps">
            {detailedSteps.map((step) => (
              <div key={step.num} className="detailed-step">
                <div className="detailed-step-num">{step.num}</div>
                <div className="detailed-step-content">
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="features-section">
        <h2>Features</h2>
        <div className="features-grid">
          {features.map((feature) => {
            const isDisabled = feature.requiresData && !data
            return (
              <div 
                key={feature.id} 
                className={`feature-card ${isDisabled ? 'disabled' : ''}`}
              >
                <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button 
                  className="feature-btn"
                  style={{ background: isDisabled ? '#404040' : feature.color }}
                  onClick={() => handleFeatureClick(feature)}
                  disabled={isDisabled}
                >
                  {isDisabled ? 'Requires Data' : feature.buttonText}
                  {!isDisabled && <ArrowRight size={14} />}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="quick-start-section">
        <div className="quick-start-card">
          <div className="quick-start-icon">
            <Rocket size={32} />
          </div>
          <div className="quick-start-content">
            <h3>Ready to Start?</h3>
            <p>Begin by building your quiz structure in the Meta Builder.</p>
          </div>
          <button className="quick-start-btn" onClick={() => onNavigate('meta')}>
            Start with Meta Builder <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
