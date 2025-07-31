import { SubscriptionsPage } from "./pages/SubscriptionsPage";

function App() {
    const handleLogin = () => {
        window.location.href = "/api/auth/start"; // проксируется на бекенд
    };
    return (
        <div className="App">
            <button onClick={handleLogin}>Войти через Google</button>
            <SubscriptionsPage />
        </div>
    );
}

export default App;
