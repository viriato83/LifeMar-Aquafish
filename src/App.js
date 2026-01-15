
import './App.css';
import Error from './components/Error';
import Login from './components/Login';
import AppRouter from './Router';

function App() {
  return (
    <div className="App">
      {/* <Error></Error> */}
   
       <Login>
       <AppRouter></AppRouter>
       </Login>
    </div>
  );
}

export default App;
