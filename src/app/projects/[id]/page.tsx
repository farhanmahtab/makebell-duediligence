'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Upload, Search, Check } from 'lucide-react';
import { Project, Document, Question } from '@/types';
import { useParams } from 'next/navigation';

export default function ProjectDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'documents' | 'questions'>('documents');
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) setProject(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Mock fetching available files from server (we need an endpoint or just hardcode for demo?
  // I didn't create an endpoint to list files in `data/`, but `ingestionService` has `listAvailableFiles`.
  // I will assume I can add a quick endpoint or just type in filenames for now.
  // Actually, let's just create a quick client-side list of expected files from the README.
  const KNOWN_FILES = [
    'ILPA_Due_Diligence_Questionnaire_v1.2.pdf',
    '20260110_MiniMax_Accountants_Report.pdf',
    '20260110_MiniMax_Audited_Consolidated_Financial_Statements.pdf',
    '20260110_MiniMax_Global_Offering_Prospectus.pdf',
    '20260110_MiniMax_Industry_Report.pdf'
  ];

  const handleIndexFile = async (filename: string) => {
    if (!project) return;
    try {
      const res = await fetch('/api/documents/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, filename }),
      });
      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAnswer = async (questionId: string) => {
    if (!project) return;
    try {
      // Optimistic update
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.map(q => 
            q.id === questionId ? { ...q, answer: { ...q.answer, status: 'processing' } as any } : q
          )
        };
      });

      const res = await fetch('/api/answers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, questionId }),
      });
      
      if (res.ok) {
        fetchProject();
      }
    } catch (e) {
      console.error(e);
      fetchProject(); // Revert
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!project) return <div className="p-10 text-center text-red-500">Project not found</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Projects
        </Link>
        
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-slate-500 mt-1">{project.clientName} • Created {new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {project.status.toUpperCase()}
            </span>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 flex gap-6">
            <button 
              onClick={() => setActiveTab('documents')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'documents' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Documents ({project.documents.length})
            </button>
            <button 
              onClick={() => setActiveTab('questions')}
              className={`py-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'questions' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Questions ({project.questions.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'documents' ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Project Documents</h3>
                  {project.documents.length === 0 ? (
                    <p className="text-slate-500 italic">No documents indexed yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {project.documents.map(doc => (
                        <li key={doc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-3">
                            <FileText className="text-blue-500" size={20} />
                            <span className="font-medium text-slate-700">{doc.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            doc.status === 'indexed' ? 'bg-green-100 text-green-700' : 
                            doc.status === 'failed' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {doc.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Available for Indexing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {KNOWN_FILES.filter(f => !project.documents.some(d => d.name === f)).map(file => (
                      <div key={file} className="flex justify-between items-center p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                        <span className="text-sm font-medium text-slate-700 truncate mr-2" title={file}>{file}</span>
                        <button 
                          onClick={() => handleIndexFile(file)}
                          className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Upload size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 {project.questions.map(q => (
                   <div key={q.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                     <div className="flex justify-between items-start mb-3">
                       <h4 className="text-slate-900 font-medium">{q.text}</h4>
                       <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">{q.section}</span>
                     </div>
                     
                     {q.answer ? (
                       <div className="mt-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">AI Generated Answer</span>
                           <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                                q.answer.confidence === 'high' ? 'bg-green-100 text-green-800 border-green-200' :
                                q.answer.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {q.answer.confidence} confidence
                              </span>
                           </div>
                         </div>
                         <p className="text-slate-800 text-sm leading-relaxed">{q.answer.text}</p>
                         {q.answer.citations.length > 0 && (
                           <div className="mt-3 pt-3 border-t border-blue-200/50">
                             <p className="text-xs text-blue-600 font-medium mb-1">Source:</p>
                             <p className="text-xs text-slate-600 italic">"{q.answer.citations[0].textSnippet}"</p>
                           </div>
                         )}
                       </div>
                     ) : (
                       <div className="mt-3 flex justify-end">
                         <button 
                           onClick={() => handleGenerateAnswer(q.id)}
                           disabled={project.documents.length === 0}
                           className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                         >
                           {project.documents.length === 0 ? 'Index Docs First' : 'Generate Answer'}
                         </button>
                       </div>
                     )}
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
