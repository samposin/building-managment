import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/assets/css/style.css';
import People from "./pages/people";
import Buildings from "./pages/buildings";
import Groups from "./pages/groups";
import Doors from "./pages/doors";
import Home from "./pages/home";
import Login from "./pages/login";
import HelpUser from './pages/helpUser';
import WalkTrought from './pages/walkTrought';
import PermissionsRequest from './pages/permissionRequest';
import AccessReqeust from './pages/permissionRequest/AccessReqeust';
import Requests from './pages/permissionRequest/Requests';
import { ToastProvider } from 'react-toast-notifications';
import '@fortawesome/fontawesome-free/css/all.min.css';

const MyCustomToast = ({ appearance, children }) => (
     <div style={{ color: appearance === 'error' ? 'red' : 'white' }} className="custom-toast">
          <i className="fas fa-user-check mr-2" style={{ color: '#25e871'}}></i>
       {children}
     </div>
);

function App() {

  return (
       <ToastProvider placement="bottom-right" components={{ Toast: MyCustomToast }}>
     <Router>
          <Switch>
               <Route path='/Login'>
                    <Login />
               </Route>
               <Route path='/Home'>
                    <Home />
               </Route>
               <Route path='/People'>
                    <People />
               </Route>
               <Route path='/Buildings'>
                    <Buildings />
               </Route>
               <Route path='/Groups'>
                    <Groups />
               </Route>
               <Route path='/Doors'>
                    <Doors />
               </Route>
               <Route path='/HelpUser'>
                    <HelpUser />
               </Route>
               <Route path='/WalkTrought'>
                    <WalkTrought />
               </Route>
               <Route path='/accessReqeust'>
                    <AccessReqeust />
               </Route>
               <Route path='/PermissionsRequest'>
                    <PermissionsRequest />
               </Route>

               <Route path='/Requests'>
                    <Requests />
               </Route>

               <Route>
                    <Login />
               </Route>

          </Switch>
    </Router>
    </ToastProvider>
  );
}

export default App