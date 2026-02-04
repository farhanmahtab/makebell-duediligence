# Frontend Experience Documentation

This document describes the complete user interface and interaction patterns implemented in the Due Diligence Questionnaire Agent.

## UI Screens

### 1. Project List (Home Page)
**Route**: `/`

**Purpose**: Central dashboard for managing all due diligence projects.

**Features**:
- Grid layout displaying all projects with key metadata
- Each project card shows:
  - Project name and client name
  - Creation date
  - Status badge (ACTIVE, OUTDATED, COMPLETED, ARCHIVED)
  - Document count
  - Question count
- "Create New Project" button for project initialization
- Responsive design adapting to mobile and desktop

**User Interactions**:
- Click any project card to navigate to project details
- Click "Create New Project" to open project creation modal
- Visual status indicators help prioritize work (OUTDATED projects need attention)

---

### 2. Project Detail Page
**Route**: `/projects/[id]`

**Purpose**: Comprehensive view of a single project with tabbed navigation for different aspects.

**Layout**: Three-tab interface:
1. **Documents Tab**
2. **Questions Tab**
3. **Evaluation Tab**

---

#### Tab 1: Documents
**Purpose**: Manage document ingestion and indexing for the project.

**Features**:
- **Project Documents Section**:
  - List of all indexed documents
  - Status indicators (indexed, indexing, failed)
  - Document name and metadata display
  
- **Available for Indexing Section**:
  - Grid of unindexed files from the `data/` directory
  - Quick-add buttons to index documents
  - Hover effects for better UX

**User Interactions**:
1. View currently indexed documents and their status
2. Click upload icon next to any available file to index it
3. System automatically marks project as OUTDATED when new documents are added
4. Real-time status updates as documents are processed

---

#### Tab 2: Questions
**Purpose**: Manage questionnaire, generate answers, and review results.

**Features**:
- **Import Questions**:
  - Dropdown menu to select questionnaire files
  - Supports PDF, DOCX, XLSX formats
  - Hover-triggered file selector
  
- **Question Cards**:
  - Section labels for organization
  - Question text display
  - Answer generation status
  - AI-generated answers with confidence scores
  - Manual override capabilities
  - Citation display for AI answers
  
- **Review Actions**:
  - **Confirm**: Mark answer as verified
  - **Reject**: Flag answer as incorrect
  - **Missing Data**: Indicate insufficient information
  - **Edit Result**: Provide manual override text
  
- **Status Badges**:
  - CONFIRMED (green)
  - REJECTED (red)
  - MANUAL_UPDATED (amber)
  - MISSING_DATA (gray)
  - Confidence indicators (high/medium/low)

**User Interactions**:
1. **Import Workflow**:
   - Hover over "Import from File" button
   - Select questionnaire file from dropdown
   - System parses and imports questions
   
2. **Answer Generation**:
   - Click "Generate Answer" for individual questions
   - Or use "Regenerate All Answers" for batch processing
   - System shows "processing" state during generation
   
3. **Review Workflow**:
   - Read AI-generated answer
   - Click quick action buttons (Confirm/Reject/Missing Data)
   - Or click "Edit Result" to provide manual text
   - Save manual override
   - Status badge updates immediately

**OUTDATED Project Handling**:
- Amber banner appears when project status is OUTDATED
- "Regenerate All Answers" button prominently displayed
- Explains that new documents require answer regeneration

---

#### Tab 3: Evaluation
**Purpose**: Compare AI-generated answers against human ground truth and measure accuracy.

**Features**:
- **Evaluation Summary Cards**:
  - **Avg. Accuracy**: Overall score percentage (0-100)
  - **Samples**: Number of evaluated answers
  - **Status**: COMPLETED indicator
  
- **Detailed Comparison View**:
  - Side-by-side display of AI vs Human answers
  - Question text header
  - Color-coded scores:
    - Green (>80%): High alignment
    - Amber (50-80%): Partial alignment
    - Red (<50%): Low alignment
  - Qualitative explanation for each score
  
- **Run Evaluation Button**:
  - Triggers evaluation process
  - Disabled until manual overrides exist
  - Shows "Evaluating..." state during processing

**User Interactions**:
1. Navigate to Evaluation tab
2. Click "Run Evaluation" (enabled only if manual overrides exist)
3. System calculates similarity scores for all overridden answers
4. View summary metrics and detailed comparisons
5. Use insights to improve AI model or document quality

---

## User Workflows

### Workflow 1: Create New Project
1. Navigate to home page (`/`)
2. Click "Create New Project"
3. Enter project name and client name
4. Submit form
5. System creates project with ACTIVE status
6. Redirect to project detail page

---

### Workflow 2: Index Documents
1. Open project detail page
2. Navigate to "Documents" tab
3. Browse "Available for Indexing" section
4. Click upload icon next to desired file
5. System:
   - Extracts text from document
   - Creates vector embeddings
   - Stores in database
   - Updates document status to "indexed"
6. If project has questions, status changes to OUTDATED

---

### Workflow 3: Import and Answer Questions
1. Open project detail page
2. Navigate to "Questions" tab
3. Hover over "Import from File" button
4. Select questionnaire file (PDF/DOCX/XLSX)
5. System parses and imports questions
6. For each question:
   - Click "Generate Answer" (or use "Regenerate All")
   - System retrieves relevant document chunks
   - Generates answer with citations and confidence
   - Displays result in question card

---

### Workflow 4: Review and Override Answers
1. Navigate to "Questions" tab
2. Read AI-generated answer
3. Choose review action:
   - **Quick Review**: Click Confirm/Reject/Missing Data
   - **Manual Override**:
     - Click "Edit Result"
     - Modify or replace answer text
     - Click "Save Override"
4. System updates answer status and displays badge
5. Manual text is preserved alongside AI result

---

### Workflow 5: Evaluate Answer Quality
1. Ensure manual overrides exist for some questions
2. Navigate to "Evaluation" tab
3. Click "Run Evaluation"
4. System:
   - Compares AI text with manual overrides
   - Calculates similarity scores (keyword overlap + length)
   - Generates qualitative explanations
   - Persists results to database
5. View summary metrics and detailed comparisons
6. Use insights to identify areas for improvement

---

## Status Tracking

### Project Status
- **ACTIVE**: Normal state, ready for work
- **OUTDATED**: New documents added, answers need regeneration
- **COMPLETED**: All questions answered and reviewed
- **ARCHIVED**: Project closed

### Answer Status
- **unanswered**: No answer generated yet
- **processing**: Answer generation in progress
- **completed**: AI answer generated
- **CONFIRMED**: Reviewer verified answer
- **REJECTED**: Reviewer flagged as incorrect
- **MANUAL_UPDATED**: Human override provided
- **MISSING_DATA**: Insufficient information to answer

### Document Status
- **uploaded**: File uploaded, not yet indexed
- **indexing**: Text extraction in progress
- **indexed**: Ready for use in answer generation
- **failed**: Error during processing

---

## Design Principles

### Visual Hierarchy
- Clear tab navigation for different aspects
- Color-coded status indicators for quick scanning
- Prominent action buttons for primary workflows
- Subtle hover effects for secondary actions

### Responsive Design
- Grid layouts adapt to screen size
- Mobile-friendly touch targets
- Readable typography across devices

### Feedback & States
- Loading states during async operations
- Success/error messages for user actions
- Disabled states with explanatory tooltips
- Real-time updates without page refresh

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Clear labels and ARIA attributes
- Sufficient color contrast

---

## Technical Implementation

### Framework
- **Next.js 16** with App Router
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling

### State Management
- React `useState` for local component state
- Optimistic updates for better UX
- Server-side data fetching with `fetch`

### Routing
- File-based routing with dynamic segments
- Client-side navigation for instant transitions
- Back button support with browser history

### Performance
- Lazy loading for large lists
- Debounced search/filter inputs
- Efficient re-renders with React keys
- Minimal bundle size with tree shaking
