import { HashRouter, Routes, Route } from 'react-router-dom'
import { ProgressProvider } from './lib/ProgressContext'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './routes/Dashboard'
import { Learn } from './routes/Learn'
import { Diagnostic } from './routes/Diagnostic'
import { QuizMe } from './routes/QuizMe'
import { MockExam } from './routes/MockExam'
import { PastExams } from './routes/PastExams'
import { Flashcards } from './routes/Flashcards'
import { MistakeNotebook } from './routes/MistakeNotebook'
import { LastMinuteReview } from './routes/LastMinuteReview'
import { Search } from './routes/Search'

function App() {
  return (
    <ProgressProvider>
      <ThemeProvider>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/:topicId" element={<Learn />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/quiz" element={<QuizMe />} />
              <Route path="/mock" element={<MockExam />} />
              <Route path="/mock/:examId" element={<MockExam />} />
              <Route path="/past-exams" element={<PastExams />} />
              <Route path="/past-exams/:examId" element={<PastExams />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/flashcards/:topicId" element={<Flashcards />} />
              <Route path="/mistakes" element={<MistakeNotebook />} />
              <Route path="/review" element={<LastMinuteReview />} />
              <Route path="/search" element={<Search />} />
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </ProgressProvider>
  )
}

export default App
