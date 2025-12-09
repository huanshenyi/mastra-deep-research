import ResearchWorkflowDemo from "./pages/research-workflow";
import AskAgainWorkflowDemo from "./pages/ask-again-workflow";

function App() {
    const pathname = window.location.pathname;

    const renderPage = () => {
        switch (pathname) {
            case "/ask-again":
                return <AskAgainWorkflowDemo />;
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
