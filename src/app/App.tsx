import ResearchWorkflowDemo from "./pages/research-workflow";
import AskAgainWorkflowDemo from "./pages/ask-again-workflow";
import GenerateReportWorkflowDemo from "./pages/generate-report-workflow";

function App() {
    const pathname = window.location.pathname;

    const renderPage = () => {
        switch (pathname) {
            case "/ask-again":
                return <AskAgainWorkflowDemo />;
            case "/generate-report":
                return <GenerateReportWorkflowDemo />;
            default:
                return <ResearchWorkflowDemo />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {renderPage()}
        </div>
    );
}

export default App;
