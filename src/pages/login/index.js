import React, { useState } from 'react';
import { Container, Form } from "react-bootstrap";
import Logo from '../../assets/icons/svg/logo.svg';
import FullGlowOrb from '../../assets/icons/svg/FullGlowOrb.svg';
import ApartmentAmbient from '../../assets/icons/videos/Apartment-Ambient-min.mp4';
import { Link, Redirect, useHistory } from 'react-router-dom';

import { GoogleSpreadsheet } from "google-spreadsheet";

import config from '../../config';

const SHEET_ID = "380142981";
const SPREADSHEET_ID = config.spread_sheet_id;
const CLIENT_EMAIL = config.client_email;
const PRIVATE_KEY = config.private_key;
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

const Login = () => {
    const history = useHistory();
    const [showLogin, setShowLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});

    const handleChange = e => {
        const { name, value } = e.target;
        setValues({
            ...values,
            [name]: value
        });
    }

    const validate = (fieldValues = values) => {
        let temp = { ...errors }
        if ('password' in fieldValues)
            temp.password = fieldValues.password ? "" : "This field is required."
        if ('email' in fieldValues)
            temp.email = fieldValues.email ? "" : "This field is required."
        // if ('country_id' in fieldValues)
        //     temp.country_id =  fieldValues.country_id ? "" : "This field is required."
        // if ('state_id' in fieldValues)
        //     temp.state_id =  fieldValues.state_id ? "" : "This field is required."
        // if ('city_id' in fieldValues)
        //     temp.city_id =  fieldValues.city_id ? "" : "This field is required."
        // if ('role_id' in fieldValues)
        //     temp.role_id =  fieldValues.role_id && fieldValues.role_id != 0 ? "" : "This field is required."
        // if ( (fieldValues.role_id == 2 || fieldValues.role_id == 3) && (fieldValues.type_account_id != "" || fieldValues.type_account_id == 0) )
        //     temp.type_account_id =  fieldValues.type_account_id ? "" : "This field is required."
    
        setErrors({
            ...temp
        });
    
        if (fieldValues === values)
            return Object.values(temp).every(x => x === "")
      }

    const handleLogin = async (e) => {
        e.preventDefault();
        if(!validate())
        return false;
        setLoading(true);
        try {
            await doc.useServiceAccountAuth({
            client_email: CLIENT_EMAIL,
            private_key: PRIVATE_KEY,
            });
            // loads document properties and worksheets
            await doc.loadInfo();
        
            const sheet = doc.sheetsById[SHEET_ID];
            // const result = await sheet.addRow(row);
        
            const rows = await sheet.getRows(); // can pass in { limit, offset }
            var filteredUser = rows.filter(obj => (values.email == obj.email && values.password == obj.password));
            if(filteredUser.length === 0 ){
                setLoading(false)
                alert("invalid user name or password");
                return false;
            }
            filteredUser = filteredUser[0];
            var userInfo = {
                first_name: filteredUser.first_name,
                last_name: filteredUser.last_name,
                user_type: filteredUser.user_type,
                vpnKey: filteredUser.vpnKey,
                door: filteredUser.door,
                email: filteredUser.email,
                // password: filteredUser.password,
            }
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            // history.push("/Requests");
            window.location.href="/Requests";
        } catch (e) {
            setLoading(false);
            console.error('Error: ', e);
        }
    }
    return (
        <Container style={{maxWidth: "100%", paddingRight: "0",paddingLeft: "0"}}>
            <video 
                autoPlay
                muted
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}          
            >
                <source src= {ApartmentAmbient} type="video/mp4" />
            </video>
            <div className="login-container">
                <img src={Logo}  alt="logo" className="logo"/>
                <div className="login-page">
                    <div className="Full-Glow-Orb">
                        <div className="welcome" style={{   backgroundImage: `url(${FullGlowOrb})`, 
                                        backgroundRepeat: 'no-repeat', backgroundSize: 'contain',
                                        width: "280px", height: "280px"}} >
                            <h4>Welcome</h4>
                            <p className="b-text-r">
                                to the future of security
                            </p>
                        </div>
                    </div>
                    <div className="login">
                        {(showLogin === false) ? <button className="b-text-m log-in mt-5" onClick={ () => {
                            setShowLogin(true);
                        }}>Login with Email</button> :
                            <Form className="my-login" onSubmit={handleLogin}>
                                <Form.Group controlId="formBasicEmail">
                                    <Form.Control type="email" name="email" className="my-input" placeholder="Enter the email" onChange={handleChange} />
                                    { errors.email && <small className="text-danger">{ errors.email }</small> }
                                </Form.Group>

                                <Form.Group controlId="formBasicPassword">
                                    <Form.Control type="password" name="password" className="my-input" placeholder="Enter the password" onChange={handleChange} />
                                    { errors.password && <small className="text-danger">{ errors.password }</small> }
                                </Form.Group>
                                { (loading) ? <button className="b-text-m log-in" type="button">Loading...</button> : <button className="b-text-m log-in" type="submit">Login</button>                                }
                            </Form>
                        }
                        <p className= "x-small mt-2">or</p>
                        <button className="x-small sign-up">
                            Create an Account
                        </button>

                        <p className= "x-small mt-2"><Link to="HelpUser" className="d-block">Help User <i className="fas fa-question-circle"></i></Link></p>

                    </div>
                </div>
            </div> 
        </Container>
    )
}
export default Login;