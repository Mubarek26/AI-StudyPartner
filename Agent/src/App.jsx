import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import DocReader from './pages/DocReader'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reader/:id" element={<DocReader />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
